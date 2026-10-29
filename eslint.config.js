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
    // eslint-config-expo 56 turned on the React Compiler rules as errors. They flag
    // patterns the current v1 code relies on (Animated.Value refs read in render,
    // Reanimated .value writes, Date.now() in render). Phase 1's re-render refactor
    // (plan §4.5) rewrites exactly that code and sets these back to 'error'.
    // Counts on 2026-10-29: refs 75, immutability 18, set-state-in-effect 7, purity 3, globals 2.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/globals': 'warn',
    },
  },
]);
