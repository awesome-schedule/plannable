function graphColoringUtil(
    graph: Int8Array[],
    colors: Int8Array,
    orderedBreadth: Int8Array,
    numColors: number,
    v: number
) {
    if (v === graph.length) return true;
    const vertex = orderedBreadth[v];
    const adjs = graph[vertex];
    const len = adjs.length;
    for (let color = 0; color < numColors; color++) {
        let canColor = true;
        for (let i = 0; i < len; i++) {
            if (colors[adjs[i]] === color) {
                canColor = false;
                break;
            }
        }
        if (canColor) {
            colors[vertex] = color;

            if (graphColoringUtil(graph, colors, orderedBreadth, numColors, v + 1)) return true;

            colors[vertex] = -1;
        }
    }
    return false;
}

export function getColoring(graph: Int8Array[]): [number, Int8Array] {
    const orderedBreadth = Int8Array.from(
        Array.from(graph.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .map(x => x[0])
    );
    const colors = new Int8Array(graph.length);
    console.time('coloring');
    let numColors = 1;
    for (let i = 1; i < 100; i++) {
        if (graphColoringUtil(graph, colors, orderedBreadth, i, 0)) {
            numColors = i;
            break;
        }
        colors.fill(-1);
    }
    console.timeEnd('coloring');
    return [numColors, colors];
}
