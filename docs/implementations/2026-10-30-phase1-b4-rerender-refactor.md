---
id: IMPL-2026-10-30-phase1-b4-rerender-refactor
title: "Phase 1 B4: the re-render refactor (clock store, UI-thread ring, frozen tabs)"
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-b3-zustand-stores, IMPL-2026-10-29-phase1-stage-a, ADR-0004, ADR-0009, ADR-0016, SRS]
---

# 2026-10-30 — Phase 1 B4: the re-render refactor

**Status:** Done locally, in five code commits (§2) and one docs commit. **Not pushed, and not on a device yet.** B4 adds no native code, but it changes how the ring is drawn (Reanimated animated props on an SVG circle) and freezes hidden tabs, so it needs the device check in §6.3 on a TestFlight build, with your go-ahead.
**Branch:** `rehaul/v2`
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B4 GATE-CHECKED, §4.2, §4.3; [rehaul plan §4.5](2026-10-29-couples-rehaul-plan.md); follows [B3](2026-10-30-phase1-b3-zustand-stores.md)

---

## 0. Read this first

- **The gate is green.** All four guards pass at every commit. The mutation check was repeated on the final chain: without the clock store's per-second notification, `timerTextTicks` and both `timerScreenTicks` guards fail at 24:59. The `fireCompletion` "exactly once" test and the three DEF-004 cold-start tests pass. Reassure counts are in §4.4: none went up, the settings-only scenario stays at 1, and the leaf renders once per displayed second.
- **While a session runs, the Timer screen no longer re-renders.** Each second, one `<TimerText>` commits; the ring moves on the UI thread. That is the target of rehaul plan §4.5 ("one `<TimerText>` at 1 Hz").
- **Plan §4.2's formula had a wrong special case,** corrected here (§4.1). As written it would have skipped 24:59 and failed the guards.
- **Timer's double commit on start (B3 finding 2) is explained and fixed** (§3.6). It came from `PremiumCalmBackground`, not from the stores.
- **One visible consequence of frozen tabs:** when a session completes while you are on another tab, the Timer tab's love note, goal popup and interstitial now appear when you come back to it, not while it is hidden (§3.5, device check 6).

## 1. Problem / Motivation

Finding F1 (rehaul plan §1.2): while a timer ran, every screen that read the clock re-rendered once a second. B3 narrowed that to the components that show time. But `TimerScreen` and `FlyModeScreen` are whole screens:
- each second they re-rendered entirely (the Classic screen: header, chip, ring, buttons, background, overlays) to change four characters of text;
- the ring moved only because its parent re-rendered;
- a hidden tab kept doing that work.

B3's chain: the engine's `setInterval(1000)` incremented `sessionStore.tick`, and `useSessionClock()` subscribed to it, so its callers re-rendered and recomputed `endAt − Date.now()` at render. Its phase was unrelated to `endAt`, so the shown second lagged the true one by up to 999 ms.

The task (plan B4) has four parts, in order:
1. a clock store on `useSyncExternalStore` that emits only when the displayed second changes, read only by a leaf `<TimerText>`;
2. the ring and mode animations driven by SharedValues derived from `endAt`, with no React render per frame;
3. only then, removal of the per-second chain;
4. `freezeOnBlur` for hidden tabs.

Done means: the A1 guards pass on both screens; Reassure's settings-only scenario stays ≤ 2 (1 since B3), the leaf renders once per displayed second, and no screen scenario goes up from B3; the `fireCompletion` "exactly once" test and the B3 cold-start tests still pass; Timer's double commit is explained or fixed.

Requirements: FR-TMR-006 (the visible timer updates every second), NFR-PERF-003 (no re-render of what doesn't show time), FR-TMR-005 (completion exactly once, including DEF-004's cold start), FR-TMR-003 (remaining time from `endAt`).

## 2. What Changed

| Commit | Content |
|--------|---------|
| `b7461f1` | **Clock store and `<TimerText>`** (part 1). The math, the store and its scheduler, the leaf; Classic, Fly's sheet and Fly's pill render it. The engine moves to the clock store; the 1 Hz tick still runs. |
| `43cf1a8` | **Ring and Fly SharedValues** (part 2). Slot SharedValues written from a store listener; the ring derives its progress on the UI thread; Fly's effect mirror goes. |
| `e9df252` | **The chain removed** (part 3). `tick`, the interval and the screens' per-second subscription are deleted; the scheduler detects completion. |
| `040ad32` | **Frozen tabs** (part 4). `freezeOnBlur`. |
| `b838ebe` | **The double commit.** `PremiumCalmBackground` sets only a changed reduce-motion value. |
| this commit | This record; the plan's B4 row and §4.2 correction; roadmap; SRS; architecture, test strategy and ADR notes; the generated traceability. |

| File | Change |
|------|--------|
| `src/utils/clockMath.ts` | **New.** The clock's arithmetic, each function pure; the ones the UI thread runs are worklets (§3.1, §4). |
| `src/stores/clockStore.ts` | **New.** The clock store, its scheduler, `useDisplayedSeconds`, and the engine (`useSessionClockEngine`, moved from the session store) (§3.2). |
| `src/components/TimerText.tsx` | **New.** The leaf: one slot's remaining time as `MM:SS`, or `--:--`. |
| `src/hooks/useSlotClock.ts` | **New.** `useSlotSharedValues(kind)` and `useSlotProgress(kind, totalMs)` (§3.3). |
| `src/stores/sessionStore.ts` | `tick` deleted; `completeEndedSession()` exported, the one completion entry point; the engine moved out. |
| `src/stores/StoreGate.tsx` | Imports the engine from the clock store. |
| `src/hooks/useSessionClock.ts` | `useSessionState()` (state and actions) added; `useSessionClock()` keeps its contract, with `displayMs` from the clock store (§3.4). |
| `src/hooks/useTimer.ts` | Takes `UseSessionStateReturn`; `remainingMs`'s render-time contract documented. |
| `src/components/CircularProgress.tsx` | Takes a `SharedValue<number>`; the arc's `strokeDashoffset` is an animated prop. |
| `src/components/FlyTimerPill.tsx` | Takes `idleMs`, renders `<TimerText>`. |
| `src/screens/TimerScreen.tsx` | `useSessionState()`; `<TimerText>`; the ring from `useSlotProgress`. |
| `src/screens/FlyModeScreen.tsx` | `useSessionState()`; `<TimerText>` in the sheet; clock SharedValues from `useSlotSharedValues('fly')`; `displayMs` deleted. |
| `src/navigation/index.tsx` | `freezeOnBlur: true` in the tabs' `screenOptions`. |
| `src/components/PremiumCalmBackground.tsx` | Sets `reduceMotion` only when it changes (§3.6). |
| Tests, new | `src/utils/__tests__/clockMath.test.ts` (13), `src/stores/__tests__/clockStore.test.tsx` (4), `src/components/__tests__/TimerText.test.tsx` (3), `src/hooks/__tests__/useSlotClock.test.tsx` (4), `src/screens/__tests__/timerScreenCommits.test.tsx` (1). |
| Tests, changed | `screens.perf-test.tsx`: the leaf scenario renders the real `<TimerText>` (same test name, so Reassure compares it). `coldStartCompletion.test.tsx`: "nothing ticked" now reads "no clock notification, no wake armed" instead of `tick === 0` (§6.1). `timerTextTicks`, `useSessionClock.test`: comments only. |

## 3. Implementation Approach

### 3.1 The math (`src/utils/clockMath.ts`)

| Function | Contract |
|----------|----------|
| `remainingMsAt(isRunning, endAt, pausedRemainingMs, idleMs, now)` | Worklet. Running: `max(0, endAt − now)`. Otherwise `pausedRemainingMs ?? idleMs`. |
| `slotRemainingMs(slot, idleMs, now)` | JS. The same rule from a slot: no slot gives `idleMs`; a slot runs only with an `endAt`. It equals the render-time rule `useTimer`, `FlyModeScreen` and `useSessionClock` each applied before B4 (pinned by a test that copies that rule). |
| `displayedSeconds(ms)` | Worklet. $\lfloor ms/1000 \rfloor$, `formatTime`'s convention. |
| `nextEmissionDelayMs(r)` | JS. For $r > 0$: $(r \bmod 1000) + \varepsilon$, $\varepsilon = 4$ ms (§4.1). |
| `progressOf(r, total)` | Worklet. $\mathrm{clamp}(1 - r/\mathit{total})$, TimerScreen's formula before B4. |
| `ringDashOffset(C, p)` | Worklet. $C \cdot (1 - \mathrm{clamp}(p))$. |

The UI thread runs the same functions as the JS thread. There is no worklet-only copy to drift, unlike `geoMath` and `geoMathWorklet`. The project lesson still applies, so a test pins the two call paths equal (§3.3).

### 3.2 The clock store (`src/stores/clockStore.ts`)

**State.** The session store's clock (read, never copied) and `sampledNow`, the wall clock at the last sample. A snapshot is a pure function of the two, so it can't change between notifications, which is what `useSyncExternalStore` requires.

**When it samples and notifies:**

| Event | Resample | Notify |
|-------|:--------:|--------|
| Any session-clock change (start, pause, resume, stop, switch, extend, completion, hydrate) | yes | always |
| A scheduled wake | yes | only if the running slot's displayed second changed |
| The app returns to the foreground | yes | only if it changed |

The clock-change listener is registered when the module is first imported, before any component can subscribe to the session store, so it runs first on every change. A snapshot therefore never pairs a new slot with an old `now`.

**The scheduler.** `reschedule()` clears any pending wake, then arms one `setTimeout(wake, (r mod 1000) + ε)` if, and only if:
- the engine is mounted,
- the active slot runs,
- and $r = \mathit{endAt} - \mathit{sampledNow} > 0$.

`wake()` resamples, notifies if the second changed, calls `completeEndedSession()`, and re-arms. So:
- **Paused or idle:** nothing is armed (§4.2: "none while paused").
- **Ended:** the first wake past the end completes the session through the session store's guards, exactly once (FR-TMR-005). A session waiting for a handler of its kind (DEF-004) arms nothing more, so nothing ticks until a handler registers and completes it.
- **State-driven, not subscriber-driven.** Completion doesn't depend on a `<TimerText>` being mounted.
- **Unmount** clears the pending wake, so a test (or a Reassure run) can't wake into the next.

**`useDisplayedSeconds(kind | 'active', idleMs)`**: `useSyncExternalStore(subscribeClock, snapshot)`, where the snapshot is $\lfloor \mathit{slotRemainingMs}(\mathit{slot}, \mathit{idleMs}, \mathit{sampledNow})/1000 \rfloor$, or null. It is a primitive, so React re-renders only when the number changes.

**The engine** (`useSessionClockEngine`, mounted once by `StoreGate`). On mount it resamples, completes a session that ended while the app was closed (or leaves it pending), and starts the scheduler. On `AppState → active` it resamples, completes and re-arms (JS timers don't run in the background on iOS). It subscribes to nothing that renders.

**`isClockWakeArmed()`** reports whether a wake is pending; tests use it ("nothing ticks").

### 3.3 The UI-thread clock (`src/hooks/useSlotClock.ts`)

**`useSlotSharedValues(kind)`** returns four SharedValues (`isRunning`, `endAt`, `durationMs`, `pausedRemainingMs`), the slot flattened by `slotClockValues` (`endAt` is −∞ unless running: Fly's sentinel). Its effect subscribes to the session store and writes all four **inside the listener**. Zustand calls listeners synchronously within `set()`, so the values change in the same JS tick as the slot. This is the project's SharedValue lesson: a `useEffect` mirror changes them a frame later, and a worklet draws that frame from the old slot.
- The values are component-level (`useSharedValue`), not module-level `makeMutable`: the Jest mock makes `makeMutable` the identity, so a `.value` write would throw in every test.
- JS-side writes use `.set()`, the form the React Compiler accepts (B5); worklets keep `.value`.

**`useSlotProgress(kind, totalMs)`** returns a derived SharedValue:

$$p = \mathrm{progressOf}\big(\mathrm{remainingMsAt}(\mathit{isRunning}, \mathit{endAt}, \mathit{paused}, \mathit{totalMs}, \mathit{now}), \mathit{totalMs}\big)$$

- `now` is a SharedValue. A frame callback advances it to `Date.now()` each frame, and the listener sets it on every slot change, so a resume never draws one frame from a stale `now`.
- **The frame callback runs only while the slot runs and the screen is focused.** `freezeOnBlur` suspends React in a hidden tab, not worklets. So the hook switches the callback off on `blur` and on on `focus`, inside the navigation listeners: a frozen screen wouldn't commit a state update, so a `useIsFocused` state would never turn it off. Outside a navigator (tests) the screen counts as focused.

**`CircularProgress`** sets `strokeDashoffset` with `useAnimatedProps(() => ringDashOffset(C, progress.value))` on `Animated.createAnimatedComponent(Circle)`. The ring now moves every frame, where it used to step once a second.

**Fly** keeps its frame callback (plane progress, rotation, the 15 Hz marker bridge, ADR-0019). Its three clock SharedValues now come from `useSlotSharedValues('fly')` instead of a `useEffect` mirror.

**Pinned:**
- the listener writes before React flushes effects (asserted inside the `act` callback; red with an effect mirror, checked by mutation);
- the frame callback's `setActive` sequence on start, blur, focus and pause;
- the UI-thread path (`slotClockValues` → `remainingMsAt`) equals the render-time path (`slotRemainingMs`) for every slot shape across a session.

### 3.4 Who reads what, after B4

| Reader | Reads | Re-renders |
|--------|-------|------------|
| `<TimerText>` (Classic, Fly sheet, Fly pill) | `useDisplayedSeconds(kind, idleMs)` | once per displayed second while its slot runs |
| `TimerScreen`, `FlyModeScreen`, `useTimer` | `useSessionState()`: the clock state and actions | on session changes only |
| The ring, Fly's plane | slot SharedValues | never (UI thread) |
| `useSessionClock()`: the guard probe and the clock tests | `useSessionState()` + `useDisplayedSeconds('active', 0)` | once per displayed second |

`useSessionClock()` keeps its contract (state, `displayMs`, actions), so the probe guard and the five clock tests run with their assertions unchanged. `displayMs` is now the displayed second × 1000 from the clock store's sample: the caller re-renders ε after each boundary, so a render-time `endAt − Date.now()` would read 59,996 where the tests expect 59,000. `formatTime` floors, so nothing displayed changes. In the app, only tests call it:

```bash
grep -rn "useSessionClock()" src --include=*.ts --include=*.tsx
```

`useTimer.remainingMs` is still computed at render. While running it now holds the value of the last session change. TimerScreen reads it only when not running (the Start/Resume button), which is documented at the definition.

### 3.5 Frozen tabs

`freezeOnBlur: true` in the tab navigator's `screenOptions`. React Navigation 7.21 passes it to react-native-screens' `Screen`, which wraps an inactive tab in react-freeze's `Freeze` (a Suspense boundary whose child throws while frozen).

**Checked in Jest:** a `<TimerText>` inside `Freeze` committed **0 times** over 10 s of wakes while frozen, and once on unfreeze, showing the current time. React retries the boundary, which suspends again, so a frozen leaf's own store subscription doesn't render it.

**What keeps running:** a hidden tab stays mounted, so its subscriptions and completion handlers keep working. A session that completes while you are on Stats is credited, and its phase advances, as before.

**What changes:** state the frozen Timer tab receives renders when it is shown again. That covers the love note, the goal popup and the interstitial queue, which waits for them. Before B4, the goal popup auto-dismissed after 1.4 s, unseen, while the tab was hidden; with love notes off, the interstitial could open over the Stats tab. Now each appears when you return. FR-ADS-001's rules are conditions, not timing, so they still hold. This is on the device check (§6.3, item 6).

### 3.6 Timer's double commit on start (B3 finding 2)

**Found** on `c77037d` in a detached worktree. Every child of `TimerScreen` was wrapped to log its renders, under one `Profiler`. Starting a session committed twice. The second commit rendered **only `PremiumCalmBackground`**, in about 0 ms.

**Cause:**
1. On mount, `PremiumCalmBackground` calls `setReduceMotion(false)` from the `AccessibilityInfo.isReduceMotionEnabled()` promise. The value is unchanged.
2. React bails out of it eagerly but still queues the update, at the lane of the promise callback, Default (`react-reconciler` 0.34, `dispatchSetStateInternal`: `enqueueUpdate$1(fiber, queue, update, 0)`).
3. The component's next render is TimerScreen's re-render on start, a store update at the Sync lane. `updateReducerImpl` skips the Default-lane update and puts its lane back on the fiber (`currentlyRenderingFiber.lanes |= updateLane`).
4. React then renders the component once more, at Default, to process it. That is the extra commit.

**Why it appeared in B3:** before B3, the screen's first re-render after mount was the asynchronous hydrate, itself at the Default lane, which processed the queued update in the same pass. B3 made hydration synchronous, removing that commit and exposing this one. That is why the Timer count stayed at 14.

**Fix:** a ref holds the last value set, and `sync` sets only a changed one. With the setState guarded in the worktree, the second commit disappeared. `timerScreenCommits.test.tsx` pins it: one commit on start, red (3 commits) against the old component. Reanimated's `useReducedMotion` was not used, because it reads once and drops the live listener.

## 4. Mathematical / Statistical Details

### 4.1 When the clock store wakes (plan §4.2, corrected)

Let $E$ be `endAt`, $r(t) = E - t$ the remaining ms, and the display $D(t) = \lfloor r(t)/1000 \rfloor$ (kept: plan §5).

**The value $k$ is shown while $r \in [1000k,\ 1000k + 1000)$.** So $D$ changes from $k$ to $k - 1$ as soon as $r < 1000k$, that is, $(r \bmod 1000)$ ms after a sample with remaining time $r$, plus the first millisecond.

The scheduler, sampling $r$ at a wake, arms

$$d(r) = (r \bmod 1000) + \varepsilon, \qquad \varepsilon = 4 \text{ ms}, \qquad r > 0.$$

**The correction.** Plan §4.2 also set $d = 1000 + \varepsilon$ when $r \bmod 1000 = 0$. Under the floor convention that is wrong: at $r = 1000k$ the change to $k - 1$ is due immediately. A fresh 25:00 session ($r = 1{,}500{,}000$) would have shown 25:00 until $T + 1004$ and then $\lfloor 1{,}498{,}996 / 1000 \rfloor = 1498$, i.e. 24:58, skipping 24:59. The guards would have failed at 24:59. The special case belongs to a ceiling countdown. The other obvious variant, $d = r \bmod 1000$ (1000 when 0), wakes at the *last* instant of each value and holds it for 999 ms: the lag §4.2 set out to remove.

**Properties** (`clockMath.test.ts`, for every $r \in [1000, 6000]$):
- **Exactly one step per wake.** $r - d = 1000k - \varepsilon$, so $D = k - 1$ at the wake: never a skipped second, since $0 < \varepsilon < 1000$.
- **At most ε late.** $D$ is still $k$ at $r - (r \bmod 1000) = 1000k$, and becomes $k - 1$ one ms later. The wake comes $\varepsilon - 1$ ms after the change, plus the timer's latency.
- **Phase-locked.** After a wake, $r \bmod 1000 = 1000 - \varepsilon$, so the next $d = 1000$: one wake per second, each ε after a boundary (`clockStore.test`: 10 notifications in 10 s, each at $(E - t) \bmod 1000 = 996$).
- **Self-correcting.** Each wake recomputes $r$ from `Date.now()`, so errors don't accumulate. A wake that comes early (a timer that fires before its deadline) sees an unchanged $D$, notifies nothing, and re-arms for the remainder.
- **Completion.** In the last displayed second ($0 < r < 1000$), $r - d = -\varepsilon$: the wake comes ε after the end, where `completeEndedSession()` completes the session, once.

**Lag, before and after.** Before: the free-running interval's phase was unrelated to $E$, so the shown second lagged by $U \in [0, 999]$ ms. After: by $\varepsilon - 1$ ms plus timer latency. Under the floor convention the starting value (25:00) is exact only at $r = 1{,}500{,}000$. The display therefore reads 24:59 within ε of a start, as it effectively did before B4: TimerScreen rendered a few ms after the start, at $r < 1{,}500{,}000$.

### 4.2 The ring

With total $T$ (the phase length, from the settings, as before) and remaining $r$ (§3.1):

$$p = \mathrm{clamp}_{[0,1]}\!\left(1 - \frac{r}{T}\right), \qquad \text{dashoffset} = C\,(1 - p), \quad C = 2\pi\,\frac{\mathit{size} - \mathit{stroke}}{2}.$$

$r$ is recomputed every frame from `endAt − Date.now()` while running (FR-TMR-003), so the ring has no drift and needs no catch-up after the background. Idle, $r = T$ and $p = 0$. Paused, $r$ is the paused remainder.

### 4.3 Render counts: what each scenario should be

Each Reassure scenario (plan §4.3): mount, start a 25-minute Pomodoro, ten 1-second advances, stop.
- **Leaf** (the real `<TimerText>`, idle text 25:00): $1 + n$, with $n$ the changes of its text. The start shows 25:00 (no change), the wakes at $T+4, T+1004, \dots, T+9004$ give 10, and the stop goes back to 25:00. So $n = 11$, and the count is **12**.
- **Timer screen** (the leaf's commits count, being inside its `Profiler`): mount 1 + start 1 + 10 leaf commits + stop 1 = **13**. Before the fix of §3.6 the start cost 2.
- **The others** don't read the clock: settings-only 1, Stats 1, Settings 2 (one `KeyboardAvoidingView` mount commit), Notes 1.

### 4.4 Render counts, measured

Each column is one commit, checked out in a detached worktree (`C:/vp-b4-base`, `node_modules` through a junction), so edits in the shared checkout couldn't leak into a run. Every Reassure invocation does 3 measured runs after 1 warm-up, and every count below was identical across its runs. The final commit was measured with 3 invocations (9 runs), all identical.

| Scenario | B3 `c77037d` | `b7461f1` store + leaf | `43cf1a8` ring | `e9df252` chain removed | `040ad32` frozen tabs | **`b838ebe` final** |
|----------|---:|---:|---:|---:|---:|---:|
| settings-only consumer | 1 | 1 | 1 | 1 | 1 | **1** |
| Timer screen (Classic) | 14 | 24 | 24 | 14 | 14 | **13** |
| Stats screen | 1 | 1 | 1 | 1 | 1 | **1** |
| Settings screen | 2 | 2 | 2 | 2 | 2 | **2** |
| Notes screen | 1 | 1 | 1 | 1 | 1 | **1** |
| `<TimerText>` leaf | 13 (stand-in) | 12 | 12 | 12 | 12 | **12** |

**Reading it:**
- **The B3 column reproduces the B3 record exactly** in this worktree, so the environment is comparable.
- **The 24s are the expected intermediate state.** While both chains ran, the tick re-rendered the screen at $T + 1000k$ and the clock store re-rendered the leaf at $T + 4 + 1000k$: two commits a second. That is 1 + 2 (start) + 10 + 10 + 1 = 24. It lasted only until the chain's removal two commits later.
- **14 after the removal:** mount 1, start 2 (the double commit of §3.6), 10 leaf commits, stop 1.
- **13 at the end** is §4.3's prediction, once the start costs 1. The screen's own function runs 3 times (mount, start, stop); `timerScreenCommits.test.tsx` pins the same numbers in the ordinary suite.
- **The leaf at 12** is the real `<TimerText>`: 1 + 11, since its idle text is 25:00 (§4.3). The plan's floor of 13 was for the stand-in, which showed 00:00 while idle.
- **`freezeOnBlur` changes nothing here**, because the scenarios render screens without a navigator. §3.5 has its Jest probe.

**Timing (advisory, as in CI):** the Timer screen's mean render time over a scenario went from 87.0 ms (B3) to 28.0–31.7 ms. The other scenarios are within a few ms, at that resolution.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A separate clock store holding a sampled `now`; snapshots derive from it and the session clock | A `now` field in the session store, set each second | A field in the session store makes every session-store subscriber re-evaluate its selector each second. The separate store's listeners are only the leaves. |
| Notify on a wake only if the displayed second changed | Notify on every wake | "Emits only when the displayed second changes" (plan §4.2) becomes literal. An early or spurious wake costs nothing. |
| Scheduler armed from session changes by the engine | Armed on the first subscriber (the usual `useSyncExternalStore` pattern) | Completion detection must not depend on a `<TimerText>` being mounted: on another tab, or before the navigator mounts the screen. |
| $d = (r \bmod 1000) + \varepsilon$ for all $r > 0$ | Plan §4.2's $1000 + \varepsilon$ at $r \bmod 1000 = 0$; $d = r \bmod 1000$ with no ε | §4.1: the first skips 24:59; the second shows each value for its last instant and then lags 999 ms. |
| Keep `useSessionClock()` (callers: tests only), with `displayMs` quantized | Delete it and rewrite the probe and the five clock tests | Unedited assertions are the evidence that behaviour survived the refactor. Quantizing keeps them exact, and changes nothing shown. |
| The ring animated on the UI thread every frame, from `endAt` | Write the SharedValue once a second from the clock store (stepped, as before B4); `withTiming(1, r)` from each start | Rehaul plan §4.5 puts the ring on the UI thread, computed from `endAt`. `withTiming` advances on frame timestamps, a monotonic clock rather than the wall clock, so it would need a resync after every background and sleep. A per-frame read of `Date.now()` is the wall clock `endAt` is set in, so it can't drift. The per-frame cost is bounded: the callback runs only while running and focused. |
| Focus gating in the navigation listeners | `useIsFocused()` state | A frozen screen doesn't commit, so a state-driven `setActive(false)` would never run while hidden. |
| Component-level SharedValues written from a store listener | Module-level `makeMutable` values written in the session store | Module-level values throw under the Reanimated Jest mock. The listener is still synchronous within `set()`. |
| `PremiumCalmBackground`: a ref guard on the setState | Reanimated's `useReducedMotion()`; a `useSyncExternalStore` over `AccessibilityInfo` | `useReducedMotion` reads once and drops the live change listener. A store is more code for one boolean. The guard is the smallest change, and was checked to remove the commit. |
| Fly's always-on frame callback and its 15 Hz marker re-render left as they are | Gate Fly's callback by focus; move the marker into a leaf | Neither is the 1 Hz chain. The marker bridge is a react-native-maps constraint (ADR-0019), and Phase 4b replaces this map. Recorded as a follow-up (§7). |
| Swap the perf test's stand-in for the real `<TimerText>`, same test name | Keep the stand-in; add a second scenario | The plan says to swap it. The same name keeps Reassure's comparison against the baseline. |
| `isClockWakeArmed()` exported for tests | `jest.getTimerCount()` | Other code under Jest keeps its own fake timers (6 pending after a bare `StoreGate` mount with no session, so none of them the clock's), so a timer count is brittle. The flag states the property directly. |

## 6. Verification

### 6.1 Local, all done

```bash
npm run typecheck
npm run lint
npx jest --ci
npm run test:perf   # in a detached worktree, per commit (§4.4)
```

- [x] Typecheck clean at every commit.
- [x] Lint: **0 errors**. Warnings 136 → 134.
- [x] Jest: **130 passed, 24 suites** (105 and 19 after B3). The four guards are green at every commit: `timerTextTicks`, both tests in `timerScreenTicks`, `flyModeGuard`.
- [x] **The mutation check, on the final chain:** with the `notify()` of the clock store's wake deleted, `timerTextTicks` and both `timerScreenTicks` tests fail at 24:59 (`timerTextTicks.test.tsx:38`, `timerScreenTicks.test.tsx:89` and `:116`). The file was restored byte-identical.
- [x] The other mutation checks:
  - an effect mirror instead of the store listener fails the synchronous-write test (`Expected: true, Received: false`);
  - the old `PremiumCalmBackground` fails `timerScreenCommits` (3 commits after start, not 2).
- [x] `useSessionClock.test.ts`, including "fires completion exactly once when the foreground event and the ticker both see the end", passes with no assertion changed.
- [x] The three DEF-004 tests in `coldStartCompletion.test.tsx` pass. In "waits, without ticking", B3's `tick === 0` became two assertions with the same intent: no clock-store notification and no wake armed during the 9 s wait.
- [x] Reassure (§4.4): no count went up.

### 6.2 Who renders each second, by grep

```bash
grep -rn "useDisplayedSeconds\|useSessionClock()" src --include=*.ts --include=*.tsx
```

Expect `TimerText.tsx`, `useSessionClock.ts`, and test files only. A new caller re-renders every second while a session runs.

### 6.3 Device (iPhone, a TestFlight build): not done yet

B4 changes no native code, but the Jest mocks can't show four things:
- Reanimated animated props on an SVG circle under Fabric;
- the UI-thread frame callback;
- `freezeOnBlur` on a real `Screen`;
- timer wakes on iOS.

It needs a TestFlight build, with your go-ahead. It could be batched with B5 if you prefer one build.

1. **Classic counts down at the second.** Start a focus session: the text changes every second, steadily, with no stutter and no skipped second.
2. **The ring moves smoothly** (not in 1 s steps) and is correct after:
   - a pause and resume;
   - locking the phone for a minute and coming back (no catch-up animation, FR-TMR-003);
   - switching to Stats and back.
3. **Fly:**
   - the plane moves;
   - the sheet's digits and the pill both count down;
   - pause and resume move the plane from the right place.
4. **Tabs:** with a session running, switch Timer → Stats → Settings → Notes → Timer. The time is right the moment the Timer tab shows.
5. **Completion, again (FR-TMR-005, DEF-004):**
   - a 1-minute focus completes once, while watching;
   - another, killed mid-session and relaunched after its end, is credited once on relaunch (B3's check 2, repeated, because B4 moved completion detection).
6. **Completion while on another tab** (§3.5): with a 1-minute focus running, go to Stats and wait for the end. On returning to Timer, the love note (if on) and, on a goal day, the popup appear then. Expected and new.

## 7. Findings and open items

1. **Plan §4.2's special case was wrong** (§4.1); corrected in the plan with a note.
2. **The long-break button label (pre-existing, not changed).** `getPrimaryButtonLabel` compares a non-running remainder with the *short* break's length during a long break. A paused 15-minute long break with more than 5 minutes left therefore says "Start", while the button resumes. A refactor shouldn't hide a behaviour change; this is for D1, which rebuilds Classic.
3. **Fly's frame callback runs every frame while Fly is mounted,** idle or hidden, and its 15 Hz `runOnJS(setMarkerCoord)` re-renders the whole `FlyModeScreen` during a flight. Both predate B4, and neither is the 1 Hz chain. Owner: Phase 4b, which replaces this map; or a small follow-up gating the callback like `useSlotProgress`.
4. **DEF-005 stays open.** B4 doesn't touch notification scheduling. Its slot is TBD (owner); D1 rebuilds Classic's start path.
5. **The device check (§6.3) is open,** and needs a TestFlight build with your go-ahead.

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B4, §4.2 (corrected here), §4.3
- [B3](2026-10-30-phase1-b3-zustand-stores.md): the stores, the tick B4 removes, finding 2
- [Phase 1 Stage A](2026-10-29-phase1-stage-a.md): the guards and the Reassure baseline
- [Rehaul plan §4.5](2026-10-29-couples-rehaul-plan.md): the re-render strategy
- [ADR-0004](../architecture/adr/0004-timestamp-based-timer.md), [ADR-0009](../architecture/adr/0009-svg-progress-ring.md), [ADR-0016](../architecture/adr/0016-unified-session-clock.md), [ADR-0019](../architecture/adr/0019-clock-driven-plane.md)
- [SRS](../srs/SRS.md): FR-TMR-003, FR-TMR-005, FR-TMR-006, NFR-PERF-003

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- [Progress ring drawn with react-native-svg stroke-dashoffset](../architecture/adr/0009-svg-progress-ring.md)
- [One unified session clock (useSessionClock) with two slots](../architecture/adr/0016-unified-session-clock.md)
- [2026-10-29 — Phase 1 (v1.4): design system and local re-architecture, plan](2026-10-29-phase1-plan.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
