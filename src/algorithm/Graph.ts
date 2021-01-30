/**
 * the graph model and algorithm used primarily for schedule rendering
 * @author Hanzhi Zhou, Kaiying Cat
 * @module src/algorithm
 */

/**
 *
 */
import ScheduleBlock from '@/models/ScheduleBlock';

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
    const componentNodes = [start];
    start.visited = true;
    while (qIdx < componentNodes.length) {
        for (const node of componentNodes[qIdx++].neighbors) {
            if (!node.visited && !node.isFixed) {
                node.visited = true;
                componentNodes.push(node);
            }
        }
    }
    return componentNodes;
}

/**
 * a modified interval scheduling algorithm, runs in worst case O(n^2)
 * besides using the fewest possible rooms,
 * it also tries to assignment events to the rooms with the lowest index possible
 * @param blocks the events to schedule
 */
export function intervalScheduling(blocks: ScheduleBlock[]) {
    if (blocks.length === 0) return 0;

    // sort by start time
    blocks.sort((b1, b2) => {
        const diff = b1.startMin - b2.startMin;
        if (diff === 0) return b1.duration - b2.duration;
        return diff;
    });
    const occupied = [blocks[0]];
    let numRooms = 0;
    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        let idx = -1;
        let minRoomIdx = Infinity;
        for (let k = 0; k < occupied.length; k++) {
            const prevBlock = occupied[k];
            if (prevBlock.endMin <= block.startMin && prevBlock.depth < minRoomIdx) {
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
        const samePath = startDepth - adj.depth === 1 && pDepth === adj.pathDepth;
        if (adj.visited) {
            flag = (adj.isFixed && samePath) || flag;
        } else {
            // be careful of the short-circuit evaluation
            flag = (samePath && DFSFindFixed(adj)) || flag;
        }
    }
    return (start.isFixed = flag);
}

/**
 * calculate the actual path depth of the nodes
 * @requires optimization
 */
export function calculateMaxDepth(blocks: ScheduleBlock[]) {
    blocks.sort((v1, v2) => v2.depth - v1.depth);

    // We start from the node of the greatest depth and traverse to the lower depths
    for (const node of blocks) if (!node.visited) depthFirstSearchRec(node, node.depth + 1);
    // for (const node of blocks) if (!node.visited && node.depth === 0) depthFirstSearchRec3(node);
    for (const node of blocks) node.visited = false;
    for (const node of blocks)
        if (!node.visited && node.neighbors.every(v => v.depth < node.depth)) DFSFindFixed(node);

    // we must set all nodes belonging to this component as visited, or the caller will have a problem
    // for (const node of blocks) node.hidden = !node.isFixed;
}
