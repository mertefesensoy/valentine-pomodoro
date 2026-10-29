# 2026-10-29 — Phase 1 B2: MMKV and the one-time AsyncStorage migration

**Status:** Done locally. Jest, typecheck, lint and the Reassure counts are green; the migration was tested against every A3 fixture. **Not yet run on a device:** B2 adds a native module, so it needs a new EAS iOS build plus TestFlight, which only you can approve (§6.2).
**Branch:** `rehaul/v2`
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B2, §5 (flag-last decision), §6 item 2 (the notes rule); [rehaul plan](2026-10-29-couples-rehaul-plan.md) §10 Risks ("AsyncStorage keys are kept for one release as a fallback")

---

## 1. Problem / Motivation

B3 replaces the hooks' async loads with Zustand stores that hydrate **synchronously**, so the first frame needs no loading state. AsyncStorage can't do that, because every read is a native round trip. MMKV can.

Every existing user's data lives in v1.3.1's AsyncStorage: stats, notes, settings, reminder, the two clock slots and the ad counters. That includes Bengisu's install. So the switch needs a migration with three properties:

- **No loss.** Every key and value arrives exactly as it was, including values that are already corrupt.
- **Crash-safe.** A crash or kill at any point during the copy must not lose or half-apply anything.
- **Reversible for one release.** AsyncStorage stays untouched (rehaul plan §10: "kept for one release as a fallback"), so a rollback build still finds v1.3.1's data. §3.4 explains how "fallback" is read here.

Plus one product rule, which you approved: **an existing install with no `love_notes` key gets the v1.3.1 default notes written explicitly.**

- Such an install has never edited its notes.
- D2 will change the defaults to a name-free set.
- Without this rule, those users, Bengisu among them, would silently switch to the new notes.

## 2. What Changed

| File | Change |
|------|--------|
| `package.json`, `package-lock.json` | `react-native-mmkv` **4.3.2** and its peer `react-native-nitro-modules` **0.37.1**, pinned like the other native modules. **New native code.** |
| `src/utils/appStorage.ts` | **New.** `appStorage = createMMKV()`, the default instance `mmkv.default`. |
| `src/utils/storageMigration.ts` | **New.** `migrateAsyncStorage(target, source)`, `ensureMigrated()`, `MIGRATION_FLAG_KEY` (`migration.asyncstorage_v1`), `MIGRATION_DONE` (`done`), `V131_STORAGE_KEYS`. |
| `src/constants/legacyLoveNotes.ts` | **New.** `V131_DEFAULT_LOVE_NOTES`, the frozen 20 notes. Copied from the A3 fixture, which was extracted from `release/ios-1.3.0`. A test asserts the two are equal. |
| `src/utils/storage.ts` | `save`, `load` and `remove` keep their async signatures and JSON format, but use `appStorage`. Each first awaits `ensureMigrated()`. |
| `src/ads/AdPolicy.ts` | Uses `load`/`save` instead of raw AsyncStorage. Same key, same JSON. |
| `src/__fixtures__/storage/resetStorage.ts` | **New, test-only.** Clears AsyncStorage **and** MMKV, the flag included. |
| `src/utils/__tests__/storageMigration.test.ts` | **New.** 30 tests: 4 per fixture × 5 fixtures, plus a mid-copy crash, the notes rule, corrupt JSON and `ensureMigrated`. |
| `src/utils/__tests__/storage.test.ts` | **New.** 5 tests of the storage layer on MMKV, including write ordering against the migration. |
| `jest.setup.ts` | `react-native-nitro-modules` mocked (§3.5). |
| `src/__fixtures__/storage/__tests__/v131.test.tsx` | Resets both stores. Reads the provider's `stats_v2` through `load()`. The never-edited-notes check is now `toEqual`, since B2 writes those notes. |
| `src/context/__tests__/flyModeGuard.test.tsx` | Seeds and reads `app_mode` through `save`/`load`. The Android "ignored switch" assertion would otherwise have passed vacuously against an AsyncStorage the app no longer writes. |
| `src/hooks/__tests__/useSessionClock.test.ts` | `resetStorage()`, and the cold-start seed goes through `save()`. |
| `src/screens/__tests__/screens.perf-test.tsx` | Reassure's `beforeEach` is `resetStorage()`, so every run migrates from the same empty state. |
| `src/screens/__tests__/flyLazyLoad.test.tsx` | `resetStorage()`. |
| `src/hooks/useLoveNotes.ts`, `useSettings.ts`, `src/types/index.ts` | Comments only: "persisted to AsyncStorage" corrected. |
| `docs/implementations/2026-10-29-phase1-plan.md` | B2 row marked done (locally). |

The A1 guards are unchanged.

## 3. Implementation Approach

### 3.1 The pieces

```
hooks / AdPolicy ──► storage.ts: save · load · remove
                         │ await ensureMigrated()      (every call)
                         ▼
                  storageMigration.ts ──reads──► AsyncStorage (v1.3.1; never written)
                         │ writes
                         ▼
                  appStorage.ts: MMKV 'mmkv.default'
```

### 3.2 `migrateAsyncStorage(target, source = AsyncStorage): Promise<'already-done' | 'migrated'>`

- **Input:** `target`, anything with `getString`/`set` (in the app, `appStorage`; in tests, also a crashing wrapper or a separate reference instance), and `source`, anything with `getAllKeys`/`multiGet`.
- **If the flag is already `done`:** returns `'already-done'` without reading `source` or writing `target`.
- **Otherwise, in order:**
  1. `getAllKeys()`, then one `multiGet` of all of them.
  2. Each non-null value is copied to `target` **as text, unparsed**. Corrupt JSON stays corrupt, and `load()` handles it at read time, as v1.3.1 does: log, then return the default.
  3. **Notes rule.** If any key is in `V131_STORAGE_KEYS` (the 13 keys an install of v1.3.1 or earlier can hold) and `love_notes` was not among the copied keys, it writes `JSON.stringify(V131_DEFAULT_LOVE_NOTES)` to `love_notes`.
  4. The flag `migration.asyncstorage_v1 = done`, **last**.
- **Never writes `source`.** Tested with spies on all six AsyncStorage write methods, plus a before/after comparison of its full contents.
- **Rejects** if a read or a write throws; the flag is then not written.

"Every AsyncStorage key" means `getAllKeys()`, not a fixed list. A key that some older version wrote and this code doesn't know about is still carried over. The three orphaned keys (`update_meta`, `fly_session` and the v1 `stats` map) are copied as-is (Stage A finding 3).

### 3.3 `ensureMigrated(): Promise<void>`

Every `save`, `load` and `remove` awaits it. That gives one invariant: **nothing reads or writes MMKV before the migration has finished.**

- **Fast path:** it reads the flag from MMKV on every call (synchronous, microseconds). There is no module-level "done" boolean, so a test that clears MMKV starts over correctly.
- **Concurrent callers** share one in-flight promise. At start-up the six stores all load at once, and one migration serves them.
- **Never rejects.** A failure is logged with `console.error` and leaves no flag.
  - This launch then runs on whatever MMKV holds, which is empty on a first launch, so the loads return their defaults. That is exactly what v1.3.1 shows when AsyncStorage fails.
  - The next launch retries the whole copy.
- **Why writes must wait too.** If a `save` could land in MMKV before the copy, the copy would overwrite it with the older v1.3.1 value. The test "a save made before the migration ran is not overwritten by the copy" pins this.

### 3.4 What "fallback for one release" means

The rehaul plan says only "kept for one release as a fallback". This doc reads that as rollback safety, not a runtime fallback: `load()` never consults AsyncStorage. It is kept, untouched, so that:

- a rollback build (1.3.x behaviour) installed over v1.4 still finds the user's v1.3.1 data
- E1's device comparison can still read the original values

From v1.4 on, the app writes only MMKV. AsyncStorage is a frozen snapshot from the moment of the update, and is deleted in a later release, once the rollback window closes.

### 3.5 Jest

- **MMKV's own mock.** react-native-mmkv 4 returns an in-memory store from `createMMKV()` whenever `JEST_WORKER_ID` is set. Each `createMMKV()` gets its own `Map`, so a test can make a separate reference instance.
- **The Nitro mock.** Importing react-native-mmkv imports react-native-nitro-modules, which calls `TurboModuleRegistry.getEnforcing('NitroModules')` at import and throws under Node. MMKV only calls Nitro lazily (`getMMKVFactory`), on the non-test path. So `jest.setup.ts` mocks Nitro with a `createHybridObject` that throws, which means any test that wanders off MMKV's mock path fails loudly.
- **`resetStorage()`** clears both stores. Without the MMKV half, the first test's flag would make every later AsyncStorage seed in the file invisible.
- **Spy hygiene.** The AsyncStorage Jest mock's methods are already `jest.fn()`s, so `jest.spyOn` returns them with earlier calls, the seeding included, still counted. Every such spy is `.mockClear()`ed as it is taken. A first test run without that failed, and that's how this was found.

### 3.6 Test first

1. Both new test files were written before any B2 module existed. First run: both suites failed to run (`Cannot find module`).
2. With `storageMigration.ts` written but `storage.ts` still on AsyncStorage: **30/30 migration tests green, and 4 of the 5 storage-layer tests red.** For example, `save writes MMKV and never AsyncStorage` failed with `Expected: "\"fly\"", Received: undefined`. The fifth, the write-ordering test, passed trivially, because on AsyncStorage there is no copy to race.
3. After the switch: 35/35.
4. **The full suite then failed five existing tests,** each because it read or seeded AsyncStorage as the app's store. They were moved to the storage layer (§2). The flyModeGuard Android test was *passing*, but only vacuously, so it was changed too.

## 4. Mathematical / Statistical Details

### 4.1 Why a crash at any point is safe

**Notation:**
- $S$: the AsyncStorage contents, a map from key to text.
- $T$: MMKV's contents.
- $N = $ `JSON.stringify(V131_DEFAULT_LOVE_NOTES)`.
- $F$: the flag pair (`migration.asyncstorage_v1`, `done`).

A run with the flag absent performs the write sequence

$$W(S) = \big[(k_1, S[k_1]),\ \dots,\ (k_n, S[k_n])\big] \;\Vert\; \big[(\texttt{love\_notes}, N)\big]_{\text{if } E(S)} \;\Vert\; [F],$$

where $E(S)$ means "$S$ holds some key of `V131_STORAGE_KEYS` and no `love_notes`".

Three facts hold:

1. **$S$ is constant across runs.** The migrator never writes AsyncStorage, and nothing else in v1.4 does either. So every run computes the same $W(S)$.
2. **Before $F$ exists, nothing else writes $T$.** Every app read and write is behind `ensureMigrated()`.
3. **Every write is an overwrite with a value fixed by $S$.** So applying any prefix of $W(S)$ and then all of $W(S)$ gives the same $T$ as applying $W(S)$ once:

$$\text{apply}(W(S),\ \text{apply}(W(S)_{1..j},\ T_0)) = \text{apply}(W(S),\ T_0) \quad \forall\, j \le |W(S)|.$$

A crash after $j$ writes leaves no $F$, since $F$ is last. So the next launch re-runs all of $W(S)$ and reaches the same final state as a run that never crashed.

Once $F$ is written, every later run is a no-op, so values the user changes afterwards are never touched again.

The tests check exactly this, with two crash points:

- at the flag write, for every fixture
- on the 5th of the full install's 14 writes (13 keys plus the flag), which leaves 4 keys in MMKV and no flag

Each time, the re-run's contents equal a clean run's contents in a separate MMKV instance (`toEqual` over every key).

### 4.2 Which installs count as "existing"

$E$ uses the 13 known keys rather than "any key at all", so an unrelated key can't turn a fresh install into an "existing" one. Two of the five fixtures are existing installs without notes:
- the v1.3.1 install that never edited its notes
- the lapsed **1.0.0** install, whose only evidence of being existing is the keys `timer_state`, `settings` and `stats`

Both get $N$. The full install keeps its edited notes (Turkish İ/ı and emoji intact). The fresh install ends with exactly one key, the flag.

### 4.3 Bundle

From the pinned export (`npx expo export --platform ios --platform android --dump-sourcemap`):

| | After B1b | After B2 | Change |
|--|--|--|--|
| iOS bytecode (B) | 3,403,356 | 3,430,632 | +27,276 (+0.80 %) |
| Android bytecode (B) | 3,491,384 | 3,518,464 | +27,080 (+0.78 %) |
| Modules iOS / Android | 1,822 / 1,845 | 1,861 / 1,884 | +39 / +39 |
| Assets (B) | 2,264,311 | 2,264,311 | 0 |

The +39 modules are react-native-mmkv's and Nitro's JS layer, plus `appStorage`, `storageMigration` and `legacyLoveNotes`. These **are** on the cold-start path, because storage is needed on the first frame. iOS stays 11.0 % below the SDK 58 baseline (3,856,208 B).

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Copy every key from `getAllKeys()`, values as unparsed text | A fixed list of known keys; parse and re-serialize | A fixed list loses any key it forgot. Parsing would turn corrupt JSON into either a crash or a silent default *at migration time*. Copying text keeps "handled where it is read, as today". |
| Gate every `save`/`load`/`remove` on `ensureMigrated()` | Run the migration once from `App.tsx` before rendering `AppProvider` | The gate makes ordering a property of the storage layer: no caller, including `AdPolicy` and future ones, can read or write too early. A render gate would rely on every reader sitting below it. B3 can still start the migration earlier for synchronous hydration, and the gate keeps holding. |
| Flag read from MMKV on every call; no module-level boolean | Memoize "done" in a variable | The flag *is* the state. No second copy can disagree with it. The cost is one synchronous MMKV read per storage call. |
| `ensureMigrated` never rejects; failure → no flag, retry next launch | Throw into the app; fall back to AsyncStorage for the launch | A launch with failed AsyncStorage reads is already "defaults" in v1.3.1, so this changes nothing a user could see. A runtime dual backend would add a second write path for a failure that has never been observed. |
| Notes rule keyed on the 13 known v1.3.1 keys | "Any key present" | Library or test keys can't misclassify a fresh install. The 1.0.0 fixture proves the oldest real shape still counts. |
| Frozen notes in `src/constants/legacyLoveNotes.ts`, tested equal to the fixture's copy | Import the fixture in production; reuse `DEFAULT_LOVE_NOTES` | Production code must not import test fixtures. `DEFAULT_LOVE_NOTES` is the constant D2 changes. Two independent copies that must agree catch an accidental edit to either. |
| MMKV default instance, unencrypted | A named or encrypted instance | AsyncStorage on iOS was also unencrypted app-sandbox storage, so this keeps the same security posture. B3 can choose instances per store; the migration targets the one the app reads. |
| Keep the async `save`/`load`/`remove` API for now | Make them synchronous now | B3 replaces the callers with stores. Changing the signatures in B2 would rewrite every hook twice. |
| `AdPolicy` through `load`/`save` | Give it its own MMKV calls | It then shares the migration gate. One behaviour difference: corrupt `ad_policy_v1` JSON is now logged with `console.error` by `load()`, not `console.warn`; the resulting state (defaults) is the same. |
| Pin `4.3.2` / `0.37.1` exactly | npm's caret ranges | Matches how the other native modules are pinned (`react-native-maps`, Reanimated). A native module change should be a deliberate edit. |

## 6. Verification

### 6.1 Local, all done

```bash
npx jest --ci
npm run typecheck
npm run lint
npx reassure
npx expo export --platform ios --platform android --dump-sourcemap
npx expo-doctor
```

- [x] `npx jest --ci`: **86 passed, 14 suites** (B1b had 51 in 12). New: 30 migration tests and 5 storage-layer tests.
- [x] **A1 guards green and unchanged.** They drive the screens only through the UI, so they ran on MMKV with no edit, which is what Stage A designed them for.
- [x] `npm run typecheck`: clean.
- [x] `npm run lint`: 0 errors, 151 warnings, unchanged from B1b.
- [x] Reassure: §6.3.
- [x] Pinned export: both platforms bundle MMKV and Nitro without resolution errors (§4.3).
- [x] `npx expo-doctor`: 19/20. The one failure is the `@expo/config-plugins` note already accepted in the SDK 58 upgrade; nothing about MMKV or Nitro.

### 6.2 Device (iPhone, TestFlight): needs your go-ahead

B2 adds native code (MMKV's C++ core through Nitro), so it can't ride on build 42. It needs a **new EAS iOS build and a TestFlight upload**. That one build can also carry the B1 and B1b device checks.

**Specific build risk.** `app.json` sets `expo-build-properties` `ios.useFrameworks: "static"` (for AdMob). Nitro and MMKV 4 have **never been built in this configuration here**, and there is no Mac to try `pod install` locally. If the EAS build fails at pods or link time, that is the first suspect.

**Checks.** Install over the phone that has data, ideally one still on App Store 1.3.1, otherwise the build 42 install, which still stores in AsyncStorage:

1. Before updating, note what the screens show: today's and the week's stats, the streak, your notes (edited or not), settings, the reminder, and Fly's camera mode.
2. Update to the new build and cold-start it. Every value is the same; on Bengisu's phone, her notes are hers.
3. Change a setting, kill the app and relaunch. The change persisted (now in MMKV).
4. Kill the app during a running Pomodoro and relaunch: the session resumes, or completes once.
5. Interstitial cadence: after 2 sessions an ad may show; the counter survived the update.
6. Fly (B1, B1b): the first open shows the placeholder briefly; search "istanbul"; tap the map; fly a short flight.

### 6.3 Reassure

`npx reassure` ×3 after B2, against the Stage A baseline:

| Scenario | Stage A | Run 1 | Run 2 | Run 3 |
|----------|---------|-------|-------|-------|
| settings-only consumer | 14 | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 |
| Timer screen (Classic) | 14 | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 |
| Stats screen | 14 | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 |
| Settings screen | 15 | 15, 15, 15 | 15, 15, 15 | 15, 15, 15 |
| Notes screen | 14 | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 |
| `<TimerText>`-sized leaf | 14 | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 |

All counts are identical to Stage A. The migration (one `getAllKeys`, one `multiGet` and the MMKV writes) finishes inside the same `render()` act as the six loads, so hydration is still one commit.

**On a phone it may differ.** There, `AsyncStorage.getAllKeys` and `multiGet` resolve in native callbacks. The loads still all wait for the same migration promise, then read MMKV synchronously, so they resolve together. If anything, hydration commits become fewer than v1.3.1's separate AsyncStorage reads. B3's synchronous hydration is where this becomes exact.

## 7. Findings and open items

1. **The device check (§6.2) is the only open item for B2.** It needs your go-ahead for the EAS build and the TestFlight submission.
2. **AsyncStorage is never cleaned up.** Deleting it is a deliberate later task, after the rollback window. Until then each install carries its v1.3.1 data twice; a few KB.
3. **A corrupt `love_notes` key is copied as-is.** The reader then falls back to `DEFAULT_LOVE_NOTES`, and after D2 that means the *new* set. This needs a torn write of the notes key, which is rare, because it is written only on edit. Left as "handled where it is read"; D2 could check the frozen set as well.
4. **Stage A finding 1 (`useStats` drops `lastAppliedSessionId`) is untouched.** B3's stats store should keep the field.

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B2, B3, E1
- [Phase 1 Stage A](2026-10-29-phase1-stage-a.md): §3.3, the fixtures; §7, the findings
- [B1](2026-10-29-phase1-b1-lazy-fly-mode.md) and [B1b](2026-10-29-phase1-b1b-airports-asset.md): their device checks ride on the same build
- [Rehaul plan](2026-10-29-couples-rehaul-plan.md) §10 Risks: AsyncStorage kept for one release
