module.exports = {
    moduleFileExtensions: ['js', 'ts', 'jsx', 'json', 'vue'],
    transform: {
        '^.+\\.vue$': 'vue-jest',
        '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.tsx?$': 'ts-jest'
    },
    transformIgnorePatterns: ['node_modules/(?!(string-similarity)/)'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    setupTestFrameworkScriptFile: '<rootDir>/tests/unit/setup.ts',
    snapshotSerializers: ['jest-serializer-vue'],
    testMatch: ['**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'],
    testURL: 'http://localhost/',
    collectCoverage: true,
    collectCoverageFrom: [
        '**/*.{ts}',
        '!**/node_modules/**',
        '!**/*.d.ts',
        '!**/tests/temp/*.*',

        // don't know how to test components
        '!**/components/**/*.ts',

        // no need to test the entry point
        '!**/App.ts',
        '!**/main.ts',
        '!**/store/*.ts',

        // this is too expensive to test (requesting a lot of data)
        // and is already used in other tests (a lot of other tests rely on its data)
        '!**/CatalogLoader.ts',
        '!**/tests/**',
        '!**/tests/unit/*.ts',
        '!**/tests/unit/*.js'
    ]
};
