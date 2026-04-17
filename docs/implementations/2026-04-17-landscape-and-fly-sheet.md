# Landscape Polish + Swipeable Fly Mode Dashboard

**Date:** 2026-04-17  
**Author:** Claude Code (claude-sonnet-4-6)

---

## 1. Problem / Motivation

Two gaps existed on the shipped branch:

**Landscape orientation was unreliable across the app.**  
`app.json` allows rotation (`"orientation": "default"`), but only `TimerScreen` had partial landscape awareness — and even that had regressions: content clipped on short viewports (no `ScrollView`), fixed margins between sections, no `SafeAreaView` for notches, and the timer ring capped at 220px. `SettingsScreen` and `LoveNotesScreen` lacked `KeyboardAvoidingView`, so the on-screen keyboard hid inputs in landscape. `StatsScreen` used a fixed-size AdMob banner that clipped in landscape.

**Fly Mode's bottom dashboard was static and broke in landscape.**  
`FlyModeScreen` hardcoded `maxHeight: height * 0.45` with no swipe gesture, no snap points, and no scroll. `mapHint` was positioned at `bottom: '46%'` — a hardcoded coupling to the portrait card footprint. `fitToCoordinates` edge padding used `height * 0.50` regardless of orientation. The user wanted to swipe the dashboard down to reveal the full map with a floating timer pill at the top.

---

## 2. What Changed

| File | Change |
|---|---|
| `src/App.tsx` | Wrapped root in `GestureHandlerRootView` + `SafeAreaProvider` — required for RNGH gestures and `useSafeAreaInsets` everywhere |
| `src/hooks/useResponsive.ts` | **NEW** — shared `{ width, height, isLandscape, isTablet, isShortViewport }` hook replacing per-screen inline derivations |
| `src/components/CircularProgress.tsx` | Made `strokeWidth` optional; defaults to `Math.round(size * 0.055)` so the ring stays proportional at tablet sizes |
| `src/screens/TimerScreen.tsx` | Added `ScrollView` so content doesn't clip in landscape; tighter margins when `isLandscape || isShortViewport`; larger ring cap; `useSafeAreaInsets` for notch clearance |
| `src/screens/StatsScreen.tsx` | `ANCHORED_ADAPTIVE_BANNER` for landscape-adaptive ad; `maxWidth: 720` tablet wrapper |
| `src/screens/SettingsScreen.tsx` | `KeyboardAvoidingView` around ScrollView so duration inputs stay above keyboard in landscape; `maxWidth: 720` tablet wrapper |
| `src/screens/LoveNotesScreen.tsx` | `KeyboardAvoidingView` + inner `ScrollView` inside the add/edit modal; `maxWidth: 720` tablet wrapper for list |
| `src/components/FlyTimerPill.tsx` | **NEW** — floating pill that fades in at peek snap; shows remaining time + tap to re-expand sheet |
| `src/components/FlySheet.tsx` | **NEW** — 3-snap swipeable container: bottom sheet in portrait, right-side panel in landscape |
| `src/screens/FlyModeScreen.tsx` | Replaced static card with `FlySheet`; bound `mapHint` and `fitToCoordinates` to sheet progress; added `FlyTimerPill` |

---

## 3. Implementation Approach

### App root

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider>
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
```

`GestureHandlerRootView` is mandatory — RNGH gestures are silently ignored without it. `SafeAreaProvider` makes `useSafeAreaInsets` return correct values instead of `{ top: 0, ... }` on iOS.

### FlySheet — snap geometry

The sheet uses a single `translation` SharedValue (`translateY` in portrait, `translateX` in landscape). Snap targets are computed from viewport dimensions:

**Portrait:**
- Full: `translateY = 0` (sheet occupies top 55% of viewport)
- Mid: `translateY = fullH − midH` where `midH = h × 0.30`
- Peek: `translateY = fullH − peekH` where `peekH = max(h × 0.06, 52)`

**Landscape (right-side panel):**
- Full: `translateX = 0` (panel at `min(w × 0.42, 400)` width)
- Peek: `translateX = panelW − 32` (32px strip with drag handle visible)

Snap targets are stored as SharedValues (`fullTransSV`, `midTransSV`, `peekTransSV`) so gesture worklets always read the current values without capturing stale closures. They are recalculated in a `useEffect` that runs on `[isLandscape, viewportWidth, viewportHeight]`, which also resets the sheet to full.

### FlySheet — gesture

Portrait uses `Gesture.Pan().activeOffsetY([-5, 5]).failOffsetX([-10, 10])`.  
Landscape uses `Gesture.Pan().activeOffsetX([-5, 5]).failOffsetY([-10, 10])`.

The `failOffset` on the cross axis ensures the map's native pan gesture takes over for horizontal swipes in portrait and vertical swipes in landscape.

### FlySheet — progress SharedValue

`sheetProgress` (0 = peek, 1 = full) is owned by `FlyModeScreen` and passed into `FlySheet`, which writes to it on every gesture frame:

```
sheetProgress = clamp(1 − translation / maxTranslation, 0, 1)
```

Three consumers read it without any JS bridge roundtrip:
- `pickerAnimatedStyle` in `FlyModeScreen` — fades pickers out below mid
- `mapHintAnimatedStyle` in `FlyModeScreen` — tracks hint banner above the sheet
- `FlyTimerPill.pillStyle` — fades the pill in at peek

### mapHint and fitToCoordinates

Portrait `mapHint.bottom` is animated:

```
bottom = interpolate(sheetProgress, [0, 1], [height×0.08, height×0.57])
```

At peek (progress=0) the hint sits just 8% from the bottom; at full (progress=1) it sits 57% up, just above the full-open sheet.

Landscape: `mapHint` is a static `View` with `top: '40%'`, `right: panelW + 16`.

`fitToCoordinates` edge padding:
```ts
bottom: isLandscape ? 40 : height * 0.58,
right:  isLandscape ? panelW + 24 : 40,
```
This keeps the route visible to the left/above of the panel regardless of orientation.

### FlyTimerPill

Opacity interpolates from 1 → 0 as sheetProgress rises from 0 to 0.35:

```
opacity = interpolate(progress, [0, 0.25, 0.35], [1, 0.5, 0], CLAMP)
```

`zIndex: 90` — below map controls (compass, view-mode button) at zIndex 100.  
Tapping the pill calls `flySheetRef.current?.expandTo(isLandscape ? 'full' : 'mid')`.

---

## 4. Mathematical / Statistical Details

**Snap selection on gesture end:**

```
projected = position + velocity × 0.15   // 150ms forward projection
chosen    = argmin over snap_targets of |projected − snap|
```

If `|velocity| > 600 pt/s`, the velocity term dominates and produces a "fling" snap. Otherwise the projected position is close to the current position and we snap to the nearest target. The 0.15s multiplier balances throw-feel vs. accidental overshoot (Material spec ~0.1s, iOS scroll ~0.2s).

**Spring constants:** `{ damping: 18, stiffness: 220, mass: 0.6 }` → ~250ms settle time, mild overshoot feel, suitable for a short-travel UI spring.

**`isTablet` heuristic:** `Math.min(width, height) >= 600` is device-stable — a phone in landscape has `min(844, 390) = 390` (not a tablet), while an iPad has `min(1024, 768) = 768`. The older `width >= 768` heuristic fires falsely on rotated phones.

---

## 5. Design Decisions

| Alternative | Why rejected |
|---|---|
| `@gorhom/bottom-sheet` | New dependency for a 3-snap simple sheet; we already have RNGH + Reanimated; custom gives the side-panel landscape variant for free |
| Lock to portrait via `app.json` | User explicitly wants landscape; would regress tablet UX |
| Bottom sheet in landscape too | Wastes 60% of screen width; user picked side panel |
| Auto-hide sheet via timer | User wants swipe control |
| Use `useDerivedValue` for progress everywhere | Using a parent-owned SharedValue passed as prop is simpler and avoids a circular derived→parent flow |
| `display: 'none'` to hide pickers at mid | Causes reflow mid-animation; use `opacity + pointerEvents` instead |

---

## 6. Verification

```bash
cd valentine-pomodoro
npx expo start
```

**Per-screen rotation matrix — portrait ↔ landscape for each:**

1. **TimerScreen** — ring centered, no clipping, header clears notch, ring scales up on tablet, duration inputs survive keyboard in landscape.
2. **Fly Mode portrait** — sheet starts full; drag down → mid (pickers fade); drag again → peek (timer pill fades in). Tap pill → sheet animates to mid. `mapHint` tracks sheet edge. `fitToCoordinates` keeps route visible.
3. **Fly Mode landscape** — right panel at ~42% width. Drag right → peek strip. Timer pill top-left. Map fits route to the left of the panel. Compass + view buttons unobscured.
4. **In-flight rotation** — flight still running after rotate; sheet resets to full; no coordinate drift.
5. **StatsScreen** — BannerAd renders adaptively; tablet max-width wrapper centres content.
6. **SettingsScreen** — duration TextInput stays above keyboard in landscape.
7. **LoveNotesScreen** — add/edit modal: multi-line input + Save/Cancel all reachable in landscape.

**Regression smoke test:**
- 25-minute Pomodoro runs to completion, fires notification.
- Fly Mode session fires "Landed!" notification.
- Stats increment after completion.
- Gift mode shows on first launch (clear AsyncStorage to test).

---

## 7. Related Docs

- `valentine-pomodoro/PLAN.md` — original v1 feature plan
- `valentine-pomodoro/DECISIONS.md` — design decisions log
- `~/.claude/CLAUDE.md` — Documentation-First workflow
