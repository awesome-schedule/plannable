import * as Coloring from '@/algorithm/Coloring';
import { graph } from './adjMatrix';

const adjList: Int8Array[] = [];
// tslint:disable-next-line: prefer-for-of
for (let i = 0; i < graph.length; i++) {
    const neighbors = [];
    for (let j = 0; j < graph.length; j++) {
        if (graph[i][j] && i != j) neighbors.push(j);
    }
    adjList.push(Int8Array.from(neighbors));
}

// describe('graph coloring test', () => {
//     it('basic', () => {
//         const colors = new Int8Array(adjList.length);
//         Coloring.dsatur(adjList, colors, colors.slice());
//         const dsaturColor = colors.slice();
//         colors.fill(-1);
//         Coloring.graphColoringExact(adjList, colors);
//         const exactColors = colors.slice();
//         // we expect the dsatur to be exact for this graph
//         expect(dsaturColor).toEqual(exactColors);
//     });
// });

describe('graph verifier', () => {
    it('dsatur', () => {
        const colors = new Int8Array(adjList.length);
        Coloring.dsatur(adjList, colors, colors.slice());
        let flag = true;
        for (let i = 0; i < adjList.length; i++) {
            const curCol = colors[i];
            for (const adj of adjList[i]) {
                if (curCol === colors[adj]) {
                    flag = false;
                    break;
                }
            }
            if (!flag) {
                break;
            }
        }
        expect(flag).toBeTruthy();
    });

    it('rlf', () => {
        const colors = new Int8Array(adjList.length);
        Coloring.recursiveLargestFirst(adjList, colors);
        let flag = true;
        for (let i = 0; i < adjList.length; i++) {
            const curCol = colors[i];
            for (const adj of adjList[i]) {
                if (curCol === colors[adj]) {
                    flag = false;
                    break;
                }
            }
            if (!flag) {
                break;
            }
        }
        expect(flag).toBeTruthy();
    });
    it('rlf less color', () => {
        const colors = new Int8Array(adjList.length);
        const rlfColors = Coloring.recursiveLargestFirst(adjList, colors);

        const colors2 = new Int8Array(adjList.length);
        const dColors = Coloring.dsatur(adjList, colors2, colors2.slice());
        expect(rlfColors).toBeLessThanOrEqual(dColors);
    })
});
