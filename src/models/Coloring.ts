/**
 * Utilities for simple graph coloring
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vertex, Graph } from './Graph';

/**
 * An exact graph coloring algorithm using backtracking
 *
 * @remark It will give up if the number of function calls exceed 200000
 * @remark It requires some heuristic to give a good initial ordering of vertices.
 * Ordering by degrees will suffice. Ordering by degree of saturation will be better
 *
 * @param graph
 * @param colors
 * @param orderedBreadth
 * @param opCount
 * @param numColors
 * @param v
 */
function graphColoringUtil(
    graph: Int8Array[],
    colors: Int8Array,
    orderedBreadth: Int8Array,
    opCount: Int32Array,
    numColors: number,
    v: number
) {
    if (v === graph.length) return true;
    const vertex = orderedBreadth[v];
    const neighbors = graph[vertex];
    const len = neighbors.length;
    opCount[0]++;
    if (opCount[0] > 200000) return false;

    for (let color = 0; color < numColors; color++) {
        let canColor = true;
        for (let i = 0; i < len; i++) {
            if (colors[neighbors[i]] === color) {
                canColor = false;
                break;
            }
        }
        if (canColor) {
            colors[vertex] = color;

            if (graphColoringUtil(graph, colors, orderedBreadth, opCount, numColors, v + 1))
                return true;

            colors[vertex] = -1;
        }
    }
    return false;
}

export function getColoring(adjList: Int8Array[]): [number, Int8Array] {
    // sort elements by their degrees
    const orderedBreadth = Int8Array.from(
        Array.from(adjList.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .map(x => x[0])
    );
    const colors = new Int8Array(adjList.length);
    const opCount = new Int32Array(1);
    let totalCount = 0;
    console.time('coloring');
    let numColors = 1;
    for (let i = 1; i < 100; i++) {
        if (graphColoringUtil(adjList, colors, orderedBreadth, opCount, i, 0)) {
            numColors = i;
            break;
        }
        colors.fill(-1);
        totalCount += opCount[0];
        opCount[0] = 0;
    }
    console.log('op count', totalCount);
    console.timeEnd('coloring');
    return [numColors, colors];
}

export function colorDepthSearch(adjList: Int8Array[], colors: Int8Array): Graph<number> {
    const graph: Graph<number> = new Map();
    const vertices: Vertex<number>[] = [];

    for (let i = 0; i < colors.length; i++) {
        const v = new Vertex(i);
        v.depth = colors[i];
        vertices.push(v);
    }

    for (let i = 0; i < colors.length; i++) {
        graph.set(vertices[i], Array.from(adjList[i]).map(x => vertices[x]));
    }

    Array.from(graph.keys())
        .filter(x => x.depth === 0)
        .forEach(root => depthFirstSearchRec(root, graph));

    return graph;
}

/**
 * A special implementation of depth first search on a single connected component.
 * The depth of all nodes are known beforehand.
 */
function depthFirstSearchRec<T>(start: Vertex<T>, graph: Graph<T>) {
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
