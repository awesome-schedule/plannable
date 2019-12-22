module.exports = {
    presets: ['@vue/cli-plugin-babel/preset'],
    env: {
        production: {
            plugins: [['transform-remove-console', { exclude: ['info', 'error', 'warn'] }]]
        },
        test: {
            plugins: ['transform-es2015-modules-commonjs']
        }
    }
};
