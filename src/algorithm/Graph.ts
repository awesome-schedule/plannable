/**
 * the graph model and algorithm used primarily for schedule rendering
 * @author Hanzhi Zhou
 * @module algorithm
 */

/**
 * The vertex of the graph.
 * It holds many attributes that are modified **in-place** when running a graph algorithm
 */
export class Vertex<T> {
    public visited = false;
    /**
     * depth of the node relative to the root
     */
    public depth = 0;
    /**
     * the maximum depth of the path starting from the root that the current node is on
     */
    public pathDepth = 0;
    public needToChange = true;
    public needToChangeFromBack = true;
    /**
     * @param val the value contained in this node
     */
    constructor(public readonly val: T) {}
}

/**
 * adjacency list representation of a graph
 */
export type Graph<T> = Map<Vertex<T>, Vertex<T>[]>;

/**
 * perform depth first search to find a connected component
 * @note the start node is not marked as visited
 * @returns node indices belonging to the connected component found
 */
export function DFS(start: number, adjList: number[][], visited: Uint8Array): number[] {
    const neighbors = adjList[start];
    const componentNodes = [start];
    for (const i of neighbors) {
        if (!visited[i]) {
            visited[i] = 1;
            componentNodes.push(...DFS(i, adjList, visited));
        }
    }
    return componentNodes;
}
