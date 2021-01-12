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
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    configureWebpack: config => {
        // get a reference to the existing ForkTsCheckerWebpackPlugin
        const existingForkTsChecker = config.plugins.filter(
            p => p instanceof ForkTsCheckerWebpackPlugin
        )[0];

        // remove the existing ForkTsCheckerWebpackPlugin
        // so that we can replace it with our modified version
        config.plugins = config.plugins.filter(p => !(p instanceof ForkTsCheckerWebpackPlugin));

        // copy the options from the original ForkTsCheckerWebpackPlugin
        // instance and add the memoryLimit property
        const forkTsCheckerOptions = existingForkTsChecker.options;
        forkTsCheckerOptions.memoryLimit = 4096;

        config.plugins.push(new ForkTsCheckerWebpackPlugin(forkTsCheckerOptions));
        config.externals = externals;
        config.plugins.push(
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
        );
    },
    // transpile dependencies that do not provide pre-built modules
    transpileDependencies: [],
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
};
