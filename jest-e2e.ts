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
testRegex: ".*\\.e2e-spec\\.ts$",
};