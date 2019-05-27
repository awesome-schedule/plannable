module.exports = {
    presets: ['@vue/app'],
    env: {
        production: {
            plugins: ['transform-remove-console', { exclude: ['info', 'error', 'warn'] }]
        }
    }
};
