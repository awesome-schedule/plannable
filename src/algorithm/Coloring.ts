/**
 * Utilities for graph coloring, used for rendering conflicting courses/events
 * @author Hanzhi Zhou, Kaiying Cat
 * @module algorithm
 */

/**
 *
 */
import ScheduleBlock from '@/models/ScheduleBlock';
import PriorityQueue from 'tinyqueue';
import { Graph, Vertex } from './Graph';

/**
 * the classical interval scheduling algorithm, runs in linear-logarithmic time
 * @param blocks the events to schedule
 * @param assignment room index for each event
 * @returns the total number of rooms required
 */
export function intervalScheduling(blocks: ScheduleBlock[], assignment: Int16Array) {
    if (blocks.length === 0) return 0;

    blocks.sort((b1, b2) => b1.startMin - b2.startMin); // sort by start time
    // min heap, the top element is the room whose end time is minimal
    // a room is represented as a pair: [end time, room index]
    const queue = new PriorityQueue<readonly [number, number]>(
        [[blocks[0].endMin, 0]],
        (r1, r2) => r1[0] - r2[0]
    );
    let numRooms = 0;
    assignment[0] = 0;
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
    return numRooms + 1;
}

/**
 * @todo
 * @requires optimization
 */
export function colorSpread(adjList: number[][], colors: Int16Array, numColors: number) {
    // sort nodes with ascending number of conflicts
    const rank = adjList
        .map((x: number[], i) => [x.length, i])
        .sort((a: number[], b: number[]) => a[0] - b[0])
        .map(x => x[1]);
    /**
     * Records the nodes that correspond to each color
     */
    const col2nodes: number[][] = new Array(numColors);
    for (let i = 0; i < col2nodes.length; i++) {
        col2nodes[i] = [];
    }
    for (let i = 0; i < colors.length; i++) {
        col2nodes[colors[i]].push(i);
    }
    for (let i = 0; i < rank.length; i++) {
        const cur = rank[i]; // current node
        let maxCol = -1; // original color
        let maxLen = 0; // maximum number of colors that current block spreads
        let curCol = maxCol; // current color
        let curLen = maxLen; // current number of colors that current block spreads
        let curColStart = maxCol; // the start of the spread of colors
        let changed = false;
        if (adjList[rank[i]].length === 0) continue;
        /**
         * This loop goes through each color to figure out which color would make the node
         * spread the widest without conflicting any other nodes in the color and colors that
         * it spreads
         */
        nextColor: for (let j = 0; j < col2nodes.length; j++) {
            for (let k = 0; k < col2nodes[j].length; k++) {
                if (adjList[cur].includes(col2nodes[j][k])) {
                    continue nextColor;
                }
            }
            if (j !== curCol + 1) {
                curColStart = j;
                curLen = 1;
            } else {
                curLen++;
            }
            curCol = j;
            if (curLen > maxLen) {
                maxLen = curLen;
                maxCol = curColStart;
                changed = true;
            }
        }
        if (changed && maxLen > 1) {
            /**
             * Between the original color and the new color, there must be
             * color(s) in which ALL of the nodes that have conflict with the
             * current node have conflict with at least one nodes
             * of of the nodes in the new color or the color that current node
             * spreads
             */
            let flip = false;
            const nodesAfter = col2nodes[maxCol];
            const start = colors[cur] < maxCol ? colors[cur] + 1 : maxCol + 1;
            const end = colors[cur] < maxCol ? maxCol : colors[cur];
            for (let c = start; c < end; c++) {
                const nodesBetween = col2nodes[c].filter(x => adjList[cur].includes(x));
                if (nodesBetween.length > 1) {
                    flip = false;
                    break;
                }
                for (let j = 0; j < nodesBetween.length; j++) {
                    for (let k = 0; k < nodesAfter.length; k++) {
                        if (adjList[nodesAfter[k]].includes(nodesBetween[j])) {
                            flip = true;
                            break;
                        }
                    }
                }
            }

            if (flip) {
                // change the color of node
                col2nodes[colors[cur]].splice(col2nodes[colors[cur]].indexOf(cur), 1);
                colors[cur] = maxCol;
                col2nodes[colors[maxCol]].push(cur);
                /**
                 * In the following context, "color rule" refers to that every node n has
                 * a color c, and either c is 0 or n is connected to a node with color c - 1.
                 */
                /**
                 * Loop through every node connected to the node that changes color because
                 * only nodes connected to the node that changes color would possibly break
                 * the color rule.
                 */
                nextNode: for (const a of adjList[cur]) {
                    const original = colors[a];
                    if (colors[a] === 0) continue;
                    /**
                     * whether a's color is less than its connected nodes'
                     */
                    let min = true;
                    /**
                     * the largest node less than a's original color
                     */
                    let max = 0;
                    for (const b of adjList[a]) {
                        // does not break the color rule; check the next node
                        if (colors[b] === colors[a] - 1) {
                            continue nextNode;
                        } else {
                            if (colors[b] < original) {
                                min = false;
                            }
                            if (colors[b] > max && colors[b] < original) {
                                max = colors[b];
                            }
                        }
                    }
                    // if break the color rule
                    col2nodes[colors[a]].splice(col2nodes[colors[a]].indexOf(a), 1);
                    colors[a] = min ? 0 : max + 1;
                    col2nodes[colors[a]].push(a);
                }
            }
        }
    }
}

/**
 * calculate the actual path depth of the nodes
 * @requires optimization
 * @param adjList
 * @param colors
 * @param values the array of things contained in each node
 */
export function colorDepthSearch<T = number>(
    adjList: number[][],
    colors: Int16Array,
    values: T[]
): Graph<T> {
    const graph: Graph<T> = new Map();
    const vertices = adjList.map((_, i) => {
        const v = new Vertex(values[i]);
        v.depth = colors[i];
        return v;
    });

    for (let i = 0; i < colors.length; i++) {
        graph.set(vertices[i], adjList[i].map(x => vertices[x]));
    }

    vertices.sort((v1, v2) => v2.depth - v1.depth);
    for (const start of vertices)
        if (!start.visited) depthFirstSearchRec(start, graph, start.depth + 1);

    return graph;
}

/**
 * A special implementation of depth first search on a single connected component,
 * used to find the maximum depth of the path that the current node is on.
 *
 * The depth of all nodes are known beforehand.
 * @requires optimization
 */
function depthFirstSearchRec<T>(start: Vertex<T>, graph: Graph<T>, depth: number) {
    const neighbors = graph.get(start)!;
    start.visited = true;
    start.pathDepth = depth;

    for (const adj of neighbors) {
        // we only visit nodes of lower depth
        if (!adj.visited && adj.depth < start.depth) depthFirstSearchRec(adj, graph, depth);
    }
}
