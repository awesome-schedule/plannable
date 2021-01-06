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
 * The vertex of a graph.
 * It holds many attributes that are modified **in-place** when running a graph algorithm
 */
export class Vertex<T> {
    public visited = false;
    /**
     * the maximum depth of the path starting from the root that the current node is on
     */
    public pathDepth = 0;
    /**
     * @param val the value contained in this node
     * @param depth depth of the node relative to the root
     */
    constructor(public readonly val: T, public readonly depth: number) {}
}

/**
 * adjacency list representation of a graph
 */
export type Graph<T> = Map<Vertex<T>, Vertex<T>[]>;

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
 * calculate the actual path depth of the nodes
 * @requires optimization
 * @param adjList
 * @param assignment
 * @param values the array of things contained in each node
 */
export function calculateMaxDepth<T = number>(
    adjList: number[][],
    assignment: Int16Array,
    values: T[]
): Graph<T> {
    const graph: Graph<T> = new Map();
    const vertices = adjList.map((_, i) => new Vertex(values[i], assignment[i]));

    for (let i = 0; i < assignment.length; i++) {
        graph.set(
            vertices[i],
            adjList[i].map(x => vertices[x])
        );
    }

    // We start from the node of the greatest depth and traverse to the lower depths
    vertices.sort((v1, v2) => v2.depth - v1.depth);
    for (const start of vertices)
        if (!start.visited) depthFirstSearchRec(start, graph, start.depth + 1);

    return graph;
}

/**
 * A special implementation of depth first search on a single connected component,
 * used to find the maximum depth of the path that the current node is on.
 *
 * We start from the node of the greatest depth and traverse to the lower depths
 *
 * The depth of all nodes are known beforehand (from the colors/slot assignment).
 */
function depthFirstSearchRec<T>(start: Vertex<T>, graph: Graph<T>, depth: number) {
    start.visited = true;
    start.pathDepth = depth;

    for (const adj of graph.get(start)!) {
        // we only visit nodes of lower depth
        if (!adj.visited && adj.depth < start.depth) depthFirstSearchRec(adj, graph, depth);
    }
}
