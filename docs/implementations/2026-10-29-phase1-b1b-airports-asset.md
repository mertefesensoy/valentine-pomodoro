---
id: IMPL-2026-10-29-phase1-b1b-airports-asset
title: "Phase 1 B1b: airports.json out of the JS bundle"
status: done
date: 2026-10-29
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-29-phase1-b1-lazy-fly-mode, SRS]
---

# 2026-10-29 — Phase 1 B1b: `airports.json` out of the JS bundle

**Status:** Done (`0d63145`; FR-FLY-004, NFR-PERF-002). Jest, typecheck, lint and the Reassure counts are green, and the bytecode was measured with the pinned command. **The device check passed** on 2026-10-30 (reported by you) on TestFlight build 43, v1.4.0 (EAS `73ad1446-23f8-4c34-a00e-78b2da38a900`). The runtime asset read works on a device (§6).
**Branch:** `rehaul/v2`
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B1b, §5 finding 1 (your decision of 2026-10-29)

---

## 1. Problem / Motivation

The airport table, `src/assets/data/airports.json` (648,483 B, 4,554 airports), was a JSON import in `FlyModeScreen`. Metro treats `.json` as source, so Hermes compiled the whole table into the app's one bytecode bundle on every platform.

B1 already defers *evaluating* it until Fly opens. But plan §5 finding 1 explains why lazy loading can't make the bundle smaller on native, and the SDK 58 upgrade had grown the bytecode by about 19 %. You decided to move the table out of the module graph in v1.4.

## 2. What Changed

| File | Change |
|------|--------|
| `src/assets/data/airports.json` → `airports.jsonasset` | Renamed with `git mv`. Content is byte-identical. |
| `metro.config.js` | **New.** Expo's `getDefaultConfig`, plus `jsonasset` in `resolver.assetExts`. |
| `src/utils/airportAsset.ts` | **New.** `readAirportsAsset()`: resolves the bundled asset through `expo-asset` and reads it as text with `expo-file-system`'s `File`. |
| `src/utils/airportData.ts` | **New.** `parseAirports(text)`, `loadAirports()` (read once, shared while in flight, kept in memory, retried after a failure), and `getLoadedAirports()`. |
| `src/hooks/useAirports.ts` | **New.** The list for React: empty until the first load finishes, then the cached array. |
| `src/screens/FlyModeScreen.tsx` | The JSON import and module-level `AIRPORTS` are gone. Fly uses `useAirports()`. The restore effect waits for a non-empty table, and a map tap is ignored until one exists. The memos and callbacks list `airports` as a dependency. One stale `eslint-disable` was removed. |
| `src/screens/__tests__/timerScreenTicks.test.tsx` | **Two A1 guard edits; the UI steps and assertions are unchanged.**<br>1. The IST → LUZ precondition reads the table through `readAirportsAsset()` + `parseAirports()`, not the deleted JSON import.<br>2. `jest.setTimeout(30_000)` (§6, the timeout note). |
| `src/utils/__tests__/airportData.test.ts` | **New.** Parse, read-once caching, a shared in-flight read, and retry after a failure. |
| `src/utils/__tests__/airportAsset.test.ts` | **New.** The real reader's native calls, with `expo-asset` and `expo-file-system` mocked. |
| `jest.setup.ts` | The native read is mocked with a disk read of the same file, so every test still runs the real parse, cache and picker. |
| `package.json` | `expo-file-system` `~58.0.13` becomes a direct dependency. It was already installed and autolinked through `expo`, so this adds **no native module**. Jest also gains a `\.jsonasset$` transform: jest-expo's asset stub, so a require yields an id as Metro's does. |
| `docs/implementations/2026-10-29-phase1-plan.md` | B1b row marked done. |

## 3. Implementation Approach

### 3.1 Keeping the file out of the bytecode

Metro decides per **extension** whether a file is source or asset. `.json` is source, and adding `json` to `assetExts` would break every package's `require('./package.json')`. So the file gets its own extension, `.jsonasset`, registered in `metro.config.js`:

```js
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('jsonasset');
```

`require('../assets/data/airports.jsonasset')` now gives Metro's **asset id** (a number), and the file is copied next to the bundle:

- in an export: `dist/assets/<hash>`
- in an iOS build: into the app, under `assets/src/assets/data/`

`metro.config.js` is new, but `getDefaultConfig` is exactly what Expo used implicitly before. The only difference is the one extension.

### 3.2 Reading it at runtime

`readAirportsAsset(): Promise<string>` (`src/utils/airportAsset.ts`):

1. `Asset.fromModule(id).downloadAsync()` gives a local `file://` URI.
   - **Release builds** (TestFlight, App Store): the asset is embedded in the app. expo-asset's iOS `downloadAsync` returns file URLs unchanged (`AssetModule.swift`: `if url.isFileURL { promise.resolve(url…) }`).
   - **Dev builds:** Metro serves the asset over HTTP, and `downloadAsync` first copies it to the caches directory.
2. `new File(localUri).text()` reads it. expo-file-system grants **read** on any path inside `Bundle.main.bundlePath`, and **read/write** on the caches directory (`FileSystemUtilities.getInternalPathPermissions`). So both paths are readable.
3. It throws if no local URI comes back. Any native error propagates.

- **Side effects:** a dev build may write a cache file. A release build writes nothing.
- **Not cached here:** caching is `airportData`'s job.

`loadAirports(): Promise<Airport[]>` (`src/utils/airportData.ts`):

| State | Call returns |
|-------|--------------|
| nothing loaded, no read in flight | starts `readAirportsAsset().then(parseAirports)` and returns it |
| a read in flight | the same promise (one read, however many callers) |
| loaded | `Promise.resolve(loaded)`, the same array every time |
| the last read failed | a new read (failures are not cached) |

Invariant: at most one read in flight, and once `loaded` is set it never changes for the life of the JS runtime.

`parseAirports(text)` is `JSON.parse` plus the `{ iata, ...record }` mapping that used to sit at FlyModeScreen's module scope. It throws on non-JSON, or on JSON that isn't an object keyed by IATA code.

`useAirports(): Airport[]` starts from `getLoadedAirports() ?? []` and always asks `loadAirports()` in an effect. Asking even when the first render had the list closes a race: another caller may finish the load between the render and the effect. Once loaded, the promise resolves with the same array, so React skips the re-render. A failed read is logged with `console.error`; the list stays empty, and reopening Fly retries.

### 3.3 What Fly does while the table loads

On the first Fly open the table is empty for one file read and parse, a few milliseconds:

- The pickers show an empty list.
- Map markers are empty.
- A map tap is ignored. The `findNearestAirport([])` call it would have made returns `undefined`.
- The restore of a saved flight's airports waits, because the effect now depends on `airports` and returns early while the table is empty.

Every later open, in the same app run, has the table on its first render.

### 3.4 Tests

**First.** `airportData.test.ts` (5 tests) and `airportAsset.test.ts` (2 tests) were written before the modules existed. First run: both suites failed with `Cannot find module '../airportAsset'`.

**The Jest mock.** Under Jest, `jest.setup.ts` replaces `readAirportsAsset` with `fs.readFileSync` of the same file. Every test therefore runs the real parse, cache and Fly code, including the A1 Fly guard, which searches the real picker for "istanbul" and "lublin".

The mock's path is computed once at module scope in a `mockAirportAssetPath` variable. Two things forced that:
- Jest only lets a hoisted factory read module variables named `mock…`.
- The app's React Native typings declare no Node globals, so `jest.setup.ts` declares `__dirname` for itself.

## 4. Mathematical / Statistical Details

**Bytecode,** from the pinned command `npx expo export --platform ios --platform android --dump-sourcemap`, reading the `.hbc` file sizes. Assets are the total of `dist/assets`, measured the same way as the SDK 58 upgrade doc.

| | HEAD `229298d` (before B1) | After B1b | Change |
|--|--|--|--|
| iOS bytecode (B) | 3,856,660 | **3,403,356** | −453,304 (**−11.75 %**) |
| Android bytecode (B) | 3,945,024 | **3,491,384** | −453,640 (**−11.50 %**) |
| Assets, both platforms (B) | 1,615,828 | 2,264,311 | +648,483, exactly the file |
| Modules iOS / Android (export log) | 1,799 / 1,794 | 1,822 / 1,845 | see below |

**Where this leaves the history** (upgrade doc §6.1):
- iOS is **11.7 % below the SDK 58 baseline** (3,856,208 B), the Phase 1 budget of "below the SDK 58 baseline".
- iOS is 4.9 % above where SDK 54 started (3,243,628 B).
- So B1b recovers about 74 % of the SDK 54 → 58 growth: (3,856,208 − 3,403,356) / (3,856,208 − 3,243,628) = 452,852 / 612,580.

**Why bytecode shrinks by 453 KB for a 648 KB file.** Hermes stores a JSON literal as bytecode that builds the object, plus string-table entries. Repeated strings (country codes, the `name`/`city`/`coordinates` keys) are stored once. So the table cost less in bytecode than as text.

**The trade.** On disk the app gains about 195 KB: +648,483 B of asset, −453,304 B of bytecode, on iOS. What it gains for that:
- Hermes no longer maps the table as part of the bundle at launch.
- The parse happens once, on the first Fly open.
- A future dataset (Phase 4b) can change without recompiling the JS.

Both files are compressed in the IPA, and JSON compresses well. App Store sizes are not measured here.

**Proof the data left the bytecode.** The bytes `Lublin` occur in both platforms' `.hbc` at HEAD (1 match each) and in neither after B1b (0 matches each).

**Modules.**
- `|V|` grows from 1,801 (after B1) to 1,822 on iOS. The new modules are expo-file-system's JS layer, the three new app files, and the asset registration in place of the JSON module.
- **None of them is on the cold-start path.** `scripts/startup-modules.js` still counts **1,745** modules evaluated at cold start, the same set as after B1 (the two eager lists diff empty). The deferred set grows from 56 to 77, because everything new hangs off the lazy Fly boundary.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A dedicated `.jsonasset` extension in `assetExts` | Add `json` to `assetExts`; rename to `.txt`; embed natively with the `expo-asset` config plugin | `json` as an asset breaks every JSON require in `node_modules`. `.txt` hides what the file is. The config plugin embeds a file only at native build time, so Metro dev builds couldn't load it, and every data change would need a native build. |
| `expo-asset` + `expo-file-system`'s `File` | `fetch(asset.localUri)`; `expo-file-system/legacy`'s `readAsStringAsync` | `fetch` on `file://` URLs is not a documented React Native contract. The legacy API is the one SDK 54 deprecated. `File.text()` is the current API, and its iOS permission code allows the bundle path (§3.2). |
| Declare `expo-file-system` directly | Import it as `expo`'s transitive dependency | Imports should be declared. It was already installed and autolinked, so the native build is unchanged. |
| Load on first Fly open, cache for the app's life | Load at start-up; reload on every open | Start-up is exactly what B1/B1b clear. One read and parse per app run is cheap, and the table never changes at runtime. |
| Failures not cached; Fly shows an empty table and logs | Throw into an error boundary; fall back to a bundled subset | A missing asset would mean a broken build, which the device check catches. An empty picker is honest and recoverable. A fallback subset would put data back in the bundle. |
| Jest reads the real file instead of the native read | A fixture subset of airports; mocking `expo-asset` everywhere | The A1 Fly guard and the airport search stay on the real data and the real parse and cache. Only the two native calls are stubbed, and they have their own test. |
| The guard's precondition uses `parseAirports`, not `loadAirports` | `await loadAirports()` | `loadAirports` would warm the cache before the screen renders, and the guard would stop exercising the real first-open load. |
| `.jsonasset` → jest-expo's asset transformer | Rely on every test mocking the reader | A stray require of the asset under Jest would otherwise be parsed as JavaScript and fail confusingly. The stub gives an id, as Metro does. |

## 6. Verification

```bash
npx jest --ci
npm run typecheck
npm run lint
npx reassure
npx expo export --platform ios --platform android --dump-sourcemap --output-dir <dir>
# bytecode: sizes of <dir>/_expo/static/js/{ios,android}/*.hbc; data gone: grep -c -a Lublin <hbc> → 0
```

- [x] `npx jest --ci`: **51 passed, 12 suites** (B1 had 44 in 10). New: 5 in `airportData`, 2 in `airportAsset`.
- [x] **A1 guards green.** The Fly guard picks IST and LUZ through the real picker, from the runtime-loaded table.
- [x] **Timeout note.** During B1b's gate runs the *Classic* guard intermittently hit Jest's 5 s per-test real-time limit. Classic never touches the airport code.
  - With a 60 s limit, its JSON-reported durations were 3,491 ms and 2,643 ms (Fly: 312 and 388 ms). It is the first test in the file, so it pays for the first full `TimerScreen` render and the modules that render pulls in, and a busy machine pushes it past 5 s.
  - `StatsScreen.hooks.test.tsx` timed out once the same way, in the first full run after the Jest config changed (a cold transform cache).
  - The guard file now sets `jest.setTimeout(30_000)`, as Stage A did for the Reassure file. The guards assert on fake timers, so real-time headroom doesn't weaken them.
  - After the change: the file passed 3/3 alone, and the full suite passed.
- [x] `npm run typecheck`: clean.
- [x] `npm run lint`: 0 errors, **151 warnings** (B1: 149). The changes:
  - +1 the asset `require` in `airportAsset.ts`, the same pattern as `useFlyModeAudio`'s sound
  - +2 the `require`s inside `jest.isolateModules` in `airportData.test.ts`
  - −1 the stale `eslint-disable` removed from FlyModeScreen
  - (`jest.setup.ts` is outside `expo lint`'s file set; plain `eslint` shows +2 there, the `fs` and `path` requires in the mock.)
- [x] Reassure, against the Stage A baseline: settings-only 14, Timer 14, Stats 14, Settings 15, Notes 14, leaf 14. All unchanged, ×3 runs each.
- [x] Bytecode before and after, and the `Lublin` check: §4.
- [x] **Device (iPhone, TestFlight build 43, v1.4.0): all items passed, reported by you on 2026-10-30.** This was the first time this path ran on a device: the asset embedding, `downloadAsync` on an embedded file URL, and `File.text()` on the bundle path.
  1. Open Fly the first time and search "istanbul" in **From**: IST appears.
  2. Tap the map: the nearest airport is picked.
  3. Start and fly a short flight; the landing works.
  4. Kill the app mid-flight and relaunch: Fly restores with the same airports and the plane at the right point.
  5. Zoomed-out map markers still appear (tier 1).

  **If the build installs but Fly shows no airports:** look for `[useAirports] Failed to load the airport table` in the device log. The first suspect is the URI. The app's name, "Valentine Pomodoro", contains a space, so the embedded asset's `file://` URI contains `%20`, and that path through `new File(uri).text()` has not run on a device.

## 7. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B1b, §5 finding 1
- [B1: lazy Fly Mode](2026-10-29-phase1-b1-lazy-fly-mode.md): the module counts and the counting script
- [SDK 58 upgrade](2026-10-29-expo-sdk-58-upgrade.md) §6.1: the bytecode history
- [Phase 1 Stage A](2026-10-29-phase1-stage-a.md): the A1 guard's IST → LUZ precondition (§4.2)
