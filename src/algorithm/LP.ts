/* eslint-disable @typescript-eslint/no-unused-vars */
import ScheduleBlock from '@/models/ScheduleBlock';
import { LP, Result } from 'glpk.js';

const GLP_MIN = 1;
const GLP_MAX = 2;
const GLP_FR = 1;
const GLP_LO = 2;
const GLP_UP = 3;
const GLP_DB = 4;
const GLP_FX = 5;
const GLP_MSG_OFF = 0;
const GLP_MSG_ERR = 1;
const GLP_MSG_ON = 2;
const GLP_MSG_ALL = 3;
const GLP_MSG_DBG = 4;
const GLP_UNDEF = 1;
const GLP_FEAS = 2;
const GLP_INFEAS = 3;
const GLP_NOFEAS = 4;
const GLP_OPT = 5;
const GLP_UNBND = 6;

const workers = [new Worker('js/glpk-worker.js'), new Worker('js/glpk-worker.js')];
const resolveMap = new Map<string, (val: any) => void>();
function workerOnMessage(msg: MessageEvent) {
    const key = msg.data.name;
    const resolve = resolveMap.get(key);
    if (resolve) {
        resolve(msg.data);
        resolveMap.delete(key);
    }
}
for (const worker of workers) worker.onmessage = workerOnMessage;

export let nativeTime = 0.0;
export let communicationTime = 0.0;
let globalCounter = 0;

async function solveLP(lp: LP): Promise<Result> {
    return new Promise((resolve, reject) => {
        resolveMap.set(lp.name, resolve);
        const time = performance.now();
        workers[globalCounter++].postMessage(lp);
        communicationTime += performance.now() - time;
        globalCounter %= workers.length;
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
                        name: `${count++}`,
                        vars: [
                            { name: `l${j}`, coef: 1.0 },
                            { name: `l${v.idx}`, coef: -1.0 },
                            { name: `w${v.idx}`, coef: -1.0 }
                        ],
                        bnds: { type: GLP_LO, lb: 0.0, ub: 1.0 }
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
                name: `${count++}`,
                vars: [{ name: `w${j}`, coef: 1.0 }],
                bnds: { type: GLP_LO, lb: block.width, ub: 0.0 }
            },
            {
                name: `${count++}`,
                vars: [{ name: `l${j}`, coef: 1.0 }],
                bnds: { type: GLP_LO, lb: maxLeftFixed, ub: 1.0 }
            },
            {
                name: `${count++}`,
                vars: [
                    { name: `w${j}`, coef: 1.0 },
                    { name: `l${j}`, coef: 1.0 }
                ],
                bnds: { type: GLP_UP, lb: 0, ub: minRight }
            }
        );
    }
    if (objVars.length === 0) return;
    const lp = {
        name: Math.random().toString(),
        objective: {
            direction: GLP_MAX,
            name: 'obj',
            vars: objVars
        },
        subjectTo
    };

    const result = await solveLP(lp);
    nativeTime += result.time * 1000;
    if (result.result.status === GLP_OPT) {
        // --------- try to minimize the sum of absolute deviations from the mean -----
        if (uniform) {
            subjectTo.push({
                name: `${count++}`,
                vars: objVars.map(_var => ({ name: _var.name, coef: 1.0 })),
                bnds: { type: GLP_LO, lb: result.result.z - 1e-8, ub: 0.0 }
            });
            const mean = result.result.z / objVars.length;
            for (let i = 0; i < objVars.length; i++) {
                const widthVar = objVars[i].name;
                subjectTo.push(
                    {
                        name: `${count++}`,
                        vars: [
                            { name: `t${i}`, coef: 1.0 },
                            { name: widthVar, coef: 1.0 }
                        ],
                        bnds: { type: GLP_LO, lb: mean, ub: 0.0 }
                    },
                    {
                        name: `${count++}`,
                        vars: [
                            { name: `t${i}`, coef: 1.0 },
                            { name: widthVar, coef: -1.0 }
                        ],
                        bnds: { type: GLP_LO, lb: -mean, ub: 0.0 }
                    }
                );
                objVars[i].name = `t${i}`;
            }
            lp.objective.direction = GLP_MIN;
            lp.name = Math.random().toString();
            const result2 = await solveLP(lp);
            nativeTime += result2.time * 1000;
            if (result2.result.status === GLP_OPT) {
                result.result = result2.result;
            } else {
                console.log('non feasible uniform constraint');
            }
        }
        // ----------------------------------------------------------------------------
        applyLPResult(component, result.result.vars);
    } else {
        console.log('not feasible');
    }
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
