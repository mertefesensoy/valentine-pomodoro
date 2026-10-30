---
id: IMPL-2026-10-30-phase1-b6-expo-router
title: "Phase 1 B6: Expo Router with native tabs"
status: in-progress
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-b4-rerender-refactor, IMPL-2026-10-30-phase1-b5-react-compiler, IMPL-2026-10-30-phase1-b3-zustand-stores, ADR-0028, ADR-0043, ADR-0002, SRS]
---

# 2026-10-30 — Phase 1 B6: Expo Router with native tabs

**Status:** Plan (this section is written before any code). Implementation follows on the same branch.
**Branch:** `phase1/b6-expo-router`, a worktree at `C:\vp\b6`, cut from `rehaul/v2` at `7034bba`. It is merged with B7's branch by the session that started this one, which then makes one TestFlight build.
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B6. Decision: [ADR-0028](../architecture/adr/0028-expo-router.md) (Expo Router, native tabs); how it is built: [ADR-0043](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md). Follows [B5](2026-10-30-phase1-b5-react-compiler.md).

---

## 1. Problem / Motivation

The app navigates with React Navigation 7's static API ([ADR-0002](../architecture/adr/0002-react-navigation-template.md)): a native stack holding a JavaScript bottom-tab navigator with a blurred tab bar (`src/navigation/index.tsx`). The approved plan replaces it with **Expo Router**, file-based, with an **iOS native tab bar** ([ADR-0028](../architecture/adr/0028-expo-router.md); Phase 1 plan, B6). The reasons are in the rehaul plan §4.1: web URLs, `/invite/[code]` universal links later, and web bundle splitting. The native tab bar is also the one place the design workflow allows glass: the system's own material, not a hand-rolled blur ([DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md); finding F10).

**Done when** (plan row): the guards and Reassure are green, deep links open each tab, and `src/navigation/` is gone.

A navigation rewrite touches what B1–B5 built and checked on TestFlight builds 43–45. Orientation in Expo Router 58.0.28 (the SDK 58 pin) found five things that would break silently:

1. **Native tabs don't freeze, and aren't lazy.** Neither `expo-router/native-tabs` nor react-native-screens 4.30's `Tabs.Screen` has a freeze option. The navigator preloads every tab right after launch (`usePreloadPlaceholderRoutes(..., lazyByDefault: false)`); a spike under Jest showed the Stats screen rendering at launch, unfocused. So B4's `freezeOnBlur` and its deliberate behaviour (B4 record §3.5) would be lost, and Stats (with its AdMob banner) and Settings would mount at every cold start.
2. **Expo Router 58 ships its own copy of React Navigation** (`expo-router/build/react-navigation/`), and no longer depends on `@react-navigation/*`. `useSlotClock.ts` reads `NavigationContext` from `@react-navigation/native`: a different context object. Inside a router screen it would read `undefined`, treat the screen as always focused, and keep the ring's frame callback running while the Timer tab is hidden. Nothing would fail.
3. **Native tabs can't report the tab bar's height** (a documented limitation). Four screens call `useBottomTabBarHeight()`, which throws without the JavaScript tab navigator's context.
4. **The tab bar button can't be customised,** so `HapticTab` (and with it DEF-007's fix) has no place to go.
5. **The splash is hidden by the router** on its first mount (`ExpoRoot` → `internalMaybeHideAsync`), unless the app has called the public `preventAutoHideAsync()`.

## 2. What Changed

Planned; the commit list is filled in when the work is done.

| File | Change |
|------|--------|
| `index.tsx` | The entry imports `expo-router/entry` instead of registering `App`. |
| `app/_layout.tsx` | New. The root layout: renders `App` from `src/App.tsx` around a native stack holding `(tabs)` and `+not-found`. |
| `app/(tabs)/_layout.tsx` | New. `NativeTabs` with four triggers (Timer, Stats, Settings, Notes), SF Symbol icons, the tab-press haptic. |
| `app/(tabs)/index.tsx`, `stats.tsx`, `settings.tsx`, `notes.tsx` | New. Each renders its screen inside `FreezeOnBlur`. |
| `app/+not-found.tsx` | New. The 404 screen, ported from `src/navigation/screens/NotFound.tsx`. |
| `src/App.tsx` | `App` takes the router's navigator as `children`. `ThemedApp` keeps the notification listener (now `router.navigate('/')`), Gift Mode, the theme (`ThemeProvider`), and hides the splash once it has mounted. B7's two start-up calls are carried over together under one comment. |
| `src/components/FreezeOnBlur.tsx` | New. React-freeze's `Freeze`, frozen while the enclosing route isn't focused. |
| `src/components/tabPressHaptic.ts` | New, replacing `HapticTab.tsx`. The tab-press haptic, following the Haptics setting (DEF-007). |
| `src/hooks/useWindowInsets.tsx` | New. The window's safe-area insets, read below a native tab (§3.4). |
| `src/hooks/useSlotClock.ts` | Reads the router's `NavigationContext`. |
| `src/screens/{Timer,Stats,Settings,LoveNotes}Screen.tsx`, `FlyModeScreen.tsx` | The tab bar height becomes safe-area insets. |
| `src/navigation/` | Deleted. |
| `src/components/HapticTab.tsx`, `src/components/ui/TabBarBackground*.tsx` | Deleted: no custom tab bar button, no blur background. |
| `package.json`, `package-lock.json`, `app.json` | `expo-router` ~58.0.28 and `react-freeze` added; the four `@react-navigation/*` packages removed; the `expo-router` config plugin added. |
| Tests | New router tests (deep links, frozen tabs, notification tap, splash, 404, haptic); the tab-bar-height providers removed from six screen tests; `useSlotClock.test.tsx` uses the router's context; the DEF-004 test header re-explained (§3.7). |
| `docs/architecture/adr/0043-…`, ADR-0028 and ADR-0002 status notes | New ADR; status notes. |

## 3. Implementation Approach

### 3.1 Routes, and where the root lives

```
app/
  _layout.tsx          root: <App><Stack/></App>
  +not-found.tsx       404
  (tabs)/
    _layout.tsx        <NativeTabs>
    index.tsx          Timer (Classic, with the Fly switch)
    stats.tsx
    settings.tsx
    notes.tsx
```

The URLs are `/`, `/stats`, `/settings`, `/notes`. Any other path renders `+not-found`.

**The root component stays in `src/App.tsx`.** `app/_layout.tsx` is a few lines that render `App` around the router's `Stack`. This keeps B7's merge small: B7 edits the two start-up calls inside `ThemedApp`, and they stay in the same file and function. `App`'s new contract:
- **Input:** `children`, the navigator to render once the stores are hydrated.
- **Output:** gesture root → safe-area provider → `StoreGate` → `ThemedApp` → `ThemeProvider` → `children`, plus Gift Mode.
- **Side effects:** at module scope, as before: the Reanimated logger, the foreground notification handler, `SplashScreen.preventAutoHideAsync()`. In `ThemedApp`: the start-up work, the notification-tap listener, and the splash hide.

**The entry** stays `index.tsx`: it imports `./gesture-handler` first, as today, then `expo-router/entry` instead of `registerRootComponent(App)`.

### 3.2 Native tabs

`NativeTabs` from `expo-router/native-tabs` (stable in SDK 58), over react-native-screens' `Tabs` (a `UITabBarController` on iOS).
- **Icons:** the same SF Symbols as today (`heart.fill`, `chart.bar.fill`, `gearshape.fill`, `heart.text.square.fill`), typed as `IconSymbolName`, so a name without an Android/web counterpart in `IconSymbol.tsx`'s mapping still fails `tsc`. Android's `md` icons wait for AN4.
- **Tab-switch animation `none`:** `NativeTabs` has no animation option; `UITabBarController` switches tabs without one. Nothing to configure.
- **The tab-press haptic (DEF-007):** `screenListeners={{ tabPress: tabPressHaptic }}`. `tabPressHaptic()` reads the Haptics setting from the settings store at the moment of the press and, on iOS, plays the same light impact as `HapticTab`. Difference: it fires when the tab is selected, not on press-in.
- **Theme:** `ThemeProvider` with `DarkTheme`/`DefaultTheme` from `expo-router` (the router's copy), chosen by `useTheme().isDark` as today. Each native tab paints the theme's background behind its screen.
- **Content insets:** `disableAutomaticContentInsets` on every trigger, so the router doesn't switch the first scroll view of each screen to automatic insets; the screens keep handling safe areas as they do today (§3.4).

### 3.3 Frozen hidden tabs: `FreezeOnBlur`

```tsx
export function FreezeOnBlur({ children }) {
    const focused = useIsFocused(); // expo-router
    return <Freeze freeze={!focused}>{children}</Freeze>;
}
```

Each route file renders its screen inside it. Contract:
- **Input:** the screen. **Must be rendered inside a route** (`useIsFocused` throws outside a navigator).
- **Output:** the screen while its route is focused; frozen otherwise. "Frozen" is react-freeze: a Suspense boundary whose child throws a pending promise. React doesn't render the subtree, and hides what it had committed.
- **Invariants:**
  - It is the same mechanism B4 used. React Navigation's `freezeOnBlur` passed through react-native-screens' `Screen` to react-freeze's `Freeze`. So B4 §3.5 holds unchanged: a hidden tab stays mounted, its passive effects (store subscriptions, completion handlers) keep running, and state it receives renders when it is shown again (the love note, goal popup and interstitial).
  - The wrapper sits **outside** its own `Freeze`, so its focus state does commit. B4 §5's warning against `useIsFocused` applies to a component inside the frozen tree, not to this one.
  - **Frozen from the first render** means a tab that isn't focused at launch never renders until first shown. The navigator's eager preload mounts only the wrapper. That restores today's lazy tabs: Stats' banner and Settings' update check don't run at cold start.

### 3.4 Safe areas instead of the tab bar height

Native tabs wrap each tab's content in its own `SafeAreaProvider` (`NativeTabsView.ios.js`). Its view sits inside the tab's view controller, so its **bottom inset includes the tab bar**. `useBottomTabBarHeight()` was the bar's height including the home indicator, so:

| Screen | Before | After |
|--------|--------|-------|
| Timer (both modes) | container `paddingBottom: tabBarHeight` | `paddingBottom: insets.bottom` (the tab's provider) |
| Fly sheet | `bottomInset={insets.bottom}`: the home indicator, read at the root | `useWindowInsets().bottom`: the same value, read from the root provider (below) |
| Stats, Settings, Notes | React Native's `SafeAreaView`, **plus** `tabBarHeight` on the banner, the list, the scroll content | `SafeAreaView` alone. Its insets are the native view's, which now include the tab bar, so the extra padding would count it twice. Notes keeps its `+ 8`. |

`useWindowInsets()` is new because the Fly sheet's padding was the window's bottom inset (34 pt portrait, 21 pt landscape on a Face ID iPhone). Inside a tab, `useSafeAreaInsets()` would return about 83 pt instead, adding a 49 pt band to the sheet. The root's insets are provided once in `App`, under a context of their own. Contract:
- **Output:** the root `SafeAreaProvider`'s insets.
- Outside the provider (tests), it falls back to `useSafeAreaInsets()`.
- **Re-renders** its consumers only when the window's insets change (rotation).

Top insets stay from the tab's provider. They equal the window's on iPhone, and on iPad they also clear a tab bar placed at the top.

The 720 pt content cap (`maxWidth: 720`) and landscape handling are inside the screens and don't change.

### 3.5 The router's copy of React Navigation

- `useSlotProgress` reads `NavigationContext` from `expo-router/react-navigation`, the object the router's `NavigationProvider` provides.
- It is marked deprecated there ("will be removed in a future SDK"). The comment at the import says what to do when it goes: let `FreezeOnBlur` provide the focus signal.
- A router test pins that a screen inside a native tab gets a non-null navigation from that context, and that blur and focus reach its listeners. The bug this guards against (the wrong context) fails silently.
- The four `@react-navigation/*` packages are removed, so the wrong import can't be made by accident, and Metro bundles one copy of React Navigation, not two.

### 3.6 Splash, Gift Mode, the notification tap, B7's start-up calls

- **Splash.** The public `SplashScreen.preventAutoHideAsync()` at module scope (unchanged) sets `userControlledAutoHideEnabled` in `SplashScreenModule.swift`, and the router's `internalMaybeHideAsync` then does nothing. `ThemedApp` calls `SplashScreen.hideAsync()` in an effect on mount. `ThemedApp` renders only below `StoreGate`, and its effect runs after its children's, so the navigator and the first tab have committed. Before the one-time migration finishes, `StoreGate` renders nothing and the splash stays up.
- **Gift Mode:** unchanged, a sibling of the navigator inside `ThemedApp`.
- **Notification tap → Timer (FR-NTF-003):** `router.navigate('/')`. It pops a stacked 404, then selects the Timer tab.
- **B7:** `useUpdateCheck(UPDATE_JSON_URL)` and `AdManager.init()` stay together in `ThemedApp`, verbatim, under `// Start-up work (B7 defers this)`. `AdManager.init()` moves out of the listener effect into its own effect, so the listener is B6's and the start-up work is B7's.

### 3.7 DEF-004 under Expo Router

DEF-004's cause was React Navigation's `NavigationContainer` rendering nothing until `Linking.getInitialURL()` resolved (up to 150 ms), so the screens subscribed to completions after the clock's cold-start completion had fired. B3 fixed it in the store: a completion waits until a handler of its kind is registered.

**Under Expo Router on iOS that wait is gone:** `getInitialURLWithTimeout()` returns `expo-linking`'s synchronous `getLinkingURL()`, and `useLinking.native.js` builds the initial state synchronously from a string. The first tab mounts in the first render. Late subscribers still happen, for other reasons:
- Fly's lazy load (B1);
- a cold start through a deep link into another tab: the Timer tab is frozen from launch, so no Pomodoro handler exists until it is shown. This is today's behaviour with lazy JavaScript tabs, and the pending completion waits without ticking (the second DEF-004 test);
- Android, where the router still races `Linking.getInitialURL()` against 150 ms.

So the B3 fix stays load-bearing, and the three tests stay as they are. Only the test file's header comment changes, to name these causes. No assertion changes.

### 3.8 Deep links

The `valentinepomodoro` scheme stays in `app.json`. On iOS, `valentinepomodoro://stats` reaches the router as `getLinkingURL()` (cold) or a `url` event (warm). `extractExpoPathFromURL` turns it into host plus path, `stats`, so:

| URL | Opens |
|-----|-------|
| `valentinepomodoro://` | Timer |
| `valentinepomodoro://stats` | Stats |
| `valentinepomodoro://settings` | Settings |
| `valentinepomodoro://notes` | Notes |
| anything else | the 404 screen, with a link home |

**Tested end to end in Jest:** `ExpoRoot` over the real `app/` directory, with `expo-linking`'s `getLinkingURL` and `addEventListener` mocked, so the URL goes through the same parsing as on the phone. (`renderRouter`'s `initialUrl` is a server location that bypasses that parsing: in the spike, `valentinepomodoro://stats` opened `/`.) The device checks the scheme registration itself.

**Changed paths:** today's automatic linking derived paths from screen names, so `love-notes` becomes `notes`. Nothing in the app or the docs links to the old paths (searched), so no redirect is added.

### 3.9 Dependencies and native code

B6 **adds native code**, so it needs a new build (the combined TestFlight build):
- `expo-router` has an iOS module (`ExpoHeadModule`, `LinkPreviewNativeModule`, `RouterToolbarModule`, an app-delegate subscriber);
- its dependencies `expo-glass-effect` (iOS) and `@react-native-masked-view/masked-view` (iOS and Android) are native and autolinked;
- the tab bar itself is react-native-screens' `Tabs`, already in the binary since SDK 58.

`react-freeze` is JavaScript; it was already installed as a react-native-screens dependency and is now a direct one.

## 4. Mathematical / Statistical Details

### 4.1 Render counts: what each scenario should be

The Reassure scenarios render each screen without a navigator, so B6 changes their counts only if a screen's own render path changes. The screens lose `useBottomTabBarHeight()` (a context read, constant 0 in the tests). Timer and Fly gain `useSafeAreaInsets()`/`useWindowInsets()` reads, which are constants under the Jest mock. **Expected: identical to B5:** settings-only 1, Timer 13, Stats 1, Settings 2, Notes 1, leaf 12.

The freeze adds nothing to these numbers; it is checked separately (§6), as in B4.

### 4.2 The bytecode budget

Two bounds apply to the iOS Hermes bytecode $b$:
- **The ceiling, NFR-PERF-002:** $b < 3{,}856{,}208$ B (the SDK 58 baseline).
- **The reference:** B5's 3,463,508 B. The headroom is $3{,}856{,}208 - 3{,}463{,}508 = 392{,}700$ B, about 11.3 % of B5.

Expo Router brings its own copy of React Navigation and the router itself; removing the four `@react-navigation/*` packages takes back the copy they had. If $b$ crosses the ceiling, that is an owner decision, raised in §7, not a footnote.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Native tabs (`expo-router/native-tabs`) | Expo Router's JavaScript tabs (`expo-router/js-tabs`), which keep `freezeOnBlur`, `tabBarButton`, the blur background and `useBottomTabBarHeight` exactly | ADR-0028 and the plan row decided native tabs; the design workflow allows glass only where the system draws it, and F10 drops the blurred bar. The JavaScript tabs would have been the smaller change, but not the approved one. |
| Freeze with a route-level wrapper | Drop freezing; React's `<Activity>` (the router's `NavigationAwareActivity`); `screenLayout` on the navigator | Dropping it loses B4 §3.5's checked behaviour and lets the navigator mount every tab at launch. `<Activity mode="hidden">` runs effect cleanups, so a hidden Timer would stop handling completions. `screenLayout` works at runtime but isn't in `NativeTabs`' types. |
| Keep the root component in `src/App.tsx`; `app/_layout.tsx` renders it | Move `ThemedApp` into `app/_layout.tsx` | B7 edits two calls in `ThemedApp`. Keeping them in place makes the merge a few lines. |
| `disableAutomaticContentInsets` on every tab | Let the router set automatic insets on each screen's first scroll view | Automatic insets would add the status bar to the Timer's scroll view, which already pads by `insets.top + 20`. Keeping manual insets keeps today's layout. |
| `useWindowInsets()` for the Fly sheet | `initialWindowMetrics`; accept a bigger sheet padding | `initialWindowMetrics` is fixed at launch, so it is wrong after a rotation (34 vs 21 pt). The bigger padding is a visible regression. |
| Remove the `@react-navigation/*` packages | Keep them installed | A stray import from them compiles and fails silently (§3.5). Removing them also keeps a second copy out of the bundle. |
| The haptic in a `tabPress` listener | Drop it (native tab bars have no haptic by default) | DEF-007's fix is on the must-keep list. The listener keeps the behaviour; the only change is press-in becoming selection. |
| End-to-end deep-link tests through `ExpoRoot` with `expo-linking` mocked | `renderRouter` with `initialUrl`; a unit test of the router's internal URL parser | `initialUrl` bypasses the URL parsing; the parser is internal. Mocking the one native call keeps everything after it real. |
| A new requirement, FR-NAV-001, for deep links | Cite an existing requirement | None fits. The SRS entry is in §8 for the merge. Until then the plain docs check reports the test's `covers: FR-NAV-001` as undefined. |

## 6. Verification

### 6.1 Plan

```bash
npm run typecheck
npm run lint
npx jest --ci
npx reassure            # against the pre-B6 baseline recorded in this worktree
node scripts/react-compiler-report.js
npx expo export --platform ios --dump-sourcemap --output-dir <scratch>
node scripts/docs/check-docs.mjs
```

- [ ] Typecheck clean; lint 0 errors.
- [ ] Jest: the 134 tests from B5 pass. Expected test edits: the six screen tests drop their tab-bar-height provider, `useSlotClock.test.tsx` switches context, and the haptic test becomes a listener test. No guard assertion changes.
- [ ] The A1 guards (`timerTextTicks`, both `timerScreenTicks`, `flyModeGuard`), the "fires completion exactly once" test, and the three DEF-004 tests pass.
- [ ] **Mutation check** on the guards after the change, as in B3–B5: delete the clock store's notification of a changed second, and the three timer guards fail at 24:59. Restore the file, byte-identical.
- [ ] Reassure equals B5: 1, 13, 1, 2, 1, 12.
- [ ] New router tests:
  - each deep link (cold and warm) opens its tab, and an unknown path opens the 404;
  - only the focused tab renders at launch;
  - a hidden tab's `<TimerText>` commits 0 times over 10 s and once on return;
  - a screen inside a native tab gets the router's navigation, and its blur and focus listeners fire;
  - a notification tap from Stats opens Timer;
  - the splash hides only after the stores are hydrated;
  - the tab press plays the haptic only when Haptics is on.
- [ ] The React Compiler report, extended to `app/`: every new route compiles, no worklet count changes.
- [ ] iOS bytecode recorded against B5's 3,463,508 B and the 3,856,208 B ceiling.

### 6.2 Device checklist (combined TestFlight build): written in full once the code is done

## 7. Findings and open items

To be filled in.

## 8. Shared-doc updates to apply at merge

To be filled in with the exact text.

## 9. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B6
- [ADR-0028](../architecture/adr/0028-expo-router.md), [ADR-0043](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md), [ADR-0002](../architecture/adr/0002-react-navigation-template.md)
- [B4 record](2026-10-30-phase1-b4-rerender-refactor.md) §3.3, §3.5: the focus gating and frozen tabs this keeps
- [B3 record](2026-10-30-phase1-b3-zustand-stores.md) §0, §3.7: DEF-004
- [B5 record](2026-10-30-phase1-b5-react-compiler.md): the counts and bytecode this is measured against
- [SRS](../srs/SRS.md): FR-NTF-003, FR-SET-001, FR-TMR-005, NFR-PERF-002, NFR-PERF-003

## Backlinks
<!-- backlinks:start -->
<!-- backlinks:end -->
