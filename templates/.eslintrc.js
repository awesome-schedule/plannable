module.exports = {
    root: true,
    env: {
        node: true,
        jquery: true,
        browser: true
    },
    extends: ['plugin:vue/recommended', '@vue/prettier'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'prefer-const': 'error',
        'vue/require-default-prop': 'off',
        'no-var': 'error'
    },
    parserOptions: {
        parser: 'babel-eslint'
    }
};
