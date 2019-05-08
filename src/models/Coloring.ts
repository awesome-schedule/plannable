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
function graphColorBackTrack(
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

            if (graphColorBackTrack(graph, colors, orderedBreadth, opCount, numColors, v + 1))
                return true;

            colors[vertex] = -1;
        }
    }
    return false;
}

/**
 *
 * @param adjList
 */
export function dsatur(adjList: Int8Array[]): [Int8Array, Int8Array] {
    const colors = new Int8Array(adjList.length).fill(-1);

    // keep track of the ordering
    const colorOrder = new Int8Array(adjList.length);
    if (!adjList.length) return [colors, colorOrder];

    // keep track of the saturation
    const saturations = adjList.map(() => new Set<number>());

    // first node is just the one of the maximum degree
    let start = 0,
        maxDegree = -1;
    for (let i = 0; i < adjList.length; i++) {
        const degree = adjList[i].length;
        if (degree > maxDegree) {
            maxDegree = degree;
            start = i;
        }
    }

    let neighbors = adjList[start];
    for (const v of neighbors) saturations[v].add(0);

    colors[start] = 0;
    colorOrder[0] = start;

    for (let i = 1; i < adjList.length; i++) {
        let nextNode = 0,
            maxSat = -1;
        // find next node to be colored
        for (let j = 0; j < saturations.length; j++) {
            if (colors[j] === -1) {
                const sat = saturations[j].size;
                if (sat > maxSat) {
                    nextNode = j;
                    maxSat = sat;
                } else if (sat === maxSat) {
                    if (adjList[j].length > adjList[nextNode].length) nextNode = j;
                }
            }
        }

        neighbors = adjList[nextNode];
        for (let color = 0; color < 999; color++) {
            let flag = true;
            // find a available color
            for (const v of neighbors) {
                if (colors[v] === color) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                // update the saturation degrees of the neighbors
                colors[nextNode] = color;
                colorOrder[i] = nextNode;
                for (const v of neighbors) saturations[v].add(color);
                break;
            }
        }
    }
    return [colors, colorOrder];
}

export function graphColoringExact(adjList: Int8Array[]): [Int8Array, number] {
    // sort elements by their degrees
    const [colors, dsaturOrder] = dsatur(adjList);
    colors.fill(-1);
    const opCount = new Int32Array(1);
    let totalCount = 0;
    console.time('coloring');
    let numColors = 1;
    for (let i = 1; i < 100; i++) {
        if (graphColorBackTrack(adjList, colors, dsaturOrder, opCount, i, 0)) {
            numColors = i;
            break;
        }
        colors.fill(-1);
        totalCount += opCount[0];
        opCount[0] = 0;
    }
    console.log('op count', totalCount);
    console.timeEnd('coloring');
    return [colors, numColors];
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
