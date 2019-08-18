// function randGraph(numNodes: number, probConn: number) {
//     const graph: number[][] = [];
//     for (let i = 0; i < numNodes; i++) {
//         graph.push([]);
//     }
//     for (let i = 0; i < numNodes; i++) {
//         for (let j = i + 1; j < numNodes; j++) {
//             if (Math.random() < probConn) {
//                 graph[i].push(j);
//                 graph[j].push(i);
//             }
//         }
//     }
//     return graph;
// }
// import fs from 'fs';

// fs.writeFileSync(__dirname + '/test_data/graph.json', JSON.stringify(randGraph(80, 0.5)));

import { graphColoringExact } from '../../src/algorithm/Coloring';
import { performance } from 'perf_hooks';
import graph from './test_data/graph.json';

test.skip('graph coloring bench', () => {
    const colors = new Int16Array(graph.length);
    let total = 0;
    for (let i = 0; i < 15; i++) {
        const start = performance.now();
        graphColoringExact(graph, colors);
        const t = performance.now() - start;
        console.log('time:', t);
        total += t;
    }
    console.log('Average:', total / 15);
});
