/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
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
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,ts}',  // adjust this to your file structure
    ],
    coverageReporters: ['lcov', 'text'],
};
