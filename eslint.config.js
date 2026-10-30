// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // .claude/ holds vendored agent skills (third-party browser scripts), not app code.
    ignores: ['dist/*', '.claude/**'],
  },
  {
    // The React Compiler rules, at 'error' again since Phase 1 B5 turned the
    // compiler on (app.json experiments.reactCompiler; ADR-0041). They were
    // held at 'warn' from the SDK 56 step until B5 fixed the findings
    // (ADR-0035). eslint-config-expo already sets them to 'error'; they are
    // spelled out so an upstream change can't quietly relax them.
    rules: {
      'react-hooks/refs': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/globals': 'error',
    },
  },
  {
    // tsc already checks namespace members in TypeScript. eslint-plugin-import's
    // own check gives false positives on Babel-compiled packages whose first
    // `export` follows a `*/` on the same line (expo-notifications 58:
    // Notifications.AndroidImportance), because its module-detection regex misses it.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'import/namespace': 'off',
    },
  },
]);
