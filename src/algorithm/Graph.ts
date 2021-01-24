/**
 * the graph model and algorithm used primarily for schedule rendering
 * @author Hanzhi Zhou, Kaiying Cat
 * @module src/algorithm
 */

/**
 *
 */
import ScheduleBlock from '@/models/ScheduleBlock';
import PriorityQueue from 'tinyqueue';

/**
 * for the array of schedule blocks provided, construct an adjacency list
 * to represent the conflicts between each pair of blocks
 */
export function constructAdjList(blocks: ScheduleBlock[]) {
    const len = blocks.length;
    // construct an undirected graph
    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            if (blocks[i].conflict(blocks[j])) {
                blocks[j].neighbors.push(blocks[i]);
                blocks[i].neighbors.push(blocks[j]);
            }
        }
    }
}

/**
 * run breadth-first search on a graph represented by `adjList` starting at node `start`
 * @returns the connected component that contains `start`
 */
export function BFS(start: ScheduleBlock) {
    let qIdx = 0;
    const componentNodes: ScheduleBlock[] = [start];
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
 * the classical interval scheduling algorithm
 * @param blocks the events to schedule
 */
export function intervalScheduling(blocks: ScheduleBlock[]) {
    if (blocks.length === 0) return [];

    blocks.sort((b1, b2) => {
        const diff = b1.startMin - b2.startMin;
        if (diff === 0) return b1.duration - b2.duration;
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
    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        const prevBlock = queue.peek()!;
        if (prevBlock.endMin > block.startMin) {
            // conflict, need to add a new room
            numRooms += 1;
            block.depth = numRooms;
        } else {
            queue.pop(); // update the room end time
            block.depth = prevBlock.depth;
        }
        queue.push(block);
    }
    numRooms += 1;
    const groupedByRoom: ScheduleBlock[][] = Array.from({ length: numRooms }, () => []);
    for (const block of blocks) groupedByRoom[block.depth].push(block);
    for (let i = 1; i < numRooms; i++) {
        for (let j = 0; j < groupedByRoom[i].length; j++) {
            const block = groupedByRoom[i][j];
            for (let k = 0; k < i; k++) {
                const prevBlocks = groupedByRoom[k];
                if (prevBlocks.every(b => !b.conflict(block))) {
                    block.depth = k;
                    groupedByRoom[i].splice(j--, 1);
                    prevBlocks.push(block);
                    break;
                }
            }
        }
    }
    return groupedByRoom;
}

/**
 * calculate the actual path depth of the nodes
 * @requires optimization
 */
export function calculateMaxDepth(blocks: ScheduleBlock[]) {
    for (const block of blocks) block.visited = false;

    blocks.sort((v1, v2) => v2.depth - v1.depth);

    // We start from the node of the greatest depth and traverse to the lower depths
    for (const node of blocks) if (!node.visited) depthFirstSearchRec(node, node.depth + 1);

    for (const node of blocks)
        if (node.neighbors.every(v => v.depth < node.depth)) DFSFindFixed(node);
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
    const startDepth = start.depth;
    if (startDepth === 0) {
        start.isFixed = true;
        return true;
    }
    const pDepth = start.pathDepth;
    let flag = false;
    for (const adj of start.neighbors) {
        // we only visit nodes next to the current node (depth different is exactly 1) with the same pathDepth
        if (startDepth - adj.depth === 1 && pDepth === adj.pathDepth) {
            // be careful of the short-circuit evaluation
            flag = DFSFindFixed(adj) || flag;
        }
    }
    start.isFixed = flag;
    return flag;
}
