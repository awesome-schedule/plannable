import { graphColoringExact, colorDepthSearch } from '../../src/algorithm/Coloring';
import { performance } from 'perf_hooks';
import graph from './graph.json';

function coloring() {
    const colors = new Int16Array(graph.length);
    let total = 0;
    for (let i = 0; i < 15; i++) {
        const start = performance.now();
        graphColoringExact(graph, colors);
        const t = performance.now() - start;
        if (i >= 5) {
            console.log('time:', t);
            total += t;
        }
    }
    console.log('Average:', total / 10);
}

function colorDFS() {
    const colors = new Int16Array(graph.length);
    graphColoringExact(graph, colors);

    const values = Array.from({ length: graph.length }, (_, i) => i);
    let total = 0;
    for (let i = 0; i < 15; i++) {
        const start = performance.now();
        colorDepthSearch(graph, colors, values);
        const t = performance.now() - start;
        if (i >= 5) {
            console.log('time:', t);
            total += t;
        }
    }
    console.log('Average:', total / 10);
}

// coloring();
colorDFS();
