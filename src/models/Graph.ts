interface VertexData<T> {
    visited: boolean;
    depth: number;
    pathDepth: number;
    path: T[][];
    parent?: T;
    val: T;
}

/**
 * The vertex of the graph.
 * It holds many attributes that are modified **in-place** when running a graph algorithm
 */
export class Vertex<T> {
    public visited: boolean = false;
    public depth: number = 0;
    public pathDepth: number = 0;
    public parent?: Vertex<T>;
    public path: Vertex<T>[][] = [];
    public val: T;
    constructor(t: T) {
        this.val = t;
    }

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

export type Graph<T> = Map<Vertex<T>, Vertex<T>[]>;

/**
 * perform depth first search on a graph that has multiple connected components
 *
 * @author Hanzhi Zhou
 * @param graph the graph represented as an adjacency list
 *
 * @see Vertex<T>
 */
export function depthFirstSearch<T>(graph: Graph<T>) {
    // the graph may have multiple connected components. Do DFS for each component
    const nodes = Array.from(graph.keys());
    while (true) {
        let start: Vertex<T> | undefined;
        let maxBreadth = -1;

        // select the first node of greatest breadth that haven't been visited as the start node
        for (const node of nodes) {
            if (!node.visited) {
                const breadth = graph.get(node)!.length;
                if (breadth > maxBreadth) {
                    maxBreadth = breadth;
                    start = node;
                }
            }
        }
        if (!start) {
            break;
        } else {
            depthFirstSearchRec(start, graph);
        }
    }
}
/**
 * A recursive implementation of depth first search on a single connected component
 * @author Hanzhi Zhou
 * @param start
 * @param graph
 */
function depthFirstSearchRec<T>(start: Vertex<T>, graph: Graph<T>) {
    // sort by breadth
    const neighbors = graph.get(start)!.sort((a, b) => {
        const d1 = graph.get(a)!;
        const d2 = graph.get(b)!;
        return d2.length - d1.length;
    });
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
    // trace back the parent pointer to update parent nodes' maximum path depth.
    if (!hasUnvisited) {
        let curParent: Vertex<T> | undefined = start;
        const path: Vertex<T>[] = [];
        curParent.pathDepth = Math.max(start.depth, start.pathDepth);

        while (true) {
            path.unshift(curParent);
            curParent.pathDepth = Math.max(start.pathDepth, curParent.pathDepth);

            // root node of the tree
            if (!curParent.parent) {
                curParent.path.push(path);
                break;
            }
            curParent = curParent.parent;
        }
    }
}
