/**
 * the graph model and algorithm used primarily for schedule rendering
 * @author Hanzhi Zhou
 * @module algorithm
 */

/**
 * vertex data
 */
interface VertexData<T> {
    visited: boolean;
    depth: number;
    pathDepth: number;
    parent?: T;
    readonly path: T[][];
    readonly val: T;
}

/**
 * The vertex of the graph.
 * It holds many attributes that are modified **in-place** when running a graph algorithm
 */
export class Vertex<T> {
    public visited: boolean = false;
    /**
     * depth of the node relative to the root
     */
    public depth: number = 0;
    /**
     * the maximum depth of the path starting from the root that the current node is on
     */
    public pathDepth: number = 0;
    /**
     * the parent of this vertex in the depth first tree
     */
    public parent?: Vertex<T>;
    /**
     * the all of the paths starting at the root and ending at one of the leaves.
     * if this vertex is not the root, then `path` will be empty
     */
    public readonly path: Vertex<T>[][] = [];
    /**
     * @param val the value contained in this node
     */
    constructor(public readonly val: T) {}

    /**
     * represent this node without creating cyclic reference
     */
    data() {
        const data: VertexData<T> = {
            visited: this.visited,
            val: this.val,
            path: this.path.map(x => x.map(y => y.val)),
            depth: this.depth,
            pathDepth: this.pathDepth
        };
        if (this.parent) {
            data.parent = this.parent.val;
        }
        return data;
    }
}

/**
 * adjacency list representation of a graph
 */
export type Graph<T> = Map<Vertex<T>, Vertex<T>[]>;

/**
 * given a graph, returns a sort function on this graph
 *
 * this function first sorts nodes by their breadth in descending order.
 * If two nodes have the same breadth, then they'll be sorted in
 * descending order according the numerical value returned by their `[Symbol.toPrimitive]` method
 *
 * @see [[ScheduleBlock]]
 * @param graph
 */
function sortFunc<T>(graph: Graph<T>) {
    return (a: Vertex<T>, b: Vertex<T>) => {
        const d1 = graph.get(a)!;
        const d2 = graph.get(b)!;
        const result = d2.length - d1.length;
        if (result) return result;
        else {
            return +b.val - +a.val;
        }
    };
}

/**
 * perform depth first search on a graph that has multiple connected components
 *
 * @param graph the graph represented as an adjacency list
 *
 * @see [[Vertex]]
 */
export function depthFirstSearch<T>(graph: Graph<T>) {
    const nodes = Array.from(graph.keys()).sort(sortFunc(graph));

    // the graph may have multiple connected components. Do DFS for each component
    while (true) {
        let start: Vertex<T> | undefined;

        // select the first node of greatest breadth that haven't been visited as the start node
        for (const node of nodes) {
            if (!node.visited) {
                start = node;
                break;
            }
        }
        if (!start) {
            break; // all nodes are visited
        } else {
            depthFirstSearchRec(start, graph);
        }
    }
}
/**
 * A recursive implementation of depth first search on a single connected component
 * @param start
 * @param graph
 */
function depthFirstSearchRec<T>(start: Vertex<T>, graph: Graph<T>) {
    /**
     * the neighbors sort by descending breadth
     *
     * @remarks Usually we use a priority queue for getting the max/min value,
     * but since we only have a small number of nodes, it suffices to sort them in place.
     */
    const neighbors = graph.get(start)!.sort(sortFunc(graph));
    start.visited = true;
    let hasUnvisited = false;

    // this part is just regular DFS, except that we record the depth of the current node.
    for (const adj of neighbors) {
        if (!adj.visited) {
            adj.depth = start.depth + 1;
            adj.parent = start;
            depthFirstSearchRec(adj, graph);
            hasUnvisited = true;
        }
    }

    // if no more nodes can be visited from the current node, it is the end of this DFS path.
    // trace the parent pointer to update parent nodes' maximum path depth until we reach the root
    if (!hasUnvisited) {
        let curParent: Vertex<T> | undefined = start;
        const path: Vertex<T>[] = [];

        while (true) {
            path.unshift(curParent);
            curParent.pathDepth = Math.max(start.depth, curParent.pathDepth);

            // root node of the tree
            if (!curParent.parent) {
                curParent.path.push(path);
                break;
            }
            curParent = curParent.parent;
        }
    }
}
