# Camera simplification — 5 modes → 3 modes, globe toggle restored

**Date:** 2026-04-20

---

## 1. Problem / Motivation

Task 3 shipped a five-mode camera system (`global | flat | followPlane |
followPath | seeAll`) with a dedicated `CameraModeSwitcher` component.
Three problems surfaced during device testing:

**1a. Globe map type was lost.** Before Task 3, a toggle button in the
sheet header switched the entire map between the `satelliteFlyover`
(3-D globe) and `mutedStandard` (flat stylised) projections — a
high-signal affordance unique to Apple Maps. Task 3 conflated globe
and flat into two separate camera *modes*, so the full-map projection
switch disappeared and only `mutedStandard` was ever used.

**1b. Five modes is over-designed.** `flat` duplicated `followPlane`
with different altitude and zero pitch. `followPath` was `followPlane`
with the camera heading oriented to the path tangent rather than the
plane bearing — negligible difference at flight scale. `global`
duplicated the `seeAll` idle fit. Three modes (`followPlane`, `route`,
`free`) cover the real use-cases without overlap.

**1c. Follow-plane broke in landscape — stale SharedValue sync lag.**
In portrait the bug was invisible; in landscape it was obvious. The
specific failure:

```tsx
// in the followPlane camera effect (pre-fix):
mapRef.current?.setCamera({ heading: bearingDeg, ... }); // MapKit rotates NOW
setMapHeading(bearingDeg);                                // React state → next render
// then, on re-render:
useEffect(() => { mapHeadingSV.value = mapHeading; }, [mapHeading]);
// ^^^^ mapHeadingSV is updated ONE RENDER AFTER setCamera
```

`markerAnimatedStyle` (a Reanimated worklet) reads `mapHeadingSV` at
60 fps. Between `setCamera` and the useEffect write, it reads the
stale previous heading and computes the wrong rotation:

```
rotate = bearingSV.value − mapHeadingSV.value
       = newBearing − oldHeading   ← wrong for ~1 frame every turn
```

In landscape this produced a visible one-frame wedge where the plane
icon was rotated to the old bearing relative to the new camera
orientation.

---

## 2. What Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | `CameraMode` union narrowed from 5 values to `'followPlane' \| 'route' \| 'free'` |
| `src/utils/geoMath.ts` | Removed `pathTangentBearing` (single caller deleted; `interpolateAlongPath` retained) |
| `src/components/CameraModeSwitcher.tsx` | **Deleted** |
| `src/components/FlySheet.tsx` | Added `headerControl?: React.ReactNode` prop; rendered in portrait `headerControlSlot` and landscape `landscapeHeaderControl` |
| `src/screens/FlyModeScreen.tsx` | See §3 for full breakdown |
| `src/screens/FlyModeScreen.tsx` (docstring) | (unchanged; doc reflects final state) |

---

## 3. Implementation Approach

### Three-mode model

| mode | camera behaviour | entered by |
|---|---|---|
| `followPlane` | `setCamera({center: plane, heading: bearingDeg, pitch: 50, altitude: 500_000})` + synchronous `mapHeadingSV.value = bearingDeg` | cycle button, session start, reset |
| `route` (renamed from `seeAll`) | `fitToCoordinates([origin, plane, dest])` at 4 Hz; `fitToCoordinates([origin, dest])` when idle | cycle button |
| `free` | no camera writes; compass reflects whatever heading the user rotated to | auto-entered on pan or rotate; exit via cycle button |

Cycle button progression: `followPlane → route`, `route → followPlane`,
`free → followPlane`. Tapping from free resumes following, which is
always the most expected action when the user is done exploring.

### Synchronous `mapHeadingSV` write (landscape fix)

The root-cause fix is a single line added immediately after
`setCamera({heading: bearingDeg})`:

```tsx
mapHeadingSV.value = bearingDeg;   // synchronous — worklet reads correct value immediately
setMapHeading(bearingDeg);         // still needed — CompassRose reads JS-side mapHeading
```

The useEffect mirror (`mapHeadingSV.value = mapHeading`) is retained as
a safety net; the explicit write in the effect body is now the primary
path so no frame lag occurs.

### Free mode replaces `userInteractingRef` timer

Previously `handlePanDrag` set a boolean ref and cleared it after
4 seconds. Any camera effect that was running checked this flag and
skipped the `setCamera` call while the user was panning. This was
invisible to the user — nothing in the UI indicated why the camera had
stopped following.

Replacing it with `free` mode:

```tsx
const enterFreeMode = useCallback(() => {
    setCameraMode(prev => (prev === 'free' ? prev : 'free'));
}, []);
```

`enterFreeMode` is wired to both `onPanDrag` and `onRegionChange`
(which also fires during pinch/rotate). Camera effects check
`cameraMode !== 'free'` via their existing early-return guards — no
separate `userInteractingRef` guard needed. The cycle button icon
changes to `🖐` and the peek-strip label reads "Free", so the user
can see the state has changed and knows tapping the button will resume
following.

### Globe toggle via `FlySheet.headerControl`

Pre-Task-3, FlySheet accepted a `headerControl?: React.ReactNode` prop
and rendered it beside the drag handle in portrait (absolutely
positioned at `right: 16, top: 6`) and above the side-panel content
in landscape. This prop was removed by Task 3.

Restored with identical semantics. `FlyModeScreen` passes a `Pressable`
globe-toggle button via `headerControl={...}`. The toggle sets
`isGlobe` state, which drives:

```tsx
const mapType: MapType = isGlobe
    ? (Platform.OS === 'ios' ? 'satelliteFlyover' : 'satellite')
    : 'mutedStandard';
```

`isGlobe` is persisted alongside `cameraMode` in `STORAGE_KEYS.FLY_PREFS`.

### FLY_PREFS migration safety

The loaded `cameraMode` is narrowed against `VALID_MODES` before use,
so a device with a pre-existing `'global' | 'flat' | 'followPath' |
'seeAll'` value in FLY_PREFS falls through silently to the new
`followPlane` default rather than crashing or rendering a stale mode.

### Latitude clamp restored

`onRegionChangeComplete` clamps `region.latitude` to `±85` before
calling `setMapRegion`. Without this, after a globe → flat transition
the camera can land near ±89° and Mercator tiling breaks at the poles.
This was present pre-Task-3 but was silently dropped.

---

## 4. Design Decisions

**Why a cycle button instead of the switcher?** The switcher had 5
buttons. Two decision points (`followPlane ↔ route`, exit `free`) do
not justify a dedicated 5-target component occupying 232 px of vertical
real estate. A single cycle button reuses the `mapControlBtn` pattern
that already exists for the compass.

**Why `free` mode auto-entered on pan, not a manual toggle?** The old
4-second timer made the UX confusing: the camera silently resumed
chasing after 4 s, often while the user was still looking at a region
they had panned to. Entering `free` explicitly and requiring the cycle
button to exit makes the handover visible and deliberate.

**Why `route` instead of `seeAll`?** `route` describes what the user
sees (the whole route), not the implementation (`fitToCoordinates`
applied to the `seeAll` viewpoint). Name change only; behaviour is
identical.

**Why keep `cameraModeSV`?** The SharedValue pattern exists for
potential Task 4 UI-thread work. Removing it is riskier than keeping
the 2-line mirror pattern. It was simply retyped from `string` to use
the new 3-value union.

**Why remove `pathTangentBearing`?** Only one caller: the now-deleted
`followPath` branch. `interpolateAlongPath` already returns `bearing`
(the instantaneous bearing between consecutive waypoints), which is
sufficient for `followPlane`. The look-ahead tangent was a minor
visual nicety with no clear UX improvement for the flight scale at
which this app operates (~1 M km altitude).

---

## 5. Verification

Run in this exact order:

1. **`npx tsc --noEmit`** — zero errors. TypeScript surfaces any missed
   `cameraMode === 'flat' | 'global' | 'followPath' | 'seeAll'`
   references.
2. **Fresh launch (portrait)** — Fly Mode opens at world
   `initialRegion`, flat map (`mutedStandard`). Tap 🌍 Globe button
   in sheet header → map converts to satellite flyover 3-D globe.
   Tap 🗺 Flat → returns.
3. **Pick origin + destination** — sheet expands, pickers work
   identically to pre-change.
4. **Start flight** — camera snaps to `followPlane`; cycle button
   appears (✈️). Plane icon rotates to its heading; in landscape
   the plane points up consistently (no 1-frame-off tilt). Compass
   needle tracks north correctly.
5. **Tap cycle (✈️ → 🗺)** — camera zooms out, `fitToCoordinates`
   fires at 4 Hz showing origin + plane + destination.
6. **Pan the map manually** — cycle icon changes to 🖐 (free).
   Camera no longer chases. Peek-strip label reads "Free".
7. **Tap cycle (🖐 → ✈️)** — camera resumes following.
8. **Rotate to landscape while in followPlane mid-flight** — plane
   stays oriented correctly, compass needle correct, sheet &
   mapControls layout correct (Task 2 followup preserved).
9. **Rotate to landscape, tap globe** — satellite flyover renders;
   no crash; no visible clamp failure at high latitudes.
10. **Kill & relaunch** — FLY_PREFS round-trips: `cameraMode` and
    `isGlobe` restored. A pre-existing `cameraMode: 'global'` in
    FLY_PREFS does NOT crash launch; falls back to `followPlane`.
11. **Reset flight** — camera returns to `followPlane`; cycle button
    hides when session ends.
12. **iOS crash regression** — airport-dot `.filter().map()` at the
    MapView children list is untouched; no nil-child crash.

---

## 6. Related Docs

- `docs/implementations/2026-04-19-camera-five-modes.md` — **superseded**
  (see addendum in that file)
- `docs/implementations/2026-04-19-sheet-two-snap.md` — Task 2 context
- `docs/implementations/2026-04-20-mapview-nil-child-fix.md` — preceding
  crash fix whose MapView child structure is preserved here
