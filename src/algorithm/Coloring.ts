/**
 * Utilities for graph coloring, used for rendering conflicting courses/events
 * @author Hanzhi Zhou, Kaiying Cat
 * @module algorithm
 */

/**
 *
 */
import { Graph, Vertex } from './Graph';
import { calcOverlap } from '@/utils';

/**
 * An exact graph coloring algorithm using backtracking
 *
 * @remark It will give up if the number of function calls exceed 200000
 * @requires optimization
 * @param graph
 * @param colors array of colors of the vertices
 * @param colorOrder A good initial ordering of vertices, probably given by some heuristic.
 * @param opCount variable for counting the total number of function calls
 * @param numColors number of colors
 * @param v the number of vertex already colored
 */
function graphColorBackTrack(
    graph: Int16Array[] | number[][],
    colors: Int16Array,
    colorOrder: Int16Array,
    opCount: Int32Array,
    numColors: number,
    v: number
) {
    if (v === graph.length) return true;
    if (opCount[0]++ > 200000) {
        // console.warn('break at', numColors);
        return false;
    }
    const vertex = colorOrder[v];
    const neighbors = graph[vertex];

    outer: for (let color = 0; color < numColors; color++) {
        for (let i = 0; i < neighbors.length; i++) {
            if (colors[neighbors[i]] === color) continue outer;
        }

        colors[vertex] = color;
        if (graphColorBackTrack(graph, colors, colorOrder, opCount, numColors, v + 1)) return true;
        colors[vertex] = -1;
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
export function dsatur(adjList: number[][], colors: Int16Array, colorOrder: Int16Array): number {
    colors.fill(-1);
    const numNodes = adjList.length;
    if (!numNodes) return 0;

    // keep track of the saturation
    const saturations = adjList.map(() => new Set<number>());

    // first node is just the one of the maximum degree
    let current = 0,
        maxDegree = -1;
    for (let i = 0; i < numNodes; i++) {
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

    for (let i = 1; i < numNodes; i++) {
        // find the next node to be colored:
        // find the node of the maximum degree of saturation and break ties by degrees
        let maxSat = -1;
        for (let j = 0; j < numNodes; j++) {
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
        outer: for (let color = 0; color < 19260817; color++) {
            // find a available color
            for (const v of neighbors) if (colors[v] === color) continue outer;

            // update the saturation degrees of the neighbors
            colors[current] = color;
            if (color > numColors) numColors = color;
            colorOrder[i] = current;
            for (const v of neighbors) saturations[v].add(color);
            break;
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
export function graphColoringExact(adjList: number[][], colors: Int16Array): number {
    // get a good initial color order using the DSATUR algorithm
    const dsaturOrder = colors.slice();
    colors.fill(-1);
    dsatur(adjList, colors, dsaturOrder);
    const opCount = new Int32Array(1);
    let totalCount = 0;
    let numColors = 1;
    for (; numColors < 19260817; numColors++) {
        if (graphColorBackTrack(adjList, colors, dsaturOrder, opCount, numColors, 0)) break;

        colors.fill(-1);
        totalCount += opCount[0];
        opCount[0] = 0;
    }
    // console.log('op count', totalCount);
    colorSpread(adjList, colors, numColors);
    verifyColoring(adjList, colors);
    return numColors;
}

function verifyColoring(adjList: number[][], colors: Int16Array) {
    for (let i = 0; i < adjList.length; i++) {
        const curCol = colors[i];
        for (const adj of adjList[i]) {
            if (curCol === colors[adj]) {
                console.warn(i, 'and', adj, 'have the same color', curCol);
                return false;
            }
        }
    }
    return true;
}

function colorSpread(adjList: number[][], colors: Int16Array, numColors: number) {
    // return;
    // sort nodes with ascending number of connections
    // eslint-disable-next-line no-unreachable
    const rank = adjList
        .map((x: number[], i) => [x.length, i])
        .sort((a: number[], b: number[]) => a[0] - b[0])
        .map(x => x[1]);
    /**
     *
     */
    const col2nodes: number[][] = new Array(numColors);
    for (let i = 0; i < col2nodes.length; i++) {
        col2nodes[i] = [];
    }
    for (let i = 0; i < colors.length; i++) {
        col2nodes[colors[i]].push(i);
    }
    for (let i = 0; i < rank.length; i++) {
        const cur = rank[i]; // node
        let maxCol = colors[cur]; // color
        let maxLen = 0;
        let curCol = maxCol;
        let curLen = maxLen;
        let curColStart = maxCol;
        let changed = false;
        if (adjList[rank[i]].length === 0) continue;
        nextColor: for (let j = 0; j < col2nodes.length; j++) {
            for (let k = 0; k < col2nodes[j].length; k++) {
                if (adjList[cur].indexOf(col2nodes[j][k]) !== -1) {
                    continue nextColor;
                }
            }
            if (j != curCol + 1) {
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
        if (changed) {
            let flip = false;
            const nodesAfter = col2nodes[maxCol];
            const start = colors[cur] < maxCol ? colors[cur] + 1 : maxCol + 1;
            const end = colors[cur] < maxCol ? maxCol + 1 : colors[cur];
            for (let c = start; c < end; c++) {
                const nodesBetween = col2nodes[c].filter(x => adjList[cur].indexOf(x) !== -1);
                if (nodesBetween.length > 1) {
                    flip = false;
                    break;
                }
                for (let j = 0; j < nodesBetween.length; j++) {
                    for (let k = 0; k < nodesAfter.length; k++) {
                        if (adjList[nodesAfter[k]].indexOf(nodesBetween[j]) !== -1) {
                            flip = true;
                            break;
                        }
                    }
                }
            }

            if (flip) {
                col2nodes[colors[cur]].splice(col2nodes[colors[cur]].indexOf(cur), 1);
                colors[cur] = maxCol;
                col2nodes[colors[maxCol]].push(cur);
            }
        }
    }
}

// function compressColor(adjList: number[][], color: Int16Array, p: number, visited: boolean[]) {
//     let col = color[p];
//     let maxCol = -1;
//     const list = [];
//     for (let i = 0; i < adjList[p].length; i++) {
//         if (!visited[adjList[p][i]]) {
//             // visited[adjList[p][i]] = true;
//             list.push(adjList[p][i]);
//             // if (color[adjList[p][i]] != color[p] + 1) {
//             //     color[adjList[p][i]] = color[p] + 1;
//             // }
//             // compressColor(adjList, color, adjList[p][i], visited);
//         } else {
//             if (color[adjList[p][i]] > maxCol) {
//                 maxCol = color[adjList[p][i]];
//             }
//         }
//     }
//     if (color[p] > maxCol + 1 && maxCol !== -1) {
//         col = maxCol + 1;
//         color[p] = maxCol + 1;
//     }
//     for (const i of list) {
//         visited[i] = true;
//         compressColor(adjList, color, i, visited);
//     }
// }

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

    // start DFS at each root node
    const roots = vertices.filter(x => x.depth === 0);
    for (const root of roots) depthFirstSearchRec(root, graph);

    // calculate the pathDepth
    for (const root of roots) {
        for (const path of root.path) {
            const len = path.length - 1;
            for (const node of path) {
                node.pathDepth = Math.max(node.pathDepth, len);
            }
        }
    }

    return graph;
}

export function recursiveLargestFirst(adjList: number[][], colors: Int16Array): number {
    colors.fill(-1);
    const notColored = new Set(colors.keys());
    const degrees = adjList.map((x, i) => x.length);
    let color = 0;
    while (notColored.size) {
        const remained = new Set(notColored);
        while (remained.size) {
            const itr = remained.values();
            let v = itr.next().value;
            for (let i = 1; i < remained.size; i++) {
                const tempV = itr.next().value;
                if (degrees[tempV] > degrees[v]) {
                    v = tempV;
                }
            }
            const adj = adjList[v];
            remained.delete(v);
            notColored.delete(v);
            colors[v] = color;
            for (const a of adj) {
                remained.delete(a);
                degrees[a] -= 1;
            }
        }
        color++;
    }
    return color;
}

/**
 * A special implementation of depth first search on a single connected component,
 * used to find the maximum depth of the path that the current node is on.
 *
 * The depth of all nodes are known beforehand.
 * @requires optimization
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
    // trace the parent pointer to until we reach the root. add the path to the root node.
    if (!hasUnvisited) {
        let curParent: Vertex<T> = start;
        const path: Vertex<T>[] = [];

        while (true) {
            path.unshift(curParent);

            // root node of the tree
            if (!curParent.parent) {
                curParent.path.push(path);
                break;
            }
            curParent = curParent.parent;
        }
    }
}
