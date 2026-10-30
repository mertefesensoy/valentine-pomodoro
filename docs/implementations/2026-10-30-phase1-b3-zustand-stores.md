---
id: IMPL-2026-10-30-phase1-b3-zustand-stores
title: "Phase 1 B3: Zustand stores, hydrated synchronously from MMKV"
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-29-phase1-b2-mmkv-migration, IMPL-2026-10-29-phase1-stage-a, ADR-0029, ADR-0030, SRS]
---

# 2026-10-30 — Phase 1 B3: Zustand stores, hydrated synchronously from MMKV

**Status:** Done, in four commits (§2), with two more for the docs. **Pushed** through `1e2316b` on 2026-10-30 (CI run 40982469277 green). **On TestFlight as build 44** (`v1.4.0-tf.44`, EAS `7fcac2fb-000e-4b2d-ad09-b2203c1042a4`), built and submitted with your go-ahead on 2026-10-30. **The device check passed** on 2026-10-30, as reported by you (§6.3).
**Branch:** `rehaul/v2`
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B3; [ADR-0029](../architecture/adr/0029-zustand-and-tanstack-query.md); follows [B2](2026-10-29-phase1-b2-mmkv-migration.md)

---

## 0. Read this first: B2 made cold-start completions get lost (DEF-004, fixed here)

**What happens.** `NavigationContainer` (React Navigation 7.5.1, `NavigationContainer.tsx:121–135`) renders nothing until `Linking.getInitialURL()` resolves. That is a native call, cut off after at most 150 ms (`useLinking.native.tsx:27–35`). So `TimerScreen`, which subscribes to session completions through `useTimer`, mounts only **after** an async native round trip.

**Why it got worse.** The clock completes a session that ended while the app was killed as soon as its own state has loaded.
- On v1.3.1 that load was an AsyncStorage call, also native, so the two raced.
- B2's MMKV load resolves in microtasks, so it **always wins**. The completion then fired into an empty handler set.

**The effect on build 43 (`v1.4.0-tf.43`).** A Pomodoro that ends while the app is killed is cleared on the next launch with:
- no stats credit
- no phase advance
- no love note

Fly sessions were affected the same way, which is what DEF-004 originally suspected.

**Evidence.**
- The test `src/stores/__tests__/coldStartCompletion.test.tsx` mounts the subscriber 150 ms after launch. Against the B2 code (`AppProvider`) it failed: `Expected number of calls: 1, Received number of calls: 0`.
- It still failed after B3's first three commits (as `it.failing`).
- It passes after the fourth (§3.7).

B2's device check (B2 doc §6.2, item 4) passed "the session resumes, or completes once". A relaunch **before** the session ended exercises only the resume path, so the check didn't catch this.

## 1. Problem / Motivation

Before B3, one React context (`AppProvider`) hosted five hooks. Each loaded from storage **asynchronously** in a mount effect, so:

- **The first frame showed defaults.** A second commit then showed the stored values. Stats and Notes rendered "Loading…" in between, and the Pomodoro phase could flip.
- **Every second, every consumer re-rendered** (finding F1). The context value changed on each 1 Hz tick, so all six `useApp()` consumers re-rendered, hidden tabs included, even those that show no time.

ADR-0029 decides Zustand stores read through selectors. B2 put the data in MMKV, which can be read synchronously. B3 does the move. Its done criteria:
- the three timer guards and the Fly guard stay green
- every `useApp()` consumer reads a store through a selector
- no Reassure count goes up

B3 also folds in the defects the SRS assigns to it (SRS §3.4):

| Defect | Requirement | What was wrong |
|--------|-------------|----------------|
| DEF-002 (Stage A finding 1) | FR-STA-002 | `lastAppliedSessionId` was dropped at every load |
| DEF-001 | FR-STA-001, FR-STA-002 | Fly credited minutes without its start day or session id |
| DEF-003 | FR-STA-005 | The streak's "yesterday" was computed from now, not from the credited day |
| DEF-007, haptics half | FR-SET-001 | The tab bar's haptic ignored the Haptics setting |
| DEF-004 | FR-TMR-005 | Cold-start completions lost; see §0 |
| Stage A finding 2 | — | `LoveNotes` was typed `{ notes }`, but storage holds a bare `string[]` |

DEF-005 (a slow notification schedule drops its id) is not store work and stays open (§7).

## 2. What Changed

| Commit | Content |
|--------|---------|
| `71d836f` | **Stores + shim.** The five stores, `StoreGate`, `loadSync`/`saveSync`; `AppContext` as a shim over the stores. Existing tests unedited (the clock test gains a wrapper). DEF-002 and the `LoveNotes` type fixed. |
| `ca21ef0` | **Selectors; `AppContext` deleted.** The six consumers, `App.tsx` and `HapticTab` read narrow selectors (DEF-007). Tests move to `StoreGate` and the stores, assertions unchanged. |
| `7863e50` | **Stats crediting.** Fly credits its start day and session id (DEF-001); the streak continues from the day before the credited day (DEF-003). |
| `e04cc8c` | **Cold-start completions wait for a handler of their kind** (DEF-004). |
| this commit | This record, the SRS, the roadmap, the plan row, ADR-0029, `ARCHITECTURE.md`, the generated traceability. |

| File | Change |
|------|--------|
| `package.json`, `package-lock.json` | `zustand` `^5.0.16` (pure JS; React 19's `useSyncExternalStore`, no extra dependency). |
| `src/stores/settingsStore.ts` | **New.** Settings (`settings`) and the daily reminder (`reminder_v1`), with the reminder actions. |
| `src/stores/reminderScheduler.ts` | **New.** `useReminderScheduler`: `useReminder`'s reschedule-on-change effect, unchanged, mounted once by the gate. |
| `src/stores/notesStore.ts` | **New.** Love notes (`love_notes`). |
| `src/stores/statsStore.ts` | **New.** Stats, goal, streak (`stats_v2`, one-time read of v1 `stats`); `useStatsViews`, `useStreak`, `previousDayKey`. |
| `src/stores/sessionStore.ts` | **New.** The two-slot clock (`session_clock`), the Pomodoro state (`timer_state`), the `tick`; `useSessionClockEngine`. |
| `src/stores/uiStore.ts` | **New.** `activeMode` (`app_mode`, through `resolveAppMode`) and the gift screen (`gift_mode`). |
| `src/stores/hydrateStores.ts` | **New.** Hydrates all five stores synchronously. |
| `src/stores/StoreGate.tsx` | **New.** The root: hydrates, mounts the engine and the reminder scheduler, renders children. |
| `src/stores/isRecord.ts` | **New.** The type check every hydrate uses before trusting a stored object. |
| `src/utils/storage.ts` | `loadSync`, `saveSync`. |
| `src/utils/storageMigration.ts` | `isStorageMigrated()`. |
| `src/hooks/useSessionClock.ts` | Now a read-only facade over the session store: state, `displayMs`, actions. Subscribes to `tick`. The five unused SharedValues are gone (§5). |
| `src/hooks/useTimer.ts` | The Pomodoro state comes from the session store (no async load, no ref mirrored in an effect). Its completion handler registers for `'pomodoro'`. |
| `src/hooks/useSettings.ts`, `useStats.ts`, `useLoveNotes.ts`, `useReminder.ts`, `useGiftMode.ts`; `src/context/AppContext.tsx` | **Deleted.** |
| `src/screens/TimerScreen.tsx`, `FlyModeScreen.tsx`, `StatsScreen.tsx`, `SettingsScreen.tsx`, `LoveNotesScreen.tsx`; `src/theme/useTheme.ts`; `src/App.tsx` | Read stores through selectors. Fly credits with day and id, and registers for `'fly'`. |
| `src/components/HapticTab.tsx` | Respects the Haptics setting. |
| `src/types/index.ts` | `LoveNotes = string[]`; `PomodoroState` moves here; `TimerState` moves to the fixture. |
| `src/__fixtures__/storage/v131.ts` | `LegacyTimerState`, frozen; `love_notes: LoveNotes`. |
| Tests, new | `src/stores/__tests__/storeGate.test.tsx`, `statsCredit.test.tsx`, `coldStartCompletion.test.tsx`; `src/screens/__tests__/flyCredit.test.tsx`; `src/components/__tests__/HapticTab.test.tsx`. |
| Tests, ported | `timerTextTicks`, `timerScreenTicks`, `flyModeGuard`, `rerenders.perf-test`, `screens.perf-test`, `StatsScreen.hooks`, `v131`, `flyLazyLoad`, `useSessionClock`: `StoreGate` and the stores replace `AppProvider` and `useApp()`. No assertion changed. |

## 3. Implementation Approach

### 3.1 The stores

Five Zustand stores, one per concern. Each keeps the **same MMKV keys and JSON shapes as v1.3.1**, so B2's migration and the A3 fixtures stay valid.

| Store | State | Keys |
|-------|-------|------|
| `useSettingsStore` | `settings`, `reminder`, `isReady` | `settings`, `reminder_v1` |
| `useNotesStore` | `notes`, `isReady` | `love_notes` |
| `useStatsStore` | `days`, `goalMinutes`, `streak`, `lastAppliedSessionId`, `goalHitPulse`, `isReady` | `stats_v2` (reads `stats` once) |
| `useSessionStore` | `clock`, `pomodoro`, `tick` | `session_clock`, `timer_state` |
| `useUiStore` | `activeMode`, `hasSeenGiftMode`, `isReady` | `app_mode`, `gift_mode` |

**Contract shared by every store:**
- `hydrate()` reads its keys with `loadSync`, synchronously.
  - It replaces the persisted fields: stored values, or defaults where a key is missing or of the wrong type.
  - It resets the transient fields (`tick`, `goalHitPulse`) and sets `isReady`.
  - **It never throws.** It runs during `StoreGate`'s render, so a throw there would stop the app from starting. Before B3 the same throw happened inside an async load, where it was only an unhandled rejection.
- **Actions** compute the next value from `get()`, `set()` it, and persist it with `saveSync`. The only exception is the stats views (§3.4), which are hooks.
- **Actions never change identity,** so a component that selects one never re-renders because of it.

### 3.2 `loadSync` / `saveSync` (`storage.ts`)

- `loadSync<T>(key, default): T` has the same format and fallbacks as `load()`. Before the B2 migration flag exists, it **reads nothing** and returns the default. That keeps B2's invariant: no read of a half-copied MMKV.
- `saveSync<T>(key, value): void` writes synchronously once migrated.
  - **Before migration** it hands the write to `save()`, which waits for the copy. That keeps the other half of B2's invariant: no write can be overwritten by the copy.
  - **Queued writes keep their order.** Each awaits the same migration promise, and continuations run in the order they were queued.
  - **It never throws.** It logs, as the hooks did with `save()`'s rejection.

### 3.3 `StoreGate`: synchronous hydration

```
App ─► StoreGate ─┬─ first render: isStorageMigrated()?
                  │     yes ─► hydrateStores() (5 × synchronous MMKV reads) ─► render children
                  │     no  ─► render null; effect: await ensureMigrated() ─► hydrateStores() ─► setReady
                  ├─ useSessionClockEngine(ready)   1 Hz ticker, AppState listener, cold-start check
                  └─ useReminderScheduler(ready)    reschedules the daily reminder on change
```

- **Every launch after the first:** the flag is in MMKV, so the gate's first render hydrates and renders the tree. The first frame shows stored values, and no screen ever renders its loading branch.
- **The launch right after the update:** the gate renders nothing while the copy runs. The splash screen covers that time, because `SplashScreen.hideAsync()` runs in `Navigation`'s `onReady`, below the gate.
- **The gate subscribes to nothing that ticks.** The engine reads the store with `getState()`, and the reminder scheduler selects only the reminder's fields. So the gate never re-renders on the clock, and its children are never re-rendered by it: React skips a child element that keeps the same identity.
- **Invariant, also stated in the code:** `hydrateStores()` calls `set()` during the gate's render. That is safe only because no component subscribes yet, since every reader is below the gate.

### 3.4 Selectors in the consumers

| Consumer | Reads |
|----------|-------|
| `TimerScreen` | `settings`, `incrementFocus`, `goalHitPulse`, `clearGoalHitPulse`, `pickRandomNote`, `activeMode`, `setActiveMode`; the clock through `useSessionClock()` |
| `FlyModeScreen` | `settings`, `incrementFocus`, `pickRandomNote`; the clock through `useSessionClock()` |
| `StatsScreen` | `isReady`, `goalMinutes`; `useStatsViews()` (today, totals, last 7 days, streak) |
| `SettingsScreen` | `settings`, `updateSettings`, `reminder`, its `isReady` and actions; `goalMinutes`, `setGoalMinutes`; `useStreak()` |
| `LoveNotesScreen` | `notes`, `isReady` and the five note actions |
| `useTheme` | `settings.themeMode` |
| `App.tsx` | `hasSeenGiftMode`, `dismissGiftMode` |
| `HapticTab` | `settings.haptics` |

The derived stats views can't be selectors: a selector that builds a new object returns a new value on every call, which `useSyncExternalStore` treats as a change on every render. So `useStatsViews()` selects the stable `days` and `streak` references and derives with `useMemo`.

### 3.5 The tick, B3's form of the `setDisplayTick` chain

The engine increments `sessionStore.tick` once a second while the active slot runs. `useSessionClock()` subscribes to it, so its callers re-render with a fresh `Date.now()` and `displayMs = endAt − now` stays current (FR-TMR-003).

**Only time displays call it:** `TimerScreen`, `FlyModeScreen`, and the guards' probes. Every other component stopped re-rendering on ticks.

B4 replaces the tick with the clock store of plan §4.2, which emits per displayed second, and removes it.

**The mutation check, repeated on `ca21ef0`:** with the line `useSessionStore.setState((s) => ({ tick: s.tick + 1 }))` deleted, **all three timer guards fail** at `24:59`. The file was then restored, identical to HEAD. So the guards still bite through the new chain.

### 3.6 The fold-ins

- **DEF-002.** `hydrate` keeps `lastAppliedSessionId` when it is a string.
- **DEF-001.** Fly's completion handler credits `getDayKeyFromDate(slot.sessionStartedAt)` with `slot.sessionId`, as `useTimer` does.
- **DEF-003.** Two changes, both needed (§4.1):
  - `incrementFocus` continues the streak from `previousDayKey(dayKey)`, not from yesterday-from-now.
  - `hydrate` stores the streak as stored. It used to persist a "broken today" streak as `current: 0`. `useStreak()` still shows the broken value.
- **DEF-007.** `HapticTab` fires only when `settings.haptics` is on.
- **`LoveNotes`.** The type is `string[]`. The notes hydrate accepts only a non-empty array of strings, else the defaults. A stored `[]` gives the defaults, as before B3.

### 3.7 DEF-004: completions wait for a handler of their kind

`onComplete(handler, kind?)` now takes the kind the handler is for. `useTimer` passes `'pomodoro'` and `FlyModeScreen` passes `'fly'`. No kind means every kind, which the clock unit test uses.

A session whose end has passed is **completed only when a handler for its kind is registered:**
- **Cold start:** the engine completes it on mount only if such a handler exists.
- **Otherwise it stays pending:** still `isRunning`, `endAt` in the past, shown as 00:00.
- **Registration fires it.** When a matching handler registers, the pending session completes then, once. In the app this is `TimerScreen` mounting after the navigator resolves, or `FlyModeScreen` after its lazy load.
- **The ticker and the foreground event check the same condition.** While nothing can handle the session they neither complete it nor tick, so nothing spins.
- **Exactly once is unchanged.** It is still the `endAt` guard in `fireCompletion`; registration only adds a third caller of it.

## 4. Mathematical / Statistical Details

### 4.1 The streak rule (FR-STA-005, DEF-003)

**Notation:**
- $d$: the credited day, the day the session **started** (FR-STA-001).
- $p(d)$: the calendar day before $d$.
- $H(x)$: day $x$ is marked hit.
- $L$: the stored `lastHitDayKey`; $c, b$: the stored `current` and `best`.

When a credit first brings day $d$ to its goal:

$$c' = \begin{cases} c + 1 & \text{if } H(p(d)) \lor L = p(d) \\ 1 & \text{otherwise} \end{cases} \qquad b' = \max(b, c') \qquad L' = d$$

Before B3, $p$ was applied to *today* $t$, not to $d$. For a session from 23:50 on day $D$ to 00:15 on $D+1$: $d = D$ but $t = D + 1$, so the old code checked whether day $D$ itself was hit.

**Why the stored $c$ must stay raw.** The displayed streak is $c$ if $t - L \le 1$ day, else $0$ (`normalizeStreakForToday`, unchanged). Before B3, the load **stored** that displayed value. In the case above, $t - L = (D+1) - (D-1) = 2$, so the load zeroed $c$ at launch. A session credited to $D$ would then compute $c' = 0 + 1$ even with the fixed $p$. Keeping $c$ raw and normalizing only for display fixes both.

**$p(d)$ is computed on UTC midnights.** It takes $d$'s `Date.UTC(y, m−1, day)` minus 86,400,000 ms, then reads the UTC date. This is the same basis as `diffDays`, so a DST change can't skip or repeat a day. A test pins month ends, a leap day, a year end, and the days after both 2026 EU clock changes.

### 4.2 Render counts (Reassure)

Each scenario is the 10 s session of plan §4.3: mount, start, ten 1 s ticks, stop. Counts were identical across 3 runs at every stage. Each stage was measured on its own commit, checked out in a separate worktree, so edits made in the meantime couldn't leak into a run. The final commit `e04cc8c` gives exactly the `ca21ef0` counts, 3 runs out of 3.

| Scenario | Before B3 (A2/B2) | `71d836f` (shim) | `ca21ef0` (selectors) |
|----------|------------------:|-----------------:|----------------------:|
| settings-only consumer | 14 | 13 | **1** |
| Timer screen (Classic) | 14 | 14 | 14 |
| Stats screen | 14 | 13 | **1** |
| Settings screen | 15 | 14 | **2** |
| Notes screen | 14 | 13 | **1** |
| `<TimerText>`-sized leaf | 14 | 13 | **13** |

**Reading it:**
- **The shim column isolates synchronous hydration.** The hydrate commit is gone (−1 everywhere), while every consumer still re-renders per tick. That is the equivalence the shim was for.
- **The selector column isolates F1.** A component that shows no time renders at mount only; the Settings screen keeps its extra `KeyboardAvoidingView` mount commit. The leaf is at 13, the floor plan §4.3 set for B4: $1 + n$ with $n = 12$ displayed changes.
- **Timer stays at 14.** Its hydrate commit went, but starting a session now costs the screen **two** commits instead of one; the second takes about 0 ms. Instrumented on `ca21ef0`: no `useState` or `useReducer` setter fires during the start, only the four store callbacks for the session-store subscriptions. Its source isn't pinned down. Plan §4.3's rule for the Timer screen is "doesn't go up", and it doesn't. B4 restructures this screen, so it can look again.

NFR-PERF-003's settings-only target (≤ 2) is met here, ahead of B4. Its other half, the leaf rendering once per displayed second, is B4's clock store.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Five stores with hand-written `hydrate()` and `saveSync` | Zustand's `persist` middleware with an MMKV adapter | `persist` stores a `{ state, version }` envelope under one name per store. Keeping v1.3.1's keys and shapes would need a mapping adapter, `partialize` and a custom `merge` per store, and it brings its own hydration and versioning to audit. Explicit reads and writes are about the same amount of code, and each can be checked against the fixtures. |
| Hydrate in `StoreGate`'s first render (lazy `useState` initializer) | At module import; in an effect | At import, the launch right after the update hasn't migrated yet. An effect would leave one frame of defaults. The initializer runs before any child renders, and React Strict Mode's double call is harmless because hydrate is idempotent. |
| Gate renders `null` while migrating | Render with defaults and re-render when migrated | Defaults then real values is the flash B3 removes. The splash screen is still up during the migration (§3.3). |
| Keep the stores' `isReady` and the screens' loading branches | Delete them | Below the gate they are always true, so the branches never show. Keeping them leaves the screens unchanged in B3, and FR-STA-006's regression test can still drive the branch through the store. D2 restyles those screens anyway. |
| Keep the tick in the store; time displays subscribe | Remove it now | Plan B4 removes the chain "only then", behind its own gate. B3 only stops the components that don't show time from following it. |
| `useSessionClock()` stays, as a facade | Every screen selects `clock` and `tick` itself | The guard probes and both screens read the clock the same way, and B4 has one place to change. |
| Drop the five clock SharedValues | Recreate them with `makeMutable` in the store | Nothing reads them. Reanimated's Jest mock makes `makeMutable` the identity, so `.value` writes would throw in tests without a new global mock. B4 adds the values the ring needs. |
| `TimerScreen`'s mode ref starts at the hydrated mode | Start at `'default'` so a stored `'fly'` calls `switchTo('fly')` on mount | On a phone after B2, the navigator already mounted the screen after the mode had loaded, so no mount-time `switchTo` happened. B3 keeps that. The one inconsistent case is a kill between persisting `app_mode` and the clock commit of `switchTo`, a window of milliseconds. |
| Shim commit before the selector commit | One commit | The shim lets every existing test run unedited against the stores. That separates "the stores behave like the hooks" from "the consumers moved". |
| Defects fixed in separate commits (`it.failing` until then) | Fix in the store commit | Each fix is reviewable and revertible on its own. `it.failing` keeps each known defect visible, and red for its reason, in the history until its fix. |
| DEF-004: kind-aware pending completion | Fire on the first tick (≤ 1 s); move crediting out of the screens | The first tick is a timing guess, and FlyModeScreen's lazy load has no bound. Moving crediting into a store layer is the real fix, but it changes ownership of love notes, haptics and ads (Phase 3 territory). Waiting for a handler of the right kind is deterministic and keeps today's ownership. |
| `zustand` with a caret range | Exact pin | It is pure JS, like the other JS dependencies with carets; the lockfile pins 5.0.16. Native modules stay exact-pinned. |

## 6. Verification

### 6.1 Local, all done

```bash
npm run typecheck
npm run lint
npx jest --ci
npm run test:perf    # ×3
```

- [x] Typecheck clean at every commit.
- [x] Lint: **0 errors**. Warnings 151 → 136 (deleted hooks took their warnings with them).
- [x] Jest: ****105 passed, 19 suites** (86 before B3)**. All four guards (`timerTextTicks`, both tests in `timerScreenTicks`, `flyModeGuard`) green at every commit.
- [x] `71d836f` was verified on its own tree in a separate worktree: 94/94, typecheck, lint, Reassure ×3.
- [x] Red first: the DEF-001, DEF-002, DEF-003 and DEF-004 tests were run against the B2 code (`AppProvider`) before any change, and each failed for its own reason:
  - DEF-002: credited twice (2 sessions, 50 min).
  - DEF-003: streak 1, not 4.
  - DEF-001: Fly credited to `2026-10-31`, not `2026-10-30`.
  - DEF-004: handler called 0 times, not 1.
  The DEF-007 test fails against the old `HapticTab`: called 1 time, not 0.
- [x] Mutation check (§3.5).
- [x] Reassure (§4.2): no count went up.

### 6.2 Who reads the clock, by grep

```bash
grep -rn "useSessionClock()" src --include=*.tsx --include=*.ts
```

Expect only `TimerScreen`, `FlyModeScreen` and test probes. A new caller re-renders every second while a session runs.

### 6.3 Device (iPhone, TestFlight build 44): passed

B3 has no native change, so it could have waited and gone into one build with B4. You chose to build it alone, to get the DEF-004 fix onto the phone sooner, since build 43 has the bug.

**The build (2026-10-30, your go-ahead):**

| | |
|--|--|
| Command | `eas build --platform ios --profile production --non-interactive --auto-submit` |
| EAS build | `7fcac2fb-000e-4b2d-ad09-b2203c1042a4`, **v1.4.0, build 44**, FINISHED |
| Source | EAS recorded `1e2316b`, the last B3 commit; CI run 40982469277 was green on it before the build |
| Submission | `977f92f0-3db4-4433-be1a-994713cf191e`, uploaded to App Store Connect, then Apple's processing |
| Tag | `v1.4.0-tf.44` (annotated, at `1e2316b`) |

**Result: all six checks below passed on a physical iPhone (2026-10-30, reported by you).** So the stores hydrate before the first frame on a device, and DEF-004 is fixed there too: a Pomodoro and a flight that ended while the app was killed were each credited once on relaunch. You didn't say whether build 44 went over build 43 or over App Store 1.3.1; either one exercises check 6.

**Checks.** Install build 44 over build 43, or over App Store 1.3.1:

1. **Cold start shows stored values at once.** Change theme and goal, then kill and relaunch. Stats and Notes never show "Loading…", and the theme doesn't flash.
2. **DEF-004.** Start a 1-minute focus session (set Focus to 1), kill the app, wait 2 minutes, relaunch.
   - Stats shows the session credited once.
   - The phase moved to the break.
   - The love note shows, if enabled.
3. **The same for Fly.** A short flight, killed in the air, relaunched after landing time: credited once.
4. **The timer ticks** on Classic and Fly, with the tab bar on another tab and back.
5. **Haptics off:** the tab bar gives no haptic.
6. **Update over build 43 or App Store 1.3.1:** values survive (B2's checks, repeated).

## 7. Findings and open items

1. **DEF-005 stays open:** a notification schedule that takes over 1 s drops its id. It is notification scheduling, not store state. Owner of the slot: TBD (B4 rewrites the start path; D1 rebuilds Classic).
2. **Timer's double commit on start** (§4.2): its source isn't identified. Not a regression in the count. B4 should look again.
3. **`src/context/` now holds only tests.** The guard files keep their paths, which the SRS and the test strategy cite.
4. **`fly_prefs`** (Fly's camera mode) still loads asynchronously inside `FlyModeScreen`. It is not a `useApp()` value and is outside B3's list. A later step can move it to the UI store.

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B3, B4, §4.3
- [B2](2026-10-29-phase1-b2-mmkv-migration.md): the migration this builds on, §3.3's invariant
- [Phase 1 Stage A](2026-10-29-phase1-stage-a.md): the guards, the Reassure baseline, findings 1–2
- [ADR-0029](../architecture/adr/0029-zustand-and-tanstack-query.md), [ADR-0030](../architecture/adr/0030-mmkv-storage.md), [ADR-0015](../architecture/adr/0015-idempotent-completion.md), [ADR-0016](../architecture/adr/0016-unified-session-clock.md)
- [SRS §3.4](../srs/SRS.md#34-known-deviations-as-built-found-2026-10-30): DEF-001–DEF-007

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- [Zustand for app state, TanStack Query for server state](../architecture/adr/0029-zustand-and-tanstack-query.md)
- ["Phase 1 B2: MMKV and the one-time AsyncStorage migration"](2026-10-29-phase1-b2-mmkv-migration.md)
- [2026-10-29 — Phase 1 (v1.4): design system and local re-architecture, plan](2026-10-29-phase1-plan.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
