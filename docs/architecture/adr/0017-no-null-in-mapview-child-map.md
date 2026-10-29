---
id: ADR-0017
title: Never return null inside a MapView child .map()
status: accepted
date: 2026-04-20
owner: Mert Efe Şensoy
related: [ADR-0018, ADR-0026]
---

# ADR-0017: Never return `null` inside a MapView child `.map()`

## Context

TestFlight 1.3.1 (39) crashed natively on iPhone 17 Pro (iOS 26.3) when Fly Mode mounted with an airport selected that was also drawn as a dot:

```
*** -[__NSArrayM insertObject:atIndex:]: object cannot be nil
-[AIRMap insertReactSubview:atIndex:]
```

A `.map()` callback that returns `null` produces an array with real `null` slots. `react-native-maps` 1.20.1's `MapView` passes every slot down to `AIRMap`, which inserts it into an `NSMutableArray` without a nil check. A direct-child conditional (`{x && <X/>}`) is safe, because React removes that `null` before it reaches native code (nil-child fix §3).

## Decision

Among `MapView` children, filter *before* mapping, so the callback always returns an element:

```tsx
{list.filter(item => !shouldSkip(item)).map(item => <Marker key={item.id} … />)}
```

A two-line comment at the call site states the invariant. The fix is per call site, with no library-level shim.

## Consequences

**Positive**
- The JS-side crash is gone, and a future nil child still surfaces as an error instead of being swallowed.
- The rule is carried forward as a Phase 4c rule for the real map (rehaul plan §2.7).

**Negative**
- Nothing enforces it mechanically. It lives in a code comment, the device-check backlog and the plan's rules.
- It was not enough on its own. On 2026-05-05, two more `AIRMap` crashes (a nil subview, and an index out of bounds) were traced to the New Architecture interop layer. They were fixed in two layers: native nil and bounds guards in `AIRMap.m`, applied through `patch-package`, and an `onMapReady` gate on the burst of up to 120 airport dots.
- On SDK 58, upstream `react-native-maps` 1.29.11 includes the insert guard, and the local patch was re-cut down to the remove guard (SDK 58 upgrade §3.2).

## Alternatives considered

- **Filter all children inside `MapView` with `React.Children.toArray(...).filter(Boolean)`, or a `<SafeMapView>` wrapper.** Rejected: it would silently drop future nil bugs and hide the dangerous pattern (nil-child fix §4).
- **A mount-time prop assertion.** It would not have caught this. The cause is the array's shape, not invalid props.

## Links

- [Nil-child fix §1](../../implementations/2026-04-20-mapview-nil-child-fix.md#1-problem--motivation) · [the invariant](../../implementations/2026-04-20-mapview-nil-child-fix.md#the-nil-child-invariant-for-react-native-maps) · [§4](../../implementations/2026-04-20-mapview-nil-child-fix.md#4-design-decisions)
- [AIRMap native guards §1](../../implementations/2026-05-05-airmap-insert-subview-crash-fix.md#1-problem--motivation) · [§3](../../implementations/2026-05-05-airmap-insert-subview-crash-fix.md#3-implementation-approach) · [§5](../../implementations/2026-05-05-airmap-insert-subview-crash-fix.md#5-design-decisions)
- [SDK 58 upgrade §3.2](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#32-one-sdk-per-step)
- [Rehaul plan §2.7](../../implementations/2026-10-29-couples-rehaul-plan.md#27-implementations2026-04--and-2026-05-05-)

## Backlinks
<!-- backlinks:start -->
- [An illustrated map for everyone; the real map as a phone-only Plus extra](0026-illustrated-map-real-map-plus.md)
- [Generate the native projects from app.json (CNG)](0032-continuous-native-generation.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
