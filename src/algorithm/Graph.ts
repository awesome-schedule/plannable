/**
 * the graph models and algorithms used primarily for schedule rendering
 * @author Hanzhi Zhou, Kaiying Shan
 * @module src/algorithm
 */

/**
 *
 */
import { ScheduleDays } from '@/models/Schedule';
import ScheduleBlock from '@/models/ScheduleBlock';
import PriorityQueue from 'tinyqueue';
import * as LP from './LP';

export const options = {
    isTolerance: 0,
    ISMethod: 1,
    applyDFS: true,
    tolerance: 0,
    LPIters: 100,
    LPModel: 3,
    showFixed: false
};

/**
 * for the array of schedule blocks provided, construct an adjacency list
 * to represent the conflicts between each pair of blocks
 */
function constructAdjList(blocks: ScheduleBlock[]) {
    const len = blocks.length;
    const matrix = new Uint8Array(len * len);
    const tolerance = options.tolerance;
    // construct an undirected graph
    for (let i = 0; i < len; i++) {
        const bi = blocks[i];
        for (let j = i + 1; j < len; j++) {
            const bj = blocks[j];
            if (bi.conflict(bj, tolerance)) {
                if (bi.depth < bj.depth) {
                    matrix[bj.idx * len + bi.idx] = 1;
                    bj.leftN.push(bi);
                    bi.rightN.push(bj);
                } else {
                    matrix[bi.idx * len + bj.idx] = 1;
                    bj.rightN.push(bi);
                    bi.leftN.push(bj);
                }
            }
        }
    }
    return matrix;
}

/**
 * run breadth-first search on a graph represented by `adjList` starting at node `start`
 * @returns the connected component that contains `start`
 */
function BFS(start: ScheduleBlock) {
    let qIdx = 0;
    const componentNodes = [start];
    start.visited = true;
    while (qIdx < componentNodes.length) {
        for (const node of componentNodes[qIdx].leftN) {
            if (!node.visited) {
                node.visited = true;
                componentNodes.push(node);
            }
        }
        for (const node of componentNodes[qIdx].rightN) {
            if (!node.visited) {
                node.visited = true;
                componentNodes.push(node);
            }
        }
        qIdx++;
    }
    return componentNodes;
}

/**
 * a modified interval scheduling algorithm, runs in worst case O(n^2)
 * besides using the fewest possible rooms, it also tries to assignment events to the rooms with the lowest index possible
 * @param blocks the events to schedule
 */
function intervalScheduling(blocks: ScheduleBlock[]) {
    if (blocks.length === 0) return 0;

    // sort by start time
    blocks.sort((b1, b2) => {
        const diff = b1.startMin - b2.startMin;
        if (diff === 0) return b2.duration - b1.duration;
        return diff;
    });
    const occupied = [blocks[0]];
    let numRooms = 0;
    const tolerance = options.isTolerance;
    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        let idx = -1;
        let minRoomIdx = Infinity;
        for (let k = 0; k < occupied.length; k++) {
            const prevBlock = occupied[k];
            if (prevBlock.endMin <= block.startMin + tolerance && prevBlock.depth < minRoomIdx) {
                minRoomIdx = prevBlock.depth;
                idx = k;
            }
        }
        if (idx === -1) {
            numRooms += 1;
            block.depth = numRooms;
            occupied.push(block);
        } else {
            block.depth = occupied[idx].depth;
            occupied[idx] = block;
        }
    }
    numRooms += 1;
    return numRooms;
}

/**
 * the classical interval scheduling algorithm, runs in O(n log n)
 * @param blocks
 */
function intervalScheduling2(blocks: ScheduleBlock[]) {
    if (blocks.length === 0) return 0;

    blocks.sort((b1, b2) => {
        const diff = b1.startMin - b2.startMin;
        if (diff === 0) return b2.duration - b1.duration;
        return diff;
    }); // sort by start time
    // min heap, the top element is the room whose end time is minimal
    // a room is represented as a pair: [end time, room index]
    const queue = new PriorityQueue<ScheduleBlock>([blocks[0]], (r1, r2) => {
        const diff = r1.endMin - r2.endMin;
        if (diff === 0) return r1.depth - r2.depth;
        return diff;
    });
    let numRooms = 0;
    const tolerance = options.isTolerance;
    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        const prevBlock = queue.peek()!;
        if (prevBlock.endMin + tolerance > block.startMin) {
            // conflict, need to add a new room
            numRooms += 1;
            block.depth = numRooms;
        } else {
            queue.pop(); // update the room end time
            block.depth = prevBlock.depth;
        }
        queue.push(block);
    }
    return numRooms + 1;
}

/**
 * A special implementation of depth first search on a single connected component,
 * used to find the maximum depth of the path that the current node is on.
 *
 * We start from the node of the greatest depth and traverse to the lower depths
 *
 * The depth of all nodes are known beforehand (from the room assignment).
 */
function depthFirstSearchRec(start: ScheduleBlock, maxDepth: number) {
    start.visited = true;
    start.pathDepth = maxDepth;

    for (const adj of start.leftN) {
        // we only visit nodes of lower depth
        if (!adj.visited) depthFirstSearchRec(adj, maxDepth);
    }
}

function DFSFindFixed(start: ScheduleBlock): boolean {
    start.visited = true;
    const startDepth = start.depth;
    if (startDepth === 0) return (start.isFixed = true);

    const pDepth = start.pathDepth;
    let flag = false;
    for (const adj of start.leftN) {
        // we only visit nodes next to the current node (depth different is exactly 1) with the same pathDepth
        if (startDepth - adj.depth === 1 && pDepth === adj.pathDepth) {
            if (adj.visited) {
                flag = adj.isFixed || flag;
            } else {
                // be careful of the short-circuit evaluation
                flag = DFSFindFixed(adj) || flag;
            }
        }
    }
    return (start.isFixed = flag);
}

export function DFSFindFixedNumerical(start: ScheduleBlock): boolean {
    start.visited = true;
    const startLeft = start.left;
    // equality here should be fine
    if (startLeft === 0.0) return (start.isFixed = true);

    let flag = false;
    for (const adj of start.leftN) {
        if (Math.abs(startLeft - adj.left - adj.width) < 1e-8) {
            if (adj.visited) {
                flag = adj.isFixed || flag;
            } else {
                // be careful of the short-circuit evaluation
                flag = DFSFindFixedNumerical(adj) || flag;
            }
        }
    }
    return (start.isFixed = flag);
}

/**
 * calculate the actual path depth of the nodes
 * @requires optimization
 */
function calculateMaxDepth(blocks: ScheduleBlock[]) {
    blocks.sort((v1, v2) => v2.depth - v1.depth);

    // We start from the node of the greatest depth and traverse to the lower depths
    for (const node of blocks) if (!node.visited) depthFirstSearchRec(node, node.depth + 1);
    // for (const node of blocks) if (!node.visited && node.depth === 0) depthFirstSearchRec3(node);
    for (const node of blocks) node.visited = false;
    for (const node of blocks) if (!node.visited && node.rightN.length === 0) DFSFindFixed(node);
}

async function _computeBlockPositionHelper(blocks: ScheduleBlock[]) {
    let prevFixedCount = 0;
    for (const block of blocks) prevFixedCount += +(block.visited = block.isFixed);
    // LP.initCountPool(blocks.length * (blocks.length + 2));

    if (options.LPModel === 1) {
        const promises = [];
        for (const block of blocks) {
            if (!block.visited) {
                const component = BFS(block);
                promises.push(LP.buildGLPKModel(component));
            }
        }
        await Promise.all(promises);
        return;
    }
    let LPModelFunc = LP.buildGLPKModel3;
    if (options.LPModel === 2) LPModelFunc = LP.buildGLPKModel2;

    let i = 0;
    while (i < options.LPIters) {
        const promises = [];
        for (const block of blocks) {
            if (!block.visited) {
                const component = BFS(block);
                promises.push(LPModelFunc(component));
            }
        }
        for (const node of blocks) node.visited = node.isFixed;
        await Promise.all(promises);

        for (const node of blocks) {
            const right = node.left + node.width;
            if (
                !node.visited &&
                (Math.abs(right - 1.0) < 1e-8 ||
                    node.rightN.find(n => n.isFixed && Math.abs(right - n.left) < 1e-8))
            ) {
                DFSFindFixedNumerical(node);
            }
        }
        let fixedCount = 0;
        for (const block of blocks) fixedCount += +(block.visited = block.isFixed);
        if (fixedCount === prevFixedCount) {
            // console.log('convergence reached at ' + i);
            break;
        }
        prevFixedCount = fixedCount;
        i++;
    }
}

/**
 * compute the width and left of the blocks contained in each day
 */
export async function computeBlockPositions(days: ScheduleDays) {
    // console.time('compute bp');
    const promises = [];
    console.time('compute block positions');
    for (const blocks of days) {
        const total =
            options.ISMethod === 1 ? intervalScheduling(blocks) : intervalScheduling2(blocks);
        if (total <= 1) {
            for (const node of blocks) {
                node.left = 0.0;
                node.width = 1.0;
            }
            continue;
        }

        const len = blocks.length;
        for (let i = 0; i < len; i++) {
            const b = blocks[i];
            b.idx = i;
            b.lpLNeg.name = b.lpLPos.name = `l${i}`;
        }
        const matrix = constructAdjList(blocks);
        // --------------- one of the bottle neck --------------------
        // console.time('group adjList');
        // for (const block of blocks) {
        //     for (const v1 of block.leftN) {
        //         if (!block.leftN.some(v => matrix[v.idx * len + v1.idx])) {
        //             block.cleftN.push(v1);
        //         }
        //     }
        // }
        // console.timeEnd('group adjList');
        // ----------------------------------------------------------
        if (options.applyDFS) {
            calculateMaxDepth(blocks);
            for (const block of blocks) {
                block.left = block.depth / block.pathDepth;
                block.width = 1.0 / block.pathDepth;
            }
            promises.push(_computeBlockPositionHelper(blocks));
        } else {
            for (const block of blocks) {
                block.left = block.depth / total;
                block.width = 1.0 / total;
            }
        }
    }
    console.timeEnd('compute block positions');
    if (options.applyDFS) {
        // console.timeEnd('compute bp');
        // const tStart = performance.now();
        // console.log('lp', performance.now() - tStart);
        await Promise.all(promises);
        let N = 0;
        let sumW = 0.0,
            sumW2 = 0.0;
        for (const blocks of days) {
            for (const block of blocks) {
                N++;
                sumW += block.width * 100;
                sumW2 += (block.width * 100) ** 2;
            }
        }
        if (N > 500) {
            const mean = sumW / N;
            console.log('meanW', mean, 'varW', sumW2 / N - mean ** 2);
        }
    }
    if (options.showFixed)
        for (const blocks of days)
            for (const block of blocks) if (block.isFixed) (block.background as any) = '#000000';
}

declare const Module: any;
interface NativeFuncs {
    setOptions(a: number, b: number, c: number, d: number, e: number, f: number, g: number): void;
    compute(a: number, b: number): number;
}
const nativeFuncs = new Promise<NativeFuncs>((resolve, reject) => {
    Module['onRuntimeInitialized'] = () => {
        resolve({
            setOptions: Module.cwrap('setOptions', 'number', new Array(7).fill('number')),
            compute: Module.cwrap('compute', 'number', ['number', 'number'])
        });
    };
});

/**
 * compute the width and left of the blocks contained in each day
 */
export async function computeBlockPositionsNative(days: ScheduleDays) {
    // console.time('compute bp');
    // const promises = [];
    console.time('native compute');
    const { compute, setOptions } = await nativeFuncs;

    setOptions(
        options.isTolerance,
        options.ISMethod,
        +options.applyDFS,
        options.tolerance,
        options.LPIters,
        options.LPModel,
        +options.showFixed
    );

    for (const blocks of days) {
        const len = blocks.length;
        const bufPtr = Module._malloc(len * 4);
        const u16 = new Uint16Array(Module.HEAPU8.buffer, bufPtr, len * 2);
        for (let i = 0; i < len; i++) {
            u16[2 * i] = blocks[i].startMin;
            u16[2 * i + 1] = blocks[i].endMin;
        }
        const ptr = compute(bufPtr, len);
        const result = new Float64Array(Module.HEAPU8.buffer, ptr, len * 2);
        for (let i = 0; i < len; i++) {
            blocks[i].left = result[2 * i];
            blocks[i].width = result[2 * i + 1];
        }
        Module._free(bufPtr);
        Module._free(ptr);
    }
    console.timeEnd('native compute');
}
