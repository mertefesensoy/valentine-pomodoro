---
id: IMPL-2026-10-30-phase1-b7-deferred-startup
title: "Phase 1 B7: deferred start-up work, and an on-device TTI probe"
status: draft
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-29-phase1-b1-lazy-fly-mode, IMPL-2026-10-30-phase1-b3-zustand-stores, SRS]
---

# 2026-10-30 — Phase 1 B7: deferred start-up work, and an on-device TTI probe

**Status:** Plan. Written before any code; §2 and §6 are filled in as the work lands.
**Branch:** `phase1/b7-deferred-startup` (worktree `C:\vp\b7`, cut from `rehaul/v2` at `7034bba`). The parent session merges it after B6 (Expo Router).
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B7.

---

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

To be filled in when the code lands.

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

Every launch keeps a few timestamps in memory. They are written to MMKV (`startup_probe_v1`, the newest 40 launches) only once the hidden panel has been opened (the setting key exists), so ordinary users write nothing. Each write happens after the interactive mark, never on the critical path: once when the deferred work has finished, and once more if a later mark arrives (the interstitial loading).

Each launch's row holds:
- `id` (wall-clock ms at the probe's first use), the arm, the drain trigger (`idle`, `idle-timeout`, `fallback` or `eager`), the app version and build number, whether storage was already migrated, and the `AppState` at the interactive mark;
- marks in ms on the clock of §4.1: `jsStart` (the native bundle-start marker), `probeInit`, `firstLayout`, `interactive`, `drainEnd`, each task's start and end (`ads.init`, `update.check`), and `ads.loaded` (the first interstitial loaded).

The marks are defined in §4.1.

### 3.5 The hidden panel (`src/startup/StartupDiagnostics.tsx`)

- Settings → About: a **1.5 s long-press on the "Made with ❤️" line** opens a small panel under it. The line itself is unchanged: the wrapper is a `Pressable` with no style and no feedback, marked not accessible, so VoiceOver reads the line as before.
- The panel shows this launch's marks, the arm for the next launches (Deferred, Alternate, Eager), and each arm's summary (§4.2) for this build. Two buttons: **Share data** (the rows as JSON, through the system share sheet, so they reach the PC without a Mac) and **Clear runs**.
- The panel's state lives in its own component, so `SettingsScreen` gains no state (its Reassure count must stay 2).
- `SettingsScreen` is the one call-site change outside the two lines: an import and the wrapper around one `<Text>`.

### 3.6 What the parent adds at merge

`markFirstFrame()` must be called once the root view has laid out. In B6's root layout (`app/_layout.tsx`), on the outermost view:

```tsx
import { markFirstFrame } from '../src/startup/deferredStartup';
// …
<GestureHandlerRootView style={{ flex: 1 }} onLayout={markFirstFrame}>
```

If B6's root has no such view, the alternative is to call `markFirstFrame()` where B6 calls `SplashScreen.hideAsync()`. Either way, a deferred launch whose trigger is `fallback` means the call is missing.

## 4. Mathematical / Statistical Details

### 4.1 The clock and the marks

All marks are `performance.now()` values, in ms. In RN 0.88 that is `HighResTimeStamp::now()`, a `steady_clock` reading since boot (`NativePerformance.cpp`, whose comment says so). The native start-up markers in `performance.rnStartupTiming` are written on iOS by `RCTPerformanceLogger` as `CACurrentMediaTime() × 1000`, also time since boot. The two should be on one clock. The probe checks that per launch rather than assuming it:

$$\text{clockOk} \iff b_0 \le p_0 \le b_1$$

where $b_0$ = `executeJavaScriptBundleEntryPointStart` (the bundle starts evaluating), $b_1$ = `endTime` (it has finished) and $p_0$ = the probe's first `performance.now()`, taken while the bundle evaluates. A launch failing the check is excluded (§4.3).

Every mark is reported relative to $b_0$:

| Symbol | Mark | Meaning |
|--------|------|---------|
| $b_0$ | `jsStart` | Hermes starts evaluating the bundle. **Time 0.** |
| $L$ | `firstLayout` | JS handles the root view's first `onLayout`: the first frame's layout is done. |
| $I$ | `interactive` | The first idle callback registered at $L$ runs: no higher-priority JS work is queued, so a touch would be handled at once. |
| $D$ | `drainEnd` | The synchronous part of the drained tasks has returned (deferred arm). In the eager arm the tasks ran before $L$, so $D$ is undefined there. |

**The primary metric is $\text{TTI} = I - b_0$.** A secondary one, $\text{TTI}^{+} = \max(I, D) - b_0$, charges the deferred arm for its own work too, so the comparison can't be won by measuring just before that work starts.

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

Let $x_1..x_m$ be the deferred arm's TTIs and $y_1..y_n$ the eager arm's.

- **Difference of medians:** $\Delta = \operatorname{median}(y) - \operatorname{median}(x)$. Positive means B7 made start-up faster.
- **Hodges–Lehmann shift**, a robust estimate of how far one distribution sits from the other: the median of all $mn$ pairwise differences $d_{ij} = y_i - x_j$.
- **Its 95 % confidence interval:** the $K$-th smallest and $K$-th largest $d_{ij}$, with
  $$K = \left\lfloor \frac{mn}{2} - 1.96\sqrt{\frac{mn(m+n+1)}{12}} \right\rfloor$$
  (the normal approximation to the Mann–Whitney $U$ distribution). For $m = n = 12$: $K = \lfloor 72 - 1.96\sqrt{300} \rfloor = \lfloor 38.05 \rfloor = 38$, so the interval runs from the 38th to the 107th of the 144 sorted differences. This matches the exact table: the two-sided 5 % critical value of $U$ for 12 and 12 is 37, and $K = U_{\text{crit}} + 1$.
- **Reading it, decided before measuring:** if the interval lies above 0, B7 shortened TTI; if it contains 0, there is no measurable difference at this sample size, and the record says so. Either way B7's done-criterion (TTI measured before and after) is met; the code stays, because it moves work off the start-up path at no cost to FR-ADS-001 or FR-UPD-001.

**Sample size: 12 cold starts per arm**, 24 in all, alternated by the app (`alternate`), so slow drift (temperature, background indexing after an install, the network) falls on both arms alike. 12 is the smallest size whose interval above is not just the outermost differences, and 24 launches take about 10 minutes.

**A launch is excluded** (rules fixed before measuring) when any of these hold:
1. the clock check of §4.1 fails;
2. storage wasn't migrated at launch (the one-time B2 copy ran);
3. it has no interactive mark (killed or sent to the background before the first idle moment);
4. `AppState` at $I$ wasn't `active`;
5. a deferred launch's trigger was `fallback` (the first-frame signal is missing: fix the wiring, rebuild, and measure again);
6. its build number differs from the build under test.

The first launch after installing pays one-time costs (a cold file cache, iOS's first-launch work), so the protocol (§6) clears the runs after it.

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

To be filled in as the work lands: local gates, the scheduler and readiness tests, Reassure, the cold-start module list, and the device checklist with the TTI protocol.

## 7. Findings and open items

To be filled in.

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md), task B7
- [SRS](../srs/SRS.md): NFR-PERF-001, FR-ADS-001, FR-UPD-001
- [B1: lazy Fly Mode](2026-10-29-phase1-b1-lazy-fly-mode.md) (the cold-start module count)
- [B3: Zustand stores](2026-10-30-phase1-b3-zustand-stores.md) (`StoreGate`, the reminder scheduler)
- [Update check](2026-04-17-app-store-update-check.md)
- [Test strategy](../testing/TEST-STRATEGY.md)

## Backlinks
<!-- backlinks:start -->
<!-- backlinks:end -->
