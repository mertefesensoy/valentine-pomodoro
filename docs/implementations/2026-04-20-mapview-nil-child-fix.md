# Crash fix — AIRMap nil-subview on iOS

**Date:** 2026-04-20

---

## 1. Problem / Motivation

TestFlight build 1.3.1 (39) crashed natively on every Fly Mode mount on
iPhone 17 Pro (iOS 26.3) the moment the user selected an airport that was
also rendered as a zoom-based dot on the map:

```
*** -[__NSArrayM insertObject:atIndex:]: object cannot be nil
-[AIRMap insertReactSubview:atIndex:] + 328
```

`AIRMap` is the Apple Maps native backend of `react-native-maps@1.20.1`.
Its `insertReactSubview:atIndex:` inserts each reconciled child into an
`NSMutableArray` without nil-filtering. `[NSMutableArray insertObject:nil
atIndex:]` raises the exception unconditionally.

The crash appeared after Task 3 (camera-five-modes) not because Task 3
changed any MapView children, but because Task 3 made the session-start
flow reliable enough that users consistently reached the state that
triggers the latent bug: origin selected, destination selected,
`visibleAirportMarkers` non-empty, session running. See the Task 3
addendum for details.

---

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/FlyModeScreen.tsx` | Replaced `.map(... return null ...)` with `.filter(...).map(...)` in the airport-dot list inside `<MapView>`. No other MapView children were touched. |

---

## 3. Implementation Approach

### The nil-child invariant for react-native-maps

React's JSX reconciler accepts `null`, `undefined`, and `false` as "no
child" in a direct-child position (i.e. `{cond && <X/>}`). It filters them
before creating fiber nodes for native components.

Arrays are different. When a `.map()` callback returns `null` for some
elements, the result is a *sparse array* — one that contains actual `null`
values at specific indices. The React reconciler does NOT filter these when
the array is a JSX child-set position. It passes each slot, including `null`
slots, down to the native module. `react-native-maps@1.20.1`'s
`MapView.js` does not call `React.Children.toArray` or any equivalent
filter on its children prop. The null slots reach `AIRMap` verbatim and are
inserted as-is into an `NSMutableArray`, which crashes.

### The bug pattern

```tsx
// WRONG — null inside .map() is a nil native child on iOS
{list.map(item => {
    if (shouldSkip(item)) return null;
    return <Marker key={item.id} ... />;
})}
```

### The fix pattern

```tsx
// CORRECT — filter first so .map() never returns null
{list
    .filter(item => !shouldSkip(item))
    .map(item => (
        <Marker key={item.id} ... />
    ))}
```

Applied to `visibleAirportMarkers` at lines 782–811: the origin and
destination airports are filtered out *before* `.map()`, so the callback
always returns a valid `<Marker>` element. The dedicated origin/destination
pins (children 2 and 3 in the MapView) are unaffected.

A two-line comment at the filter call site documents the invariant:

```tsx
// filter BEFORE map — returning null inside a MapView child .map()
// produces nil slots that crash AIRMap.insertReactSubview on iOS.
```

### Why the other four MapView children are safe

All four use `{X && <Component/>}` where `X` is `object | null`. When `X`
is null, the expression evaluates to `null` — a direct-child null that
React's reconciler removes before handing it to native. This pattern is
safe. Only array-position nulls (from `.map()`) bypass that filtering.

---

## 4. Design Decisions

**`.filter().map()` vs `React.Children.toArray(...).filter(Boolean)` on
the MapView children array:** The library-level shim would intercept all
children and silently swallow any future nil bugs. That is dangerous: we
want future nil children to surface as errors, not to be silently dropped.
The per-callsite fix is the correct scope — it documents the invariant
exactly where it matters.

**No wrapper component around `<MapView>`:** Same reasoning. Adding a
`<SafeMapView>` that calls `React.Children.toArray` internally adds
indirection and makes the dangerous pattern invisible to future authors.

**No mount-time assertion on MapView props:** The crash was not caused by
invalid coordinates or undefined props — the Marker's `coordinate` prop was
always a valid `{latitude, longitude}` object. An assertion would not have
caught this bug. The fix is structural (array shape), not prop-validation.

---

## 5. Verification

1. **Reproduce pre-fix** (for reference, do not apply to production):
   - Launch Fly Mode on iPhone 17 Pro / iOS 26.3 simulator.
   - Pick a tier-1 airport visible at the default zoom (JFK, LHR, NRT).
   - AIRMap crashes on the render where both the dedicated pin and the
     airport-dot array attempt to mount simultaneously.

2. **Confirm fix, post-patch:**
   - Same airport selection. MapView mounts cleanly. Dedicated pin renders;
     the same airport does not appear as a dot underneath it.
   - Pick a destination. Same — no duplicate, no crash.
   - Start the flight. Plane animates, camera modes switch cleanly.
   - Cycle through all five camera modes mid-session: no crash.

3. **Reset flow:** reset clears origin + destination. Pick the same airports
   again. Repeat step 2.

4. **TypeScript / lint:**
   ```
   cd valentine-pomodoro
   npm run typecheck
   npm run lint
   ```
   Both must pass with zero new errors or warnings.

---

## 6. Related Docs

- Task 3 doc (camera-five-modes, the release that exposed this bug):
  `docs/implementations/2026-04-19-camera-five-modes.md`
- Crash build: TestFlight 1.3.1 (39), iPhone 17 Pro, iOS 26.3
