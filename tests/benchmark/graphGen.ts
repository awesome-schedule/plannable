import fs from 'fs';

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

fs.writeFileSync(__dirname + '/graph_smaller.json', JSON.stringify(randGraph(80, 0.3)));
