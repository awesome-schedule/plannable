import ScheduleBlock from '@/models/ScheduleBlock';
import solver from 'javascript-lp-solver';
import { LP } from 'glpk.js';

function applyLPResult(component: ScheduleBlock[], result: { [varName: string]: number }) {
    for (const key in result) {
        if (key.startsWith('l')) {
            const idx = +key.substr(1);
            component.find(b => b.idx === idx)!.left = result[key];
        } else if (key.startsWith('w')) {
            const idx = +key.substr(1);
            component.find(b => b.idx === idx)!.width = result[key];
        }
    }
}

export function buildGLPKModel(component: ScheduleBlock[], uniform = true) {
    const objVars = [];
    const subjectTo: LP['subjectTo'] = [];
    let count = 0;
    for (const block of component) {
        const j = block.idx;
        let maxLeftFixed = 0;
        let minRight = 1;
        for (const v of block.neighbors) {
            const temp = v.left + v.width;
            if (temp <= block.left + 1e-8) {
                if (v.isFixed) {
                    maxLeftFixed = Math.max(maxLeftFixed, temp);
                } else {
                    subjectTo.push({
                        name: (count++).toString(),
                        vars: [
                            { name: `l${j}`, coef: 1.0 },
                            { name: `l${v.idx}`, coef: -1.0 },
                            { name: `w${v.idx}`, coef: -1.0 }
                        ],
                        bnds: { type: window.glpk.GLP_LO, lb: 0.0, ub: 1.0 }
                    });
                }
            }
            if (v.left + 1e-8 >= block.left + block.width) {
                if (v.isFixed) {
                    minRight = Math.min(v.left, minRight);
                }
            }
        }
        objVars.push({ name: `w${j}`, coef: 1 });
        subjectTo.push(
            {
                name: (count++).toString(),
                vars: [{ name: `w${j}`, coef: 1.0 }],
                bnds: { type: window.glpk.GLP_LO, lb: block.width, ub: 1.0 }
            },
            {
                name: (count++).toString(),
                vars: [{ name: `l${j}`, coef: 1.0 }],
                bnds: { type: window.glpk.GLP_LO, lb: maxLeftFixed, ub: 1.0 }
            },
            {
                name: (count++).toString(),
                vars: [
                    { name: `w${j}`, coef: 1.0 },
                    { name: `l${j}`, coef: 1.0 }
                ],
                bnds: { type: window.glpk.GLP_UP, lb: 0, ub: minRight }
            }
        );
    }
    if (objVars.length === 0) return;
    const lp = {
        name: 'LP',
        objective: {
            direction: window.glpk.GLP_MAX,
            name: 'obj',
            vars: objVars
        },
        subjectTo
    };

    console.time('solve');
    const result = window.glpk.solve(lp, window.glpk.GLP_MSG_ERR);
    let time = result.time;
    if (result.result.status === window.glpk.GLP_OPT) {
        // --------- try to minimize the sum of absolute deviations from the mean -----
        if (uniform) {
            {
                subjectTo.push({
                    name: (count++).toString(),
                    vars: objVars.map(_var => ({ name: _var.name, coef: 1.0 })),
                    bnds: { type: window.glpk.GLP_LO, lb: result.result.z - 1e-6, ub: 0.0 }
                });
                const meanFactor = 1 / objVars.length;
                const widthVarsCopy = objVars.map(_var => ({ name: _var.name, coef: meanFactor }));
                widthVarsCopy.push({ name: 'mean', coef: -1.0 });
                subjectTo.push({
                    name: (count++).toString(),
                    vars: widthVarsCopy,
                    bnds: { type: window.glpk.GLP_FX, lb: 0.0, ub: 0.0 }
                });
            }
            for (let i = 0; i < objVars.length; i++) {
                const widthVar = objVars[i].name;
                subjectTo.push(
                    {
                        name: (count++).toString(),
                        vars: [
                            { name: `t${i}`, coef: 1.0 },
                            { name: widthVar, coef: 1.0 },
                            { name: 'mean', coef: -1.0 }
                        ],
                        bnds: { type: window.glpk.GLP_LO, lb: 0.0, ub: 0.0 }
                    },
                    {
                        name: (count++).toString(),
                        vars: [
                            { name: `t${i}`, coef: 1.0 },
                            { name: widthVar, coef: -1.0 },
                            { name: 'mean', coef: 1.0 }
                        ],
                        bnds: { type: window.glpk.GLP_LO, lb: 0.0, ub: 0.0 }
                    }
                );
                objVars[i].name = `t${i}`;
            }
            lp.objective.direction = window.glpk.GLP_MIN;
            const result2 = window.glpk.solve(lp, window.glpk.GLP_MSG_ERR);
            time += result2.time;
            if (result2.result.status === window.glpk.GLP_OPT) {
                result.result = result2.result;
            }
        }
        // ----------------------------------------------------------------------------
        applyLPResult(component, result.result.vars);
    } else {
        console.log('not feasible');
    }
    console.timeEnd('solve');
    console.log('native lp time', time);
}

export function buildJSLPSolverModel(component: ScheduleBlock[], uniform = true) {
    const widths: string[] = [];
    const model = [''];
    for (const block of component) {
        const j = block.idx;
        let maxLeftFixed = 0;
        let minRight = 1;
        for (const v of block.neighbors) {
            const temp = v.left + v.width;
            if (temp <= block.left + 1e-8) {
                if (v.isFixed) {
                    maxLeftFixed = Math.max(maxLeftFixed, temp);
                } else {
                    model.push(`1 l${j} -1 l${v.idx} -1 w${v.idx} >= 0`);
                }
            }
            if (v.left + 1e-8 >= block.left + block.width) {
                if (v.isFixed) {
                    minRight = Math.min(v.left, minRight);
                }
            }
        }
        widths.push(`w${j}`);
        model.push(`1 w${j} >= ${block.width}`);
        model.push(`1 w${j} <= ${1.5 * block.width}`);
        model.push(`1 l${j} >= ${maxLeftFixed}`);
        model.push(`1 l${j} 1 w${j} <= ${minRight}`);
    }
    if (model.length === 1) return;
    model[0] = `max: 1 ${widths.join(' 1 ')}`;

    console.time('solve');
    let result = solver.Solve(solver.ReformatLP(model));
    if (result.feasible) {
        // --------- try to minimize the sum of absolute deviations from the mean -----
        if (uniform) {
            model.push(`1 ${widths.join(' 1 ')} >= ${result.result - 1e-6}`);
            const additionalFactor: string[] = [];
            const meanFactor = 1 / widths.length;
            model.push(`${meanFactor} ${widths.join(` ${meanFactor} `)} -1 mean = 0`);
            for (let i = 0; i < widths.length; i++) {
                additionalFactor.push(`1 t${i}`);
                model.push(`1 t${i} -1 ${widths[i]} 1 mean >= 0`);
                model.push(`1 t${i} 1 ${widths[i]} -1 mean >= 0`);
            }
            model[0] = `min: ${additionalFactor.join(' ')}`;
            const temp = solver.Solve(solver.ReformatLP(model));
            if (temp.feasible) result = temp;
        }
        // ----------------------------------------------------------------------------
        applyLPResult(component, result);
    } else {
        console.log('not feasible');
    }
    console.timeEnd('solve');
}
