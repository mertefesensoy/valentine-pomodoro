/**
 * Jest's transform for JS and TS: jest-expo's own babel-jest setup, plus the
 * React Compiler on app code exactly when the app has it (Phase 1 B5).
 *
 * babel-preset-expo adds the compiler only when its Babel caller reports
 * `supportsReactCompiler`. Metro sets that from app.json's
 * `experiments.reactCompiler`; jest-expo's caller never does. Without this file
 * Jest would test uncompiled components while the app ships compiled ones, so
 * the guards would prove nothing about the compiled code.
 *
 * Contract:
 * - The options are jest-expo's (`resolveBabelOptions`). For app code, and
 *   only while app.json turns the compiler on, the caller also reports
 *   `supportsReactCompiler`; babel-preset-expo then adds the compiler with the
 *   options it gives the app.
 * - App code is what Metro bundles: every file outside node_modules except the
 *   tests, their fixtures and mocks, and jest.setup.ts. Those are never in the
 *   app, so they stay as written. That keeps a test's probes (render counters,
 *   captured values) measuring what they were written to measure, and keeps
 *   functions inside jest.mock() factories free of the compiler's imports,
 *   which babel-plugin-jest-hoist rejects. node_modules is excluded by the
 *   compiler itself (its default `sources`).
 * - Babel puts the caller into the options babel-jest hashes for its cache
 *   key, so flipping the flag in app.json retransforms every file.
 *
 * src/components/__tests__/reactCompiler.test.tsx checks that app code under
 * test is compiled exactly when app.json says so.
 */
const path = require('path');
const { expo } = require('./app.json');

// jest-expo resolves babel-jest from its own folder (the Jest 30 copy, not the
// root's babel-jest 29 that @react-native/jest-preset pulls in); so do we.
const jestExpoDir = path.dirname(require.resolve('jest-expo/package.json'));
const babelJest = require(require.resolve('babel-jest', { paths: [jestExpoDir] }));
const { resolveBabelOptions } = require('jest-expo/src/resolveBabelOptions');

const compilerOn = expo.experiments?.reactCompiler === true;
// The project root as jest-expo passes it (Jest runs from the root).
const options = resolveBabelOptions(process.cwd());

const plain = babelJest.createTransformer(options);
const compiled = babelJest.createTransformer({
    ...options,
    caller: { ...options.caller, supportsReactCompiler: true },
});

const TEST_ONLY = /[\\/](__tests__|__fixtures__|__mocks__)[\\/]|[\\/]jest\.setup\.[jt]s$/;
const pick = (file) => (compilerOn && !TEST_ONLY.test(file) ? compiled : plain);

module.exports = {
    canInstrument: plain.canInstrument,
    getCacheKey: (source, file, transformOptions) => pick(file).getCacheKey(source, file, transformOptions),
    getCacheKeyAsync: (source, file, transformOptions) =>
        pick(file).getCacheKeyAsync(source, file, transformOptions),
    process: (source, file, transformOptions) => pick(file).process(source, file, transformOptions),
    processAsync: (source, file, transformOptions) => pick(file).processAsync(source, file, transformOptions),
};
