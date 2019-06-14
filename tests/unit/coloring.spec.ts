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
    return graph.map(arr => new Int8Array(arr));
}

function verifyColoring<T extends Coloring.TypedIntArray>(adjList: T[], colors: T) {
    let flag = true;
    for (let i = 0; i < adjList.length; i++) {
        const curCol = colors[i];
        for (const adj of adjList[i]) {
            if (curCol === colors[adj]) {
                console.warn(i, 'and', adj, 'have the same color', curCol);
                flag = false;
                break;
            }
        }
        if (!flag) {
            break;
        }
    }
    return flag;
}

describe('graph verifier', () => {
    it('color algorithm tests', () => {
        const numNodes = Array.from({ length: 5 }, (_, i) => (i + 1) * 20);
        const probConn = Array.from({ length: 4 }, (_, i) => (i + 1) * 0.2);

        for (const numN of numNodes) {
            for (const prob of probConn) {
                const adjList = randGraph(numN, prob);
                console.info('num nodes:', numN, 'prob conn:', prob);

                const colors = new Int8Array(adjList.length);
                const rlfColors = Coloring.recursiveLargestFirst(adjList, colors);
                expect(verifyColoring(adjList, colors)).toBe(true);

                const colors2 = new Int8Array(adjList.length);
                const dColors = Coloring.dsatur(adjList, colors2, colors2.slice());
                expect(verifyColoring(adjList, colors2)).toBe(true);

                console.info('rlf colors:', rlfColors, 'dsatur colors:', dColors);
                // expect(rlfColors).toBeLessThanOrEqual(dColors);
            }
        }
    });
});
