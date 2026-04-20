# Task 1 — Unified Session Clock

**Date:** 2026-04-19
**Plan:** `C:\Users\senso\.claude\plans\flickering-waddling-spark.md`

---

## 1. Problem / Motivation

The app had two independent timers running simultaneously:

- `useTimer.ts` owned a `setInterval(1000)` + `targetEndTime` + `AppState` listener driving the Pomodoro session.
- `FlyModeScreen.tsx` owned a separate `setInterval(1000)` + `targetEndTimeRef` + another `AppState` listener driving the Fly session.

The two clocks were not connected. Both wrote their own `STORAGE_KEYS.TIMER_STATE` and `STORAGE_KEYS.FLY_SESSION` independently. Switching modes did not synchronise them. The `progressSV` SharedValue used `withTiming(progress, { duration: 950 })`, which meant the plane lagged the clock by up to 950 ms.

---

## 2. What Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Added `SessionKind`, `SessionSlot`, `SessionClockState` types |
| `src/utils/storage.ts` | Added `SESSION_CLOCK` and `FLY_PREFS` storage keys; `FLY_SESSION` kept but deprecated |
| `src/hooks/useSessionClock.ts` | **New file** — shared wall-clock primitive with two independent slots; 1 Hz tick drives re-renders |
| `src/context/AppContext.tsx` | Instantiates `useSessionClock` once; exposes `session` on context |
| `src/hooks/useTimer.ts` | Rewritten to delegate clock state to `useSessionClock`; keeps Pomodoro-specific logic |
| `src/screens/TimerScreen.tsx` | Passes `session` as 4th arg to `useTimer`; mode-switch calls `session.switchTo()` |
| `src/screens/FlyModeScreen.tsx` | Deleted inline ticker, `targetEndTimeRef`, `AppState` listener, `FLY_SESSION` save/restore; reads clock from `session` |

---

## 3. Implementation Approach

### Two-slot architecture

`useSessionClock` holds two `SessionSlot` objects — `pomodoro` and `fly` — and an `activeKind` pointer. Only one slot drives the SharedValues and `displayMs` at a time, but the other slot retains its paused state. Switching modes never overwrites the paused slot.

### Single `Date.now()` basis

All timestamps (`endAt`, session scheduling for notifications, notification scheduling) use `Date.now()`. `performance.now()` would give a monotonic counter that cannot be compared to notification fire-times, so it is explicitly rejected. This is documented in the code.

### Idempotent completion

`fireCompletion` guards against double-fire by checking `clockStateRef.current[kind]?.endAt === slot.endAt` before firing. This covers the race between the 1 Hz JS ticker and the `AppState` 'active' listener both detecting the same expired session.

### Notification cancel on mode switch

`useTimer`'s `prevActiveKindRef` effect watches `session.state.activeKind`. When Pomodoro goes dormant (activeKind changes away from `'pomodoro'`), it cancels the scheduled notification. This mirrors the same path as `pause()`. For Fly Mode, a `flyNotifIdRef` is updated via `useEffect` whenever the scheduled notification ID changes, and the unmount cleanup uses it to cancel the notification when the screen unmounts.

### 1 Hz re-render for `displayMs`

The old per-mode tickers (`setTimerState` in `useTimer`, `setRemainingMs` in `FlyModeScreen`) caused a re-render every second so that `displayMs = endAt − Date.now()` was always fresh. Removing those tickers would have frozen the timer text between renders. The fix: `useSessionClock`'s 1 Hz interval calls `setDisplayTick(t => t + 1)` every second while a session is running (not on completion). This nudges React to re-render AppProvider → propagates through context → both `useTimer` and `FlyModeScreen` recompute `displayMs` with a fresh `Date.now()`. The completion branch still calls `fireCompletion`; only the "session is still running" branch calls `setDisplayTick`.

### `onComplete` gated on `kind` argument

Both `useTimer` and `FlyModeScreen` gate their completion handlers on the `kind` argument passed to the callback — not on `session.state.activeKind` which could be stale by the time the async handler runs.

---

## 4. Design Decisions

**Why two slots instead of one?** A single slot would mean switching to Fly Mode loses the paused Pomodoro's `remainingMs`. Two independent slots preserve both sessions concurrently and match user expectation: "I paused my Pomodoro at 15:00, switched to Fly, came back — where is my 15:00?"

**Why `Date.now()` inside Reanimated worklets?** `Date.now()` is callable in Reanimated 3 worklets and shares the same epoch as `endAtSV`. `info.timestamp` in `useFrameCallback` is a performance counter with a different origin and would drift from the notification scheduler. The plan explicitly marks `Date.now()` as the primary path, not a fallback.

**Why keep `FLY_SESSION` storage key?** Removing it could break cold-start restore on devices that have an existing saved session. It's deprecated and will not be written; a future migration can clean it up.

**`SESSION_CLOCK` and `FLY_PREFS` are fully independent.** A corrupt JSON read on one must not touch the other. Each has its own fallback: `SESSION_CLOCK` falls back to `{ activeKind: null, pomodoro: null, fly: null }`; `FLY_PREFS` falls back to `{ cameraMode: 'seeAll' }`.

---

## 5. Mathematical / Statistical Details

**Progress computation (for cold-start paused restore):**

```
progress = clamp(1 - pausedRemainingMs / totalDurationMs, 0, 1)
```

Where `totalDurationMs = flightData.totalSeconds * 1000`. At `remainingMs = 0`, `progress = 1` (destination). At full remaining, `progress = 0` (origin).

**Sub-waypoint interpolation** (unchanged from prior code):

```
exactIdx = progress × (N - 1)          // fractional index along waypoints array
lower    = floor(exactIdx)
upper    = lower + 1
fraction = exactIdx - lower

latitude  = wps[lower].lat + fraction × (wps[upper].lat - wps[lower].lat)
longitude = wps[lower].lon + fraction × normalisedLonDiff
```

Longitude difference is normalised to `[-180, +180]` to prevent Pacific route teleportation.

---

## 6. Verification

Static checks (logic traced without device):

- [x] **Two-slot preservation** — `switchTo('fly')` on a running Pomodoro: `pausedRemainingMs = endAt − Date.now()` saved; slot survives; `useTimer.remainingMs` reads `pausedRemainingMs` on switch-back. ✓
- [x] **Background accuracy** — `endAt` is an absolute `Date.now()` epoch; `displayMs = max(0, endAt − Date.now())` always fresh at render time; AppState listener re-syncs SharedValues on foreground. ✓
- [x] **Completion fires once** — `fireCompletion` guards `clockStateRef.current[kind]?.endAt === slot.endAt`; first call clears the slot; second call (concurrent ticker + AppState) finds `live = null` → returns immediately. ✓
- [x] **grep** — `setInterval | AppState.addEventListener | targetEndTime` appear only in `useSessionClock.ts`. ✓
- [x] **displayMs freeze** — Bug found and fixed: added `setDisplayTick(t => t + 1)` to the 1 Hz interval so consumers re-render every second and `displayMs` is never stale. ✓

Device-only checks (require physical hardware):

- [ ] Pause Pomodoro at 15:00; switch to Fly; run a Fly session to completion; switch back. Pomodoro shows 15:00 paused; Resume works.
- [ ] Start a 1-minute Fly session; background immediately; wait 75 s; return. `onComplete` fires exactly once (stats credited, love note shown).
- [ ] Portrait and landscape: pill renders, reads `session.displayMs`, matches the dashboard timer to within ±1 s.

---

## 7. Related Docs

- Plan: `C:\Users\senso\.claude\plans\flickering-waddling-spark.md` (Tasks 1–5 overview)
- Types: `src/types/index.ts` (`SessionKind`, `SessionSlot`, `SessionClockState`)
- Storage keys: `src/utils/storage.ts` (`SESSION_CLOCK`, `FLY_PREFS`)
