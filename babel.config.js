const plugins = [];
if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['info', 'error', 'warn'] }]);
} else if (process.env.NODE_ENV === 'test') {
    plugins.push('transform-es2015-modules-commonjs');
}
module.exports = {
    presets: ['@vue/app'],
    plugins
};
