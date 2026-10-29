// Expo's implicit default is `presets: ['babel-preset-expo']`; app builds get
// exactly that. The one addition is for Jest only (NODE_ENV=test): Jest runs
// CommonJS and can't execute `import()`, which babel-preset-expo leaves in place
// for Metro. This plugin makes the preset's CommonJS transform compile it to a
// deferred require, so React.lazy(() => import(...)) works in tests (Phase 1 B1).
module.exports = {
    presets: ['babel-preset-expo'],
    env: {
        test: {
            plugins: ['@babel/plugin-transform-dynamic-import'],
        },
    },
};
