/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {}],
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: './test-results',
            outputName: 'junit.xml'
        }]
    ],
    roots: ['<rootDir>'],
    modulePaths: ['<rootDir>'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    collectCoverage: true,
    coverageReporters: ['lcov', 'text'],
    testTimeout: 30000,
    maxWorkers: 4
};
