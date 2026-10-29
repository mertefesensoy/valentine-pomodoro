# 2026-10-29 — First CI run: lint false positive and a stale local lint cache

**Status:** Done (CI re-run result in §6)
**Branch:** `rehaul/v2`
**Plan:** [2026-10-29-couples-rehaul-plan.md](2026-10-29-couples-rehaul-plan.md), Phase 0 exit criterion "green CI"

---

## 1. Problem / Motivation

The first GitHub Actions run after pushing `rehaul/v2` ([run 40894252335](https://github.com/mertefesensoy/valentine-pomodoro/actions/runs/40894252335)) failed at **Lint** with 2 errors, while every local gate during the SDK 54 → 58 upgrade had reported 0 lint errors. Typecheck passed; the unit tests never ran because lint failed first.

The errors:

```
src/hooks/useNotifications.ts  18:39  'AndroidImportance' not found in imported namespace 'Notifications'  import/namespace
src/utils/notifications.ts     71:35  'AndroidImportance' not found in imported namespace 'Notifications'  import/namespace
```

Two separate problems produced this:

1. **The errors are false positives.** `Notifications.AndroidImportance` exists at runtime and in the type declarations, and `tsc` accepts it.
2. **The local gate was lying.** `expo lint` caches results in `.expo/cache/eslint/`. ESLint's cache key is each file's own content plus the config, not the packages that file imports. `notifications.ts` and `useNotifications.ts` did not change during the upgrade, so their cached "clean" result from before `expo-notifications` 58 survived. CI has no cache, so it saw the true result. `npx expo lint --no-cache` reproduces CI exactly: 147 problems, 2 errors, 145 warnings.

Problem 2 matters more: Phase 1 adds many dependencies (Expo Router, Zustand, MMKV, i18next), and each one could hide a lint regression the same way.

## 2. What Changed

| File | Change |
|------|--------|
| `eslint.config.js` | `import/namespace` turned off for `.ts` and `.tsx` files, with a comment saying why. |
| `package.json` | `lint` is now `expo lint --no-cache`, so the local gate matches CI. |
| `docs/implementations/2026-10-29-expo-sdk-58-upgrade.md` | The §6.1 lint row is corrected: it came from cached runs. |
| `docs/implementations/2026-10-29-phase0-foundation.md` | Status and §6.3 record the first CI run. |

## 3. Implementation Approach

**Why the plugin misses the export.** `eslint-plugin-import` builds an export map for every module it follows. Before parsing a file, it checks the file against an "unambiguous module" regex, roughly `(^|;)\s*(export|import)…`, and skips any file that doesn't look like an ES module. `expo-notifications` 58.1.7 ships Babel output in which the first export follows a JSDoc comment on the same line:

```js
/** … */ export var AndroidImportance = /*#__PURE__*/ function(AndroidImportance) {
```

The line starts with ` * */`, not with `export`, so the regex fails. The plugin's debug log says so: `ExportMap ignored path due to unambiguous regex: …/NotificationChannelManager.types.js`. The package's `index.js` re-exports that file with `export *`, so `AndroidImportance` disappears from the map and the rule reports it as missing.

**The fix.** For TypeScript files, `tsc` already checks namespace members, more accurately and with the real declaration files. The typescript-eslint project recommends turning off `import/namespace` (along with `import/named` and `import/default`) in TypeScript projects for this reason. The rule is turned off only for `**/*.ts` and `**/*.tsx`, so the few JavaScript config files keep it.

**The cache.** `expo lint` passes `--cache --cache-location .expo/cache/eslint/` by default. `--no-cache` turns that off. A full uncached run takes well under a minute on this project, which is a fair price for a gate that can't report a stale pass.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Turn off `import/namespace` for TS files | Inline `eslint-disable` at the two call sites; `import { AndroidImportance }` named import | Inline disables hide the cause and recur at every new call site. The named import runs into the same export map, through `import/named`. `tsc` is the authoritative check for TS. |
| `--no-cache` in the `lint` script | Delete `.expo/cache/eslint/` once; document "clear the cache after upgrades" | Deleting once fixes today only. A rule people must remember is the same trap as before. |
| Leave the 145 warnings | Fix them now | 105 are the React Compiler rules deliberately set to `warn` until Phase 1 (`eslint.config.js`), and the rest are v1 code that Phase 1 rewrites. |

## 6. Verification

Local (all run on 2026-10-29):

- [x] `npm run lint` (now uncached): 145 problems, **0 errors**, 145 warnings.
- [x] `npm run typecheck`: clean.
- [x] `npx jest --ci`: 25/25.
- [x] **Mutation check:** a scratch file with `Notifications.AndroidImportanceTypo` fails `tsc` with TS2551 ("Did you mean 'AndroidImportance'?"). So turning off the lint rule loses no protection. The scratch file was deleted.

CI:

- [x] The re-run on `rehaul/v2` ([run 40895284323](https://github.com/mertefesensoy/valentine-pomodoro/actions/runs/40895284323)) passed typecheck, lint and, for the first time on Linux, all 25 unit tests. Recorded in the Phase 0 doc §6.3.

## 7. Related Docs

- [Phase 0 foundation](2026-10-29-phase0-foundation.md) · [Expo SDK 58 upgrade](2026-10-29-expo-sdk-58-upgrade.md)
- `.github/workflows/ci.yml`: the gate
