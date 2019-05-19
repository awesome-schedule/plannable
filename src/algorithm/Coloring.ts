/**
 * Utilities for graph coloring, used for rendering conflicting courses/events
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vertex, Graph } from './Graph';

type TypedIntArray = Int8Array | Int16Array | Int32Array;

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
function graphColorBackTrack<T extends TypedIntArray>(
    graph: T[],
    colors: T,
    colorOrder: T,
    opCount: Int32Array,
    numColors: number,
    v: number
) {
    if (v === graph.length) return true;
    if (opCount[0]++ > 100000) {
        // console.warn('break at', numColors);
        return false;
    }
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
 * @param colors an array used to record the colors of nodes. colors start from 0.
 * length must equal to the length of adjList.
 * @param colorOrder an array used to record the order of coloring
 */
export function dsatur<T extends TypedIntArray>(adjList: T[], colors: T, colorOrder: T): number {
    colors.fill(-1);
    if (!adjList.length) return 0;

    // keep track of the saturation
    const saturations = adjList.map(() => new Set<number>());

    // first node is just the one of the maximum degree
    let current = 0,
        maxDegree = -1;
    for (let i = 0; i < adjList.length; i++) {
        const degree = adjList[i].length;
        if (degree > maxDegree) {
            maxDegree = degree;
            current = i;
        }
    }

    let neighbors = adjList[current];
    for (const v of neighbors) saturations[v].add(0);

    colors[current] = 0;
    colorOrder[0] = current;
    let numColors = 0;

    for (let i = 1; i < adjList.length; i++) {
        // find the next node to be colored:
        // find the node of the maximum degree of saturation and break ties by degrees
        let maxSat = -1;
        for (let j = 0; j < saturations.length; j++) {
            if (colors[j] === -1) {
                const sat = saturations[j].size;
                if (sat > maxSat) {
                    current = j;
                    maxSat = sat;
                } else if (sat === maxSat) {
                    if (adjList[j].length > adjList[current].length) current = j;
                }
            }
        }

        neighbors = adjList[current];
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
                colors[current] = color;
                if (color > numColors) numColors = color;
                colorOrder[i] = current;
                for (const v of neighbors) saturations[v].add(color);
                break;
            }
        }
    }
    return numColors + 1;
}

/**
 * the entry point of the backtrack graph coloring
 * @see [[graphColorBackTrack]]
 * @param adjList adjacency list representation of the graph
 * @param colors an array used to record the colors of nodes. colors start from 0.
 * length must equal to the length of adjList.
 * @returns total number of colors
 */
export function graphColoringExact<T extends TypedIntArray>(adjList: T[], colors: T): number {
    // get a good initial color order using the DSATUR algorithm
    const dsaturOrder = colors.slice();
    colors.fill(-1);
    dsatur(adjList, colors, dsaturOrder);
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
    return numColors;
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
