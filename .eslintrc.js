module.exports = {
    root: true,
    env: {
        node: true,
        jquery: true,
        browser: true
    },
    extends: ['plugin:vue/recommended', '@vue/prettier', '@vue/typescript'],
    rules: {
        'no-console': 'off',
        'no-debugger': 'error',
        'prefer-const': 'error',
        'vue/require-default-prop': 'off',
        'no-var': 'error',
        'vue/no-v-html': 'off',
        'no-constant-condition': 'off'
    },
    parserOptions: {
        parser: '@typescript-eslint/parser'
    }
};
