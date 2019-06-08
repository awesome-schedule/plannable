const plugins = [];
if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['info', 'error', 'warn'] }]);
}
module.exports = {
    presets: ['@vue/app'],
    plugins
};
