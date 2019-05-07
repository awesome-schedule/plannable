import { Vertex, Graph } from './Graph';

function graphColoringUtil(
    graph: Int8Array[],
    colors: Int8Array,
    orderedBreadth: Int8Array,
    numColors: number,
    v: number
) {
    if (v === graph.length) return true;
    const vertex = orderedBreadth[v];
    const adjs = graph[vertex];
    const len = adjs.length;
    for (let color = 0; color < numColors; color++) {
        let canColor = true;
        for (let i = 0; i < len; i++) {
            if (colors[adjs[i]] === color) {
                canColor = false;
                break;
            }
        }
        if (canColor) {
            colors[vertex] = color;

            if (graphColoringUtil(graph, colors, orderedBreadth, numColors, v + 1)) return true;

            colors[vertex] = -1;
        }
    }
    return false;
}

export function getColoring(graph: Int8Array[]): Graph<number> {
    const orderedBreadth = Int8Array.from(
        Array.from(graph.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .map(x => x[0])
    );
    const colors = new Int8Array(graph.length);
    console.time('coloring');
    let numColors = 1;
    for (let i = 1; i < 100; i++) {
        if (graphColoringUtil(graph, colors, orderedBreadth, i, 0)) {
            numColors = i;
            break;
        }
        colors.fill(-1);
    }
    const g: Graph<number> = new Map();
    const vertices: Vertex<number>[] = [];
    for (let i = 0; i < colors.length; i++) {
        const v = new Vertex(i);
        v.depth = colors[i];
        vertices.push(v);
    }
    for (let i = 0; i < colors.length; i++) {
        g.set(vertices[i], Array.from(graph[i]).map(x => vertices[x]));
    }
    depthFirstSearch(g);
    console.log(numColors, 'colors');
    console.timeEnd('coloring');
    return g;
}

/**
 * perform depth first search on a graph that has multiple connected components
 *
 * @param graph the graph represented as an adjacency list
 *
 * @see [[Vertex]]
 */
export function depthFirstSearch<T>(graph: Graph<T>) {
    const nodes = Array.from(graph.keys()).filter(x => x.depth === 0);
    for (const node of nodes) {
        depthFirstSearchRec(node, graph);
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
    const neighbors = graph.get(start)!;
    let hasUnvisited = false;

    // this part is just regular DFS, except that we record the depth of the current node.
    for (const adj of neighbors) {
        if (adj.depth > start.depth) {
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
