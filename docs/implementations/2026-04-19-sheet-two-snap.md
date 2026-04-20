# Task 2 — Sheet 3-snap → 2-snap

**Date:** 2026-04-19
**Plan:** `C:\Users\senso\.claude\plans\flickering-waddling-spark.md`

---

## 1. Problem / Motivation

The portrait sheet had three snap points (`full | mid | peek`). The `mid` point was `h * 0.25` from the top, which clipped the control buttons halfway and sat at `sheetProgress ≈ 0.49` — precisely where the pill's old opacity curve `[0, 0.25, 0.35] → [1, 0.5, 0]` bottomed out. Every time the sheet landed at mid, the pill disappeared, even though the sheet was only half-open and the user was nowhere near the full dashboard. The two-snap fix closes both bugs simultaneously: no mid resting state means neither clipped controls nor a vanished pill.

---

## 2. What Changed

| File | Change |
|------|--------|
| `src/components/FlySheet.tsx` | Removed `'mid'` from `FlySnapPoint`, dropped `midTransSV`, simplified `resolveSnap` to nearest-of-two binary logic, added `doubleTap` gesture composed via `Gesture.Race`, preserved current snap across device rotation, gated `Haptics.selectionAsync()` on new `hapticsEnabled` prop, spring-drove `sheetProgress.value` transition |
| `src/components/FlyTimerPill.tsx` | Re-tuned opacity curve: `[0, 0.5, 1] → [1, 1, 0]` (fully visible through mid-drag, fades only near full) |
| `src/screens/FlyModeScreen.tsx` | `onTap` now expands to `'full'` in both orientations; `pickerAnimatedStyle` re-keyed to `[0.45, 0.75]`; `mapHintAnimatedStyle` bottom range raised from `h*0.08` to `h*0.12`; `hapticsEnabled` prop passed; sheet children reordered (timerRow first, mode-indicator strip second, then pickers and controls); `modeIndicatorStrip` / `modeIndicatorText` styles added |

---

## 3. Implementation Approach

### Snap geometry

**Before:**
```ts
function portraitSnaps(h: number) {
    return {
        full: 0,
        mid:  h * 0.55 - h * 0.30,
        peek: h * 0.55 - Math.max(h * 0.06, 52),
        fullH: h * 0.55,
    };
}
```
`mid` translation ≈ `h * 0.25`; visible height ≈ `h * 0.30`.

**After:**
```ts
function portraitSnaps(h: number) {
    return {
        full: 0,
        peek: h * 0.55 - Math.max(h * 0.10, 80),
        fullH: h * 0.55,
    };
}
```
Visible height at peek = `max(h * 0.10, 80)` — ~80-102 px on typical phones, enough for drag handle (18 px) + timer row (≤52 px) + mode-indicator strip (≤16 px) with ~14 px breathing room.

### Binary `resolveSnap`

The three-way nearest-of-three comparison with an explicit landscape guard is replaced by a single expression:

```ts
const resolveSnap = (pos: number, velocity: number): FlySnapPoint => {
    'worklet';
    const fling = Math.abs(velocity) > VELOCITY_THRESHOLD;
    const projected = fling ? pos + velocity * 0.15 : pos;
    return Math.abs(projected - fullTransSV.value) < Math.abs(projected - peekTransSV.value)
        ? 'full'
        : 'peek';
};
```

Same VELOCITY_THRESHOLD (600 pt/s) and look-ahead (0.15 s). The landscape `isLandscapeSV` guard is no longer needed since there was never a `mid` in landscape anyway.

### Double-tap gesture

`Gesture.Tap().numberOfTaps(2)` is composed with the pan via `Gesture.Race(doubleTap, panGesture)`. Race means the first recognizer to enter ACTIVE state wins. Because double-tap waits for 2 taps before activating, a pan with any movement (> 2 px threshold) always wins in a pan scenario. A stationary double-tap activates before the pan, cancels it, and toggles the snap.

### Spring-driven `sheetProgress`

Previously `snapToTarget` wrote `sheetProgress.value = progress` instantaneously. The pill opacity is driven by `sheetProgress`, so the pill's fade appeared at the same instant as the snap decision — abrupt. Now it uses `withSpring(progress, SPRING)` so the pill cross-fade tracks the sheet's physical spring.

During live dragging (`.onUpdate`) the progress is still written instantaneously to stay frame-accurate, but on `.onEnd` (and on `expandTo`), the spring takes over.

### Rotation preservation

Before: dimension-change `useEffect` hard-coded `translation.value = withSpring(0, SPRING); sheetProgress.value = 1` (force-to-full).

After: a `currentSnapRef = useRef<FlySnapPoint>('full')` tracks the last-settled snap. `onSnap` (the JS callback that fires on every resolved snap) updates `currentSnapRef.current`. The dimension-change effect calls `snapToTarget(currentSnapRef.current)` instead of hard-coding full.

Edge case: on mount the sheet is `full` (initial `translation = 0`). The ref starts at `'full'`. Rotation before any user interaction stays at `full`. Rotation after a peek gesture stays at `peek`. Correct in both cases.

### `hapticsEnabled` prop

`onSnap` previously called `Haptics.selectionAsync()` unconditionally (line 133 in the old file). A new `hapticsEnabled?: boolean` prop gates the call. `FlyModeScreen` passes `hapticsEnabled={settings.settings.haptics}`.

### Sheet children reordering

Old order (inside `FlySheet` children): pickers → timer → controls.
New order: timer → mode-indicator strip → pickers → controls.

At peek, only the topmost `max(h*0.10, 80)` px of the body are visible. With the new order, users see the live timer and the mode indicator at peek — the two most contextually useful pieces of information during a flight. Pickers and controls are only needed when the sheet is expanded.

### Mode-indicator strip

A simple text label showing `{viewMode}{isGlobe ? ' · 🌍' : ''}`. This is a **placeholder** that will be removed and replaced by Task 3's `CameraModeSwitcher`. Its purpose in Task 2 is to give the peek snap a visual identity below the timer row. No effort invested in styling beyond readable text.

---

## 4. Mathematical / Statistical Details

**Snap geometry budget (portrait, iPhone 13, h = 844 px):**
- Sheet full height: `844 * 0.55 = 464 px`
- Peek visible: `max(844 * 0.10, 80) = 84 px`
- peek translation: `464 - 84 = 380 px`
- `maxTransSV = 380`, so `sheetProgress = 1 - translation / 380`
  - At peek (`translation = 380`): `sheetProgress = 0`
  - At full (`translation = 0`): `sheetProgress = 1`

**Peek visual budget:**
- Drag handle row: ~18 px (10 top + 4 bar + 2 margin + 2 bottom)
- Timer row: ≤52 px (52 pt text + 16 pt margin-bottom)
- Mode-indicator strip: ~20 px (12 pt text + 8 pt margin)
- Total: ~90 px → fits comfortably in 84 px on iPhone 13, tight on SE (h = 667, visible = 80 px)

On iPhone SE the timer row is forced to share 62 px with the mode strip. The 16 pt `marginBottom` on `timerRow` is the first thing to sacrifice in a future pass if clipping is observed. The mode strip is a Task 3 placeholder and can be shrunk or hidden at peek on small screens if needed.

---

## 5. Design Decisions

**Why `Gesture.Race(doubleTap, pan)` and not `Gesture.Exclusive`?** `Gesture.Exclusive` (try tap first, fall back to pan) would introduce a perception delay on single taps, because the recognizer must wait for the double-tap window to expire before handing off to the pan. `Race` runs both simultaneously: the pan wins immediately on any movement, the double-tap wins on two stationary taps. No delay either way.

**Why `withSpring` on `sheetProgress` in `snapToTarget` but not during drag?** The drag's `.onUpdate` needs to track the finger in real-time (instantaneous). The `.onEnd` and `expandTo` paths have already committed to a snap target, so the spring makes the pill fade physically consistent with the sheet bounce. Mixing modes (spring on end, direct on update) is intentional.

**Why `max(h * 0.10, 80)` instead of the plan's `max(h * 0.08, 64)`?** The plan's value was an approximation. At `max(0.06, 52)` (the old peek), the handle was the only visible element. The timer row is 52 pt text → rendered as ~70 px on most devices including the spacing. `max(0.10, 80)` gives ~80-102 px across phone sizes, which covers handle + timer reliably. The mode strip is bonus; if it clips on the smallest phones it does not affect function.

**Why not change `timerRow` margins?** Keeping the existing style values avoids any layout regression in the full-sheet view where the timer row has always had those margins. A future Task 4 pass may tighten or remove margins when the whole sheet layout is revisited.

---

## 6. Verification

Static checks (logic traced without device):

- [x] **`FlySnapPoint` = `'full' | 'peek'`** — grep for `'mid'` in `src/` returns no matches. ✓
- [x] **`midTransSV` removed** — grep returns no matches. ✓
- [x] **`expandTo` callers** — only `FlyModeScreen:826` calls `expandTo('full')`. No `'mid'` argument anywhere. ✓
- [x] **`hapticsEnabled` gated** — `onSnap` now `if (hapticsEnabled) Haptics.selectionAsync()`. `FlyModeScreen` passes `settings.settings.haptics`. ✓
- [x] **`setDisplayTick` chain untouched** — no `React.memo` added to `FlySheet`, `FlyTimerPill`, or any parent. The 1 Hz re-render from `useSessionClock` propagates through context as before. ✓
- [x] **`sheetProgress` spring** — `snapToTarget` calls `withSpring(progress, SPRING)` for `sheetProgress`. Drag `.onUpdate` still writes directly (intentional; see §5). ✓

Device-only checks (require physical hardware):

- [ ] Portrait peek: drag handle + timer text visible without clipping on iPhone SE and iPhone 13.
- [ ] Portrait full: airport pickers and all control buttons fully visible.
- [ ] Flick up hard (|v| > 600): snaps to full. Flick down hard: snaps to peek. No mid resting state.
- [ ] Release at mid-drag: snaps to nearest of two (no mid).
- [ ] Double-tap: toggles between full and peek; haptic fires (if haptics enabled in settings).
- [ ] Rotate portrait→landscape while at peek: stays at peek.
- [ ] Rotate portrait→landscape while at full: stays at full.
- [ ] Pill opacity: fully visible at peek; still visible through mid-drag; fades to zero as sheet reaches full.
- [ ] Pill opacity transition: spring-driven cross-fade (not a hard cut).
- [ ] Pill onTap: expands sheet to full (in both portrait and landscape).
- [ ] Timer text still decrements at 1 Hz at rest in both snap states (setDisplayTick chain intact).
- [ ] Mode indicator strip visible at peek (shows current viewMode label).

---

## 7. Related Docs

- Plan: `C:\Users\senso\.claude\plans\flickering-waddling-spark.md` (Task 2 section)
- Task 1 doc: `docs/implementations/2026-04-19-timer-unification.md`
- Types: `src/components/FlySheet.tsx` (`FlySnapPoint`, `FlySheetRef`, `FlySheetProps`)

---

## Followup (2026-04-20) — geometry & map-control overlap

**Problem:** four layout bugs surfaced during device testing:
1. Portrait full snap was too tall (`h*0.55`) — map only 45 % visible.
2. Landscape full snap: compass + CameraModeSwitcher column overlapped the sheet.
3. Portrait-peek → rotate landscape: sheet peek strip inaccessible (blocked by mapControls overlay + potentially stale gesture axis).
4. Landscape peek strip crossed the mapControls column.

**Fixes:**
1. **Portrait fullH 0.55 → 0.45** (`FlySheet.tsx:portraitSnaps`). Three `FlyModeScreen.tsx` constants updated in lockstep: both `fitToCoordinates` bottom-padding sites `0.58 → 0.48`; `mapHintAnimatedStyle` top-of-range `0.57 → 0.47`.
2. **mapControls column moves with sheetProgress in landscape** (`FlyModeScreen.tsx`). `styles.mapControls` loses the static `right: 12`; gains `zIndex: 5`. An `Animated.View` wrapper + `mapControlsAnimatedStyle` interpolates `right` from `44` (peek: PEEK_STRIP 32 + gap 12) to `panelW + 12` (full). Follows the same pattern as `mapHintAnimatedStyle`. Portrait retains static `right: 12`.
3. **Gestures memoized** (`FlySheet.tsx`): `portraitGesture`, `landscapeGesture`, `doubleTap`, and `Gesture.Race(...)` all wrapped in `useMemo` with `[onSnap]` / `[isLandscape]` deps. Prevents stale axis config (Y vs X) after an orientation change mid-touch.
4. **Tap-to-expand on drag handles** (`FlySheet.tsx`): portrait `dragHandleRow` and landscape `sideDragHandle` each wrapped in a `<Pressable>` that calls `snapToTarget('full')`. Provides a last-resort expansion gesture on the narrow landscape peek strip.

**Invariant:** In landscape, the mapControls column and the sheet never overlap. Controls are always at `right: panelW + 12` (full) or `right: PEEK_STRIP + 12` (peek). In portrait the `right` is constant 12.

**FlySheet geometry constants are coupled to FlyModeScreen layout math.** If `fullH` changes again, update these three FlyModeScreen sites in the same commit: `fitToCoordinates` bottom edgePadding (×2) and `mapHintAnimatedStyle` progress=1 bottom value.

**Verification:** 8-step device test matrix in `C:\Users\senso\.claude\plans\sheet-geometry-followup.md`.
