# Device Check Backlog

Outstanding manual device checks from Tasks 1–4 plus crash-fix regression.
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

**Followup (2026-04-20) — geometry & map-control overlap:**

- [ ] **Portrait full height:** map shows ≥ 55 % of screen height at full snap (sheet is 45 % of viewport, not 55 %).
- [ ] **Landscape full — no overlap:** compass + camera-cycle button sit to the LEFT of the sheet's left edge; no button is covered by the sheet.
- [ ] **Landscape peek — no overlap:** with sheet at peek, compass column sits 44 pt left of the 32 pt peek strip, fully tappable.
- [ ] **mapControls slides with sheetProgress (landscape):** collapse sheet from full to peek; compass + cycle button animate rightward into their peek position, never crossing the sheet.
- [ ] **Rotation mid-touch safety (gesture memo):** begin a portrait drag, rotate mid-drag, complete the drag — no stuck sheet; no gesture axis confusion.
- [ ] **Tap-to-expand (portrait):** at peek, tap the drag-handle bar — sheet expands to full.
- [ ] **Tap-to-expand (landscape):** at peek (32 pt strip), tap the vertical drag-handle bar — sheet expands to full.
- [ ] **iPhone SE 3rd gen content fit:** at portrait full on a 667 pt device, Start button fully tappable without bottom clipping.

---

## Task 3 — Camera Modes (3-mode) + Globe Toggle

Current camera surface: `followPlane | route | free` (plus an `isGlobe` map-type toggle). Single cycle button in the mapControls column replaces the deleted `CameraModeSwitcher`.

- [ ] **Globe toggle (portrait):** Tap 🌍 Globe in the sheet header — map converts to satellite flyover 3-D globe. Tap 🗺 Flat — returns to `mutedStandard`.
- [ ] **Globe toggle (landscape):** Same toggle appears at the top of the side panel; same behaviour.
- [ ] **Session start default:** Start a flight — camera snaps to `followPlane`; cycle button appears with ✈️ icon.
- [ ] **`followPlane` plane rotation (portrait):** Plane icon's nose points up continuously as the heading changes; no one-frame wedge on turns.
- [ ] **`followPlane` plane rotation (landscape):** Same — no one-frame-off tilt (the bug the synchronous `mapHeadingSV` write fixes; invisible in portrait, obvious in landscape).
- [ ] **SYD→LAX meridian crossing:** Fly a session that crosses the 180° meridian. Plane nose stays up, does not flip.
- [ ] **Compass tracks north:** Needle rotates opposite to the map as camera heading changes; stays accurate through turns.
- [ ] **Cycle ✈️ → 🗺 (route mode):** Tap cycle — camera pulls out, `fitToCoordinates` reframes to show origin + plane + destination at ≈ 4 Hz. No stutter.
- [ ] **`route` mode on IST→JFK:** Over a long curved route, the reframe gently moves with the plane; origin and destination stay visible throughout.
- [ ] **Pan enters `free` mode:** While in `followPlane` or `route`, drag the map manually — cycle icon flips to 🖐, peek strip reads "Free", camera stops chasing.
- [ ] **Pinch / rotate enters `free` mode:** Same via gesture — `onRegionChange` also triggers `free`.
- [ ] **Cycle 🖐 → ✈️:** From `free`, tapping cycle returns to `followPlane`; camera resumes chasing.
- [ ] **Cycle ✈️ ↔ 🗺 skips `free`:** Cycling from `followPlane` or `route` never enters `free` (only manual pan / rotate does).
- [ ] **No `CameraModeSwitcher` visible:** mapControls column contains only the compass and the single cycle button.
- [ ] **Rotate mid-session:** Camera mode preserved through orientation change.
- [ ] **Sheet collapse/expand:** Camera mode preserved through sheet snap changes.
- [ ] **FLY_PREFS round-trip:** Kill the app while in `route` with `isGlobe = true`; reopen — both restored.
- [ ] **FLY_PREFS migration safety:** On a device with a pre-existing `cameraMode: 'global' | 'flat' | 'followPath' | 'seeAll'` in `FLY_PREFS` (edit via dev tool or simulate), launching does NOT crash and falls back to `followPlane` silently.
- [ ] **Reset defaults:** Reset a session — camera returns to `followPlane`; cycle button hides when `isSessionActive` is false.
- [ ] **Latitude ±85 clamp:** Pan toward the north pole in `free` mode — map clamps at ≈85° latitude; no Mercator rendering failure at the pole. Same for south.
- [ ] **Peek-strip label:** The mode-indicator text reads `Following` / `Route` / `Free`, with ` · 🌍` suffix iff globe is on.

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

## Crash-fix regressions (AIRMap nil-subview)

Source: `docs/implementations/2026-04-20-mapview-nil-child-fix.md`. These repro a TestFlight 1.3.1 (39) native crash on iPhone 17 Pro, iOS 26.3.

- [ ] **Select a tier-1 airport as origin** (JFK, LHR, NRT, HND). MapView mounts without native crash. The dedicated origin pin renders; the airport does NOT also appear as a tier-1 dot underneath it.
- [ ] **Select the same or another tier-1 airport as destination.** Same — no duplicate dot, no crash.
- [ ] **Start + run a session end-to-end with two tier-1 airports.** Plane animates through; no mid-flight crash as dots enter and leave `visibleAirportMarkers`.
- [ ] **Reset + re-pick the same airports.** Cycle works repeatedly; no crash on repeat mount.

---

## Regression Gates (run before any of the above is considered done)

These cover the `useSessionClock` core. If any fail, stop and fix before proceeding.

- [ ] Full Pomodoro focus → short break → focus cycle. Phase cycling, love note, stats all fire correctly.
- [ ] Stats screen shows correct focus-minute attribution for sessions run in both modes.
- [ ] No `setInterval`, `targetEndTime`, `AppState.addEventListener` references outside `useSessionClock.ts` (grep check — confirm the inline ticker is truly gone).
