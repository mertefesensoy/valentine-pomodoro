---
id: IMPL-2026-10-30-phase1-b7-deferred-startup
title: "Phase 1 B7: deferred start-up work, and an on-device TTI probe"
status: in-progress
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-29-phase1-b1-lazy-fly-mode, IMPL-2026-10-30-phase1-b3-zustand-stores, SRS]
---

# 2026-10-30 — Phase 1 B7: deferred start-up work, and an on-device TTI probe

**Status:** Code done and verified locally, in four code commits after the plan commit (§2). **Merged into `rehaul/v2` on 2026-10-30 as `3d3fbaf`, after B6 (`1b7a8d7`), with `onLayout={markFirstFrame}` on `App()`'s root view in `src/App.tsx` (§3.6); pushed 2026-10-30 (through `3369418`).** The device checklist (§6.5) passed on TestFlight build 46 (`v1.4.0-tf.46`), 2026-10-30, the probe panel's `deferred (idle)` line included, so the first-frame wiring works on the phone. **The done-criterion, cold-start TTI before and after, still needs the panel's numbers on record (§6.7).**
**Branch:** `phase1/b7-deferred-startup` (worktree `C:\vp\b7`, cut from `rehaul/v2` at `7034bba`). The parent session merges it after B6 (Expo Router) and adds one call (§3.6).
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B7.

---

## 0. Read this first

- **The ads SDK start and the launch's update check now run after the first frame,** in one idle callback once the root view has laid out. Both call sites are unchanged; the deferral is inside `AdManager.init()` and `useUpdateCheck` (§3.2).
- **The parent must add one call at merge:** `onLayout={markFirstFrame}` on the root view of B6's `app/_layout.tsx` (§3.6). Without it every launch waits for a 2 s fallback, which keeps ads and the update check working, and the probe marks the launch `fallback` so it is excluded from the measurement.
- **Audio:** nothing ran at cold start since B1. The cold-start module list has no `expo-audio` module, before or after (§6.4). Nothing to change.
- **One build measures both arms.** A hidden switch, reached by a 1.5 s long-press on Settings → About's credit line, makes launches alternate between the pre-B7 path and B7's (§3.3, §3.5). The panel shows each arm's median TTI and spread, and shares the raw rows.
- **The arms are compared on TTI from the probe's own start,** which every launch has; TTI from the JS bundle's start is the absolute number for NFR-PERF-001, wherever the native marker passes its check. Neither starts at the tap on the icon: the native time before the bundle runs is invisible to JS, and to this build without a Mac. B7 changes nothing in that span (§4.1).
- **Local gates:** Jest 180/180 in 31 suites (+46 tests); typecheck clean; lint 0 errors, 38 warnings, as before; Reassure render counts unchanged (settings-only 1, Timer 13, Stats 1, Settings 2, Notes 1, leaf 12); 9 mutations, each caught (§6.2).
- **Your decisions** are in §7: whether the panel ships in the App Store build, and how NFR-PERF-001's 1.0 s is to be read.

## 1. Problem / Motivation

Phase 1 task B7: *"Defer non-critical start-up work. `AdManager.init`, the update check and audio preload run after the first frame. RN 0.88 removed `InteractionManager`, so use `requestIdleCallback`, or a `setTimeout(0)` after the first `onLayout`."* Done when *"cold-start TTI is measured on the iPhone (TestFlight builds) before and after."*

The requirement behind it is NFR-PERF-001: cold-start time-to-interactive ≤ 1.0 s on an iPhone 12-class device, measured on a TestFlight build, baseline TBD. Nothing measures TTI today, and there is no Mac, so Instruments isn't available.

At `7034bba` these run during the first commit of `ThemedApp` (`src/App.tsx`), before the first frame:
- `useUpdateCheck(UPDATE_JSON_URL)` (line 46): its mount effect calls `check()`, which starts a `fetch` to the iTunes Lookup API (FR-UPD-001).
- `AdManager.init()` (line 51), in the effect that also adds the notification-tap listener: `MobileAds().initialize()`, then `AdPolicy.init()`, then the first interstitial `preload()` (FR-ADS-001).

Neither is needed for the first screen. Both start native work (the Google Mobile Ads SDK's start-up, a network request) whose callbacks come back to the JS thread while the first screen is still being built.

Constraints from the brief:
- **One TestFlight build carries B6 and B7** and must yield both the "before" and the "after" numbers. So the build needs a hidden switch that runs the start-up work the pre-B7 way.
- **File boundary with B6.** The deferral lives in `src/hooks/useUpdateCheck.ts`, `src/ads/AdManager.ts` and a new `src/startup/`. `src/navigation/`, `app/`, `package.json`, `app.json` and the navigator, notification and Gift Mode parts of `src/App.tsx` are not edited.
- **Behaviour kept:** the interstitial is loaded and ready by the 2nd completed session (FR-ADS-001); the update check runs once per cold launch, and Settings' "Check for updates" (`checkForUpdates({ force: true })`) works at once, even before the deferred work has run (FR-UPD-001); nothing visible changes at launch, and the splash timing doesn't get worse.

## 2. What Changed

| Commit | Content |
|--------|---------|
| `2f0a944` | This record's plan sections (§1, §3–§5), before any code. |
| `6ab3953` | `src/startup/`: the first-frame scheduler, the probe, the before/after switch and the statistics, with their tests. Nothing calls them yet. |
| `8c6bf3d` | `AdManager.init()` and `useUpdateCheck`'s launch check hand their work to the scheduler; the readiness and update-check tests. |
| `c4c6ab5` | The hidden panel and its one-line wrapper in Settings → About. |
| `4a0d151` | This record completed (§0, §2, §6–§8, shared-doc updates). |
| `e0e8f26` | **The comparison can't be emptied by two things untestable from Windows:** the arms are compared on TTI from the probe's start, which every row has; a failed clock check no longer excludes a row, and only `background` (not `inactive`) does; the panel shows AppState and the clock status (§4.1, §4.3). |
| this commit | This record updated for `e0e8f26`. |

| File | Change |
|------|--------|
| `src/startup/deferredStartup.ts` | New. `runAfterFirstFrame()` queues start-up work; `markFirstFrame()` releases it into one idle callback; a 2 s fallback releases it if the signal never comes; the eager arm runs work at once. |
| `src/startup/startupProbe.ts` | New. Per-launch marks in memory; rows persisted to MMKV (`startup_probe_v1`, newest 40) once the panel has been opened; the clock check, TTI, TTI⁺ and the exclusion rules. |
| `src/startup/startupVariant.ts` | New. The stored switch (`startup_variant_v1`): `deferred`, `eager` or `alternate`, resolved once per launch. |
| `src/startup/probeStats.ts` | New. Type-7 quantiles, median, IQR and range; the Hodges–Lehmann shift and its 95 % interval (§4.2, §4.3). |
| `src/startup/StartupDiagnostics.tsx` | New. `HiddenStartupDiagnostics`, the long-press wrapper, and the panel. |
| `src/ads/AdManager.ts` | `init()` defers the SDK start, policy load and first preload through the scheduler, and returns one promise per launch; the first interstitial's `LOADED` is marked for the probe. |
| `src/hooks/useUpdateCheck.ts` | The mount effect registers the launch check with the scheduler (its cleanup cancels it); the forced check is unchanged. |
| `src/screens/SettingsScreen.tsx` | The credit line in About is wrapped in `HiddenStartupDiagnostics`; one import. No state added. |
| `src/startup/__tests__/deferredStartup.test.ts` | New, 27 tests: the scheduler, the switch, the stored rows, both TTI origins and the exclusion rules. |
| `src/startup/__tests__/probeStats.test.ts` | New, 6 tests: quantiles against R, the shift and its interval worked by hand. |
| `src/startup/__tests__/StartupDiagnostics.test.tsx` | New, 4 tests: the line unchanged, the long-press, the comparison without the native marker, the mode, share and clear buttons. |
| `src/ads/__tests__/adReadiness.test.ts` | New, 5 tests: the interstitial ready by the 2nd completed session through the signal, the fallback and the eager arm (FR-ADS-001). |
| `src/hooks/__tests__/useUpdateCheck.test.tsx` | New, 4 tests: the launch check after the first frame, once for two mounts; the forced check at once and the deferred one then a no-op; the fallback (FR-UPD-001). |
| `docs/implementations/2026-10-30-phase1-b7-deferred-startup.md` | This record. |

**Not edited**, per the brief: `src/App.tsx`, `src/navigation/`, `app/`, `package.json`, `app.json`, and every shared doc (their updates are in the last section, for the parent to apply at merge).

## 3. Implementation Approach

### 3.1 What runs at cold start, and what moves

| Work | Where | B7 |
|------|-------|----|
| `AdManager.init()`: Mobile Ads SDK start, ad-policy load, first interstitial request | `App.tsx:51` effect | **Deferred** to after the first frame, inside `AdManager.init()`. The call site is unchanged. |
| Update check (`fetch` to iTunes Lookup) | `useUpdateCheck` mount effect | **Deferred**, inside the hook's effect. The call sites (App.tsx line 46, SettingsScreen) are unchanged. The forced check is not deferred. |
| Audio preload | `useFlyModeAudio` (`useAudioPlayer`) | **Nothing runs at cold start since B1** (Fly is `React.lazy`). Checked against the cold-start module list (§6); nothing to change. |
| `Notifications.setNotificationHandler`, `SplashScreen.preventAutoHideAsync()` | `App.tsx` module scope | Kept. Both must be in place before the first notification or frame. |
| Store hydration (sync MMKV reads) | `StoreGate` | Kept: the first frame shows stored values (B3). |
| Daily-reminder reschedule (permission read, cancel, schedule) | `useReminderScheduler`, in `StoreGate` | Kept, and listed as eager work found. It runs only when the reminder is on, it is functional B3 code (FR-NTF-002) outside B7's file boundary, and its native calls are async. A later task can defer it with the same scheduler. |
| Reduce-motion query | `PremiumCalmBackground` | Kept: it decides what the first frame draws. |

### 3.2 The scheduler (`src/startup/deferredStartup.ts`)

Contracts:

- **`runAfterFirstFrame(name, task): () => void`**
  - Input: a label (used by the probe, §3.4) and a task that is synchronous or returns a promise.
  - Output: a cancel function. It removes the task if it hasn't started; afterwards it does nothing.
  - Side effects: in the **eager** arm (§3.3) it runs the task at once, synchronously, as the code before B7 did. Otherwise it queues the task.
  - Invariants: a task runs at most once; queued tasks run in registration order; a task that throws or rejects is logged and doesn't stop the others; in the deferred arm no task runs before the first-frame signal, unless the fallback timer fires.
- **`markFirstFrame(): void`**
  - The first-frame signal: the root view's first `onLayout`. Idempotent: only the first call counts, so it can be the root's `onLayout` handler as it is (it fires again on rotation).
  - On the first call it records the probe's first-layout mark, asks the probe to time the first idle moment (§3.4), then schedules the queue's drain.
- **The drain** runs every queued task in one idle callback: `requestIdleCallback(drain, { timeout: 1000 })` when the global exists (RN 0.88 bridgeless installs it), else `setTimeout(drain, 0)`. A task registered after the drain schedules another one.
- **Fallback timer:** 2 s after the first registration, if no first-frame signal has arrived, the queue drains anyway and the probe records the trigger as `fallback`. This is the safety net for FR-ADS-001 and FR-UPD-001 if the signal is never wired, or wired wrong. On this branch alone the signal isn't wired (it belongs in B6's root layout, §3.6), so every deferred launch takes the fallback until the merge.

What the RN 0.88 source says about the primitives (read in `node_modules/react-native`, 0.88.1):
- **`requestAnimationFrame` is `setTimeout(0)`** in bridgeless mode (`ReactCommon/react/runtime/TimerManager.cpp`, the comment at the `createTimer` call). It doesn't wait for a frame, so the scheduler doesn't use it.
- **`requestIdleCallback` is an idle-priority task** in the runtime scheduler (`NativeIdleCallbacks.cpp`, `RuntimeScheduler_Modern::scheduleIdleTask`): it runs once no higher-priority JS task is queued. Its `timeout` isn't what it says: `getResolvedTimeoutForIdleTask` turns any timeout under 5 min into **10 s + timeout**. So `{ timeout: 1000 }` means the drain runs at the latest about 11 s after it was scheduled, even if the JS thread never idles.
- Idle tasks with equal timeouts run in registration order (the queue is ordered by expiration time). The probe registers its idle callback before the drain's, with the same timeout, so it fires first.

### 3.3 The before/after switch (`src/startup/startupVariant.ts`)

A stored setting, `startup_variant_v1` in MMKV, read once per launch at the scheduler's first use:

| Setting | This launch runs |
|---------|------------------|
| absent, or `deferred` (default) | deferred (B7) |
| `eager` | eager: every task runs at registration, the pre-B7 path |
| `alternate` | the arm the previous launch didn't run, for measuring both arms in one session (§4.3) |

- The read is guarded by `isStorageMigrated()`: before the one-time B2 copy has finished, the setting can't exist, and `loadSync` would refuse anyway.
- Only `alternate` writes (the arm it chose), so a user who never opens the panel never writes the key.
- The setting changes the next launch, not the current one: the current launch has already chosen its arm.

### 3.4 The probe (`src/startup/startupProbe.ts`)

Every launch keeps a few timestamps in memory. They are written to MMKV (`startup_probe_v1`, the newest 40 launches) only once the hidden panel has been opened (the setting key exists), so ordinary users write nothing. Writes never land on the start-up path: none happens before the interactive mark, and after it each write waits 500 ms for later marks to gather. In practice that is two or three writes per launch: when the deferred work has finished, when the update check's response arrives, and when the interstitial loads.

Each launch's row holds:
- `id` (wall-clock ms at the probe's first use), the arm, the drain trigger (`idle`, `idle-timeout`, `fallback` or `eager`), the app version and build number, whether storage was already migrated, and the `AppState` at the interactive mark;
- marks in ms since the native bundle-start marker (`jsStart`, time 0 on the clock of §4.1): `jsEnd` (the bundle has finished), `probeInit`, `firstLayout`, `interactive`, `drainEnd`, each task's start and end (`ads.init:start`, `ads.init:end`, `update.check:start`, `update.check:end`), and `ads.loaded` (the first interstitial loaded).

The marks are defined in §4.1.

### 3.5 The hidden panel (`src/startup/StartupDiagnostics.tsx`)

- Settings → About: a **1.5 s long-press on the "Made with ❤️" line** opens a small panel under it. The line itself is unchanged: the wrapper is a `Pressable` with no style and no feedback, marked not accessible, so VoiceOver reads the line as before.
- The panel shows this launch's arm, trigger, AppState, clock status and two TTIs; the arm for the next launches (Deferred, Alternate, Eager); each arm's summary (§4.2) of TTI from the probe's start for this build, with the shift between them (§4.3); and each arm's median TTI from the bundle's start, over the rows that passed the clock check. Two buttons: **Share data** (the rows as JSON, through the system share sheet, so they reach the PC without a Mac) and **Clear runs**.
- The panel's state lives in its own component, so `SettingsScreen` gains no state (its Reassure count must stay 2).
- `SettingsScreen` is the one call-site change outside the two lines: an import and the wrapper around one `<Text>`.

### 3.6 What the parent adds at merge

`markFirstFrame()` must be called once the root view has laid out. In B6's root layout (`app/_layout.tsx`), on the outermost view, the one that today is `App()`'s `<GestureHandlerRootView style={{ flex: 1 }}>` (`src/App.tsx:96`):

```tsx
import { markFirstFrame } from '@/startup/deferredStartup';
// …
<GestureHandlerRootView style={{ flex: 1 }} onLayout={markFirstFrame}>
```

- The handler can be passed as it is: only the first call counts, and the layout event argument is ignored.
- If B6's root has no such view, the alternative is to call `markFirstFrame()` where B6 calls `SplashScreen.hideAsync()`. That is later than the layout, so $L$ and $I$ (§4.1) move later in both arms alike.
- If the merge keeps `src/App.tsx`'s `App()` as the root instead, the same `onLayout` goes there.
- `AdManager.init()` and `useUpdateCheck(…)` need nothing, wherever B6 puts them.
- **Check after the merge:** the panel's "This launch" line on the device shows `idle`, not `fallback` (§6.5, item 5).

## 4. Mathematical / Statistical Details

### 4.1 The clock and the marks

All marks are `performance.now()` values, in ms. In RN 0.88 that is `HighResTimeStamp::now()`, a `steady_clock` reading since boot (`NativePerformance.cpp`, whose comment says so). The native start-up markers in `performance.rnStartupTiming` are written on iOS by `RCTPerformanceLogger` as `CACurrentMediaTime() × 1000`, also time since boot. The two should be on one clock. The probe checks that per launch rather than assuming it:

$$\text{clockOk} \iff 0 \le p_0 - b_0 \le 10\,000\ \text{ms}$$

where $b_0$ = `executeJavaScriptBundleEntryPointStart` (the bundle starts evaluating) and $p_0$ = the probe module's first `performance.now()`, taken when the module is first evaluated. Two clocks on different bases differ by hours (the time the phone slept, or since a different epoch), not by a few seconds, so a window this wide still catches them. It isn't tighter ($p_0 \le b_1$, the bundle's end) because under Expo Router (B6) the root layout, and with it the probe, may be evaluated just after the bundle has finished. The bundle's end, $b_1$ = `endTime`, is stored as `jsEnd` for reference.

Marks are stored relative to $b_0$ when the check passes, and relative to $p_0$ when it doesn't (then `probeInit` is 0):

| Symbol | Mark | Meaning |
|--------|------|---------|
| $b_0$ | `jsStart` | Hermes starts evaluating the bundle. |
| $p_0$ | `probeInit` | The probe module is first evaluated, while the app's modules load. Both arms run identical code up to here: the switch is read later, at the first registration. |
| $L$ | `firstLayout` | JS handles the root view's first `onLayout`: the first frame's layout is done. |
| $I$ | `interactive` | The first idle callback registered at $L$ runs: no higher-priority JS work is queued, so a touch would be handled at once. |
| $D$ | `drainEnd` | The synchronous part of the drained tasks has returned (deferred arm). In the eager arm the tasks ran before $L$, so $D$ is undefined there. |

**Two TTIs, for two purposes:**
- **For comparing the arms: $\text{TTI}_p = I - p_0$.** Every row has it. Everything B7 can change happens after $p_0$, so a difference between arms shows in full; and the bundle's evaluation up to $p_0$, the same in both arms, adds no noise.
- **For NFR-PERF-001's absolute number: $\text{TTI}_b = I - b_0$,** defined only for rows that passed the clock check.
- For each, a secondary $\text{TTI}^{+} = \max(I, D) - \text{origin}$ charges the deferred arm for its own work too, so the comparison can't be won by measuring just before that work starts.

The arms are compared on $\text{TTI}_p$ so that the comparison can't be emptied by an assumption this branch can't test on an iPhone: that the native marker exists in this build (the host must register RN's performance-logger hooks) and shares `performance.now()`'s clock (it depends on how libc++ implements `steady_clock` on iOS). If either fails, every row loses $\text{TTI}_b$ and the panel says so, but the comparison stands.

**What it doesn't see.** On bridgeless iOS, `APP_STARTUP_START` is logged in `ReactInstance::loadScript`, immediately before the bundle runs, not at process launch. Process creation, dyld, the native React host and Hermes set-up happen before $b_0$ and aren't measured. B7 doesn't change any of them: both arms run the same binary up to $b_0$. The probe also can't see the UI thread: if the Ads SDK's start-up blocks the main thread, it shows up only as a later $L$ or $I$. So NFR-PERF-001's absolute 1.0 s can't be fully verified this way. The difference between arms can.

**Why iOS prewarming doesn't distort it.** iOS may pre-launch a process before the user taps, but only up to `UIApplicationMain`, which is long before $b_0$.

### 4.2 Summarising one arm

For one arm's clean runs (§4.3), sorted $x_{(1)} \le \dots \le x_{(n)}$:

- **Quantiles**, by linear interpolation between order statistics (Hyndman and Fan's type 7, R's default):
  $$h = (n-1)\,p + 1,\qquad Q(p) = x_{(\lfloor h \rfloor)} + (h - \lfloor h \rfloor)\,\bigl(x_{(\lfloor h \rfloor + 1)} - x_{(\lfloor h \rfloor)}\bigr)$$
  with $x_{(n+1)} := x_{(n)}$.
- **Centre:** the median $Q(0.5)$.
- **Spread:** the interquartile range, $Q(0.25)$ to $Q(0.75)$, and the full range, $x_{(1)}$ to $x_{(n)}$.

The median and quartiles are used, not the mean and standard deviation, because launch times are right-skewed: an occasional slow launch (a background task, thermal throttling) would drag a mean. The panel and §6 show the same numbers; `src/startup/probeStats.ts` is the only implementation.

### 4.3 The comparison

Let $x_1..x_m$ be the deferred arm's $\text{TTI}_p$ values and $y_1..y_n$ the eager arm's (§4.1).

- **Difference of medians:** $\Delta = \operatorname{median}(y) - \operatorname{median}(x)$. Positive means B7 made start-up faster.
- **Hodges–Lehmann shift**, a robust estimate of how far one distribution sits from the other: the median of all $mn$ pairwise differences $d_{ij} = y_i - x_j$.
- **Its 95 % confidence interval:** the $K$-th smallest and $K$-th largest $d_{ij}$, with
  $$K = \left\lfloor \frac{mn}{2} - 1.96\sqrt{\frac{mn(m+n+1)}{12}} \right\rfloor$$
  (the normal approximation to the Mann–Whitney $U$ distribution). For $m = n = 12$: $K = \lfloor 72 - 1.96\sqrt{300} \rfloor = \lfloor 38.05 \rfloor = 38$, so the interval runs from the 38th to the 107th of the 144 sorted differences. This matches the exact table: the two-sided 5 % critical value of $U$ for 12 and 12 is 37, and $K = U_{\text{crit}} + 1$.
- **Reading it, decided before measuring:** if the interval lies above 0, B7 shortened TTI; if it contains 0, there is no measurable difference at this sample size, and the record says so. Either way B7's done-criterion (TTI measured before and after) is met; the code stays, because it moves work off the start-up path at no cost to FR-ADS-001 or FR-UPD-001.

**Sample size: 12 cold starts per arm**, 24 in all, alternated by the app (`alternate`), so slow drift (temperature, background indexing after an install, the network) falls on both arms alike. With 12 per arm the interval leaves out the 37 smallest and the 37 largest of the 144 differences, about a quarter at each end, so two or three odd launches can't set it. (The smallest samples with any interval at all are 4 per arm, where $K = 1$ and the interval is the full range of differences.) More launches would narrow it further; 24 is what fits in about 15 minutes of your time.

**A launch is excluded** (rules fixed before measuring) when any of these hold:
1. storage wasn't migrated at launch (the one-time B2 copy ran);
2. it has no interactive mark (killed or sent to the background before the first idle moment);
3. `AppState` at $I$ was `background`. Not "anything but `active`": iOS can still report `inactive` while a cold launch is becoming active, and that rule could have excluded every launch;
4. a deferred launch's trigger was `fallback` (the first-frame signal is missing: fix the wiring, rebuild, and measure again);
5. its build number differs from the build under test.

A failed clock check doesn't exclude a launch from the comparison; it only removes its $\text{TTI}_b$. The first launch after installing pays one-time costs (a cold file cache, iOS's first-launch work), so the protocol (§6) clears the runs after it.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Defer inside `AdManager.init()` and `useUpdateCheck`'s effect | Wrap the two calls in `App.tsx` | The brief's boundary: B6 moves `ThemedApp`'s code into its root layout, so call sites in `App.tsx` would conflict. Deferring inside the callee keeps both call sites as they are, wherever B6 puts them. |
| `requestIdleCallback` after the first `onLayout`, with a fallback timer | `setTimeout(0)` after `onLayout`; `requestAnimationFrame` | rAF is `setTimeout(0)` in RN 0.88 (§3.2). An idle callback waits until the JS queue is empty, which `setTimeout(0)` doesn't. The fallback guarantees the ads and update check still run if the signal is never wired. |
| An explicit `markFirstFrame()` for the root's `onLayout` | Infer the first frame from the first registration (an effect) | An effect runs after React's commit but before the native views are laid out. The root's `onLayout` is the earliest JS-visible sign that the first frame is laid out, and it also gives the probe its $L$ mark. |
| A stored setting with an `alternate` arm | Two builds; a build-time flag | The brief: one build gives both numbers. Alternating per launch removes drift between arms and needs no switching between runs. |
| Timestamps relative to the bundle-start marker | `Date.now()`; the probe's own first timestamp | `Date.now()` can jump. The probe's module evaluates late in the bundle, after most libraries, so it would hide their cost. The native marker is the earliest point JS can see. |
| Median, IQR, Hodges–Lehmann | Mean and standard deviation; a t-test | Launch times are right-skewed with occasional outliers; rank-based statistics aren't moved by one slow launch. |
| Persist only once the panel has been opened | Always persist | Ordinary users write nothing and store nothing. The in-memory marks cost a few `performance.now()` calls and one idle callback. |
| No lazy loading of the Google Mobile Ads JS modules | `require()` inside `AdManager` | `StatsScreen` imports `BannerAd` statically, and the navigator imports `StatsScreen` statically, so the package is evaluated at cold start anyway (checked in §6). Moving it needs the Stats banner to load lazily, which waits on the DEF-006 decision (Phase 1 D2). |
| No ADR | ADR-0044 | The deferral is the plan's own instruction. The hidden panel is recorded here and offered to you as a decision (§7). |

## 6. Verification

### 6.1 Local gates, all done (Windows, Node, this worktree after `npm ci`)

| Gate | Baseline `7034bba` | B7 `c4c6ab5` |
|------|-------------------|--------------|
| `npm run typecheck` | clean | **clean** |
| `npm run lint` | 0 errors, 38 warnings | **0 errors, 38 warnings** |
| `npx jest` | 134 tests, 26 suites | **180 tests, 31 suites, all pass** |
| A1 timer guards (`timerScreenTicks`, `timerTextTicks`, `useSessionClock`, `flyModeGuard`) | pass | **pass** (in the full run) |

- [x] The three new test files that reload modules per launch use `require()` after `jest.resetModules()`; each has one file-level `no-require-imports` disable with that reason, so the warning count stays at 38.
- [x] Two test-only stand-ins, each commented where it is. `deferredStartup.test.ts` hands every simulated launch the same react-native-mmkv mock instance, because the mock keeps data per instance and a module reset would otherwise wipe "the disk". `useUpdateCheck.test.tsx` pins `react` with `jest.doMock`, so the hook loaded after a reset renders with RNTL's React. Both are listed for TEST-STRATEGY §3 in the shared-doc section.

### 6.2 Mutation checks

Each mutation was applied to the committed code, the B7 test files run, and the file restored with `git checkout`. M1–M6 ran at `c4c6ab5`, M7 and M8 at `e0e8f26`.

| # | Mutation | Tests that failed |
|---|----------|-------------------|
| M1 | Deferred arm runs tasks at registration (no deferral) | 11: seven scheduler tests, ad readiness (signal and fallback), update check (waits for the first frame; forced before deferred) |
| M2 | No fallback timer | 3: the fallback test in each of the three files |
| M3 | `useUpdateCheck` effect back to `void check()` | 2: waits for the first frame; forced before deferred |
| M4 | `AdManager.init()` calls `initNow()` directly | 2: starts nothing before the first frame; the fallback |
| M5 | The probe's interactive callback removed | 7: scheduler and stored-row tests |
| M5b | The interactive callback requested *after* the drain | 1: "takes the interactive mark before the deferred work starts" |
| M6 | The `fallback` exclusion rule removed | 1: "excludes a launch when the first-frame signal was missing" |
| M7 | Exclude every launch not `active` at $ (the rule before `e0e8f26`) | 2: "accepts a complete launch" (`inactive`); the panel's comparison without the native marker |
| M8 | A failed clock check excludes the launch again | 2: "a failed clock check keeps the run"; the panel's comparison without the native marker |

### 6.3 Reassure (NFR-PERF-003: no count may go up)

The baseline was measured at `7034bba` in this worktree (`npx reassure --baseline`), then B7 at `c4c6ab5` and again at `e0e8f26`, three runs per invocation.

| Scenario | Brief | Baseline `7034bba` | **B7** |
|----------|------:|------------------:|-------:|
| settings-only consumer | 1 | 1 | **1** |
| Timer screen (Classic) | 13 | 13 | **13** |
| Stats screen | 1 | 1 | **1** |
| Settings screen | 2 | 2 | **2** |
| Notes screen | 1 | 1 | **1** |
| `<TimerText>` leaf | 12 | 12 | **12** |

- Every count is identical in every run, at both B7 commits. Reassure reports "Render count changes: (none)".
- **Timing (advisory, 1 ms resolution):** a first B7 run overlapped an `expo export` on the same machine and showed Timer 20.3 → 27.7 ms at 43 % stability. A quiet re-run gave Timer 20.3 → **17.3 ms** and Stats 3 → 4 ms, every other scenario equal. At `e0e8f26`, one run overlapped the docs checker and was noisy (Settings 26 ms, Notes 28 ms); the quiet re-run gave Timer 14.3, Stats 3, Settings 9, Notes 6, leaf 1 and settings-only 0 ms against the baseline's 20.3, 3, 7, 8, 2 and 1. B7 changes nothing these scenarios render except the Settings wrapper (the panel stays closed in them), and its count is unchanged.
- The "1 initial update" Reassure lists for Settings and the settings-only consumer is in the baseline too.

### 6.4 Cold-start modules and bundle size

Measured with `scripts/startup-modules.js` on a plain-JS iOS export (`npx expo export --platform ios --no-bytecode --no-minify --source-maps`), as B1 did.

| | `7034bba` | B7 |
|--|---:|---:|
| Modules evaluated at an iOS cold start | 1,796 | **1,801** (+5: the five `src/startup/` modules) |
| of them `expo-audio` | **0** | **0** |
| of them `react-native-google-mobile-ads` | 60 | 60 |

- **Audio:** no `expo-audio` module is evaluated at cold start, before or after: B1's lazy Fly took all nine. There is no audio work to defer.
- **Ads JS:** the 60 Google Mobile Ads modules stay on the cold-start path because `StatsScreen` imports `BannerAd` statically and the navigator imports `StatsScreen` statically (§7, F1). B7 defers the SDK's *start*, not the evaluation of its JS.
- `StartupDiagnostics.tsx` is one of the five new modules, through Settings' static import. It defines a component and a stylesheet; it runs nothing.
- **iOS bytecode** (`npx expo export --platform ios --dump-sourcemap`, as B5 measured): B5 recorded 3,463,508 B at `b19f248`, which has the same app code as `7034bba`. **B7: 3,481,012 B**, +17,504 B (+0.51 %) for the five new modules, and still 9.7 % under NFR-PERF-002's limit of 3,856,208 B. E3 re-measures with the pinned two-platform command.

### 6.5 Device checklist (iPhone, TestFlight build 46): passed

Build 46 is recorded in [B6 §6.6](2026-10-30-phase1-b6-expo-router.md) (EAS `bf625f5c-beb8-4fef-8130-ee0e798417c1`, source `3369418`, submission `a4695d2b-7f17-439b-af67-72bf2d6469b3`, tag `v1.4.0-tf.46`).

**Result: passed on a physical iPhone (2026-10-30, reported by you: "all passes the verifications").** You ran these checks together with B6's and reported them together, not one by one. Items 1–5 are ticked below. Item 6 ran, but its numbers haven't been shared yet (§6.7).

- [x] 1. **Launch looks the same as build 45:** the splash, then the Timer screen; no flash, no layout jump, no delay you can see.
- [x] 2. **The interstitial still comes:** set Focus to 1 minute, complete two focus sessions; the interstitial shows after the 2nd, as in A0 (FR-ADS-001).
- [x] 3. **Check for updates works at once:** cold-start the app, go straight to Settings and tap "Check for updates" within a few seconds. The "You're up to date" alert appears (TestFlight 1.4.0 is newer than the App Store's 1.3.1), and no second alert follows (FR-UPD-001).
- [x] 4. **The credit line is unchanged:** Settings → About, "Made with ❤️ by Mert Efe Sensoy" looks as before; a normal tap does nothing; VoiceOver reads it as text.
- [x] 5. **The hidden panel and the wiring:** a 1.5 s long-press on that line opens "Start-up probe". Its "This launch" line should read `deferred (idle) · active · clock ok`, then two TTIs. **`fallback` instead of `idle`** means `markFirstFrame()` isn't wired (§3.6): stop and report. `clock check failed` or `inactive` don't stop the measurement (§4.1, §4.3); just report what it shows. A second long-press closes it.
- [ ] 6. **The TTI protocol** below, then report the panel's lines and the shared data.

### 6.6 The TTI protocol (you; about 15 minutes)

**Before you start:** the phone charged above 50 %, Low Power Mode off, on the same Wi-Fi throughout, unlocked, and not charging (or charging the whole time: be consistent). Note the iPhone model and the iOS version.

1. **Install** the build from TestFlight and **open it once** (the warm-up launch). Wait until the Timer screen shows.
2. **Open the panel:** Settings → About, long-press the "Made with ❤️" line for 1.5 s.
3. Tap **Alternate**, then **Clear runs** (this drops the warm-up launch).
4. **Kill the app:** swipe up from the bottom edge and pause to open the app switcher, then swipe the app's card up and off the screen.
5. **Wait 10 seconds.**
6. **Tap the app's icon.** Don't touch the screen. When the Timer screen shows, **wait 10 more seconds**: the launch's row is written after its deferred work, and the update check can take up to 5 s.
7. **Repeat 4–6 for 24 launches in all.** The app alternates the arms by itself, 12 each. You can open the panel any time after step 6 of a launch to see the counts; the line "clean for build N" should grow by one per launch.
8. **Read the panel:** under "TTI from probe start", the Deferred and Eager lines (n, median, IQR, range, TTI⁺ median) and the "Eager − deferred" line; then the "From JS bundle start (NFR-PERF-001)" line.
9. Tap **Share data** and send it to yourself (Mail or Notes), so it reaches the PC; paste it to the session or into this record.
10. Tap **Deferred**, to return to the default for the next launches.

If a launch's row is missing (you touched the screen, the app went to the background, a call came in), just do one more launch of that arm: §4.3's rules exclude it, and the panel counts clean runs only.

### 6.7 Results

**Open.** The protocol ran on build 46 (2026-10-30), and you reported it passed, but the panel's lines and its Share data haven't reached this record yet. When they do, record here: device, iOS version, build, then per arm n, median, IQR and range for TTI and TTI⁺, the difference of medians, and the Hodges–Lehmann shift with its 95 % interval; the raw rows in an appendix.

## 7. Findings and open items

**Your decisions (none blocks the merge):**

1. **Does the panel ship in the App Store release?** It is invisible without the long-press, writes nothing until it is opened, and sends nothing anywhere: harmless for users and App Review. It is also E3's tool for the Phase 1 TTI measurement. **Recommendation:** keep it through E3, then decide at E4 whether to remove `HiddenStartupDiagnostics` from Settings (one wrapper and one import; the scheduler stays either way). **Open:** the panel stays in the TestFlight builds through E3, and you decide at E4.
2. **How NFR-PERF-001's 1.0 s is read.** The only TTI this build can measure starts at the JS bundle's start (§4.1). The time before it, from the tap through process start and the native React host to Hermes, isn't visible without Instruments, so without a Mac. **Recommendation:** amend NFR-PERF-001's Verify line to define this interval (proposed text below), and keep the 1.0 s target for it. **Decided 2026-10-30: yes.** The SRS text below was applied at the merge.

**Findings:**

- **F1. The Google Mobile Ads JS is still evaluated at cold start (60 modules)**, through `StatsScreen`'s static `BannerAd` import (DEF-006). B7 defers the SDK's start, not its evaluation. Expo Router (B6) may load route files lazily, which could take it off the path without code; if not, the Stats banner can load lazily once D2 decides DEF-006.
- **F2. The daily reminder is rescheduled on every launch when it is on** (`useReminderScheduler` in `StoreGate`: a permission read, a cancel and a schedule, all native and async). It is functional B3 code (FR-NTF-002) outside B7's file boundary. A later task can register it with `runAfterFirstFrame` too.
- **F3. In RN 0.88 bridgeless, `requestAnimationFrame` is `setTimeout(0)`** (`TimerManager.cpp`). Code that expects rAF to wait for a frame doesn't get that. Nothing in the app relies on it today (the animations run on the UI thread through Reanimated).
- **F4. `requestIdleCallback`'s `timeout` means 10 s + timeout** in RN 0.88 (`getResolvedTimeoutForIdleTask`). Anyone using it with a timeout should know this.
- **F5. On this branch alone, every deferred launch takes the 2 s fallback,** because `markFirstFrame()` is wired at merge (§3.6). Ads and the update check work either way; only the measurement needs the wiring. Wired at the merge (§3.6).

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md), task B7
- [SRS](../srs/SRS.md): NFR-PERF-001, FR-ADS-001, FR-UPD-001
- [B1: lazy Fly Mode](2026-10-29-phase1-b1-lazy-fly-mode.md) (the cold-start module count)
- [B3: Zustand stores](2026-10-30-phase1-b3-zustand-stores.md) (`StoreGate`, the reminder scheduler)
- [Update check](2026-04-17-app-store-update-check.md)
- [Test strategy](../testing/TEST-STRATEGY.md)
- RN 0.88.1 source read for §3.2 and §4.1 (in `node_modules/react-native`): `ReactCommon/react/runtime/TimerManager.cpp` (rAF), `ReactCommon/react/nativemodule/idlecallbacks/NativeIdleCallbacks.cpp` and `ReactCommon/react/renderer/runtimescheduler/RuntimeScheduler_Modern.cpp` (idle tasks and their timeout), `ReactCommon/react/nativemodule/webperformance/NativePerformance.cpp` (`now()`, `getReactNativeStartupTiming`), `ReactCommon/react/runtime/ReactInstance.cpp` (where `APP_STARTUP_START` is logged), `React/Base/RCTPerformanceLogger.mm` (`CACurrentMediaTime`).

## Shared-doc updates to apply at merge

This branch doesn't edit shared docs. Apply each of these when merging, then run `node scripts/docs/check-docs.mjs --write` to regenerate backlinks and `TRACEABILITY.md`. Commit hashes are this branch's; if the merge rewrites them, use the merged ones. Text to paste is in fenced blocks.

**1. `docs/implementations/2026-10-29-phase1-plan.md`, the B7 row, "Done when" column.** Append:

```markdown
<br>**Status, 2026-10-30: code done on `phase1/b7-deferred-startup` (`6ab3953`, `8c6bf3d`, `c4c6ab5`, `e0e8f26`); the TTI measurement waits for the B6+B7 TestFlight build.** `AdManager.init()` and the launch's update check run in one idle callback after the root's first layout (`markFirstFrame()`, called from B6's root layout), with a 2 s fallback. Audio had no cold-start work left after B1. One build gives both numbers: a hidden switch (a 1.5 s long-press on Settings → About's credit line) alternates the pre-B7 and B7 paths per launch, and the panel reports each arm's median TTI and spread. Jest 180/180; lint 0 errors; Reassure counts unchanged; cold-start modules 1,796 → 1,801; iOS bytecode 3,481,012 B. [B7 doc](2026-10-30-phase1-b7-deferred-startup.md).
```

**2. `docs/roadmap/ROADMAP.md`.** Replace the Stage B row `| | B6 Expo Router · B7 deferred start-up work | Not started |` with a B6 row (the parent's text) and this one:

```markdown
| | B7 deferred start-up work: the ads start and the update check after the first frame; an on-device TTI probe with a hidden before/after switch | **Code done** `6ab3953`…`e0e8f26` ([B7](../implementations/2026-10-30-phase1-b7-deferred-startup.md)); TTI measured on the B6+B7 TestFlight build |
```

In the status paragraph at the top, after the B4/B5 sentence, add: "B7's code is done; its TTI measurement rides on the B6+B7 TestFlight build."

**3. `docs/srs/SRS.md`.**

NFR-PERF-001, replace the Target/Status/Verify line with:

```markdown
**Target:** Phase 1 E3 · **Status:** planned (baseline TBD: the B6+B7 TestFlight build measures it with the B7 probe) · **Verify:** D: the B7 start-up probe on a TestFlight build. TTI is the first idle moment after the root's first layout, in ms from the JS bundle's start (`executeJavaScriptBundleEntryPointStart`), the median of ≥ 12 clean cold starts; the B7 before/after comparison uses the same moment measured from the probe's own start, which needs no native marker ([B7 record §4](../implementations/2026-10-30-phase1-b7-deferred-startup.md#4-mathematical--statistical-details)). The native time before the bundle starts isn't measured (no Mac for Instruments). T: `src/startup/__tests__/deferredStartup.test.ts`, `src/startup/__tests__/probeStats.test.ts`, `src/startup/__tests__/StartupDiagnostics.test.tsx` · **Source:** PLAN-REHAUL §6.2, PLAN-PHASE1 B7
```

FR-UPD-001, replace its Verify entry `I: useUpdateCheck.ts` with:

```markdown
**Verify:** I: `useUpdateCheck.ts`; T: `src/hooks/__tests__/useUpdateCheck.test.tsx` (since Phase 1 B7 the launch check runs after the first frame, still once per cold launch; the forced check runs at once)
```

FR-ADS-001, append to its Verify line, after the `timerScreenOverlays` entry:

```markdown
; T: `src/ads/__tests__/adReadiness.test.ts` (the interstitial is loaded by the 2nd completed session after B7's deferred start)
```

**4. `docs/architecture/ARCHITECTURE.md`.**

§8.2, the storage table, add two rows:

```markdown
| `startup_variant_v1` | `STARTUP_VARIANT_KEY` (`src/startup/startupVariant.ts`) | `{ mode: 'deferred' \| 'eager' \| 'alternate', last: 'deferred' \| 'eager' \| null }` | `startupVariant` / the hidden panel, and `alternate` launches | Diagnostics (B7). Written only once the panel has been opened |
| `startup_probe_v1` | `STARTUP_PROBE_KEY` (`src/startup/startupProbe.ts`) | `ProbeRow[]`, newest 40 | `startupProbe` | Diagnostics (B7). Written only once the panel has been opened; leaves the phone only through the panel's Share |
```

The `ThemedApp` description: after "calls `AdManager.init()`", add "(since B7, it and the update check defer their work until after the first frame: `src/startup/deferredStartup.ts`)".

The hooks table, the `useUpdateCheck` row: "Runs once per process on mount (§3)." becomes "Runs once per process, after the first frame (B7; §3)."

The target-state table, the Phase 1 B7 row becomes:

```markdown
| Phase 1 B7 | `AdManager.init` and the launch update check run after the first frame (`src/startup/`); audio had no cold-start work left after B1 | The mount-effect calls in `ThemedApp` | **Done** (`6ab3953`…`e0e8f26`); TTI measured on the B6+B7 TestFlight build |
```

**5. `CHANGELOG.md`, `[Unreleased]`.**

Under **Added**, a new bullet:

```markdown
- **Stage B:** B7, a start-up probe for measuring cold-start time-to-interactive on an iPhone without a Mac: timestamps from the JS bundle's start to the first layout and the first idle moment, and a hidden panel (a 1.5 s long-press on Settings → About's credit line) with a before/after switch, each arm's median and spread, and a share button. It stores nothing until the panel is opened (6ab3953, c4c6ab5).
```

Under **Changed**, after B5's bullet:

```markdown
- **Stage B:** B7, the Google Mobile Ads start and the launch's update check run after the first frame, in one idle callback, instead of during the first render. The interstitial is still loaded long before the 2nd completed session, and "Check for updates" works at once (8c6bf3d).
```

In the Stage B tests bullet, before "Jest runs 134 tests in 26 suites at B5", add "the start-up scheduler, probe and panel, ad readiness after the deferred start, and the deferred update check (6ab3953, 8c6bf3d, c4c6ab5, e0e8f26);", and end the bullet with "Jest runs 134 tests in 26 suites at B5, and 180 in 31 at B7."

**6. `docs/testing/TEST-STRATEGY.md`.**

§3, the bullet listing the exceptions to "mock at the package boundary", add: "`appStorage` in `deferredStartup.test.ts`, which gives every simulated launch the same react-native-mmkv mock instance so stored values outlive `jest.resetModules()` (B7); and `react`, pinned with `jest.doMock` in `useUpdateCheck.test.tsx`, so the hook loaded after a module reset renders with RNTL's React (B7)".

§4, the guards table, add two rows:

```markdown
| `src/startup/__tests__/deferredStartup.test.ts` | Deferred start-up work waits for the first frame, falls back after 2 s, and runs at once in the eager arm; the probe's TTI mark comes before the work (NFR-PERF-001; B7, mutation-checked) | Any change to the root layout or the start-up order |
| `src/ads/__tests__/adReadiness.test.ts`, `src/hooks/__tests__/useUpdateCheck.test.tsx` | With start-up work deferred, the interstitial is ready by the 2nd completed session, and the update check runs once per launch and at once when forced (FR-ADS-001, FR-UPD-001; B7, mutation-checked) | Phase 5's ads rewrite; any change to the start-up order |
```

**7. `docs/README.md`**, the implementation records table, as its first row:

```markdown
| 2026-10-30 | [Phase 1 B7: deferred start-up work and an on-device TTI probe](implementations/2026-10-30-phase1-b7-deferred-startup.md) |
```

**8. `docs/testing/TRACEABILITY.md`** is regenerated by `check-docs.mjs --write`. **The ADR index** doesn't change: B7 adds no ADR (§5).

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- [2026-10-29 — Phase 1 (v1.4): design system and local re-architecture, plan](2026-10-29-phase1-plan.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
