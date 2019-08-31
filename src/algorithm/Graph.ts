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
    /**
     * the parent of this vertex in the depth first tree
     */
    public parent?: Vertex<T> = undefined;
    /**
     * @param val the value contained in this node
     */
    constructor(public readonly val: T) {}

    // the following code is for debug purposes only
    // /**
    //  * represent this node without creating cyclic reference
    //  */
    // data() {
    //     const data: any = {
    //         visited: this.visited,
    //         val: this.val,
    //         path: this.path.map(x => x.map(y => y.val)),
    //         depth: this.depth,
    //         pathDepth: this.pathDepth
    //     };
    //     if (this.parent) {
    //         data.parent = this.parent.val;
    //     }
    //     return data;
    // }
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
