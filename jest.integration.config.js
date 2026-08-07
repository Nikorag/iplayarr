/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {}],
    },
    testMatch: ['**/tests/integration/**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: './test-results',
                outputName: 'junit-integration.xml',
            },
        ],
    ],
    roots: ['<rootDir>'],
    modulePaths: ['<rootDir>'],
    // Load .env.integration before any test module is evaluated
    setupFiles: ['<rootDir>/tests/integration/dotenv.setup.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.integration.ts'],
    testTimeout: 30000,
};
