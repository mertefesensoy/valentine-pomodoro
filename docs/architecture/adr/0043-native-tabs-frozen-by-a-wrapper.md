---
id: ADR-0043
title: Native tabs, frozen by a route wrapper, laid out by safe-area insets
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0028, ADR-0002, ADR-0031, IMPL-2026-10-30-phase1-b6-expo-router, IMPL-2026-10-30-phase1-b4-rerender-refactor, IMPL-2026-10-29-phase1-plan]
---

# ADR-0043: Native tabs, frozen by a route wrapper, laid out by safe-area insets

> **Status note:** accepted as part of the approved Phase 1 task B6, which [ADR-0028](0028-expo-router.md) decided. It records how B6 builds that decision, not a new direction. Built on branch `phase1/b6-expo-router` ([B6 record](../../implementations/2026-10-30-phase1-b6-expo-router.md)); it needs the device check on the combined TestFlight build (B6 record §6.6).

## Context

[ADR-0028](0028-expo-router.md) chose Expo Router with an iOS native tab bar. Expo Router 58's native tabs (`expo-router/native-tabs`, a `UITabBarController` through react-native-screens' `Tabs`) differ from the JavaScript bottom tabs the app has used since v1 ([ADR-0002](0002-react-navigation-template.md)) in four ways that matter here:

1. **No freezing, no lazy tabs.** There is no freeze option, and the navigator mounts every tab right after launch. Phase 1 B4 froze hidden tabs (`freezeOnBlur`) and built behaviour on it, checked on TestFlight build 45: overlays that a session's completion raises on the hidden Timer tab appear when you return to it.
2. **No tab bar height.** `useBottomTabBarHeight()` has no equivalent; four screens used it.
3. **No custom tab button.** The tab-press haptic lived in one (`HapticTab`, DEF-007).
4. **Expo Router 58 vendors React Navigation.** Its contexts are not the ones `@react-navigation/native` exports, so code reading a context from that package gets `undefined` inside a router screen.

## Decision

1. **Native tabs**, with `disableAutomaticContentInsets` on every tab, so the screens keep the safe-area handling they already have.
2. **Freezing is done by a route-level wrapper,** `FreezeOnBlur`: react-freeze's `Freeze`, frozen while `useIsFocused()` is false. Every tab route renders its screen inside it. It is the mechanism React Navigation's `freezeOnBlur` used, so hidden tabs stay mounted, keep their effects, and render what they received when shown. A tab that isn't focused at launch never renders until first shown, which restores lazy tabs.
3. **Layout by safe-area insets.** Each native tab has its own `SafeAreaProvider`, whose bottom inset includes the tab bar. The Timer screen pads by it. Stats, Settings and Notes drop their extra padding, because their `SafeAreaView` already includes the bar. The one place that needs the window's inset, the Fly sheet, reads it through `useWindowInsets()`, which provides the root provider's insets.
4. **The haptic moves to a `tabPress` listener** that reads the Haptics setting when the tab is pressed.
5. **The router's copy of React Navigation is the only one.** `useSlotClock` reads `NavigationContext` from `expo-router/react-navigation`, and the `@react-navigation/*` packages are removed.

## Consequences

**Positive**
- The system tab bar: its material (Liquid Glass on iOS 26), behaviour on iPad, accessibility and the absence of a switch animation come from UIKit, as the design workflow asks.
- B4's frozen tabs and their checked behaviour survive. So do lazy tabs: no banner or update check at cold start from tabs nobody opened.
- One copy of React Navigation in the bundle.

**Negative**
- **A possible blank frame on switching tabs.** UIKit shows the new tab first; JavaScript then unfreezes it. React has hidden a frozen tab's content, so a frame or two of background may show. JavaScript tabs did both in one commit. It can't be seen in Jest; it is the first device check. **Fallback if it shows:** remove `FreezeOnBlur` from the affected routes and re-check B4 §3.5's overlay behaviour and the cold-start cost, recording both.
- **A deprecated import.** `NavigationContext` from `expo-router/react-navigation` is marked "will be removed in a future SDK". When it goes, `FreezeOnBlur` can provide the focus signal instead.
- **The haptic fires on selection,** not on press-in.
- **Android needs its own pass** (AN4): no `md` icons yet, and Android's native tabs pad the bottom automatically.

## Alternatives considered

- **Expo Router's JavaScript tabs** (`expo-router/js-tabs`). Everything would have stayed exactly as it was, but ADR-0028 chose native tabs, and the design rules drop the blurred bar (F10).
- **No freezing.** It loses B4 §3.5's behaviour, and every tab would mount at launch.
- **React's `<Activity>`** (the router's `NavigationAwareActivity`). Hiding runs effect cleanups, so a hidden Timer would stop handling completions.
- **The navigator's `screenLayout`.** It works at runtime, but `NativeTabs` doesn't declare it.
- **`initialWindowMetrics` for the Fly sheet.** It is fixed at launch, so it is wrong after a rotation.

## Links

- [B6 record](../../implementations/2026-10-30-phase1-b6-expo-router.md)
- [ADR-0028](0028-expo-router.md), [ADR-0002](0002-react-navigation-template.md)
- [B4 record §3.5](../../implementations/2026-10-30-phase1-b4-rerender-refactor.md#35-frozen-tabs)
- [Design workflow](../../process/DESIGN-WORKFLOW.md)

## Backlinks
<!-- backlinks:start -->
- [React Navigation bottom tabs from the with-react-navigation template](0002-react-navigation-template.md)
- [Expo Router for navigation](0028-expo-router.md)
- ["Phase 1 B6: Expo Router with native tabs"](../../implementations/2026-10-30-phase1-b6-expo-router.md)
<!-- backlinks:end -->
