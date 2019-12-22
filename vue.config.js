// vue.config.js

/**
 * we don't bundle these. Instead, we load them from CDN.
 */
const externals = {
    jquery: 'jQuery',
    bootstrap: 'bootstrap',
    vue: 'Vue',
    papaparse: 'Papa',
    vuedraggable: 'vuedraggable'
};

const CircularDependencyPlugin = require('circular-dependency-plugin');
module.exports = {
    configureWebpack: {
        externals,
        plugins: [
            new CircularDependencyPlugin({
                // exclude detection of files based on a RegExp
                exclude: /a\.js|node_modules/,
                // add errors to webpack instead of warnings
                failOnError: false,
                // allow import cycles that include an asyncronous import,
                // e.g. via import(/* webpackMode: "weak" */ './file.js')
                allowAsyncCycles: false,
                // set the current working directory for displaying module paths
                cwd: process.cwd()
            })
        ]
        // worker loader requires Buffer from nodejs
        // node: {
        //     Buffer: false
        // }
    },
    // transpile dependencies that do not provide pre-built modules
    transpileDependencies: [],
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
};
