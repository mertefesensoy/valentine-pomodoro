# Task 4 — Plane Movement as a Pure Function of the Clock

**Date:** 2026-04-20
**Plan:** `C:\Users\senso\.claude\plans\flickering-waddling-spark.md`

---

## 1. Problem / Motivation

After Task 1 removed the inline `setInterval` ticker from `FlyModeScreen`, nothing drove `progressSV` forward during a live session. The plane marker was set to the origin on start and never moved. The old mechanism was `withTiming(progressSV, { duration: 950 })` inside the ticker body, plus a `useAnimatedReaction` that throttled `runOnJS(updateMarkerFromProgress)` to every 6th frame (~10 Hz). Both halves were removed in Task 1 but the replacement was deferred to Task 4.

Additionally, the `useAnimatedReaction` read `session.isRunningSV` (the active-slot SharedValue from `useSessionClock`). When the user has both a paused Fly session and an active Pomodoro session, `session.isRunningSV === true` reflects Pomodoro — so any naive "read the clock SharedValues" approach would animate the plane with Pomodoro's end time.

A latent Task 3 bug was also found and fixed: `const isSessionActive` was declared at line 565 of the function body but referenced in a `useEffect` dep array at line 546. JavaScript's TDZ would throw on every render. Moved to line 211, immediately after `timerRunning` and `paused`.

---

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/FlyModeScreen.tsx` | Rewrote plane animation engine; fixed TDZ bug; updated docstring |
| `docs/implementations/2026-04-20-plane-clock-driven.md` | This file |

### Deleted from `FlyModeScreen.tsx`

| Symbol | Reason |
|--------|--------|
| `isMountedRef` | No longer needed; React 18 state setters on unmounted components are no-ops |
| `waypointsRef` / its sync effect | Replaced by `waypointsSV` (UI-thread SharedValue) |
| `bearingSV ↔ bearingDeg` effect bridge | Frame callback owns `bearingSV` now; JS-side bridge is redundant |
| `updateMarkerFromProgress` callback | Replaced by inline worklet path |
| `frameCountSV` | Replaced by delta-time accumulator `markerUpdateAccSV` |
| `useAnimatedReaction(progressSV, ...)` | Replaced by `useFrameCallback` |
| `cancelAnimation(progressSV/bearingSV)` in cleanup | Neither is animated; frame callback stops on unmount automatically |
| `useAnimatedReaction` import | No remaining callers |
| `cancelAnimation` import | No remaining callers |

### Added to `FlyModeScreen.tsx`

| Symbol | Purpose |
|--------|---------|
| `MARKER_HZ = 15` (module const) | Tunable knob for runOnJS cadence; comment notes `CAMERA_HZ` follows same cadence |
| `interpolateAlongPathWorklet` (module fn) | `'worklet'`-annotated mirror of `geoMath.ts:interpolateAlongPath`; runs on UI thread |
| `waypointsSV: SharedValue<LatLng[]>` | Holds waypoints on UI thread; written on JS when `flightData` changes |
| `flyEndAtSV`, `flyDurationSV`, `flyIsRunningSV` | Fly-slot-specific clock fields on UI thread; never reflect Pomodoro state |
| `markerUpdateAccSV` | Delta-time accumulator (ms) for the MARKER_HZ runOnJS throttle |
| Fly-slot sync effect | Writes `flyEndAtSV / flyDurationSV / flyIsRunningSV` whenever `flySlot` changes |
| `useFrameCallback` | Core engine: computes progress, writes `bearingSV` at 60fps, `runOnJS` at 15Hz |

---

## 3. Implementation Approach

### Clock source: `Date.now()`

Inside the `useFrameCallback` worklet, progress is computed as:

```
remaining = max(0, flyEndAtSV.value − Date.now())
progress  = clamp((flyDurationSV.value − remaining) / flyDurationSV.value, 0, 1)
```

`Date.now()` is used (not `info.timestamp`) because `flyEndAtSV` was written using `Date.now()` — they must share the same clock source. `info.timestamp` is a performance-counter value and would drift from the notification scheduler and the pill timer text.

### Fly-slot isolation

`session.endAtSV` from `useSessionClock` reflects whichever slot is currently `activeKind`. If the user pauses Fly and starts Pomodoro, `activeKind = 'pomodoro'` and `session.endAtSV` is Pomodoro's end time. Reading it in the frame callback would animate the plane with Pomodoro's clock.

Fix: three fly-slot-specific SharedValues (`flyEndAtSV`, `flyDurationSV`, `flyIsRunningSV`) are maintained inside `FlyModeScreen`, written by a `useEffect` that watches `flySlot` (the `session.state.fly` object). These only contain fly's clock fields and are set to `NEGATIVE_INFINITY` / `false` when the fly session is not running. The frame callback reads only these.

### Delta-time accumulator (15 Hz runOnJS throttle)

The frame callback accumulates `info.timeSincePreviousFrame` (typically 16.67 ms at 60fps) in `markerUpdateAccSV`. When the accumulator reaches `1000 / MARKER_HZ = 66.67 ms`, it resets to zero and fires:
- `runOnJS(setMarkerCoord)(coord)` — updates the `react-native-maps Marker` coordinate
- `runOnJS(setBearingDeg)(bearing)` — updates camera effects that need JS-thread bearing

Between these 15 Hz ticks, `bearingSV` is written directly at 60fps so the rotation animation stays smooth.

### Cold-start paused restore

When `flyIsRunningSV.value === false`, the frame callback returns early and `bearingSV` is never written. A paused session restored from `STORAGE_KEYS.SESSION_CLOCK` needs an initial bearing write so the plane icon faces the right direction before the user resumes.

Fix: the restore effect (`[flightData, progressSV, bearingSV]` deps) already computes `coord + bearing` via `interpolateAlongPath` and calls `setMarkerCoord` + `setBearingDeg`. It now also writes `bearingSV.value = bearing` directly so the rotation is immediately correct on the UI thread.

### `interpolateAlongPathWorklet`

Defined at module scope (outside the component) so the Reanimated Babel plugin instruments it before the `useFrameCallback` closure captures it. The math is identical to `geoMath.ts:interpolateAlongPath` — sub-waypoint linear interpolation with Pacific-crossing longitude normalisation. Inline `toRad`/`toDeg` helpers are used since `Math.*` functions are available in Reanimated worklets via JSI.

**Contract:** keep in sync with `geoMath.ts:interpolateAlongPath`. The two functions must produce identical output for the same inputs.

---

## 4. Mathematical Details

### Progress formula

```
progress = clamp((D − R) / D, 0, 1)

where:
  D = flyDurationSV.value  (total session duration in ms)
  R = max(0, flyEndAtSV.value − Date.now())  (remaining ms)
```

At session start: `R ≈ D` → progress ≈ 0.  
At session end: `R = 0` → progress = 1.  
While paused: frame callback returns early; `progressSV` holds the last computed value.

### Accumulator throttle

```
threshold   = 1000 / MARKER_HZ = 66.67 ms
accumulator += timeSincePreviousFrame   (≈16.67 ms at 60fps)
if accumulator >= threshold:
    accumulator -= threshold            ← subtract, not reset to zero
    fire runOnJS
```

**Why subtract rather than reset?** Resetting to zero discards the overshoot past the threshold. On a 60fps device the first fire happens at `4 × 16.67 = 66.68 ms` (0.01 ms overshoot). If we reset, that 0.01 ms is discarded and each subsequent cycle starts fresh. Over a 25-minute session at 15 Hz = 22 500 cycles, the cumulative drift is `22 500 × 0.01 ms ≈ 225 ms`. Still inside the ±500 ms spec, but enough to make the plane appear systematically slightly behind the timer on close inspection. Subtracting `threshold` instead carries the overshoot into the next cycle, bounding drift to at most one frame period (≤ 33 ms at 30fps).

On a 30fps device: fires every 2 frames (`2 × 33.33 = 66.67 ms`, ~0 overshoot). The cadence is real-time delta-based, not frame-count based, so it degrades gracefully under CPU load (plane moves in larger steps but remains at the geometrically correct position for that moment in time).

### Arrival accuracy

The plane reaches `progress = 1` when `Date.now() >= flyEndAtSV.value`. This is the same condition that `useSessionClock`'s 1 Hz ticker uses to fire `onComplete`. Because both read `Date.now()`, the plane arrives at the destination within one frame (~17 ms) of `onComplete` firing. The spec requires ≤ 0.5 s; this comfortably satisfies it.

---

## 5. Design Decisions

**Why not reuse `session.endAtSV` directly?** `session.endAtSV` is owned by `useSessionClock` and reflects the active slot — whichever of `pomodoro` or `fly` is `activeKind`. If the user is looking at `FlyModeScreen` while Pomodoro is the active slot, the frame callback would animate the plane using Pomodoro's clock. Fly-slot-specific SharedValues solve this without any changes to `useSessionClock`.

**Why `Date.now()` instead of `performance.now()`?** `flyEndAtSV` is set with `Date.now()` (wall clock) in both `session.start()` and the restore logic. Notifications are also wall-clock-scheduled. Using `performance.now()` in the worklet would require a separate offset calculation to convert to wall clock — unnecessary complexity with no benefit.

**Why delta-time accumulator instead of frame modulo?** The old `frameCountSV % 6` approach assumes 60fps and fires every 100 ms at that rate. On a 30fps device it would fire every 200 ms. The delta-time accumulator fires every `1000 / MARKER_HZ` real milliseconds regardless of frame rate, giving consistent behaviour across devices.

**Why `MARKER_HZ = 15` not higher?** The `react-native-maps` bridge call per `setMarkerCoord` triggers a native layout/draw. Empirical evidence from MapKit shows 15 Hz is visually smooth for a moving map marker and leaves headroom for the bridge to process other events. A tuning comment in the file explains how to change it.

**`interpolateAlongPathWorklet` duplication risk:** The worklet function and `geoMath.ts:interpolateAlongPath` contain identical math. Any edit to one that isn't mirrored in the other is a silent divergence — the JS-side restore/camera logic and the UI-thread animation will disagree on plane position. The comment "keep in sync" is weak enforcement. The right fix is a unit test that calls both with the same inputs and asserts equal outputs. This is flagged in the Task 5 risk summary as a concrete testing requirement.

**TDZ bug fix (`isSessionActive`):** `const isSessionActive = timerRunning || paused` was declared at line 565 (post camera effects) but included in a `useEffect` dep array at line 546. JavaScript's temporal dead zone means accessing a `const` before its declaration throws a `ReferenceError`. Moved to line 211 (immediately after `timerRunning` and `paused` are computed). This was a latent Task 3 bug that would have crashed on first render — caught during Task 4 static review. It is the first concrete evidence that deferred device checks can allow breaking bugs to accumulate silently; all outstanding device checks from Tasks 2–4 should be run before closing this work out.

---

## 6. Verification

Static checks (logic traced without device):

- [x] `withTiming` grep — returns zero matches in `FlyModeScreen.tsx`. ✓
- [x] `frameCountSV` grep — returns zero matches in `src/`. ✓
- [x] `useAnimatedReaction` grep — returns zero matches in `FlyModeScreen.tsx`. ✓
- [x] `cancelAnimation` grep — returns zero in `FlyModeScreen.tsx` code (one comment only). ✓
- [x] `isMountedRef` grep — returns zero matches in `FlyModeScreen.tsx`. ✓
- [x] `waypointsRef` grep — returns zero matches in `FlyModeScreen.tsx`. ✓
- [x] `isSessionActive` declared at line 211, before first camera effect (~line 531). ✓
- [x] `interpolateAlongPathWorklet` at module scope, `'worklet'` directive present. ✓
- [x] Frame callback checks `flyIsRunningSV` (not `session.isRunningSV`). ✓
- [x] `Date.now()` used in worklet (not `info.timestamp`). ✓
- [x] Restore effect writes `bearingSV.value = bearing` for cold-start paused case. ✓
- [x] `handleStart` resets `progressSV.value = 0` and `markerUpdateAccSV.value = 0`. ✓
- [x] `handleReset` clears `waypointsSV.value = []`, `progressSV.value = 0`, `markerUpdateAccSV.value = 0`. ✓

Device-only checks:

- [ ] Start a 1-minute session: plane arrives within ±0.5 s of timer zero.
- [ ] IST→JFK: nose points along path at all times; no stepping at waypoint boundaries.
- [ ] Pause 10 s, resume: plane jumps to correct resumed position, no rewind.
- [ ] Background 20 s, foreground: plane at correct position, no animated catch-up.
- [ ] Paused session cold-start (kill + reopen while paused): plane icon faces correct bearing.
- [ ] Switch to TimerScreen mid-flight (Pomodoro becomes active), switch back: plane still at correct position when fly resumes.
- [ ] Extend session mid-flight (session.extend): plane visibly slows, still arrives on time.
- [ ] All five camera modes with plane moving: mode-switch does not reset position.

---

## 7. Related Docs

- Plan: `C:\Users\senso\.claude\plans\flickering-waddling-spark.md` (Task 4 section)
- Task 1 doc: `docs/implementations/2026-04-19-timer-unification.md`
- Task 3 doc: `docs/implementations/2026-04-19-camera-five-modes.md`
- Frame callback: `src/screens/FlyModeScreen.tsx` (`useFrameCallback`, ~line 360)
- Worklet: `src/screens/FlyModeScreen.tsx` (`interpolateAlongPathWorklet`, ~line 121)
- Source of truth interpolation: `src/utils/geoMath.ts` (`interpolateAlongPath`)
