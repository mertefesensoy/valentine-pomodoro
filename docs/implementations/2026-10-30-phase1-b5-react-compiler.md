---
id: IMPL-2026-10-30-phase1-b5-react-compiler
title: "Phase 1 B5: the React Compiler on, its lint rules back to error"
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-b4-rerender-refactor, ADR-0041, ADR-0035, SRS]
---

# 2026-10-30 — Phase 1 B5: the React Compiler on, its lint rules back to error

**Status:** Done, in five code commits and two docs commits (§2). **Pushed** `178b4ba..758881b` on 2026-10-30 with your OK (CI run 41014132814 green); the push also carried B4's `f5f3a5c` and the design session's `5292199`, `17639cd` and `10adac0`. **On TestFlight as build 45** (`v1.4.0-tf.45`, EAS `0eb8ca72-141f-457b-bde1-890b1d07b4bc`), built and submitted with your go-ahead on 2026-10-30; the same build carries B4's check. **The device check passed** on 2026-10-30, as reported by you (§6.4).
**Branch:** `rehaul/v2`
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B5; [rehaul plan §4.5, item 4](2026-10-29-couples-rehaul-plan.md#45-re-render-strategy-f1-with-the-documented-trap-guarded); follows [B4](2026-10-30-phase1-b4-rerender-refactor.md). Decision: [ADR-0041](../architecture/adr/0041-react-compiler-on.md), which supersedes [ADR-0035](../architecture/adr/0035-react-compiler-lint-warnings.md).

---

## 0. Read this first

- **The gate is green.**
  - Lint has **0 errors** with the five rules at `error` (warnings 134 → 38).
  - Reassure is **neutral** with the compiler on: every render count equals B4's (§4.3).
  - Jest passes 134/134 with the compiler on, and with it off.
  - The mutation check still holds: without the clock store's per-second notification, the three timer guards fail at 24:59.
- **Jest would not have tested compiled code.** `babel-preset-expo` turns the compiler on only for a caller that says it supports it. Metro says so when app.json asks; jest-expo never does. `jest.babelTransformer.js` closes that gap, and a test pins it (§3.1).
- **94 findings, not the plan's 105.** B3 and B4 had already rewritten the rest. 92 are fixed. Two `set-state-in-effect` findings in FlyModeScreen keep a commented suppression; Phase 4b replaces that screen (§3.4).
- **Classic's overlay queue is now derived from state instead of synchronised by effects** (§3.3). Three tests, written against the old screen first, pin the order: celebration, then love note, then interstitial.
- **The compiler compiles 38 components and hooks and skips 7**, each for a recorded reason (§3.5). One of them had been all of FlyModeScreen, because of a single unused lint suppression; that is gone, and Fly compiles. No worklet was lost (24 with the compiler, 24 without).

## 1. Problem / Motivation

The rehaul plan's re-render strategy (§4.5, item 4) ends with the React Compiler: automatic memoisation, kept only if Reassure is neutral or better. Phase 1 task B5:
1. turn on `experiments.reactCompiler`;
2. fix the compiler-rule findings in the code B3 and B4 didn't already rewrite;
3. set the five `react-hooks/*` rules back to `error`.

Done means:
- lint has 0 errors with the rules at `error`;
- Reassure is neutral or better against B4's counts (settings-only 1, Stats 1, Settings 2, Notes 1, `<TimerText>` leaf 12, Timer 13). If it is worse, the compiler goes off again and the rules stay at `error`;
- every guard and the mutation check still pass;
- Jest runs the compiled code, so the guards test what ships.

The rules had been at `warn` since the SDK 56 step ([ADR-0035](../architecture/adr/0035-react-compiler-lint-warnings.md)). There is a second reason to fix the findings rather than only switch the compiler on: **the compiler skips any component with a finding**, so an unfixed finding is a component that stays uncompiled.

Requirements: NFR-PERF-003 (no re-render of what doesn't show time); FR-TMR-006 (the guards); FR-ADS-001 rule 3 and FR-NTE-001 (the overlay order the Classic refactor keeps).

## 2. What Changed

| Commit | Content |
|--------|---------|
| `10811ce` | **Jest compiles app code exactly when app.json does** (§3.1): `jest.babelTransformer.js`, the `package.json` transform, `reactCompiler.test.tsx`, `scripts/react-compiler-report.js`. |
| `630c35a` | **Classic's overlay order pinned** (`timerScreenOverlays.test.tsx`), passing against the screen as it was. |
| `7a849b3` | **The findings fixed; the five rules at `error`** (§3.2–3.4). |
| `6395aee` | **The compiler on** (`app.json`). |
| `f11082d` | The report counts skipped functions, not the compiler's log events. |
| this commit | This record; ADR-0041 (ADR-0035 superseded); the plan's B5 row; roadmap; SRS; architecture; test strategy; generated backlinks and traceability. |

| File | Change |
|------|--------|
| `app.json` | `expo.experiments.reactCompiler: true`. |
| `jest.babelTransformer.js` | **New.** jest-expo's babel-jest setup, plus `supportsReactCompiler` in the Babel caller for app code while app.json turns the compiler on (§3.1). |
| `package.json` | Jest's `\.[jt]sx?$` transform points at the file above. |
| `scripts/react-compiler-report.js` | **New.** Per file: what the compiler compiled and skipped, and why; exits 1 if any file's worklet count changes (§3.5). |
| `eslint.config.js` | `refs`, `immutability`, `set-state-in-effect`, `purity`, `globals`: `warn` → `error`. |
| `src/components/GiftModeModal.tsx`, `GoalReachedPopup.tsx`, `LoveNoteCard.tsx` | Animated values from `useAnimatedValue`, not `useRef(new Animated.Value(…)).current`. |
| `src/components/PremiumCalmBackground.tsx` | The same, with lazy `useState` for the two arrays; the loop effect lists the (stable) values in its deps. |
| `src/hooks/useTimer.ts` | `remainingMs` from `slotRemainingMs(slot, idle, getClockNow())`, not `Date.now()` at render. |
| `src/hooks/useFlyModeAudio.ts` | The player's `loop`/`volume` setters move into a `playLooping(player)` helper. |
| `src/screens/TimerScreen.tsx` | `handleTimerComplete` is declared before `useTimer` uses it. The celebration is the stats store's pulse, love notes wait behind the render guard, and interstitials are counted requests (§3.3). |
| `src/screens/FlyModeScreen.tsx` | SharedValue writes use `.set()`. Interstitials are counted requests. Two commented suppressions. The unused `exhaustive-deps` suppression is removed (§3.4). |
| Tests, new | `src/components/__tests__/reactCompiler.test.tsx` (1), `src/screens/__tests__/timerScreenOverlays.test.tsx` (3). |
| Tests, changed | `timerTextTicks.test.tsx`: the probe captures its clock in an effect, not during render. `timerScreenCommits.test.tsx`: the screen's renders are counted by its `useTimer` calls, not the ring's renders (§3.6). |

## 3. Implementation Approach

### 3.1 Jest compiles what Metro compiles

**What was found.**
- `babel-preset-expo` 58 adds `babel-plugin-react-compiler` (1.0.0) only when `api.caller(c => c.supportsReactCompiler)` is true (`build/common.js`, `getReactCompiler`).
- Metro sets that from `exp.experiments.reactCompiler`. The Expo CLI's `exportEmbedAsync` does too, and it is what an EAS iOS build runs.
- jest-expo calls Babel with `caller: { name: 'metro', bundler: 'jest', platform: 'ios' }` (`src/resolveBabelOptions.js`). So with only the app.json switch, every test would have run uncompiled components.
- Before B5, the full suite passed with the compiler "on" (131/131). TimerScreen, the one screen that would have shown a difference, wasn't compiling at all: its finding made the compiler skip it.

**`jest.babelTransformer.js`.**
- **Contract.** Input: jest-expo's own options (`resolveBabelOptions(process.cwd())`). For every file Metro would bundle from the project, and only while `app.json` has `experiments.reactCompiler: true`, the transform uses the same options plus `caller.supportsReactCompiler: true`. Everything else goes through jest-expo's options unchanged. Output: a babel-jest transformer: `process`, `processAsync`, `getCacheKey`, `getCacheKeyAsync`, `canInstrument`.
- **Excluded:** files under `__tests__`, `__fixtures__` and `__mocks__`, and `jest.setup.ts`.
  - The app never contains them.
  - Compiling them breaks Jest. The compiler compiles functions inside `jest.mock()` factories, giving them a reference to its runtime import, and `babel-plugin-jest-hoist` rejects any factory that references an outer variable ("Invalid variable access: _c", from `jest.setup.ts`).
  - Their probes and render counters must keep measuring what they were written to measure.
- **node_modules** is excluded by the compiler's own default (`sources`: no path containing `node_modules`).
- **Cache.** Babel puts the caller into the options babel-jest hashes for its cache key (`loadPartialConfig(...).options.caller`, checked), so flipping the flag retransforms.
- It uses babel-jest from jest-expo's folder (30.5.2), as jest-expo does. The root's 29.7.0 is `@react-native/jest-preset`'s.

**The pin, `reactCompiler.test.tsx`.** It wraps `react/compiler-runtime`'s `c` (the memo-cache function every compiled component calls on each render) in a `jest.fn`. Then it renders `<TimerText>` and asserts that `c` was called exactly when app.json turns the compiler on. It checks behaviour, so it doesn't depend on how Babel names the import. It passes both ways: compiler off at `10811ce`, on at `6395aee`.

### 3.2 The findings

Recounted at `f5f3a5c` (B4's last commit) with `npx eslint . -f json`: **94**.

| Rule | Count | Where | Fix |
|------|------:|-------|-----|
| `refs` | 75 | GiftModeModal 30, PremiumCalmBackground 21, GoalReachedPopup 13, LoveNoteCard 11 | `useRef(new Animated.Value(x)).current` reads a ref during render. Single values now come from `useAnimatedValue(x)`: React Native's own hook, which creates the value once, as the ref did. The two arrays come from `const [a] = useState(() => …)`. |
| `immutability` | 11 | FlyModeScreen 8, useFlyModeAudio 2, TimerScreen 1 | Fly's SharedValue writes `sv.value = x` → `sv.set(x)`, the form Reanimated 4.7.1 documents for the compiler (`useSharedValue`, "React Compiler support"). The expo-audio player's setters move into a helper (below). TimerScreen used `handleTimerComplete` before declaring it, so it is now declared first. |
| `set-state-in-effect` | 6 | TimerScreen 3, FlyModeScreen 3 | Four rewritten so no effect sets state (§3.3, §3.4); two suppressed with a reason (§3.4). |
| `purity` | 1 | useTimer | `Date.now()` at render → the clock store's sample (below). |
| `globals` | 1 | `timerTextTicks.test.tsx` | The probe wrote a module variable during render; it now does so in an effect. The test calls `start()` only after the first render has settled, and test files aren't compiled. |

**Why 94, not 105.** The plan counted on 2026-10-29: refs 75, immutability 18, set-state-in-effect 7, purity 3, globals 2. B3 and B4 rewrote the code behind 11 of them: AppContext, the tick, Fly's effect mirror, and the render-time clock reads.

**`useTimer.remainingMs`.** Contract unchanged. It is the Pomodoro slot's remainder:
- no slot: the phase's full length;
- running: `endAt − now`;
- paused: the paused remainder, or the full length.

"Now" is now `getClockNow()`: the clock store's `sampledNow`, which it resamples on every session-clock change, before anything renders (B4 §3.2). That function exists for this ("read it instead of `Date.now()` wherever a value must stay stable between notifications"). TimerScreen reads the value only while not running (B4 §3.4), where it doesn't depend on now at all. While running, it moves from "`Date.now()` at the render after the change" to "the time of the change". The difference is the milliseconds in between.

**`playLooping(player)`** (useFlyModeAudio): sets `player.loop = true` and `player.volume = 1.0`, then calls `player.play()`. expo-audio 58 has no methods for loop and volume, only these setters, so writing them is a command to the native player, like `play()`. The lint treats a property write on a hook's return value as mutating React-owned data. The helper's comment says why it is safe here: the player is never read during render, so nothing memoised depends on those fields.

### 3.3 Classic's overlays, derived instead of synchronised

**Before** (three effects, three pieces of state and a ref):
1. On a new `goalHitPulse`: copy it into `goalPopup` state, unless that day was already celebrated (a ref). If a love note was showing, move it to `queuedLoveNote` and dismiss it.
2. If a love note appears while the popup shows: queue it and dismiss it.
3. If `isAdPending` and no overlay shows: clear the flag, then show the interstitial.

**After:**

```ts
const goalPopup = goalHitPulse;                      // the store's pulse is the popup's state
{!goalPopup && showLoveNoteCard && lastLoveNote && <LoveNoteCard … />}
useEffect(() => {                                    // the interstitial
  if (adRequests === adsServedRef.current) return;   // nothing unserved
  if (goalPopup || showLoveNoteCard) return;         // an overlay is up
  adsServedRef.current = adRequests;                 // served before showing
  AdManager.showIfReady(() => {});
}, [adRequests, goalPopup, showLoveNoteCard]);
```

Why each part is the same behaviour:
- **The celebration.** The stats store sets `goalHitPulse` only when a completion first reaches a day's goal: `hitTransition = !wasHit && nowHit`, and `goalHit` stays true for that day (`statsStore.ts`). So the "already celebrated" ref could never fire. The popup's `onClose` clears the pulse, as it did. Reading the pulse directly removes the copy, and the render it cost.
- **The love note.** The render guard `!goalPopup && …` already unmounted the card while the celebration showed. When the celebration closes, the card mounts again and starts its own 8 s timer and entrance animation. That is all the queue achieved.
- **The interstitial.** A count of requests replaces the pending flag (§4.1). The effect sets no state, and a re-run can't show a second ad for the same requests, which was the old comment's concern ("clear pending flag strictly before attempting show to avoid loops").

**Two differences, both edge cases:**
- **The note shown.** The queue showed the note as it was when queued; now the card shows `lastLoveNote` when the celebration closes. They differ only if another focus completes during the celebration's 1.4 s.
- **A reset during the celebration.** It now clears the waiting note too. Before, the queued copy survived it.

**Pinned first.** `timerScreenOverlays.test.tsx` drives the real screen through the UI: a 1-minute focus, with the ad policy mocked to allow every ad (§5). It was committed (`630c35a`) and passing against the old effects before they were replaced. It passes after, and is red against two mutants:

| Mutant | Result |
|--------|--------|
| The ad doesn't wait for the overlays (old code) | 3 of 3 fail |
| The ad doesn't wait for the overlays (new code) | 3 of 3 fail |
| No celebration (new code) | 2 of 3 fail (the third has no goal) |

### 3.4 Fly Mode

- **SharedValues.** All 15 writes use `.set()`: the effects, `handleStart`, `handleReset`, and the frame callback's progress, bearing and throttle accumulator. Reads stay `.value`, which the compiler accepts. The same holds in `useSlotClock`'s one worklet write, `now.value = Date.now()`, inside the compiled `useSlotProgress`.
- **Interstitials:** the same request count as Classic (§4.1). `handleReset` marks every request served (`adsServedRef.current = adRequests`), which is what `setIsAdPending(false)` did.
- **Two findings suppressed, each with a comment and a reason in the directive** (`-- …; Phase 4b`):
  - **The airport restore** (`setOrigin` once the airport table has loaded). It is a one-time initialisation from data that arrives asynchronously. Deriving the selection instead would rework the restore and reset paths.
  - **The followed heading** (`setMapHeading(bearingDeg)` while the camera follows the plane). Leaving follow mode keeps the last bearing, which a derived heading would lose.

  Both sit in a screen that Phase 4b replaces with the illustrated map ([ADR-0026](../architecture/adr/0026-illustrated-map-real-map-plus.md)). A `set-state-in-effect` suppression doesn't stop the compiler; only `exhaustive-deps` and `rules-of-hooks` suppressions do.
- **The suppression that hid Fly from the compiler.** The compiler skips any function containing a next-line or block suppression of `react-hooks/exhaustive-deps` (`DEFAULT_ESLINT_SUPPRESSIONS` in babel-plugin-react-compiler; an end-of-line `eslint-disable-line` doesn't match its pattern). FlyModeScreen's FLY_PREFS load effect had one, which the lint already reported as unused. Removing it lets the compiler compile the whole screen, with no skip and all 5 worklets intact (§3.5). Its replacement comment avoids the directive's literal text: the compiler's pattern matches any comment that contains it.

### 3.5 What the compiler compiles

Run `node scripts/react-compiler-report.js` (`--verbose` for the reasons). It transforms every file Metro bundles from `src/` with babel-preset-expo and Metro's iOS release caller, once with the compiler and once without. The compiler's own logger reports what it compiled and skipped.

At `6395aee`: **38 compiled**, among them every screen except Settings, TimerText, the four Animated components, FlyTimerPill, `useTimer`, `useSessionState`/`useSessionClock`, `useSlotProgress` and `useDisplayedSeconds`. **7 skipped:**

| Function | Why the compiler skips it | Effect |
|----------|---------------------------|--------|
| `CircularProgress` | A default parameter that calls a function (`strokeWidth = Math.round(size * 0.055)`): "cannot be safely reordered" | The compiled TimerScreen memoises its element, so it re-renders only when its props change. |
| `FlySheet` | 9 × "This value cannot be modified" (its gesture handlers' SharedValue writes); the lint doesn't report these | Rendered as written. Its 10 worklets are untouched. |
| `useSlotSharedValues` | `useSessionStore.getState()` uses a Zustand hook as a value | Its `useMemo` stays as B4 wrote it, so the identities B4 relied on are unchanged. |
| `useFlyModeAudio` | An `exhaustive-deps` next-line suppression on its unmount cleanup | A hook with no render output; nothing to memoise. |
| `SettingsScreen` | `try … finally` without `catch` (compiler limitation) | As before B5. |
| `useUpdateCheck` | A conditional inside `try` (compiler limitation) | A hook with no render output. |
| `useSessionClockEngine` | `engineInstances++` on a module variable (compiler limitation) | Mounted once by StoreGate; renders nothing. |

**Worklets.** The worklet count per file is the same with and without the compiler (24 = 24, 0 files differ); the script exits 1 otherwise. In the compiled components, every Reanimated hook receives an inline workletized factory: Fly's 5 (`FlyModeScreenTsx1Factory`…`5`), FlyTimerPill's 1, `useSlotProgress`'s 2. With Reanimated installed, the compiler also turns on its Reanimated type definitions (`enableCustomTypeDefinitionForReanimated`). A worklet broken by the compiler would fail only on a phone, because Reanimated's Jest mock runs worklets on the JS thread. This check is the substitute until the device check.

### 3.6 The brief's three hints, checked

| Hint | Checked how | Result |
|------|-------------|--------|
| Reanimated 4 recommends `get()`/`set()` under the compiler | Reanimated 4.7.1 docs (`useSharedValue`, "React Compiler support"); the lint and the report | Every flagged write uses `.set()`. B4's JS-side writes already did. Worklet reads stay `.value`; the compiler compiles `useSlotProgress` and FlyModeScreen with them. |
| Worklets and `useSyncExternalStore` selectors keep stable identities | The compiled output of `clockStore.ts`; the report's worklet counts | `subscribeClock` is module-level. The compiled `useDisplayedSeconds` memoises `getSnapshot` on `(kind, idleMs)`, where B4 made a new closure each render, so it is if anything more stable. The snapshot is still a number. Worklets as in §3.5. |
| Memoised values B4 relies on keep their render timing | `timerScreenCommits` (commits 1 → 2 → 12 → 13; screen renders 1 → 2 → 2 → 3); Reassure (§4.3) | Unchanged. `useSlotSharedValues` isn't compiled, so its `useMemo` is as written. TimerScreen's `useMemo`s (`ringSize`, `totalMs`) become compiler scopes with the same inputs. |

**`timerScreenCommits.test.tsx` changed its proxy.** It counted the screen's own renders by the ring's, since "the ring is a plain child of the screen". A compiled TimerScreen memoises the ring's element, so on a phone that stops being true. In Jest it stayed true only by accident: Reanimated's mock returns a new object from `useDerivedValue` on every render, a new prop each time. The test now counts calls to `useTimer`, once per screen render, through a pass-through wrapper. The numbers asserted are the same.

## 4. Mathematical / Statistical Details

### 4.1 The interstitial request count

Let $R$ be the requests (state: incremented each time the ad policy allows an ad after a completion) and $S$ the requests served (a ref). Let $O$ be "an overlay is showing": the celebration or a love note on Classic; a running or paused flight or the landing note on Fly.

- **Invariant:** $0 \le S \le R$. $S$ only ever becomes $R$.
- **The effect** runs when $R$ or $O$ changes. If $R > S$ and $\neg O$, it sets $S := R$ and asks for one ad.
- **Reset** (Fly): $S := R$.

The old pending flag $p$ is exactly $p \equiv (R > S)$:
- an allowed completion: $R := R + 1$ makes $R > S$, which is $p := 1$;
- showing: $S := R$, which is $p := 0$, done before `showIfReady` as before;
- reset: $S := R$, which is $p := 0$.

So the two show the same ads at the same moments. Several allowed completions while overlays show still give one ad. What changes is where the clearing happens: in a ref, inside the effect, instead of a state update that would cost another render.

### 4.2 Render counts: what each scenario should be

Each Reassure scenario (plan §4.3): mount, start a 25-minute Pomodoro, ten 1-second advances, stop. A scenario counts **commits** under a `Profiler`. A commit happens when a state change renders something. The compiler can shrink what renders inside a commit, but every state change that rendered something before still does: its owner still re-renders. So the counts should equal B4's:
- settings-only 1;
- Timer 13: mount 1, start 1, ten `<TimerText>` commits, stop 1;
- Stats 1, Settings 2, Notes 1;
- leaf 12.

Where the compiler can help is the **time** per commit. A compiled TimerScreen skips its unchanged children on start and stop. That is advisory in Reassure (§4.3); Jest's Reanimated mock understates it (§3.6).

### 4.3 Render counts, measured

Each column is one commit, checked out in a detached worktree (`C:/vp-b5-measure`, `node_modules` through a junction, as B3 and B4 did), so edits in the shared checkout couldn't leak into a run. Each Reassure invocation does 3 measured runs after 1 warm-up. The compiler commit was measured with 3 invocations (9 runs). **Every count was identical across all its runs.**

| Scenario | B4 `f5f3a5c` | fixes, compiler off `7a849b3` | **compiler on `6395aee`** (×3) |
|----------|---:|---:|---:|
| settings-only consumer | 1 | 1 | **1** |
| Timer screen (Classic) | 13 | 13 | **13** |
| Stats screen | 1 | 1 | **1** |
| Settings screen | 2 | 2 | **2** |
| Notes screen | 1 | 1 | **1** |
| `<TimerText>` leaf | 12 | 12 | **12** |

**Reading it:**
- **The B4 column reproduces the B4 record exactly** (B4 §4.4), so this environment is comparable.
- **Neutral, as §4.2 predicts.** No count went up, so the plan's condition for keeping the compiler holds. None went down either: the scenarios count commits, and the compiler doesn't remove commits.

**Timing (advisory, as in CI), the mean render time per scenario, in ms:**

| Scenario | `f5f3a5c` | `7a849b3` | `6395aee` runs 1 / 2 / 3 |
|----------|---:|---:|---:|
| Timer screen | 47.7 | 31.3 | 19.3 / 19.7 / 18.7 |
| Settings screen | 16.0 | 11.0 | 7.0 / 6.0 / 4.3 |
| Notes screen | 20.0 | 6.0 | 6.0 / 6.7 / 6.0 |
| Stats screen | 5.0 | 3.0 | 2.0 / 5.0 / 1.0 |

- The B4 column ran first in a fresh worktree; its warm-up took 264 ms. B4 recorded 28.0–31.7 ms for the Timer screen at `b838ebe`, in line with `7a849b3`'s 31.3.
- So the comparison that counts is `7a849b3` → `6395aee`, the compiler alone: **the Timer screen goes from about 31 ms to about 19 ms over the scenario**, in all three runs (each run 12–26 ms). Its start and stop renders now skip the children whose props didn't change.
- The other screens render once or twice, and their differences are within a few ms, at this resolution.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A custom Jest transformer that adds the caller flag for app code | Only the app.json switch; `babel-plugin-react-compiler` in `babel.config.js` under `env.test` | The first tests uncompiled code. The second duplicates the preset's options by hand, and compiles `jest.mock()` factories, which Jest's hoisting then rejects. The transformer reuses jest-expo's options and the preset's own compiler options, and reads the one switch the app reads. |
| Leave test files, fixtures, mocks and `jest.setup.ts` uncompiled | Compile everything outside node_modules, like the compiler's default | The app never contains them; it breaks `jest.mock()` factories; a compiled probe would measure the compiler and the app together. |
| Pin the compiler under Jest by spying on `react/compiler-runtime`'s `c` | Match `_compilerRuntime` in `String(TimerText)` | Behaviour, not Babel's naming. The runtime's types hide `c`, so the test reads it through `jest.requireMock`. |
| `useAnimatedValue` for Animated values | `useState(() => new Animated.Value(x))[0]`; `useMemo` | React Native's own hook for exactly this (0.71+). `useMemo` isn't a guarantee of one instance. `useState` is used only for the arrays, which `useAnimatedValue` can't make. |
| Derive Classic's overlays; count interstitial requests | Suppress the three findings; keep the effects but set state in a microtask; move the queue into a store | Deriving removes state the screen didn't need (§3.3), and the count is the flag without the extra render (§4.1). A microtask only hides the cascade from the lint. A store is more code for D1 to undo. The order was pinned by tests first. |
| Suppress Fly's two remaining `set-state-in-effect` findings, with reasons | Rework the airport restore and the followed heading | Both rewrites change behaviour on a screen that Phase 4b replaces, and nothing tests them; the suppressions don't stop the compiler. |
| Let FlyModeScreen compile (remove the unused suppression) | Opt it out explicitly with `'use no memo'` | It compiles with no skip and keeps all 5 worklets. Its skip was an accident, not a decision. The device check covers Fly anyway (§6.4). One line opts it out again if that check fails. |
| `getClockNow()` for `useTimer.remainingMs` | Drop the running branch; compute it in an effect | Same value, now a pure function of the stores. The clock store exports the function for exactly this. |
| `playLooping(player)` helper | `eslint-disable` the two lines; a ref to the player | The setters are the player's API, and the helper says so once. A suppression would set a precedent for the rules that matter. |
| `timerScreenCommits` counts `useTimer` calls | Keep counting the ring's renders | The ring's count matches the screen's only because of a Reanimated mock artefact (§3.6). |
| Mock `AdPolicy` and `AdManager` in the overlay test | Seed the policy's MMKV state and spy on the real manager | The test is about when the screen asks for an ad, not about the frequency caps. AdPolicy's module-level cache would couple the tests' order to its counter. The test strategy now lists this exception. |

## 6. Verification

### 6.1 Local, all done

```bash
npm run typecheck
npm run lint
npx jest --ci
node scripts/react-compiler-report.js
npm run test:perf   # in a detached worktree, per commit (§4.3)
```

- [x] Typecheck clean at every commit.
- [x] **Lint: 0 errors** with the five rules at `error`. Warnings 134 → 38: `import/first` 13, `no-unused-vars` 11, `no-require-imports` 6, `array-type` 3, `exhaustive-deps` 2, `import/no-duplicates` 2, `no-empty-object-type` 1. None is a compiler rule.
- [x] **Jest: 134 passed, 26 suites**, with the compiler on (`6395aee`) and with it off (`7a849b3`, and `6395aee` with the flag flipped). After B4 it was 130 and 24.
- [x] `reactCompiler.test.tsx` passes with the compiler off and with it on, asserting each.
- [x] Each code commit passes alone:
  - `10811ce`: 131/131 (25 suites; compiler off, so the new test asserts "off"), in the measurement worktree;
  - `630c35a`: 134/134 (26 suites; the overlay tests against the old screen), in the measurement worktree;
  - `7a849b3`: 134/134 (compiler off), in the measurement worktree;
  - `6395aee`: 134/134, in the shared checkout at the same content, before the commit.
- [x] **The real Metro pipeline compiles too.** `npx expo export --platform ios --dump-sourcemap --output-dir <scratch>` at `b19f248` succeeds. The bundle's source map lists `node_modules/react/compiler-runtime.js`, which only compiled components import. The iOS bytecode is **3,463,508 B**:
  - +32,876 B (+0.96 %) over B2's 3,430,632 B, which covers B3, B4 and B5 together;
  - still 10.2 % under the SDK 58 baseline (NFR-PERF-002).

  E3 re-measures with the pinned two-platform command before release.

### 6.2 The guards and the mutation check, with the compiler on

- [x] `timerTextTicks`, both `timerScreenTicks` tests and `flyModeGuard` pass.
- [x] **Mutation check:** with the clock store's `notify()` on a changed second deleted (`resampleAndComplete`), all three timer guards fail at 24:59 (`timerTextTicks.test.tsx:43`, `timerScreenTicks.test.tsx:89` and `:116`). The file was restored, byte-identical (sha256 checked).
- [x] `useSessionClock.test.ts`, including "fires completion exactly once when the foreground event and the ticker both see the end", passes. So do the three DEF-004 cold-start tests in `coldStartCompletion.test.tsx`. No assertion changed.
- [x] The overlay mutants of §3.3.

### 6.3 The compiler's coverage

```bash
node scripts/react-compiler-report.js --verbose
```

Expect "functions compiled: 38; functions skipped: 7; files whose worklet count changes: 0", and exit 0. A new skip or a worklet mismatch after a change is worth reading before the change ships.

### 6.4 Device (iPhone, TestFlight build 45): passed

The Jest mocks can't show three things:
- worklets the compiler touched, running on the UI thread;
- compiled components with real native views (react-native-maps, Modal, Animated);
- expo-audio.

One build covered this check and B4's; [B4 §6.3](2026-10-30-phase1-b4-rerender-refactor.md) has the full build record.

**The build (2026-10-30, your go-ahead):** EAS `0eb8ca72-141f-457b-bde1-890b1d07b4bc`, **v1.4.0, build 45**, from `6eaeb50`, whose app code is identical to `758881b`; submission `844c25a5-63d4-4f8e-bbd8-8946a01f9b95`; tag `v1.4.0-tf.45`.

**Result: passed on a physical iPhone (2026-10-30, reported by you: "45 works well approved").** You approved the build after receiving these five checks together with B4's six; you didn't report them one by one.

1. **No crash on the UI thread.** Use the ring, Fly's plane and sheet, the pill, and the tab switches. A worklet the compiler broke would crash with "Tried to synchronously call a non-worklet function on the UI thread".
2. **Classic after a focus:**
   - (a) one that reaches the day's goal shows the celebration, then the love note, then (when the ad policy allows) the interstitial;
   - (b) one below the goal shows the love note, then the interstitial;
   - (c) with love notes off, the celebration, then the interstitial.

   Use a 1-minute focus and a 1-minute goal. The interstitial needs 2 completed sessions since the last one, and 120 s.
3. **The Animated components animate as before:** the background (aurora, hearts, sparkles), the love-note card, the goal popup, and the gift-mode hearts. With Reduce Motion on, the background is still.
4. **Fly, compiled now:**
   - pick airports;
   - start: the plane moves and turns;
   - the camera modes: follow (the map heading follows the plane), route, free;
   - pause, resume, reset;
   - the landing note, then the interstitial;
   - the cabin sound loops at full volume and stops on pause.
5. **Settings, Stats and Notes** behave as before.

## 7. Findings and open items

1. **Jest didn't compile, and nothing said so** (§3.1). Fixed and pinned. Any project on Expo SDK 54+ with `experiments.reactCompiler` and jest-expo has the same gap.
2. **The compiler skips silently.** A finding, a compiler limitation, or a next-line `exhaustive-deps` suppression anywhere in a component skips all of it, with no build output. The report (§3.5) is how to see it. 7 functions are skipped now.
3. **The lint and the compiler disagree.** FlySheet's 9 errors and `useSlotSharedValues`' Zustand-hook use are compile-time skips that the lint doesn't report. Not fixed: neither was a lint finding, and FlySheet's gesture code goes with Phase 4b's map.
4. **Two suppressions remain** (Fly, §3.4). Owner: Phase 4b.
5. **The device check (§6.4) passed** on TestFlight build 45, 2026-10-30, the same build as B4's.
6. **Not changed:** the long-break button label (B4 finding 2, for D1), DEF-005.

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B5
- [B4](2026-10-30-phase1-b4-rerender-refactor.md): the counts this is measured against, and the clock store whose sample `useTimer` now reads
- [ADR-0041](../architecture/adr/0041-react-compiler-on.md), [ADR-0035](../architecture/adr/0035-react-compiler-lint-warnings.md)
- [Rehaul plan §4.5](2026-10-29-couples-rehaul-plan.md#45-re-render-strategy-f1-with-the-documented-trap-guarded)
- [Test strategy](../testing/TEST-STRATEGY.md): the guards, and the mocking exceptions
- [SRS](../srs/SRS.md): NFR-PERF-003, FR-TMR-006, FR-ADS-001, FR-NTE-001

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [React Compiler lint rules as warnings until Phase 1 B5](../architecture/adr/0035-react-compiler-lint-warnings.md)
- [The React Compiler is on, and Jest compiles app code the way Metro does](../architecture/adr/0041-react-compiler-on.md)
- [2026-10-29 — Phase 1 (v1.4): design system and local re-architecture, plan](2026-10-29-phase1-plan.md)
- ["Phase 1 B4: the re-render refactor (clock store, UI-thread ring, frozen tabs)"](2026-10-30-phase1-b4-rerender-refactor.md)
- ["Phase 1 B6: Expo Router with native tabs"](2026-10-30-phase1-b6-expo-router.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
