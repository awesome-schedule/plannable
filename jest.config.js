module.exports = {
    moduleFileExtensions: ['js', 'ts', 'jsx', 'json', 'vue'],
    transform: {
        '^.+\\.vue$': 'vue-jest',
        '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.tsx?$': 'ts-jest'
    },
    transformIgnorePatterns: ['/node_modules/(?!(string-similarity)/)'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
    snapshotSerializers: ['jest-serializer-vue'],
    testMatch: ['**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'],
    testURL: 'http://localhost/',
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/**/*.ts',

        '!**/*.d.ts',

        // don't know how to test components
        '!**/components/**/*.ts',

        // no need to test the entry point
        '!**/App.ts',
        '!**/main.ts',

        // todo
        // '!**/store/*.ts',

        // this is already used in other tests (a lot of other tests rely on its data)
        '!**/CatalogLoader.ts'
    ]
};
