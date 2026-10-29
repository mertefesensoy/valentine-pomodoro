---
id: IMPL-2026-10-29-phase1-b1-lazy-fly-mode
title: "Phase 1 B1: lazy Fly Mode"
status: done
date: 2026-10-29
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-29-phase1-b1b-airports-asset, SRS]
---

# 2026-10-29 — Phase 1 B1: lazy Fly Mode

**Status:** Done (`5b10a78`; FR-FLY-004). Jest, typecheck, lint and the Reassure counts are green. **The device check is open:** it rides on TestFlight build 43, v1.4.0 (EAS `73ad1446-23f8-4c34-a00e-78b2da38a900`), uploaded 2026-10-30 (§6).
**Branch:** `rehaul/v2`
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B1, §5 finding 1

---

## 1. Problem / Motivation

`TimerScreen` imported `FlyModeScreen` statically. On every cold start, even straight into Classic, Hermes therefore evaluated:

- Fly Mode itself
- `FlySheet`, `AirportPicker`, `FlyTimerPill` and the geo maths
- all of react-native-maps
- expo-audio
- the 648 KB airport JSON, as a JS module

None of it is needed until the user opens Fly. Plan task B1 defers it to the first switch.

**What B1 does not do (plan §5, finding 1).** On iOS and Android, Hermes ships one precompiled bytecode bundle. `React.lazy` changes *when* a module is evaluated, not *whether* it is in the bundle. The bytecode stays the same size; removing the airport data from it is B1b.

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/TimerScreen.tsx` | `FlyModeScreen` is `React.lazy(() => import('./FlyModeScreen'))`, rendered inside a `Suspense` whose fallback is `FlyModePlaceholder` (theme background plus a spinner). The ModeSwitcher stays outside the Suspense boundary. |
| `src/screens/__tests__/flyLazyLoad.test.tsx` | **New.** Three tests that record when the `FlyModeScreen` module is evaluated: not on a Classic cold start, never on Android, and once when the user switches to Fly. |
| `babel.config.js` | **New.** Expo's implicit default (`babel-preset-expo`) plus, **for `NODE_ENV=test` only**, `@babel/plugin-transform-dynamic-import`, so Jest can run `import()`. |
| `package.json`, `package-lock.json` | Dev dependency `@babel/plugin-transform-dynamic-import` `~7.29.7` (matches `@babel/core` 7.29.7). |
| `jest.setup.ts` | Comments only. The maps and audio mocks used to be justified by the static import. Now they are justified by the tests that open Fly (the A1 guard). |
| `scripts/startup-modules.js` | **New.** Counts the modules a cold start evaluates, from a plain-JS Metro export (§3.2, §4). |
| `docs/implementations/2026-10-29-phase1-plan.md` | B1 row marked done. |

## 3. Implementation Approach

### 3.1 The lazy boundary

```tsx
const FlyModeScreen = lazy(() => import("./FlyModeScreen"));
…
<View style={styles.flyContainer}>
  <Suspense fallback={<FlyModePlaceholder />}>
    <FlyModeScreen />
  </Suspense>
  <View style={styles.flyModeSwitcherBar}>…<ModeSwitcher …/></View>
</View>
```

**On device.** Metro compiles `import()` to Expo's `asyncRequire(id, paths)`. Without bundle splitting (native), that resolves on a microtask to `require(id)`. So the first Fly switch costs one Suspense commit with the placeholder; the next commit has Fly.

**Placeholder.** `FlyModePlaceholder` fills the Fly area with the theme's `colors.bg` and an `ActivityIndicator` in `colors.accent`. Its accessibility label is "Loading Fly Mode". It is deliberately plain, because Stage D restyles every surface.

**Platform gate unchanged.** `isFlyModeAvailable()` and `resolveAppMode()` in `src/constants/features.ts` already keep `activeMode` away from `'fly'` on Android and web. The lazy component is rendered only when `activeMode === 'fly'`, so on those platforms the module is never loaded.

**Kept out of scope:**
- Prefetching Fly after the first frame.
- Moving Fly's own imports.

Both would change what B1 measures. B7 owns start-up scheduling.

### 3.2 How the cold-start module count is measured

`scripts/startup-modules.js <bundle.js> [--list out.txt]`:

- **Input:** a non-minified, non-bytecode Metro export, with its source map next to it.
- **Output:** totals on stdout. With `--list`, a sorted list of the source path of every module evaluated at cold start.
- **Side effects:** none besides the optional list file.

Method:
1. Each module in the bundle is `__d(factory, id, [deps])`. The trailer gives the module's id and its dependency ids (`null` for an unresolved optional dependency).
2. Inside each factory, every `require(_dependencyMap[i])`, `_$$_IMPORT_DEFAULT(…)` and `_$$_IMPORT_ALL(…)` is a **sync** edge. Every `_dependencyMap[i], _dependencyMap.paths`, the `asyncRequire` call that `import()` compiles to, is an **async** edge.
3. The script walks the graph from the `__r(…)` entry points. It counts what is reachable through sync edges only, and what is reachable through both kinds.
4. Names come from the source map (trace-mapping's `AnyMap`, since Metro writes a sectioned map): the first mapped line inside each factory. Generated modules with no mapping, such as JSON and asset registrations, keep a numeric id.

The method rests on two facts:

- Expo's Metro config has `inlineRequires: false` (checked: `getTransformOptions()` returns it). So every ES import is a top-level require in the factory, and runs when the factory runs.
- A `require` written inside a function body would also be counted as sync. That makes the result an **upper bound** on what a cold start evaluates. The app has no such requires on its start-up path.

### 3.3 Test first

`flyLazyLoad.test.tsx` mocks `../FlyModeScreen` with a factory that calls `mockFlyModuleEvaluated()`, so the test can see when the module is evaluated. `TimerScreen` is `require`d inside each test, not imported at the top: under the static import, a top-level import would run the factory while the spy is still in its temporal dead zone, and the test would fail for the wrong reason.

**Red run, against the static import (before the change):**

```
FAIL src/screens/__tests__/flyLazyLoad.test.tsx
  ● … › a cold start into Classic does not evaluate FlyModeScreen
    expect(jest.fn()).not.toHaveBeenCalled()
    Expected number of calls: 0
    Received number of calls: 1
  ● … › on Android a stored fly mode never evaluates FlyModeScreen
    (same: Received number of calls: 1)
Tests: 2 failed, 1 passed, 3 total
```

The third test (switching to Fly) passed in that run because the module was already loaded. After the change, all three pass.

**Second red, the Jest toolchain.** The first run after the change failed for a different reason: `TypeError: A dynamic import callback was invoked without --experimental-vm-modules`. babel-preset-expo leaves `import()` alone for Metro, and Jest's CommonJS runtime can't execute it. Fixed with the test-only Babel plugin (§5).

## 4. Mathematical / Statistical Details

Let $G = (V, E_s \cup E_a)$ be the module graph of the iOS bundle: $V$ the modules, $E_s$ the sync edges, $E_a$ the async ones. Let $R \subset V$ be the entry modules, the four `__r(…)` calls.

- **Evaluated at cold start:** $C = \{\,v : v \text{ reachable from } R \text{ in } (V, E_s)\,\}$
- **Reachable at all:** $A = \{\,v : v \text{ reachable from } R \text{ in } (V, E_s \cup E_a)\,\}$
- **Deferred until an `import()`:** $A \setminus C$

**Results** (iOS, `npx expo export --platform ios --no-bytecode --no-minify --source-maps`):

| | HEAD `229298d` (before B1) | After B1 |
|--|--|--|
| Modules in the bundle, $\lvert V \rvert$ | 1,799 | 1,801 |
| Async `import()` edges, $\lvert E_a \rvert$ | 0 | 1 |
| Evaluated at cold start, $\lvert C \rvert$ | **1,799** | **1,745** |
| Deferred until Fly opens, $\lvert A \setminus C \rvert$ | 0 | **56** |

**Deferred: 56 modules, −3.0 % of cold-start evaluation:**

- 7 app files: `FlyModeScreen`, `FlySheet`, `FlyTimerPill`, `AirportPicker`, `useFlyModeAudio`, `geoMath`, `geoMathWorklet`
- 34 react-native-maps modules
- 9 expo-audio modules
- 6 generated modules, among them the `airports.json` module and the `fly-ambient.m4a` asset registration

**New: 2 modules,** Expo's async-require helper (`expo/internal/async-require-module.js`, `expo/src/async-require/asyncRequireModule.ts`). They are evaluated at cold start, which is why $\lvert V \rvert$ grows by 2.

So $1{,}799 - 56 + 2 = 1{,}745$.

By count, 3 % looks small. By weight it is larger: the deferred set includes the largest module in the app, the 648 KB airport JSON, which Hermes had to materialise as an object at start-up, plus all of react-native-maps' Fabric component registration.

**Bytecode is unchanged in kind.** All 1,801 modules are still in the one bundle (finding 1). The pinned-export bytecode numbers are recorded in the B1b doc, which is the task that changes them.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| `lazy(() => import('./FlyModeScreen'))` | `lazy(async () => require('./FlyModeScreen'))` | Both defer evaluation on device. With `require`, Metro records a *sync* dependency, so the start-up count (and any future tool) can't tell it apart from an eager import. `import()` is the documented `React.lazy` form, and on web it would split a chunk. |
| Jest runs `import()` through `@babel/plugin-transform-dynamic-import`, enabled only under `env.test` in a new `babel.config.js` | Run Jest with `--experimental-vm-modules`; a custom Jest transformer that re-creates jest-expo's Babel options; `babel-plugin-dynamic-import-node` | The plugin is Babel's official one and only sets the flag that babel-preset-expo's own `@babel/plugin-transform-modules-commonjs` reads. The `test` env never applies to Metro builds (`NODE_ENV` is `development` or `production` there), so app builds get exactly Expo's implicit default config. The VM-modules flag would change how every test file loads. |
| The ModeSwitcher sits outside `Suspense` | Wrap the whole Fly container | While Fly loads, the user can still switch back to Classic. |
| A plain themed placeholder | A skeleton map; a "paper" illustration | The load takes one microtask and a commit. Stage D owns the visual language, and C3 the art. |
| Measure with a static graph walk of the export | Count modules at runtime on the device; count in Jest | Runtime counting needs a device build and instrumentation. Jest's module registry isn't Metro's. The static walk is reproducible on Windows from the same export the plan pins, and its one approximation (§3.2) is an upper bound. |
| Commit the script | Keep it in a scratch folder | E3 re-measures at the end of Phase 1. A committed, documented script makes the before and after comparable. |

## 6. Verification

```bash
npx jest --ci
npm run typecheck
npm run lint
npx reassure
npx expo export --platform ios --no-bytecode --no-minify --source-maps --output-dir <dir>
node scripts/startup-modules.js <dir>/_expo/static/js/ios/index-<hash>.js --list eager.txt
```

- [x] `npx jest --ci`: **44 passed, 10 suites** (was 41 in 9). New: the three `flyLazyLoad` tests.
- [x] **A1 guards unchanged and green**, including the Fly guard. Its press of "Switch to fly mode" flushes the lazy load inside its `act`, so `getByTestId('map-view')` holds with no edit to the guard.
- [x] `npm run typecheck`: clean.
- [x] `npm run lint`: 0 errors, 149 warnings (was 146). All three new warnings are `no-require-imports` in the new test:
  - two in the `jest.mock` factory (factories can't use imports; the A1 maps mock has the same two)
  - the deliberate in-test `require` of `TimerScreen` (§3.3)
- [x] Reassure, counts against the Stage A baseline: §6.1.
- [x] Module counts: §4. To reproduce, run the export and the script at `229298d` and at this commit.
- [ ] **Device (iPhone, TestFlight build 43, v1.4.0):**
  1. A cold start into Classic is unchanged.
  2. The first switch to Fly shows the placeholder for at most a moment, then the map.
  3. Switching back and forth again shows no placeholder.
  4. Killing the app while in Fly and relaunching restores Fly: the lazy load happens at start-up in that case.
  5. A1's Fly items from A0 still pass: pick, start, sheet drag and double-tap, landing.

### 6.1 Reassure

The B1 run (`npx reassure`, compared against `.reassure/baseline.perf` from Stage A):

| Scenario | Stage A | After B1 |
|----------|---------|----------|
| settings-only consumer | 14 | 14, 14, 14 |
| Timer screen (Classic) | 14 | 14, 14, 14 |
| Stats screen | 14 | 14, 14, 14 |
| Settings screen | 15 | 15, 15, 15 |
| Notes screen | 14 | 14, 14, 14 |
| `<TimerText>`-sized leaf | 14 | 14, 14, 14 |

Reassure reports no added or removed scenarios and no count changes. That's expected: the Timer scenario runs in Classic, where the Suspense boundary is never mounted.

## 7. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B1, B1b, §5 finding 1
- [Phase 1 Stage A](2026-10-29-phase1-stage-a.md): the A1 guards and A2 baseline this keeps green
- [SDK 58 upgrade](2026-10-29-expo-sdk-58-upgrade.md) §6.1: the module and bytecode history
- B1b: [2026-10-29-phase1-b1b-airports-asset.md](2026-10-29-phase1-b1b-airports-asset.md)
