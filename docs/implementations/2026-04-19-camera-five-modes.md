# Task 3 — Five Camera Modes (`isGlobe` retired)

**Date:** 2026-04-19
**Plan:** `C:\Users\senso\.claude\plans\flickering-waddling-spark.md`

---

## 1. Problem / Motivation

`FlyModeScreen` previously modelled camera control as `ViewMode = 'overview' | 'chase' | 'route'` plus an orthogonal `isGlobe: boolean`. The two were independent state axes, their interaction was partially implemented (globe + route gave undefined camera behaviour), and the product spec called for five well-defined modes with distinct geometric contracts. The globe toggle lived inside the sheet's header control slot — invisible at peek and confusingly coupled to the mode cycle button on the map overlay.

---

## 2. What Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Added `CameraMode = 'global' \| 'flat' \| 'followPlane' \| 'followPath' \| 'seeAll'` |
| `src/utils/geoMath.ts` | Added `interpolateAlongPath` (extracted from FlyModeScreen inline logic) and `pathTangentBearing` |
| `src/components/CameraModeSwitcher.tsx` | **New** — vertical stack of 5 icon buttons, shows active state, haptic-gated |
| `src/components/FlySheet.tsx` | Removed `headerControl` prop and all its rendering (portrait slot + landscape slot + styles) |
| `src/screens/FlyModeScreen.tsx` | Removed `ViewMode` type, `isGlobe` state, `globeCamera`, `mapType` ternary, `cycleViewMode`, globe lat clamp, `Platform` import, `Camera` import; replaced 2 camera effects with 3 new mode-specific effects; added FLY_PREFS load/persist; replaced view-mode cycle button with `CameraModeSwitcher`; used `interpolateAlongPath` in marker update and restore; updated mode-indicator strip to show `cameraMode` |

---

## 3. Implementation Approach

### Five-mode geometry contract

| Mode | `heading` | `pitch` | Fit / Altitude | Update cadence |
|------|-----------|---------|----------------|----------------|
| `global` | 0 | 0 | `fitToCoordinates([origin, dest])` — static | once on mode entry + origin/destination change |
| `flat` | 0 | 0 | `altitude: 2_500_000` centred on plane | every marker update via `setCamera` |
| `followPlane` | plane bearing | 50 | `altitude: 500_000` | every marker update via `setCamera` (instant) |
| `followPath` | path tangent +1.5 % | 50 | `altitude: 600_000` | every marker update via `setCamera` (instant) |
| `seeAll` | 0 | 0 | `fitToCoordinates([origin, plane, dest])` — dynamic | every marker update, throttled 4 Hz |

`mapType` is now a constant `'mutedStandard'`. The 3D satellite experience (`satelliteFlyover` / `satellite`) is removed with no flag.

### Three camera effects replacing two

**Effect 1 — `global` and `seeAll` idle** (`[cameraMode, origin, destination, isSessionActive]`): fires when in `global` or `seeAll` mode and no session is active, framing both airports. This is the "map of intent" state — user has picked airports, sees the full route.

**Effect 2 — `flat`, `followPlane`, `followPath`** (`[markerCoord, cameraMode, bearingDeg]`): fires on every marker update (≈10 Hz from the `useAnimatedReaction` throttle). Uses `setCamera` (instant, no JS-driven animation) so the map stays locked to the plane without lagging.
- `followPath` reads `progressSV.value` from the JS thread and calls `pathTangentBearing(waypoints, progress, 0.015)` — a 1.5%-of-route lookahead, enough to lead visible curves without over-rotating.
- `setMapHeading(heading)` is called in both `followPlane` and `followPath` so the plane's screen-rotation formula (`bearingDeg - mapHeading`) remains accurate.

**Effect 3 — `seeAll` dynamic** (`[markerCoord, cameraMode]`): 4 Hz guard via `seeAllThrottleRef`. Fits `[origin, markerCoord, destination]` while flying, giving a live "overview" that reframes as the plane moves. `userInteractingRef` guard suppresses the fit for 4 s after the user pans.

### `interpolateAlongPath` extraction

The sub-waypoint interpolation logic was duplicated in `updateMarkerFromProgress` and the paused-session restore effect. Both are now single calls to `interpolateAlongPath(waypoints, progress)` from `geoMath.ts`. The math is identical: fractional index into the waypoints array, linear interpolation of lat/lon, Pacific-crossing normalisation, bearing from lower→upper waypoint.

### `pathTangentBearing`

```
ahead = clamp(progress + lookAhead, 0, 1)
coordA = interpolateAlongPath(wps, progress).coord
coordB = interpolateAlongPath(wps, ahead).coord
return calculateBearing(coordA, coordB)
```

For `followPath`, `mapHeading = pathTangent` and plane screen rotation = `bearingDeg - pathTangent`. On a rightward curve, `pathTangent > bearingDeg` → plane appears slightly left of screen-up, pointing into the curve. This is the correct visual: the path curves right ahead of the plane icon.

### `headerControl` removal

The globe toggle (previously in `FlySheet.headerControl`) is gone with `isGlobe`. Rather than leave an empty slot, the prop is removed from `FlySheetProps` entirely. Portrait `dragHandleRow` reverts to just the drag handle bar. Landscape `sidePanelContent` loses the `landscapeHeaderControl` row. No layout damage: `sidePanelContent` already has `paddingTop: 12`.

### FLY_PREFS persistence

```ts
// Load on mount (independent of SESSION_CLOCK)
load<{ cameraMode?: CameraMode }>(STORAGE_KEYS.FLY_PREFS, {}).then(prefs => {
    if (prefs.cameraMode) setCameraMode(prefs.cameraMode);
});

// Save on change
useEffect(() => {
    save(STORAGE_KEYS.FLY_PREFS, { cameraMode }).catch(() => {});
}, [cameraMode]);
```

A `FLY_PREFS` parse failure falls back to `{}` → `DEFAULT_CAMERA_MODE = 'seeAll'`. `SESSION_CLOCK` is never touched.

`handleReset` sets `setCameraMode(DEFAULT_CAMERA_MODE)` which triggers the save effect, persisting `seeAll` as the post-reset default.

### `CameraModeSwitcher`

Five `Pressable` buttons in a vertical `View` with `gap: 8`. Active button gets `borderColor: accentPrimary`, `borderWidth: 2`, a tinted `backgroundColor`. Tap calls `onSelect(mode)` and haptic-fires if `hapticsEnabled`. Rendered in the existing `mapControls` column below the compass, gated by `isSessionActive && markerCoord`.

---

## 4. Mathematical / Statistical Details

**`followPath` heading vs plane heading:**

- Camera heading at time t = `pathTangentBearing(wps, p(t), 0.015)`
- Plane icon screen rotation = `bearingDeg(t) - mapHeading(t)`
  = `bearingDeg(t) - pathTangent(p(t), 0.015)`

On a straight segment: `pathTangent ≈ bearingDeg` → rotation ≈ 0 → plane points straight up.
On a right curve: `pathTangent > bearingDeg` → rotation < 0 → plane icon points slightly left, curve ahead is straight up. The user's eye follows the upcoming path naturally.

**`lookAhead = 0.015` tuning:**

`lookAhead` is a fraction of the entire route, not of waypoint count. On a 25-minute session `0.015 × 25 min = 22.5 s` of future flight is visible. On a 1-minute session it is `0.9 s`. The tuning question is a screen-space one: "how far ahead should the camera lead a visible curve?" — not a time or waypoint question. `0.015` was chosen because on a visibly curved route like IST→JFK the great circle bends roughly 1.5–2 % per visible map area; this value gives a small but perceptible lead without making the camera feel like it's racing ahead of the plane. If the lead feels too aggressive on short sessions or too subtle on long ones, change this constant (not the waypoint count or session duration).

**`seeAll` throttle budget:**
- After Task 4: marker updates at 15 Hz (`MARKER_HZ`)
- `seeAll` fitToCoordinates calls: max 4 Hz (250 ms guard)
- Native MapKit `fitToCoordinates` with `animated: true` will skip the queued animation if the previous one hasn't settled. 4 Hz is well within the "no perceptible stuttering" budget on modern hardware.

---

## 5. Design Decisions

**Why three effects instead of one big switch?** Each effect has a different dependency array and a different conceptual trigger. Merging them into one `useEffect([markerCoord, cameraMode, origin, destination, isSessionActive, ...])` would cause every dep-change to evaluate all branches — the `seeAll` idle branch would fire during flights, etc. Separate effects with tight dep arrays are more predictable.

**Why `setCamera` (instant) for `flat`/`followPlane`/`followPath`?** `animateCamera` introduces a 300ms JS-driven animation on top of native rendering. At 10 Hz marker updates, the next update fires 100ms later — before the animation resolves. This causes camera "fighting" and stuttering. Instant `setCamera` avoids this entirely.

**Why `fitToCoordinates` with `animated: true` for `seeAll`?** Unlike `followPlane`, `seeAll` doesn't need pixel-perfect instantaneous alignment. The native MapKit spring animation naturally smooths the reframe, making the camera feel like it's "breathing" around the route. The 4 Hz throttle prevents update-flooding.

**Why `lookAhead = 0.015` for `followPath`?** On a 100-waypoint route, 0.015 × 99 ≈ 1.5 waypoints of lookahead. At cruise, the plane covers ≈1 waypoint per 30 s of session time. So 1.5 waypoints ≈ 45 s of future path — enough to smoothly lead a visible curve without the map feeling like it's "racing ahead" of the plane.

**Why keep `userInteractingRef` guard for the new effects?** All three effects check it (or use `fitToCoordinates` which respects user gesture state natively). A user who wants to freely explore the map during a flight shouldn't be fought back to the tracked position every 100 ms.

---

## 6. Verification

Static checks (logic traced without device):

- [x] `isGlobe` grep — returns zero matches in `src/`. ✓
- [x] `viewMode` grep — returns zero matches in `src/`. ✓
- [x] `Platform` grep — returns zero matches in `FlyModeScreen.tsx`. ✓
- [x] `Camera` import — removed from `react-native-maps` import. ✓
- [x] `globeToggle` / `globeToggleText` styles — removed. ✓
- [x] `headerControl` prop — removed from `FlySheetProps`, all rendering slots, and the FlyModeScreen usage. ✓
- [x] `FLY_PREFS` independence — load/save on separate useEffects; no shared catch clause with `SESSION_CLOCK`. ✓
- [x] `interpolateAlongPath` used in both `updateMarkerFromProgress` and the restore effect. ✓

Device-only checks:

- [ ] Cycle through all 5 modes mid-session: timer continuous, plane animation continuous.
- [ ] `global`: route framed static (origin + destination, no plane tracking), heading=0, pitch=0.
- [ ] `flat`: top-down, plane centred, no rotation, no tilt.
- [ ] `followPlane`: plane nose points straight up at all times; SYD→LAX 180° crossing stays correct.
- [ ] `followPath`: on IST→JFK, screen leads the curve — path goes right, map tilts right before the plane does.
- [ ] `seeAll`: map gently reframes as plane moves; origin and destination stay visible; slight lead-time on edge approach.
- [ ] Rotating device mid-session: camera mode preserved (mode not reset).
- [ ] Collapsing/expanding sheet: camera mode preserved.
- [ ] Mode persists across app kill + reopen (FLY_PREFS loaded on mount).
- [ ] Reset sets camera back to `seeAll`; FLY_PREFS updated to `seeAll`.
- [ ] No `isGlobe` toggle visible anywhere in the UI.

---

## 8. Postmortem — nil-child crash exposed by this task

Task 3 did **not** introduce the crash; it exposed a latent bug that
pre-dated it.

**The latent bug:** `visibleAirportMarkers.map((airport) => { if (...) return null; ... return <Marker/>; })` — returning `null` inside a `.map()` used as MapView children produces nil slots in the native child array. `AIRMap.insertReactSubview:atIndex:` inserts each slot into an `NSMutableArray` without nil-filtering, so a nil slot crashes with `[NSMutableArray insertObject:nil atIndex:]`.

**Why Task 3 made it reproducible:** Before Task 3, the globe / view-mode cycle button was unreliable in certain orientations, so users rarely reached the specific state that triggers the crash: both airports selected AND the selected airport visible as a tier-1 dot at the current zoom. Task 3's cleaner session-start flow made this the default path. Every user with a popular airport origin/destination (JFK, LHR, NRT, etc.) at default zoom crashed on mount.

**The fix:** Replaced `return null` inside the `.map()` with a `.filter()` step before `.map()`, so the callback always returns a valid `<Marker>` element. See `docs/implementations/2026-04-20-mapview-nil-child-fix.md`.

**The rule going forward:** MapView children must **never** come from a `.map()` that can return `null`. Always filter first:

```tsx
// WRONG
{list.map(item => { if (skip(item)) return null; return <Marker .../>; })}

// CORRECT
{list.filter(item => !skip(item)).map(item => <Marker .../>)}
```

The `&&` short-circuit pattern (`{cond && <Marker/>}`) is safe for
direct-child positions but must not be used as the body of a `.map()`.

---

## 7. Related Docs

- Plan: `C:\Users\senso\.claude\plans\flickering-waddling-spark.md` (Task 3 section)
- Task 1 doc: `docs/implementations/2026-04-19-timer-unification.md`
- Task 2 doc: `docs/implementations/2026-04-19-sheet-two-snap.md`
- Camera mode type: `src/types/index.ts` (`CameraMode`)
- Geo helpers: `src/utils/geoMath.ts` (`interpolateAlongPath`, `pathTangentBearing`)
- Switcher component: `src/components/CameraModeSwitcher.tsx`

---

## Superseded (2026-04-20)

The five-mode surface introduced by this task was reduced to three modes
on 2026-04-20 — see
`docs/implementations/2026-04-20-camera-simplification.md`.

Removed: `global`, `flat`, `followPath`.
Renamed: `seeAll` → `route` (identical behaviour).
Added: `free` — auto-entered on pan/rotate, replaces the 4-second
`userInteractingRef` suppression timer; exited by tapping the cycle
button.

`CameraModeSwitcher.tsx` was deleted; a single cycle button in the
`mapControls` column replaced it.

`pathTangentBearing` in `geoMath.ts` was removed (no remaining
callers); `interpolateAlongPath` is retained.

`isGlobe` state was restored with the pre-Task-3 globe/flat toggle
button passed via the `FlySheet.headerControl` prop.

A separate bug — plane icon not rotating in landscape followPlane —
was fixed in the same commit. Root cause: `mapHeadingSV` was only
written via a useEffect mirror of `mapHeading`, so `markerAnimatedStyle`
read a stale heading for one frame after every
`setCamera({heading}) / setMapHeading` pair. Fix: write
`mapHeadingSV.value = bearingDeg` synchronously alongside `setCamera`.
