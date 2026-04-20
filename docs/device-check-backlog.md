# Device Check Backlog

Outstanding manual device checks from Tasks 2–4.
Run on a physical device (iOS required for MapKit; Android for bridge-behavior parity).
Check each box only after verifying on device — static review does not count.

---

## Task 1 — Unified Session Clock

- [ ] Start a 25-min Pomodoro session, switch to Fly Mode, start a Fly session. Both timers match to within ±0.5 s at every point.
- [ ] Pause 10 s, resume. Elapsed time unchanged by the pause.
- [ ] Background the app for 30 s, return. Timer reflects real elapsed time immediately (no animated catch-up).
- [ ] **Warm-return completion:** start a 1-min Fly session, background immediately, wait 75 s, return. `onComplete` fires exactly once; stats credited, love note shown, notification did not double-fire.
- [ ] **Two-slot preservation:** pause Pomodoro at 15:00, switch to Fly, run and finish a Fly session, switch back. Pomodoro dashboard shows 15:00 paused; Resume works.
- [ ] Portrait and landscape: overlay pill renders, values match the dashboard timer.

---

## Task 2 — Sheet Two-Snap

- [ ] Portrait `peek`: handle + timer + mode-indicator strip visible with no clipping.
- [ ] Portrait `full`: all dashboard controls fully visible, no bottom clip.
- [ ] No resting state other than `peek` or `full` after any drag release.
- [ ] Slow drag to mid-travel, release: snaps to nearest (not stuck).
- [ ] Flick up: snaps to `full`. Flick down: snaps to `peek`.
- [ ] Double-tap the drag handle: toggles between `full` and `peek`.
- [ ] Haptic fires on each snap **only** when `Settings → Haptics` is on; silent when off.
- [ ] Rotate device while at `peek`: stays at `peek` after rotation (no force-reset to `full`).
- [ ] Rotate device while at `full`: stays at `full`.
- [ ] Pill opacity: fully visible at `peek` (`sheetProgress ≈ 0`), fully visible mid-drag (`sheetProgress ≈ 0.5`), faded out at `full` (`sheetProgress ≈ 1`). Cross-fade is spring-driven (not a jump).
- [ ] Timer text decrements continuously at both snap positions (proves `setDisplayTick` re-render chain survived the sheet refactor).

---

## Task 3 — Five Camera Modes

- [ ] Cycle through all five modes mid-session: timer continues uninterrupted, plane animation continues.
- [ ] **`global`**: route framed statically (origin + destination visible), heading = north, pitch = 0, plane not tracked.
- [ ] **`flat`**: top-down, north-up, plane centred, no tilt.
- [ ] **`followPlane`**: plane points straight up at all times. Verify specifically on SYD→LAX (180° meridian crossing — plane nose must not flip).
- [ ] **`followPath`**: on a visibly curved route (IST→JFK), the screen's forward direction leads the path — the curve appears ahead of the plane icon rather than behind it.
- [ ] **`seeAll`**: map gently reframes as plane moves; origin and destination remain visible; no stutter.
- [ ] Rotate device mid-session: selected camera mode preserved.
- [ ] Collapse sheet to `peek`, expand back to `full`: camera mode preserved.
- [ ] Kill app while in Fly Mode with a non-default camera mode; reopen: mode restored from `FLY_PREFS`.
- [ ] Reset button: camera mode reverts to `seeAll`; `FLY_PREFS` updated (verify on next cold start).
- [ ] No globe toggle visible anywhere in the UI.

---

## Task 4 — Clock-Driven Plane Movement

- [ ] **Arrival accuracy**: start a 1-min session, measure with a stopwatch. Plane arrives at destination within ±0.5 s of timer reaching 00:00.
- [ ] **Path accuracy**: IST→JFK route. Plane nose points along the great-circle path at all times; no visible stepping at waypoint segment boundaries.
- [ ] **Pause/resume continuity**: pause mid-flight for 10 s, resume. Plane is at the correct position; no jump forward or backward.
- [ ] **Background accuracy**: start a flight, background the app for 20 s, foreground. Plane is at the geometrically correct position; no animated catch-up, no reset to origin.
- [ ] **Cold-start paused restore**: start a flight, pause, kill the app, reopen. Plane marker appears at the correct paused position and faces the correct bearing.
- [ ] **Slot isolation**: start a Fly session, switch to TimerScreen (Pomodoro becomes `activeKind`), switch back to Fly. Fly slot progress is preserved; plane continues from where it was.
- [ ] **Session extend** (requires calling `session.extend()` via a dev tool or test UI): mid-flight, extend by 5 min. Plane visibly slows; still arrives at the destination when the new timer expires.
- [ ] **Camera mode continuity**: switch camera modes while the plane is in motion. Position and bearing are continuous through the switch (no reset to origin or bearing jump).

---

## Regression Gates (run before any of the above is considered done)

These cover the `useSessionClock` core. If any fail, stop and fix before proceeding.

- [ ] Full Pomodoro focus → short break → focus cycle. Phase cycling, love note, stats all fire correctly.
- [ ] Stats screen shows correct focus-minute attribution for sessions run in both modes.
- [ ] No `setInterval`, `targetEndTime`, `AppState.addEventListener` references outside `useSessionClock.ts` (grep check — confirm the inline ticker is truly gone).
