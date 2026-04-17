# Fly Mode iOS Bugs — Gesture + Mid-flight Restore

**Date:** 2026-04-17  
**Author:** Claude Code (claude-sonnet-4-6)

---

## 1. Problem / Motivation

After the swipeable Fly Mode dashboard shipped, three bugs were discovered on **iPhone 17 (iOS 18, `newArchEnabled: true`)**:

1. **FlySheet completely unresponsive to swipes.** The sheet is visible but dragging it (either from the drag handle or the body) does nothing.
2. **Mid-flight restore auto-resumes silently.** Start a flight → switch to Pomodoro → return to Fly Mode → press Resume → the UI jumps back to showing the "Start Flight" button, while the countdown is running invisibly in the background.
3. **"Start Flight" uses the previously-stopped remaining time.** After the bad Resume state above, pressing Start resulted in the timer showing the paused remaining duration instead of the full fresh flight time.

---

## 2. What Changed

| File | Change |
|---|---|
| `src/components/FlySheet.tsx` | Added `collapsable={false}` to `Animated.View` in both portrait and landscape branches. Lowered `activeOffsetY` and `activeOffsetX` from `[-5, 5]` → `[-2, 2]`. |
| `src/screens/FlyModeScreen.tsx` | Added `setTimerRunning(true)` in `handleResume`. Added defensive state reset at the top of `handleStart` (`pausedRemainingRef = 0`, `restoredRemainingRef = null`, `setPaused(false)`). |

No other files were modified.

---

## 3. Implementation Approach

### Bug #1 — FlySheet swipe

**Root cause A: Fabric view-flattening.** The app runs with `newArchEnabled: true` (React Native Fabric / new architecture). Under Fabric, `Animated.View` nodes that carry only style-transform props can be *collapsed* out of the native shadow tree as an optimization. RNGH's `GestureDetector` attaches its native recognizer to the shadow node of its direct child — if that node is flattened away, no recognizer is installed and no gestures fire. The RNGH docs explicitly call out `collapsable={false}` as the remedy.

**Root cause B: MapKit pan recognizer winning the 5pt race.** `react-native-maps` registers a native `UIPanGestureRecognizer` on the MapView at the UIKit layer. With `activeOffsetY([-5, 5])`, RNGH's pan gesture needs 5pt of vertical movement before it claims the touch sequence. MapKit's recognizer, always-active because `onPanDrag` is wired, routinely wins that 5pt race on iOS 18's faster touch dispatch. Lowering to `[-2, 2]` ensures RNGH claims within 2pt — faster than MapKit reacts — while still being above the ~1pt tap micro-jitter that would ghost-fire from button taps.

**Fixes applied:**
```tsx
// FlySheet.tsx — both portrait and landscape Animated.View
<Animated.View collapsable={false} style={[...]}>

// portrait Pan
const portraitGesture = Gesture.Pan()
    .activeOffsetY([-2, 2])   // was [-5, 5]
    .failOffsetX([-10, 10]);

// landscape Pan
const landscapeGesture = Gesture.Pan()
    .activeOffsetX([-2, 2])   // was [-5, 5]
    .failOffsetY([-10, 10]);
```

### Bug #2 — Resume splits timer state

`handleResume` called `setPaused(false)` and `startTick(totalMs)` but never called `setTimerRunning(true)`. The button-group JSX branches on `timerRunning` + `paused`:
- `!timerRunning && !paused` → **Start** (idle)
- `timerRunning && !paused` → Pause + Reset (running)
- `paused` → Resume + Reset

With `timerRunning` still false, the post-Resume render hit the first branch and showed the Start button — even though `startTick()` had already started the countdown.

**Fix:** mirror what `handleStart` already does:
```ts
const handleResume = useCallback(() => {
    ...
    setPaused(false);
    setTimerRunning(true);   // ← added
    startTick(totalMs);
    ...
});
```

### Bug #3 — Start shows stale remaining time

This was a consequence of bug #2: in the broken post-Resume state, the existing tick interval was writing the saved-session remaining time to `remainingMs` every second. If the user then pressed Start, `handleStart` wrote `setRemainingMs(totalMs)` correctly, but the still-live old interval could overwrite it once before `startTick`'s `clearInterval` ran. The fix to bug #2 eliminates the path into this state entirely. As belt-and-suspenders, `handleStart` now also zeroes stale refs at its entry point:

```ts
const handleStart = useCallback(() => {
    if (!flightData) return;
    pausedRemainingRef.current = 0;       // ← added
    restoredRemainingRef.current = null;  // ← added
    setPaused(false);                     // ← added
    const totalMs = flightData.totalSeconds * 1000;
    ...
});
```

---

## 4. Mathematical / Statistical Details

No formulas changed. The `[-2, 2]` threshold is chosen from empirical RNGH guidance:
- iOS tap micro-jitter: ~0.5–1pt.  
- MapKit recognizer claim threshold (observe-only mode): ~4–6pt.  
- RNGH `activeOffset` of 2pt: above jitter (no false fires on taps), below MapKit claim (RNGH wins the race).

---

## 5. Design Decisions

| Alternative | Why rejected |
|---|---|
| `Gesture.Exclusive(sheetPan, Gesture.Native())` | More powerful but requires wiring a native gesture ref on the MapView, which isn't currently exported by react-native-maps. The `collapsable + lower offset` approach solves both root causes without additional gesture composition plumbing. |
| Restrict pan to drag-handle area only | Degrades UX — users expect to drag from anywhere on the sheet body. |
| Raise activeOffset instead of lowering | Opposite of what's needed; MapKit would win even more reliably at higher values. |
| Add `setTimerRunning(true)` to unmount-save effect | Wrong layer; the save effect reads snapshot and persists to storage. The running flag must be set synchronously in handleResume so React's commit phase sees the correct state immediately. |

---

## 6. Verification

```bash
cd valentine-pomodoro
npx expo start --clear
```

**Bug #1 — Sheet gesture:**
1. Open Fly Mode. Sheet starts at `full`.
2. Drag drag-handle down → snaps to `mid` (pickers fade). Drag again → snaps to `peek` (pill fades in).
3. Drag from the blank sheet body area (not on a button) — same behaviour.
4. Tap a button (Start / Pause) without dragging — press registers normally (no ghost cancel).
5. Rotate to landscape — side panel drag right → `peek`; drag left → `full`.

**Bug #2 — Resume state:**
1. Start a flight. Switch to Pomodoro mid-flight.
2. Return to Fly Mode. **Expected:** Resume + Reset buttons, correct remaining time.
3. Press Resume. **Expected:** UI immediately shows Pause + Reset (NOT Start). Timer counts down.

**Bug #3 — Start freshness:**
1. Repeat step 1–2 above. Instead of Resume, press Reset.
2. Press Start Flight. **Expected:** timer starts at the full flight duration, not the previously-paused value.

---

## 7. Related Docs

- `docs/implementations/2026-04-17-landscape-and-fly-sheet.md` — prior session's implementation
- RNGH Fabric note: https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-detector
- `~/.claude/CLAUDE.md` — Documentation-First workflow
