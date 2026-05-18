// import { pathsToModuleNameMapper } from 'ts-jest/utils';

import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/',
    }),
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: '.',
    transform: {
        "^.+\\.(t|j)s$": "ts-jest"},
    collectCoverageFrom: [
        "**/*.(t|j)s",
        "!**/*.spec.ts",
        "!**/*.e2e-spec.ts",
        '!src/**/*.module.ts',
        '!src/**/*.interface.ts',
        '!src/main.ts'
    ],
    coverageDirectory: "../coverage",
    testRegex: '.*\\.spec\\.ts$', // или .e2e-spec.ts, если у тебя е2е тесты
};
