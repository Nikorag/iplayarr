/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {}],
    },
    reporters: [
        'default',
        ['jest-junit', { 
            outputDirectory: './test-results',
            outputName: 'junit.xml'
        }]
    ],
    roots: ['<rootDir>'],
    modulePaths: ['<rootDir>'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
