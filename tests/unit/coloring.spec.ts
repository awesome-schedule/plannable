import { toNativeAdjList } from '@/algorithm';
import * as Coloring from '@/algorithm/Coloring';

function randGraph(numNodes: number, probConn: number) {
    const graph: number[][] = [];
    for (let i = 0; i < numNodes; i++) {
        graph.push([]);
    }
    for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
            if (Math.random() < probConn) {
                graph[i].push(j);
                graph[j].push(i);
            }
        }
    }
    return toNativeAdjList(graph);
}

function verifyColoring(adjList: Int16Array[], colors: Int16Array) {
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

describe('graph verifier', () => {
    it('color algorithm tests', () => {
        const numNodes = Array.from({ length: 5 }, (_, i) => (i + 1) * 20);
        const probConn = Array.from({ length: 4 }, (_, i) => (i + 1) * 0.2);

        for (const numN of numNodes) {
            for (const prob of probConn) {
                const [adjList] = randGraph(numN, prob);
                console.info('num nodes:', numN, 'prob conn:', prob);

                const colors = new Int16Array(adjList.length);
                const rlfColors = Coloring.recursiveLargestFirst(adjList, colors);
                expect(verifyColoring(adjList, colors)).toBe(true);

                const colors2 = new Int16Array(adjList.length);
                const dColors = Coloring.dsatur(adjList, colors2, colors2.slice());
                expect(verifyColoring(adjList, colors2)).toBe(true);

                let bColors = -1;
                if (numN <= 40) {
                    const colors3 = new Int16Array(adjList.length);
                    bColors = Coloring.graphColoringExact(adjList, colors3);
                    expect(verifyColoring(adjList, colors3)).toBe(true);
                    expect(bColors).toBeLessThanOrEqual(dColors);
                } else {
                    console.info('Skipped backtrack test: too many nodes');
                }

                console.info(
                    'rlf colors:',
                    rlfColors,
                    'dsatur colors:',
                    dColors,
                    'backtrack colors:',
                    bColors
                );
            }
        }
    });
});
