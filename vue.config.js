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
    chainWebpack: config => {
        config.externals(externals);
    },
    // transpile dependencies that do not provide pre-built modules
    transpileDependencies: ['string-similarity']
};
