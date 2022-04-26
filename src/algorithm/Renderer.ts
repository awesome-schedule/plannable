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
    applyDFS: false,
    tolerance: 0,
    LPIters: 50,
    LPModel: 1,
    showFixed: false,
    MILP: false,
    tFactor: 0.1
};

/**
 * compute the width and left of the blocks contained in each day
 */
export function computeBlockPositions(days: ScheduleDays) {
    const Module = window.NativeModule;

    console.time('native compute');
    Module._setOptions(
        options.isTolerance,
        options.ISMethod,
        +options.applyDFS,
        options.tolerance,
        options.LPIters,
        options.LPModel,
        +options.MILP,
        options.tFactor
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
        /**
         * the rPtr returned by _compute is an pointer pointing to an array of ScheduleBlock. The offsets of some important fields are listed below.
         * ```cpp
         * ScheduleBlock* rPtr = compute(bufPtr, len);
         * assert(offsetof(ScheduleBlock, isFixed) == 0);
         * assert(offsetof(ScheduleBlock, left) == 24);
         * assert(offsetof(ScheduleBlock, width) == 32);
         * assert(sizeof(ScheduleBlock) == 64);
         * ```
         */
        const rPtr = Module._compute(bufPtr, len);
        if (rPtr === 0) {
            alert('Out of memory!');
            console.error('Out of memory!');
        }
        const result = new Float64Array(Module.HEAPU8.buffer, rPtr, len * 8);
        for (let i = 0; i < len; i++) {
            blocks[i].left = result[8 * i + 3];
            blocks[i].width = result[8 * i + 4];
        }
        if (len > N) {
            N = len;
            sum = Module._getSum();
            sumSq = Module._getSumSq();
        }
        // N += len;
        // sum += Module._getSum();
        // sumSq += Module._getSumSq();
        if (options.showFixed) {
            const arr = new Uint8Array(Module.HEAPU8.buffer, rPtr, len * 64);
            for (let i = 0; i < len; i++) {
                if (arr[64 * i]) (blocks[i] as any).background = '#000';
            }
        }
    }
    if (N > 0) console.log('mean', sum / N, 'variance', sumSq / N - (sum / N) ** 2);
    console.timeEnd('native compute');
}
