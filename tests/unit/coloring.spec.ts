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
    return graph;
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

describe('graph verifier', () => {
    it('afds', () => {
        const adjList: number[][] = [];
        const numNodes = Math.floor(Math.random() * 20 + 1);
        for (let i = 0; i < numNodes; i++) {
            adjList.push([]);
        }
        for (let i = 0; i < numNodes; i++) {
            for (let j = i + 1; j < numNodes; j++) {
                if (Math.random() < 0.5) {
                    adjList[i].push(j);
                    adjList[j].push(i);
                }
            }
        }

        const colors: Int16Array = new Int16Array(adjList.length);

        const dsaturOrder = colors.slice();
        colors.fill(-1);
        Coloring.dsatur(adjList, colors, dsaturOrder);
        const opCount = new Int32Array(1);
        let totalCount = 0;
        let numColors = 1;
        for (; numColors < 19260817; numColors++) {
            if (Coloring.graphColorBackTrack(adjList, colors, dsaturOrder, opCount, numColors, 0))
                break;

            colors.fill(-1);
            totalCount += opCount[0];
            opCount[0] = 0;
        }

        Coloring.colorSpread(adjList, colors, numColors);
        nextNode: for (let i = 0; i < adjList.length; i++) {
            if (colors[i] === 0) continue;
            for (let j = 0; j < adjList[i].length; j++) {
                if (colors[j] === colors[i] - 1) continue nextNode;
            }
            expect('猫').toBe('cat');
        }
    });
    it('color algorithm tests', () => {
        const numNodes = Array.from({ length: 5 }, (_, i) => (i + 1) * 20);
        const probConn = Array.from({ length: 4 }, (_, i) => (i + 1) * 0.2);

        for (const numN of numNodes) {
            for (const prob of probConn) {
                const adjList = randGraph(numN, prob);
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
