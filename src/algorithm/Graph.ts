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
    const adjList: number[][] = blocks.map(() => []);

    // construct an undirected graph
    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            if (blocks[i].conflict(blocks[j])) {
                adjList[i].push(j);
                adjList[j].push(i);
            }
        }
    }
    return adjList;
}

/**
 * run breadth-first search on a graph represented by `adjList` starting at node `start`
 * @returns the connected component that contains `start`
 */
export function BFS(start: number, adjList: number[][], visited: Uint8Array): number[] {
    let qIdx = 0;
    const componentNodes: number[] = [start];
    visited[start] = 1;
    while (qIdx < componentNodes.length) {
        for (const i of adjList[componentNodes[qIdx++]]) {
            if (!visited[i]) {
                visited[i] = 1;
                componentNodes.push(i);
            }
        }
    }
    return componentNodes;
}

/**
 * the classical interval scheduling algorithm, runs in linear-logarithmic time
 * @param blocks the events to schedule
 * @param assignment room index for each event
 * @returns the total number of rooms required
 */
export function intervalScheduling(blocks: ScheduleBlock[], assignment: Uint16Array) {
    if (blocks.length === 0) return [];

    blocks.sort((b1, b2) => {
        const diff = b1.startMin - b2.startMin;
        if (diff === 0) return b1.duration - b2.duration;
        return diff;
    }); // sort by start time
    // min heap, the top element is the room whose end time is minimal
    // a room is represented as a pair: [end time, room index]
    const queue = new PriorityQueue<readonly [number, number]>(
        [[blocks[0].endMin, 0]],
        (r1, r2) => {
            const diff = r1[0] - r2[0];
            if (diff === 0) return r1[1] - r2[1];
            return diff;
        }
    );
    let numRooms = 0;
    for (let i = 1; i < blocks.length; i++) {
        const { startMin, endMin } = blocks[i];
        const [earliestEnd, roomIdx] = queue.peek()!;
        if (earliestEnd > startMin) {
            // conflict, need to add a new room
            numRooms += 1;
            queue.push([endMin, numRooms]);
            assignment[i] = numRooms;
        } else {
            queue.pop(); // update the room end time
            queue.push([endMin, roomIdx]);
            assignment[i] = roomIdx;
        }
    }
    numRooms += 1;
    const groupedByRoom: number[][] = Array.from({ length: numRooms }, () => []);
    for (let i = 0; i < assignment.length; i++) groupedByRoom[assignment[i]].push(i);
    for (let i = 1; i < numRooms; i++) {
        for (let j = 0; j < groupedByRoom[i].length; j++) {
            const blockIdx = groupedByRoom[i][j];
            const block = blocks[blockIdx];
            for (let k = 0; k < i; k++) {
                const prevBlocks = groupedByRoom[k];
                if (prevBlocks.every(b => !blocks[b].conflict(block))) {
                    assignment[blockIdx] = k;
                    groupedByRoom[i].splice(j--, 1);
                    groupedByRoom[k].push(blockIdx);
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
 * @param adjList
 * @param assignment
 */
export function calculateMaxDepth(adjList: number[][], depths: Uint16Array) {
    const len = depths.length;
    const visited = new Uint8Array(len);
    const pathDepth = new Uint16Array(len);
    const isFixed = new Uint8Array(len);

    const vertices = new Uint16Array(len);
    for (let i = 0; i < vertices.length; i++) {
        vertices[i] = i;
    }
    vertices.sort((v1, v2) => depths[v2] - depths[v1]);

    // We start from the node of the greatest depth and traverse to the lower depths
    for (const v of vertices)
        if (!visited[v]) depthFirstSearchRec(v, adjList, visited, depths, pathDepth, depths[v] + 1);

    for (let i = 0; i < len; i++) {
        const curDepth = depths[i];
        if (adjList[i].every(v => depths[v] < curDepth)) {
            DFSFindFixed(i, adjList, isFixed, depths, pathDepth);
        }
    }

    return [pathDepth, isFixed] as const;
}

/**
 * A special implementation of depth first search on a single connected component,
 * used to find the maximum depth of the path that the current node is on.
 *
 * We start from the node of the greatest depth and traverse to the lower depths
 *
 * The depth of all nodes are known beforehand (from the room assignment).
 */
function depthFirstSearchRec(
    start: number,
    adjList: number[][],
    visited: Uint8Array,
    depths: Uint16Array,
    pathDepth: Uint16Array,
    maxDepth: number
) {
    visited[start] = 1;
    pathDepth[start] = maxDepth;

    const startDepth = depths[start];
    for (const adj of adjList[start]) {
        // we only visit nodes of lower depth
        if (!visited[adj] && depths[adj] < startDepth)
            depthFirstSearchRec(adj, adjList, visited, depths, pathDepth, maxDepth);
    }
}

function DFSFindFixed(
    start: number,
    adjList: number[][],
    isFixed: Uint8Array,
    depths: Uint16Array,
    pathDepth: Uint16Array
): boolean {
    const startDepth = depths[start];
    if (startDepth === 0) {
        isFixed[start] = 1;
        return true;
    }
    const pDepth = pathDepth[start];
    let flag = false;
    for (const adj of adjList[start]) {
        // we only visit nodes of lower depth
        if (startDepth - depths[adj] === 1 && pDepth === pathDepth[adj]) {
            // be careful of the short-circuit evaluation
            flag = DFSFindFixed(adj, adjList, isFixed, depths, pathDepth) || flag;
        }
    }
    isFixed[start] = +flag;
    return flag;
}
