// vue.config.js
const externals = {
    jquery: 'jQuery',
    bootstrap: 'bootstrap',
    vue: 'Vue',
    papaparse: 'Papa',
    vuedraggable: 'vuedraggable'
};
module.exports = {
    // configureWebpack: config => {
    //     return {
    //         externals
    //     };
    // },
    parallel: false,
    chainWebpack: config => {
        config.externals(externals);
        // config.module
        //     .rule('worker')
        //     .test(/\.worker\.js$/i)
        //     .use('worker-loader')
        //     .loader('worker-loader')
        //     .end();
        config.output.globalObject('this');
    }
};
