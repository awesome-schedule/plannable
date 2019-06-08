// transpile all modules to commonjs to avoid interpolation issue
// https://github.com/vuejs/vue-cli/issues/2637
const plugins = ['transform-es2015-modules-commonjs'];
if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['info', 'error', 'warn'] }]);
}
module.exports = {
    presets: ['@vue/app'],
    plugins
};
