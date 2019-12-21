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
module.exports = {
    configureWebpack: {
        externals
        // worker loader requires Buffer from nodejs
        // node: {
        //     Buffer: false
        // }
    },
    // transpile dependencies that do not provide pre-built modules
    transpileDependencies: [],
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
};
