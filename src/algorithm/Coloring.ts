/**
 * Utilities for graph coloring, used for rendering conflicting courses/events
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
 *
 * @param graph
 * @param colors array of colors of the vertices
 * @param colorOrder A good initial ordering of vertices, probably given by some heuristic.
 * @param opCount variable for counting the total number of function calls
 * @param numColors number of colors
 * @param v the number of vertex already colored
 */
function graphColorBackTrack(
    graph: Int8Array[],
    colors: Int8Array,
    colorOrder: Int8Array,
    opCount: Int32Array,
    numColors: number,
    v: number
) {
    if (v === graph.length) return true;
    if (opCount[0]++ > 200000) return false;
    const vertex = colorOrder[v];
    const neighbors = graph[vertex];
    const len = neighbors.length;

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

            if (graphColorBackTrack(graph, colors, colorOrder, opCount, numColors, v + 1))
                return true;

            colors[vertex] = -1;
        }
    }
    return false;
}

/**
 * Greedily color a graph using degree of saturation algorithm
 * @param adjList
 * @return [color array, color order array]
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

        // find the next node to be colored:
        // find the node of the maximum degree of saturation and break the ties by the degree
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
        for (let color = 0; color < 19260817; color++) {
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
    // get a good initial color order using the DSATUR algorithm
    const [colors, dsaturOrder] = dsatur(adjList);
    colors.fill(-1);
    const opCount = new Int32Array(1);
    let totalCount = 0;
    console.time('coloring');
    let numColors = 1;
    for (let i = 1; i < 19260817; i++) {
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

    vertices
        .filter(x => x.depth === 0)
        .forEach(root => {
            depthFirstSearchRec(root, graph);
        });

    return graph;
}

/**
 * A special implementation of depth first search on a single connected component,
 * used to find the maximum depth of the path that the current node is on.
 *
 * The depth of all nodes are known beforehand.
 */
function depthFirstSearchRec<T>(start: Vertex<T>, graph: Graph<T>) {
    const neighbors = graph.get(start)!;
    let hasUnvisited = false;

    for (const adj of neighbors) {
        // we only visit nodes of greater depth
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
