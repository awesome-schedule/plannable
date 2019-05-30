// vue.config.js
const externals = {
    jquery: 'jQuery',
    bootstrap: 'bootstrap',
    vue: 'Vue',
    papaparse: 'Papa',
    vuedraggable: 'vuedraggable'
};
module.exports = {
    configureWebpack: config => {
        return {
            externals
        };
    }
};
