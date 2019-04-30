import { Vertex, depthFirstSearch } from '../../src/models/Graph';
import { inspect } from 'util';

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
            [-1, { visited: false, val: -1, path: [], depth: 0, pathDepth: 0 }],
            [1, { visited: true, val: 1, path: [[1, 2], [1, 3]], depth: 0, pathDepth: 1 }],
            [2, { visited: true, val: 2, path: [], depth: 1, pathDepth: 1, parent: 1 }],
            [3, { visited: true, val: 3, path: [], depth: 1, pathDepth: 1, parent: 1 }],
            [4, { visited: true, val: 4, path: [[4]], depth: 0, pathDepth: 0 }],
            [5, { visited: true, val: 5, path: [[5]], depth: 0, pathDepth: 0 }],
            [6, { visited: true, val: 6, path: [], depth: 1, pathDepth: 2, parent: 8 }],
            [7, { visited: true, val: 7, path: [], depth: 2, pathDepth: 2, parent: 6 }],
            [8, { visited: true, val: 8, path: [[8, 6, 7], [8, 9]], depth: 0, pathDepth: 2 }],
            [9, { visited: true, val: 9, path: [], depth: 1, pathDepth: 1, parent: 8 }]
        ]);
    });
});
