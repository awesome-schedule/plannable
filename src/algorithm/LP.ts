import ScheduleBlock from '@/models/ScheduleBlock';
import { LP, Result } from 'glpk.js';

const CONSTS = Object.freeze({
    GLP_MIN: 1 /* minimization */,
    GLP_MAX: 2 /* maximization */,

    /* type of auxiliary/structural variable: */
    GLP_FR: 1 /* free (unbounded) variable */,
    GLP_LO: 2 /* variable with lower bound */,
    GLP_UP: 3 /* variable with upper bound */,
    GLP_DB: 4 /* double-bounded variable */,
    GLP_FX: 5 /* fixed variable */,

    /* message level: */
    GLP_MSG_OFF: 0 /* no output */,
    GLP_MSG_ERR: 1 /* warning and error messages only */,
    GLP_MSG_ON: 2 /* normal output */,
    GLP_MSG_ALL: 3 /* full output */,
    GLP_MSG_DBG: 4 /* debug output */,

    /* solution status: */
    GLP_UNDEF: 1 /* solution is undefined */,
    GLP_FEAS: 2 /* solution is feasible */,
    GLP_INFEAS: 3 /* solution is infeasible */,
    GLP_NOFEAS: 4 /* no feasible solution exists */,
    GLP_OPT: 5 /* solution is optimal */,
    GLP_UNBND: 6 /* solution is unbounded */
});

const worker = new Worker('js/glpk-worker.js');
const resolveQueue: any[] = [];
worker.onmessage = msg => {
    if (resolveQueue.length) {
        const resolve = resolveQueue.shift();
        resolve(msg.data);
    }
};
const workerInitialize = new Promise((resolve, reject) => {
    resolveQueue.push(resolve);
});

async function solveLP(lp: LP): Promise<Result> {
    await workerInitialize;
    return new Promise((resolve, reject) => {
        resolveQueue.push(resolve);
        worker.postMessage(lp);
    });
}

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

export async function buildGLPKModel(component: ScheduleBlock[], uniform = true) {
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
                        bnds: { type: CONSTS.GLP_LO, lb: 0.0, ub: 1.0 }
                    });
                }
            }
            if (v.left >= block.left + block.width - 1e-8) {
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
                bnds: { type: CONSTS.GLP_LO, lb: block.width, ub: 0.0 }
            },
            {
                name: (count++).toString(),
                vars: [{ name: `l${j}`, coef: 1.0 }],
                bnds: { type: CONSTS.GLP_LO, lb: maxLeftFixed, ub: 1.0 }
            },
            {
                name: (count++).toString(),
                vars: [
                    { name: `w${j}`, coef: 1.0 },
                    { name: `l${j}`, coef: 1.0 }
                ],
                bnds: { type: CONSTS.GLP_UP, lb: 0, ub: minRight }
            }
        );
    }
    if (objVars.length === 0) return;
    const lp = {
        name: 'LP',
        objective: {
            direction: CONSTS.GLP_MAX,
            name: Math.random().toString(),
            vars: objVars
        },
        subjectTo
    };

    // console.time('solve');
    const result = await solveLP(lp);
    let time = result.time;
    if (result.result.status === CONSTS.GLP_OPT) {
        // --------- try to minimize the sum of absolute deviations from the mean -----
        if (uniform) {
            {
                subjectTo.push({
                    name: (count++).toString(),
                    vars: objVars.map(_var => ({ name: _var.name, coef: 1.0 })),
                    bnds: { type: CONSTS.GLP_LO, lb: result.result.z - 1e-6, ub: 0.0 }
                });
                const meanFactor = 1 / objVars.length;
                const widthVarsCopy = objVars.map(_var => ({ name: _var.name, coef: meanFactor }));
                widthVarsCopy.push({ name: 'mean', coef: -1.0 });
                subjectTo.push({
                    name: (count++).toString(),
                    vars: widthVarsCopy,
                    bnds: { type: CONSTS.GLP_FX, lb: 0.0, ub: 0.0 }
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
                        bnds: { type: CONSTS.GLP_LO, lb: 0.0, ub: 0.0 }
                    },
                    {
                        name: (count++).toString(),
                        vars: [
                            { name: `t${i}`, coef: 1.0 },
                            { name: widthVar, coef: -1.0 },
                            { name: 'mean', coef: 1.0 }
                        ],
                        bnds: { type: CONSTS.GLP_LO, lb: 0.0, ub: 0.0 }
                    }
                );
                objVars[i].name = `t${i}`;
            }
            lp.objective.direction = CONSTS.GLP_MIN;
            lp.objective.name = Math.random().toString();
            const result2 = await solveLP(lp);
            time += result2.time;
            if (result2.result.status === CONSTS.GLP_OPT) {
                result.result = result2.result;
            }
        }
        // ----------------------------------------------------------------------------
        applyLPResult(component, result.result.vars);
    } else {
        console.log('not feasible');
    }
    // console.timeEnd('solve');
    console.log('native lp time', time);
}

// export function buildJSLPSolverModel(component: ScheduleBlock[], uniform = true) {
//     const widths: string[] = [];
//     const model = [''];
//     for (const block of component) {
//         const j = block.idx;
//         let maxLeftFixed = 0;
//         let minRight = 1;
//         for (const v of block.neighbors) {
//             const temp = v.left + v.width;
//             if (temp <= block.left + 1e-8) {
//                 if (v.isFixed) {
//                     maxLeftFixed = Math.max(maxLeftFixed, temp);
//                 } else {
//                     model.push(`1 l${j} -1 l${v.idx} -1 w${v.idx} >= 0`);
//                 }
//             }
//             if (v.left + 1e-8 >= block.left + block.width) {
//                 if (v.isFixed) {
//                     minRight = Math.min(v.left, minRight);
//                 }
//             }
//         }
//         widths.push(`w${j}`);
//         model.push(`1 w${j} >= ${block.width}`);
//         model.push(`1 w${j} <= ${1.5 * block.width}`);
//         model.push(`1 l${j} >= ${maxLeftFixed}`);
//         model.push(`1 l${j} 1 w${j} <= ${minRight}`);
//     }
//     if (model.length === 1) return;
//     model[0] = `max: 1 ${widths.join(' 1 ')}`;

//     console.time('solve');
//     let result = solver.Solve(solver.ReformatLP(model));
//     if (result.feasible) {
//         // --------- try to minimize the sum of absolute deviations from the mean -----
//         if (uniform) {
//             model.push(`1 ${widths.join(' 1 ')} >= ${result.result - 1e-6}`);
//             const additionalFactor: string[] = [];
//             const meanFactor = 1 / widths.length;
//             model.push(`${meanFactor} ${widths.join(` ${meanFactor} `)} -1 mean = 0`);
//             for (let i = 0; i < widths.length; i++) {
//                 additionalFactor.push(`1 t${i}`);
//                 model.push(`1 t${i} -1 ${widths[i]} 1 mean >= 0`);
//                 model.push(`1 t${i} 1 ${widths[i]} -1 mean >= 0`);
//             }
//             model[0] = `min: ${additionalFactor.join(' ')}`;
//             const temp = solver.Solve(solver.ReformatLP(model));
//             if (temp.feasible) result = temp;
//         }
//         // ----------------------------------------------------------------------------
//         applyLPResult(component, result);
//     } else {
//         console.log('not feasible');
//     }
//     console.timeEnd('solve');
// }
