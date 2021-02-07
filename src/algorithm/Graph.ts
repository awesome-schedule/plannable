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
    const tolerance = options.tolerance;
    // construct an undirected graph
    for (let i = 0; i < len; i++) {
        const bi = blocks[i];
        for (let j = i + 1; j < len; j++) {
            const bj = blocks[j];
            if (bi.conflict(bj, tolerance)) {
                bj.neighbors.push(bi);
                bi.neighbors.push(bj);
            }
        }
    }
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
        for (const node of componentNodes[qIdx++].neighbors) {
            if (!node.visited) {
                node.visited = true;
                componentNodes.push(node);
            }
        }
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

    const startDepth = start.depth;
    for (const adj of start.neighbors) {
        // we only visit nodes of lower depth
        if (!adj.visited && adj.depth < startDepth) depthFirstSearchRec(adj, maxDepth);
    }
}

function DFSFindFixed(start: ScheduleBlock): boolean {
    start.visited = true;
    const startDepth = start.depth;
    if (startDepth === 0) return (start.isFixed = true);

    const pDepth = start.pathDepth;
    let flag = false;
    for (const adj of start.neighbors) {
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
    for (const adj of start.neighbors) {
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
    for (const node of blocks)
        if (!node.visited && node.neighbors.every(v => v.depth < node.depth)) DFSFindFixed(node);
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
                    node.neighbors.find(n => n.isFixed && Math.abs(right - n.left) < 1e-8))
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
    for (const blocks of days) {
        blocks.forEach((b, i) => {
            b.idx = i;
            b.lpLNeg.name = b.lpLPos.name = `l${i}`;
        });
        constructAdjList(blocks);

        const total =
            options.ISMethod === 1 ? intervalScheduling(blocks) : intervalScheduling2(blocks);
        if (total <= 1) {
            for (const node of blocks) {
                node.left = 0.0;
                node.width = 1.0;
            }
            continue;
        }
        if (options.applyDFS) {
            calculateMaxDepth(blocks);
            for (const block of blocks) {
                block.left = block.depth / block.pathDepth;
                block.width = 1.0 / block.pathDepth;
            }
        } else {
            for (const block of blocks) {
                block.left = block.depth / total;
                block.width = 1.0 / total;
            }
        }
    }
    if (options.applyDFS) {
        // console.timeEnd('compute bp');
        // const tStart = performance.now();
        await Promise.all(days.map(blocks => _computeBlockPositionHelper(blocks)));
        // console.log('lp', performance.now() - tStart);
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
