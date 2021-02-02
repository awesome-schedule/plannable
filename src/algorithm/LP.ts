/**
 * this module contains
 *  - several functions that build different linear programming models for schedule event rendering
 *  - several GLPK workers that accept LP models and return their solution (if feasible)
 * @author Hanzhi Zhou
 * @module src/algorithm
 */

/**
 *
 */
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

const WorkerURL = '/js/glpk-worker.js';
const workers: Worker[] = [];
if (typeof Worker !== 'undefined') {
    const numCores = Math.min(Math.max(navigator.hardwareConcurrency, 2), 4);
    for (let i = 0; i < numCores; i++) {
        workers.push(new Worker(WorkerURL));
    }
}
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

const posWVar = { name: 'width', coef: 1.0 };
const negWVar = { name: 'width', coef: -1.0 };
const zeroLB = { type: GLP_LO, lb: 0.0, ub: 0.0 };

/**
 * build a LP model that maximizes the sum of widths `w1 + ... + wn`, where `n` equals to the number of blocks passed in.
 * All ScheduleBlocks have independent widths, but each width variable `wi` must be greater than the initially calculate width.
 * Then, a second LP model is built to minimize the absolute deviations of each width from the mean while retaining previously maximized sum of the widths
 * @param component
 */
export async function buildGLPKModel(component: ScheduleBlock[], uniform = true) {
    if (!window.Worker) return;

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
                        vars: [block.lpLPos, v.lpLNeg, { name: `w${v.idx}`, coef: -1.0 }],
                        bnds: zeroLB
                    });
                }
            }
            if (v.isFixed && v.left >= block.left + block.width - 1e-8)
                minRight = Math.min(v.left, minRight);
        }
        const wWar = { name: `w${j}`, coef: 1.0 };
        objVars.push(wWar);
        subjectTo.push(
            {
                name: `${count++}`,
                vars: [wWar],
                bnds: { type: GLP_LO, lb: block.width, ub: 0.0 }
            },
            {
                name: `${count++}`,
                vars: [block.lpLPos],
                bnds: { type: GLP_LO, lb: maxLeftFixed, ub: 1.0 }
            },
            {
                name: `${count++}`,
                vars: [wWar, block.lpLPos],
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
                // we need to copy the objective vars because we will modify it later and we don't want it to be changed here
                vars: objVars.concat(),
                bnds: { type: GLP_LO, lb: result.result.z - 1e-8, ub: 0.0 }
            });
            const mean = result.result.z / objVars.length - 1e-8;
            const upperMeanBnd = { type: GLP_LO, lb: mean, ub: 0.0 },
                lowerMeanBnd = { type: GLP_LO, lb: -mean, ub: 0.0 };
            for (let i = 0; i < objVars.length; i++) {
                const tVar = { name: `t${i}`, coef: 1.0 };
                subjectTo.push(
                    {
                        name: `${count++}`,
                        vars: [tVar, objVars[i]],
                        bnds: upperMeanBnd
                    },
                    {
                        name: `${count++}`,
                        vars: [tVar, { name: objVars[i].name, coef: -1.0 }],
                        bnds: lowerMeanBnd
                    }
                );
                objVars[i] = tVar;
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
        console.log('not optimal');
    }
}

function applyLPResult2(
    component: ScheduleBlock[],
    result: { [varName: string]: number },
    widthVarMap: Int16Array,
    numVars: number
) {
    const widthResult = new Float64Array(numVars);
    for (const key in result) {
        if (key.startsWith('l')) {
            const idx = +key.substr(1);
            component.find(b => b.idx === idx)!.left = result[key];
        } else if (key.startsWith('w')) {
            const idx = +key.substr(1);
            widthResult[idx] = result[key];
        }
    }
    for (const block of component) {
        block.width = widthResult[widthVarMap[block.pathDepth]];
    }
}

/**
 * build a LP model that maximizes width `w1 + ... + wn`, where `n` equals to the number of unique pathDepths of the blocks passed in
 * All ScheduleBlocks that share the same pathDepth are required to have the same width. This function needs to be applied iteratively to achieve the optimal result
 * @param component
 */
export async function buildGLPKModel2(component: ScheduleBlock[]) {
    if (!window.Worker) return;
    const tStart = performance.now();
    const subjectTo: LP['subjectTo'] = [];

    let maxPathDepth = 0;
    for (const block of component) {
        maxPathDepth = Math.max(block.pathDepth, maxPathDepth);
    }
    maxPathDepth += 1;
    const widthVarMap = new Int16Array(maxPathDepth).fill(-1);
    const widthVars: string[] = [];
    for (const block of component) {
        if (widthVarMap[block.pathDepth] === -1) {
            const idx = widthVars.length;
            widthVars.push(`w${idx}`);
            widthVarMap[block.pathDepth] = idx;
        }
    }
    const widthVarCount = new Int32Array(widthVars.length);

    let count = 0;
    for (const block of component) {
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
                            block.lpLPos,
                            v.lpLNeg,
                            { name: widthVars[widthVarMap[v.pathDepth]], coef: -1.0 }
                        ],
                        bnds: zeroLB
                    });
                }
            }
            if (v.isFixed && v.left >= block.left + block.width - 1e-8)
                minRight = Math.min(v.left, minRight);
        }
        const varIdx = widthVarMap[block.pathDepth];
        widthVarCount[varIdx]++;
        const bWVar = { name: widthVars[varIdx], coef: 1.0 };
        subjectTo.push(
            // {
            //     name: `${count++}`,
            //     vars: [bWVar],
            //     bnds: { type: GLP_LO, lb: block.width, ub: 3 * block.width }
            // },
            {
                name: `${count++}`,
                vars: [block.lpLPos],
                bnds: { type: GLP_LO, lb: maxLeftFixed, ub: 1.0 }
            },
            {
                name: `${count++}`,
                vars: [bWVar, block.lpLPos],
                bnds: { type: GLP_UP, lb: 0, ub: minRight }
            }
        );
    }

    const objVars = [];
    for (let i = 0; i < widthVarCount.length; i++) {
        objVars.push({ name: widthVars[i], coef: widthVarCount[i] });
    }
    communicationTime += performance.now() - tStart;
    const result = await solveLP({
        name: Math.random().toString(),
        objective: {
            direction: GLP_MAX,
            name: 'obj',
            vars: objVars
        },
        subjectTo
    });
    nativeTime += result.time * 1000;
    if (result.result.status === GLP_OPT) {
        applyLPResult2(component, result.result.vars, widthVarMap, widthVars.length);
    } else {
        console.log('not optimal');
    }
}

function applyLPResult3(component: ScheduleBlock[], result: { [varName: string]: number }) {
    for (const key in result) {
        if (key.startsWith('l')) {
            const idx = +key.substr(1);
            component.find(b => b.idx === idx)!.left = result[key];
        } else if (key.startsWith('w')) {
            for (const b of component) b.width = result[key];
        }
    }
}

/**
 * build a LP model that optimizes the maximum width `w`.
 * All ScheduleBlocks are required to have width `w`. This function needs to be applied iteratively to achieve the optimal result
 * @param component
 */
export async function buildGLPKModel3(component: ScheduleBlock[]) {
    if (!window.Worker) return;

    const tStart = performance.now();
    const subjectTo: LP['subjectTo'] = [];
    let count = 0;
    for (const block of component) {
        let maxLeftFixed = 0.0;
        let minRight = 1.0;
        for (const v of block.neighbors) {
            const temp = v.left + v.width;
            if (temp <= block.left + 1e-8) {
                if (v.isFixed) {
                    maxLeftFixed = Math.max(maxLeftFixed, temp);
                } else {
                    subjectTo.push({
                        name: `${count++}`,
                        vars: [block.lpLPos, v.lpLNeg, negWVar],
                        bnds: zeroLB
                    });
                }
            }
            if (v.isFixed && v.left >= block.left + block.width - 1e-8)
                minRight = Math.min(v.left, minRight);
        }
        subjectTo.push(
            {
                name: `${count++}`,
                vars: [block.lpLPos],
                bnds: { type: GLP_LO, lb: maxLeftFixed, ub: 1.0 }
            },
            {
                name: `${count++}`,
                vars: [posWVar, block.lpLPos],
                bnds: { type: GLP_UP, lb: 0.0, ub: minRight }
            }
        );
    }

    communicationTime += performance.now() - tStart;
    const result = await solveLP({
        name: Math.random().toString(),
        objective: {
            direction: GLP_MAX,
            name: 'obj',
            vars: [posWVar]
        },
        subjectTo
    });
    nativeTime += result.time * 1000;
    if (result.result.status === GLP_OPT) {
        applyLPResult3(component, result.result.vars);
    } else {
        console.log('not optimal');
    }
}

export function clearTime() {
    nativeTime = 0.0;
    communicationTime = 0.0;
}
