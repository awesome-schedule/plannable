/**
 * the graph models and algorithms used primarily for schedule rendering
 * @author Hanzhi Zhou, Kaiying Shan
 * @module src/algorithm
 */

/**
 *
 */
import { ScheduleDays } from '@/models/Schedule';

export const options = {
    isTolerance: 0,
    ISMethod: 1,
    applyDFS: true,
    tolerance: 0,
    LPIters: 100,
    LPModel: 2,
    showFixed: false
};

declare const Module: any;
interface NativeFuncs {
    setOptions(a: number, b: number, c: number, d: number, e: number, f: number): void;
    compute(a: number, b: number): void;
    getPositions(): number;
    getSum(): number;
    getSumSq(): number;
    getFixed(): number;
}
const nativeFuncs = new Promise<NativeFuncs>((resolve, reject) => {
    Module['onRuntimeInitialized'] = () => {
        resolve({
            setOptions: Module.cwrap('setOptions', null, new Array(6).fill('number')),
            compute: Module.cwrap('compute', null, ['number', 'number']),
            getPositions: Module.cwrap('getPositions', 'number'),
            getSum: Module.cwrap('getSum', 'number'),
            getSumSq: Module.cwrap('getSumSq', 'number'),
            getFixed: Module.cwrap('getFixed', 'number')
        });
    };
});

/**
 * compute the width and left of the blocks contained in each day
 */
export async function computeBlockPositions(days: ScheduleDays) {
    // console.time('compute bp');
    // const promises = [];
    console.time('native compute');
    const funcs = await nativeFuncs;

    funcs.setOptions(
        options.isTolerance,
        options.ISMethod,
        +options.applyDFS,
        options.tolerance,
        options.LPIters,
        options.LPModel
    );
    let N = 0;
    let sum = 0;
    let sumSq = 0;
    for (const blocks of days) {
        const len = blocks.length;
        if (len === 0) continue;

        const bufPtr = Module._malloc(len * 4);
        const u16 = new Int16Array(Module.HEAPU8.buffer, bufPtr, len * 2);
        for (let i = 0; i < len; i++) {
            u16[2 * i] = blocks[i].startMin;
            u16[2 * i + 1] = blocks[i].endMin;
        }
        funcs.compute(bufPtr, len);
        const result = new Float64Array(Module.HEAPU8.buffer, funcs.getPositions(), len * 2);
        for (let i = 0; i < len; i++) {
            blocks[i].left = result[2 * i];
            blocks[i].width = result[2 * i + 1];
        }
        N += len;
        sum += funcs.getSum();
        sumSq += funcs.getSumSq();
        if (options.showFixed) {
            const fixed = new Uint8Array(Module.HEAPU8.buffer, funcs.getFixed(), len);
            for (let i = 0; i < len; i++) {
                if (fixed[i]) (blocks[i] as any).background = '#000';
            }
        }
        Module._free(bufPtr);
    }
    if (N > 0) console.log('mean', sum / N, 'variance', sumSq / N - (sum / N) ** 2);
    console.timeEnd('native compute');
}
