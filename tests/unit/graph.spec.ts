import { Vertex, depthFirstSearch } from '../../src/models/Graph';

describe('graph test', () => {
    it('depth first search', () => {
        const grap = new Map<number, number[]>();
        grap.set(1, [2, 3]);
        grap.set(2, [1]);
        grap.set(3, [1]);
        grap.set(4, []);
        grap.set(5, []);
        grap.set(6, [7, 8]);
        grap.set(7, [6, 8]);
        grap.set(8, [6, 7, 9]);
        grap.set(9, [8]);

        const graph = new Map<Vertex<number>, Vertex<number>[]>();
        const nodes = [new Vertex(-1)];

        for (const [node, _] of grap) {
            nodes.push(new Vertex(node));
        }

        for (const [node, neighbors] of grap) {
            graph.set(nodes[node], neighbors.map(x => nodes[x]));
        }

        depthFirstSearch(graph);
        const result = nodes.map(x => [x.val, x.data()]);
        expect(result).toEqual([
            [-1, { depth: 0, path: [], pathDepth: 0, val: -1, visited: false }],
            [1, { depth: 0, path: [[1, 3], [1, 2]], pathDepth: 1, val: 1, visited: true }],
            [2, { depth: 1, parent: 1, path: [], pathDepth: 1, val: 2, visited: true }],
            [3, { depth: 1, parent: 1, path: [], pathDepth: 1, val: 3, visited: true }],
            [4, { depth: 0, path: [[4]], pathDepth: 0, val: 4, visited: true }],
            [5, { depth: 0, path: [[5]], pathDepth: 0, val: 5, visited: true }],
            [6, { depth: 2, parent: 7, path: [], pathDepth: 2, val: 6, visited: true }],
            [7, { depth: 1, parent: 8, path: [], pathDepth: 2, val: 7, visited: true }],
            [8, { depth: 0, path: [[8, 7, 6], [8, 9]], pathDepth: 2, val: 8, visited: true }],
            [9, { depth: 1, parent: 8, path: [], pathDepth: 1, val: 9, visited: true }]
        ]);
    });
});
