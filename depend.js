const madge = require('madge');

madge('src/main.ts')
    .then(res => res.svg())
    .then(output => {
        console.log(output.toString());
    });
//  madge --image graph.svg src/main.ts
