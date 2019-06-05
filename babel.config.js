module.exports = {
    presets: ['@vue/app'],
    env: {
        production: {
            plugins: [['transform-remove-console', { exclude: ['info', 'error', 'warn'] }]]
        }
    },

    // transpile all modules to commonjs to avoid interpolation issue
    // https://github.com/vuejs/vue-cli/issues/2637
    plugins: ['@babel/plugin-transform-modules-commonjs']
};
