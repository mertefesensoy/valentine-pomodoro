# 2026-10-29 — Phase 1 Stage A: the A1–A3 safety-net gates

**Status:** Done for A1, A2 and A3. A0 (the iPhone check through TestFlight) is still open and needs your go-ahead.
**Branch:** `rehaul/v2`. Commits `82317d3` (A1), `8e211a9` (A2), `57ebc65` (A3), plus this doc. **Not pushed.**
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), §3 Stage A, §4.3, §5

---

## 1. Problem / Motivation

v1.4 is one release that carries a storage migration (B2), new stores (B3) and the re-render refactor (B4). Any of these can freeze the timer or lose data in ways a phone shows and a unit test might not. The plan therefore puts each risky change behind a gate that already exists and has been **seen to fail**. Stage A builds three of those gates:

- **A1.** The only timer guard (`timerTextTicks`) read the clock through a probe component. A probe can keep passing while a real screen's own subscription is broken, so the guard has to cover the screens users actually see.
- **A2.** One Reassure scenario existed: a settings-only consumer, 14 renders. B4's acceptance rule "no screen scenario goes up" needs a baseline for each screen. The 14-render breakdown was inferred, not measured.
- **A3.** B2 must be tested against the exact data already on users' phones. That data was described only in prose.

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/__tests__/timerScreenTicks.test.tsx` | **New (A1).** Renders the real `TimerScreen`, in Classic and in Fly, and asserts the visible timer goes 25:00 → 24:59 → 24:00. |
| `jest.setup.ts` | Three additions, all needed because `TimerScreen` imports `FlyModeScreen` statically:<br>• `react-native-maps` mocked as plain `View`s with no-op camera methods<br>• `expo-audio` mocked with a stub player<br>• Gesture Handler's own `jestSetup` loaded |
| `src/screens/__tests__/screens.perf-test.tsx` | **New (A2).** Five Reassure scenarios: Timer (Classic), Stats, Settings, Notes, and a `<TimerText>`-sized leaf. |
| `src/__fixtures__/storage/v131.ts` | **New (A3).** The v1.3.1 storage fixtures, their types, and the raw AsyncStorage entries. |
| `src/__fixtures__/storage/__tests__/v131.test.tsx` | **New (A3).** Checks each fixture against the readers that ship today. |
| `src/hooks/useTimer.ts` | `PomodoroState` is exported. Type only; no runtime change. |
| `src/ads/AdPolicy.ts` | `AdState` is exported. Type only; no runtime change. |
| `docs/implementations/2026-10-29-phase1-plan.md` | A1–A3 rows marked done. §4.3's breakdown marked as confirmed, with the leaf target corrected. The A3 row's `fly_session` wording corrected. |
| `docs/implementations/2026-10-29-phase1-stage-a.md` | This doc. |

No app behaviour changed.

## 3. Implementation Approach

### 3.1 A1: guards on the real screens

**The test tree** is `GestureHandlerRootView` → `AppProvider` → `BottomTabBarHeightContext` (value 0) → `TimerScreen`. These are the providers `App.tsx` puts above the tabs, plus the tab-bar height the tab navigator would supply.

**The guards drive the screens only through the UI:**

- **Classic.** Press **Start**.
- **Fly.**
  1. Press "Switch to fly mode", and assert the map is on screen.
  2. Open the **From** picker, search "istanbul", and tap **IST**.
  3. Open the **To** picker, search "lublin", and tap **LUZ**.
  4. Press **Start Flight**.

Neither test seeds storage or sets the app mode directly. A guard that wrote AsyncStorage would have to be rewritten in B2 and B3, the very changes it exists to watch.

**Why IST → LUZ.** That flight is exactly 25 minutes (§4.2). The test asserts this first, using the app's own `haversineDistance` and `flightDurationToSeconds`. If the airport data (B1b) or the formula changes, that precondition fails with a clear message, rather than the guard failing for the wrong reason.

**Notifications.** Starting a session asks for notification permission, raced against a 1 s `setTimeout` (`useTimer.start`, `FlyModeScreen.handleStart`). Under fake timers that timeout never fires on its own, so a permission call that never settles would hold the session start forever. The test file mocks `expo-notifications` to deny permission. The race then settles on the first microtask and nothing is scheduled.

**Assertions query the visible text** (`getByText`, `getAllByText`), not test IDs, so they keep holding when:

- B4 moves the text into a `<TimerText>` leaf
- D1 restyles the screen

Fly shows the time twice, in the pill and in the sheet. So the Fly guard uses `getAllByText`, and after 1 s also asserts that no "25:00" is left.

**Mutation check.** A guard over behaviour that already works can't fail first in the usual test-driven way. Seeing it fail under a deliberate breakage is that step.

| Breakage | Guard | Result |
|----------|-------|--------|
| `setDisplayTick(t => t + 1)` removed from `useSessionClock.ts` | `timerTextTicks` (the probe) | **Failed** at the 24:59 step: expected `24:59`, received `25:00` |
| same | Classic on the real screen | **Failed** at the 24:59 step: `Unable to find an element with text: 24:59` |
| same | Fly on the real screen | **Failed** at the 24:59 step: same message; the rendered tree still shows `25:00` twice |

The file was then restored with `git checkout -- src/hooks/useSessionClock.ts`; `git status` shows it clean. All three guards pass again.

### 3.2 A2: the wider Reassure baseline

**The 14-render breakdown, now instrumented.** The settings-only scenario was run once with a `React.Profiler`, which counts commits per step, and a render counter in the consumer. The one-off test file was deleted afterwards.

| Step | Commits | Phase | Consumer renders |
|------|---------|-------|------------------|
| `render()` | 2 | mount, then update | 2 |
| `act` flush after render | 0 | — | 0 |
| `session.start` | 1 | update | 1 |
| each of 10 one-second ticks | 1 each (10) | update | 1 each (10) |
| `session.stop` | 1 | update | 1 |
| **Total** | **14** | | **14** |

The plan's inferred breakdown (mount 1 + hydrate 1, start 1, 10 ticks, stop 1) is **confirmed**. Two details it didn't state:

- **Both hydrate and mount land inside `render()`.** RNTL's `render` awaits an `act` that flushes the store loads. All six loads land in **one** batched commit, because the Jest AsyncStorage mock resolves each one in a microtask of the same `act`.
- **One hydrate commit is a lower bound.** On a phone the loads resolve in separate native callbacks and can take more than one commit.

**The new scenarios** (`src/screens/__tests__/screens.perf-test.tsx`):

- **Same session.** Each runs the same 10 s session: flush, `session.start` (25-minute Pomodoro), ten 1 s ticks, `session.stop`.
- **Providers in the `wrapper`.** They go in Reassure's `wrapper` option, which renders outside its Profiler. Each count is therefore the number of commits in which the *measured* screen or leaf rendered.
- **`SessionHandle`.** A tiny component inside the wrapper hands the scenario the session API. Its own renders are not counted.
- **Empty storage per run.** `beforeEach` clears AsyncStorage, so every run hydrates from the same state.
- **No network.** `useUpdateCheck` is mocked, since Settings checks the store for a newer version on mount.
- **`jest.setTimeout(120_000)`.** Four mounts of a full screen take longer than Jest's 5 s default in real time. On the first attempt the four screen tests timed out, kept measuring in the background, and wrote their counts under the *next* test's name: five rows named "TimerText-sized leaf", with counts like `[5, 2, 15]`. The longer limit prevents that.

**Results.** Three `npx reassure --baseline` runs, with counts identical in every run:

| Scenario | Run 1 | Run 2 | Run 3 | Initial-render commits |
|----------|-------|-------|-------|------------------------|
| settings-only consumer (Phase 0, unchanged) | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 | 2 |
| Timer screen (Classic) | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 | 2 |
| Stats screen | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 | 2 |
| Settings screen | **15**, 15, 15 | 15, 15, 15 | 15, 15, 15 | **3** |
| Notes screen | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 | 2 |
| `<TimerText>`-sized leaf | 14, 14, 14 | 14, 14, 14 | 14, 14, 14 | 2 |

Each cell lists the three measured runs within one baseline run (`runs: 3`, after one warm-up). Durations are recorded too, but treated as advisory (plan §4.3).

**Why Settings has 15.** A one-off diagnostic (deleted) logged every state update during Settings' initial render. It found the extra commit:

- The source is React Native's `KeyboardAvoidingView`. On iOS its `componentDidMount` calls `_setBottom(0)`, a `setState` during the mount commit, which the Profiler reports as a `nested-update` commit.
- Notes also contains a `KeyboardAvoidingView`, but only inside its add-note modal, which isn't mounted while the modal is closed.

The commit happens once, at mount, and has nothing to do with the clock.

**Where the counts live.** `.reassure/` is git-ignored, so the record is this doc. CI's existing pull-request job measures the base branch and the PR branch itself, and needs no change.

**What the counts mean today.** All six scenarios show 14 because every tick changes `AppProvider`'s context value, so every `useApp()` consumer re-renders whatever it reads. There is one difference in what each kind of scenario measures:

- The Phase 0 scenario puts `AppProvider` *inside* the Profiler.
- The new ones put it outside.

Today the two give the same numbers. After B4 they diverge in the intended direction, because the new ones count only the measured subtree.

### 3.3 A3: the v1.3.1 storage fixtures

**What "v1.3.1" is.** `release/ios-1.3.0` at `c527044` (`app.json` 1.3.1, build 6), which is what the App Store ships. None of the code that reads or writes these keys has changed since: `git diff release/ios-1.3.0 HEAD` is empty for all of these files:

- `src/types`, `src/constants/defaults.ts`, `src/utils/storage.ts`, `src/ads/AdPolicy.ts`
- `useStats`, `useSettings`, `useLoveNotes`, `useReminder`, `useGiftMode`, `useSessionClock`

So the shapes are read from today's code, cross-checked against the release branch.

**Every key a v1.3.1 install can hold:**

| Key | Written in 1.3.1 by | Type it is checked against | Notes |
|-----|---------------------|----------------------------|-------|
| `timer_state` | `useTimer` (on complete, skip, reset) | `PomodoroState` (`useTimer.ts`) | Three fields. Installs that haven't finished a session since 1.2 may still hold the legacy `TimerState`. |
| `settings` | `useSettings` | `Settings` | |
| `stats` | — (1.0.x) | `StatsMap` | The v1 map. `useStats` copies it into `stats_v2` once and **never deletes it**. |
| `stats_v2` | `useStats` | `StatsState` | |
| `gift_mode` | `useGiftMode` | `GiftMode` | |
| `love_notes` | `useLoveNotes` (on edit only) | `LoveNotes['notes']` | Stored as a **bare `string[]`**, not the `{ notes }` object `src/types` declares. |
| `update_meta` | — (1.0.2–1.3.0) | local `LegacyUpdateMeta` | **Orphaned.** The soft-update prompt wrote it from `d17141c`. 1.3.1's prompt neither reads nor writes it. |
| `reminder_v1` | `useReminder` | `ReminderSettings` | |
| `app_mode` | `AppProvider` | `AppMode` | |
| `fly_session` | — (1.3.0) | local `LegacyFlySession` | **Orphaned, not "still read"** as the plan's A3 row said. 1.3.0's paused-flight snapshot (`b82dbed`), cleared with `null`. Today only a comment mentions it. |
| `session_clock` | `useSessionClock` | `SessionClockState` | The most-written key. |
| `fly_prefs` | `FlyModeScreen` | local `FlyPrefs` (`CameraMode` from `src/types`) | Written with an inline type. |
| `ad_policy_v1` | `AdPolicy` | `AdState` (`AdPolicy.ts`) | Raw `AsyncStorage`, not `save()`; same JSON. |

**The fixtures** (`src/__fixtures__/storage/v131.ts`):

| Export | What it is |
|--------|-----------|
| `V131_FULL` (`V131Storage`) | An iOS install that started on 1.0.x and is now on 1.3.1, with all 13 keys:<br>• a paused Pomodoro **and** a paused flight in the two clock slots<br>• edited notes, including Turkish İ/ı and emoji, to catch encoding loss in B2<br>• non-default settings, a reminder<br>• stats from both eras<br>• the two orphaned keys |
| `FRESH_INSTALL_ENTRIES` | No keys. |
| `NOTES_NEVER_EDITED_ENTRIES` | `V131_FULL` without `love_notes`. |
| `V131_DEFAULT_LOVE_NOTES` | The 20 notes v1.3.1 shows when `love_notes` is absent. Extracted from `release/ios-1.3.0:src/constants/defaults.ts`, not retyped. Frozen because D2 replaces `DEFAULT_LOVE_NOTES`, and B2 must write *these*. |
| `CORRUPT_SESSION_CLOCK_ENTRIES` | `V131_FULL` with `session_clock` torn mid-write (`TORN_SESSION_CLOCK`). |
| `STATS_V1_USER` (`V100Storage`) | A 1.0.0 install never opened since: legacy `TimerState`, `Settings` without `themeMode`, `animationsEnabled` and `flyModeSound`, a v1 stats map, no `stats_v2`, and no `love_notes`. |
| `toRawEntries(values)` and the `*_ENTRIES` arrays | Ready for `AsyncStorage.multiSet`. |

**Why the stats v1 user is a 1.0.0 install:**

- **The 1.3.1 shape doesn't exist on disk.** A v1.3.1 install without `stats_v2` never stays that way: `useStats` writes `stats_v2` on its first launch.
- **Android has no installs.** It never reached production on Play (corrected in `5da66f4`).
- **So the real population is lapsed early iOS installs.** `stats_v2` first shipped in the 1.2.x line (`d52f707`, February 2026). An iPhone last opened on 1.0.0–1.0.3 still holds the v1 map, whatever binary iOS has since auto-installed. 1.0.0 is the oldest of those shapes and the one missing the most fields.
- **It also exercises B2's notes rule.** The install has no `love_notes`, and its only evidence of being "existing" is pre-1.2 keys. B2's rule must still treat it as existing and write the v1.3.1 default notes.

**`toRawEntries(values: object): RawEntries`**

- **Input:** an object of key → value.
- **Output:** `[key, JSON.stringify(value)]` pairs, which is exactly the text `save()` writes.
- **Side effects:** none.
- **Relies on:** every value being JSON-safe. The test enforces this with `toStrictEqual` after a round trip, which catches an `undefined` field that JSON would drop silently.

**Typing.**

- The fixtures are **TypeScript object literals annotated with their storage interface**, not `.json` files. A JSON import widens `"dark"` to `string`, so it couldn't be checked against unions like `ThemeMode` without casts, and casts would defeat the drift check.
- Three keys have no type in the app: `update_meta` and `fly_session`, whose code no longer exists, and `fly_prefs`, which is written with an inline type. Their types are declared in the fixture file and say so. For those three, "typed against `src/types`" covers only `CameraMode`.
- `PomodoroState` and `AdState` were private, so each gained an `export`.

**Type-drift mutation check.** Each edit was made, `tsc` was run, and the file was restored:

| Drift | `tsc` result |
|-------|--------------|
| `Settings` gains a required field | `v131.ts(142,5)` and `(252,5)`: TS2741, property missing (in both the v1.3.1 and the 1.0.0 fixture) |
| `ThemeMode` loses `'dark'` | `v131.ts(149,9)`: TS2322, `"dark"` not assignable to `ThemeMode` |
| `AdState.lastShownAt` renamed | `v131.ts(219,45)`: TS2561, `lastShownAt` does not exist in `AdState` |

**The fixture test** (7 tests) checks each fixture against the v1.3.1 readers still in the app:

- **Keys.** The full install has exactly the 13 keys, and every key the app reads today (`STORAGE_KEYS` plus `ad_policy_v1`) is among them. Keys added after v1.3.1 go in the test's `NEW_SINCE_V131` list, so B2's migration flag won't need the fixture to change.
- **JSON safety.** Every value survives a JSON round trip unchanged.
- **Round trip.** `load()` reads every key of the full install back unchanged.
- **Fresh install.** It leaves storage empty.
- **Never-edited notes.** 12 keys and no `love_notes`, so the reader returns the default it is given.
- **Corrupt `session_clock`.** The raw text is not JSON. `load()` falls back to the idle default and logs one error, and every other key still reads.
- **Stats v1 user.** It has no `stats_v2`. Today's `AppProvider` migrates the v1 map with the same totals (4 sessions, 100 minutes) and writes `stats_v2` with the same days.

## 4. Mathematical / Statistical Details

### 4.1 The guard's expected texts

`formatTime(ms)` shows $\lfloor r/1000 \rfloor$ seconds as MM:SS, where $r$ is the remaining milliseconds (plan §4.2). A 25-minute session starts at $r = 1\,500\,000$, so the text is `25:00`.

After $t$ ms of fake time, $r = 1\,500\,000 - t$. That gives `24:59` at $t = 1000$ and `24:00` at $t = 60\,000$.

The 1 Hz `setInterval` fires at exactly those instants under fake timers, so the expected texts are exact, with no ±1 s tolerance.

### 4.2 Why Istanbul → Lublin is a 25-minute flight

`flightDurationToSeconds(d)` for a great-circle distance $d$ km below 1500 km (short haul, 45 minutes of overhead):

$$T(d) = \operatorname{round}\!\left(\frac{\frac{d}{900}\cdot 60 + 45}{5}\cdot 60\right) = \operatorname{round}(0.8\,d + 540)\ \text{seconds},$$

where 900 km/h is the cruise speed and 5 is the scale factor. The [300, 10 800] s clamp doesn't bind here.

$T(d) = 1500$ exactly when $0.8\,d + 540 \in [1499.5,\ 1500.5)$, that is, $d \in [1199.375,\ 1200.625)$ km.

In `airports.json`, IST is at 41.2749°N, 28.7321°E and LUZ at 51.2402°N, 22.7135°E. The haversine distance between them (Earth radius 6371 km) is 1199.818 km. So $0.8 \times 1199.818 + 540 = 1499.854$, which rounds to 1500 s. The pair sits 0.443 km (0.35 s) above the lower edge of the window.

Among tier-1 airports, 110 ordered pairs give exactly 1500 s. IST → LUZ was chosen because Istanbul is home.

### 4.3 Render counts

For the 10 s scenario, a component that reads the whole context renders in

$$C = m + h + s + n + p = 1 + 1 + 1 + 10 + 1 = 14$$

commits: mount, hydrate, start, $n = 10$ ticks, and stop. Settings adds one mount-phase commit ($k = 1$), giving 15.

**The leaf target needs correcting (plan §4.3).** After B4, a leaf that subscribes only to the clock renders once at mount and once per *change of its displayed value*. The plan said "1 + n, with n = 10", but the stand-in leaf's value also changes at start and at stop:

- start: `00:00` → `25:00`
- ten ticks: down to `24:50`
- stop: back to `00:00`

That is 12 changes, so the leaf's B4 floor in this scenario is **13**. Only the hydrate commit disappears. The real `<TimerText>` can be one lower if it shows the configured duration while idle, because then start doesn't change its text.

So B4's win shows in the settings-only, Stats, Settings and Notes scenarios, not in the leaf or the Timer screen. The Timer screen contains the leaf, so it still commits every second; its rule is "doesn't go up".

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Guards drive the screens only through the UI | Seed `app_mode` and `session_clock` in AsyncStorage | A guard tied to AsyncStorage would have to be rewritten in B2 and B3, the changes it must outlive. |
| Pick airports through the real picker, searching by city | Search by IATA; mock `AirportPicker` | The list renders 20 rows at first, tier-sorted. A city search puts the airport in that first batch, and keeps the picker real. Mocking the picker was the fallback, but wasn't needed. |
| Deny notification permission in the guard file | Grant it and stub scheduling; mock `useNotifications` | Denying settles the start race on the first microtask and keeps the real hook. Granting adds a scheduling path the guard doesn't care about. |
| Maps, audio and Gesture Handler mocks in `jest.setup.ts` | Mock them per test file | All three are native modules touched at import by any `TimerScreen` render, which is the setup file's stated rule. The notifications stub is a behaviour choice for one test, so it stays in that file. |
| Reassure `wrapper` for the new scenarios; Phase 0's scenario left as is | Put `AppProvider` inside the Profiler like Phase 0 | The wrapper counts only the measured subtree, which is what "renders of a screen" means. Reassure compares by test name, so changing the old scenario would break its history. |
| Clear storage before every run | Let runs share storage | Every run then hydrates from the same state, so the three counts can only differ for a real reason. |
| TypeScript fixtures plus generated JSON text | `.json` files | A JSON import widens string unions, so `tsc` couldn't check them without casts. The entries *are* the JSON, generated, never hand-edited. |
| Export `PomodoroState` and `AdState` | Mirror the types in the fixture | A mirror can't drift-check anything. The exports are type-only. |
| A 1.0.0 install as the stats v1 user | A 1.3.1-shaped install minus `stats_v2`; an Android 1.0.1 install | The first doesn't exist on disk, and Android has no installs. Lapsed early iOS installs are the real population. |
| Corrupt `session_clock` | Corrupt `settings` or `stats_v2` | It is written far more often than any other key, so a torn write is most likely there. |
| A frozen literal copy of the default notes | Import `DEFAULT_LOVE_NOTES` | D2 changes that constant, and B2 must write the v1.3.1 set. The copy was extracted from the release branch, not retyped. |
| A `NEW_SINCE_V131` list in the fixture test | Assert the fixture equals `STORAGE_KEYS` | Exact equality would fail as soon as B2 adds its flag. The list makes "a key v1.3.1 never had" an explicit, reviewed entry. |

## 6. Verification

Nothing in A1–A3 needs a device.

```bash
npx jest --ci
npm run typecheck
npm run lint
npx reassure --baseline
```

- [x] `npx jest --ci`: **41 passed, 9 suites** (was 32 in 7). New: 2 guards and 7 fixture tests.
- [x] `npm run typecheck`: clean.
- [x] `npm run lint`: exit 0, **0 errors**, 146 warnings. 3 of the warnings are new, all in test code:
  - two `require` calls inside the maps mock factory (jest factories can't use imports)
  - the module-level session handle in the perf test, the same pattern the two existing tests use
- [x] `npx reassure --baseline` ×3: the counts in §3.2, identical in every run. Read them from `.reassure/baseline.perf` (`counts` per line).
- [x] A1 mutation check (§3.1). To repeat it:
  1. Comment out `setDisplayTick(t => t + 1);` in `useSessionClock.ts`.
  2. Run `npx jest src/screens/__tests__/timerScreenTicks.test.tsx src/context/__tests__/timerTextTicks.test.tsx`. Expect 3 failed.
  3. Run `git checkout -- src/hooks/useSessionClock.ts`.
- [x] A3 type-drift check (§3.3). Make any of the three edits, run `npx tsc --noEmit`, and expect an error in `v131.ts`. Then restore the file.

## 7. Findings for later sessions

1. **`useStats` drops `lastAppliedSessionId` on every launch.**
   - What happens: the v2 load branch rebuilds the state as `{ days, goalMinutes, streak }` and saves it, so the idempotency key is lost after each cold start.
   - Risk: a completion re-fired across a restart could count twice. That needs the stats write to land and the clock clear not to, which is a narrow window.
   - B3's stats store should keep the field.
2. **Two types in `src/types` no longer match anything in the code.**
   - `LoveNotes` (`{ notes }`) doesn't match the stored bare array.
   - `TimerState` is legacy only.
   - The fixtures still use both, for the stored shapes, so removing either is a B3 decision that updates the fixture types to frozen local copies.
3. **Leftover keys.** `stats` (v1), `update_meta` and `fly_session` are never deleted. B2 copies them as-is. Whether to drop them later is a choice for after the rollback window (plan §10).
4. **`AirportPicker` uses React Native's deprecated `SafeAreaView`.** Tests print the warning, and a future React Native release removes the component.
5. **The guard file's `expo-notifications` mock spreads `requireActual`.** That prints the Expo Go push-token warning in test output. It is harmless noise.

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): §3 Stage A, §4.3, B2, B4
- [Phase 0](2026-10-29-phase0-foundation.md): §3.2, the existing tests and the mutation-check practice
- [Rehaul plan](2026-10-29-couples-rehaul-plan.md): §4.5
