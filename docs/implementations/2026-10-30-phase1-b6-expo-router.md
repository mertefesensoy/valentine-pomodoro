---
id: IMPL-2026-10-30-phase1-b6-expo-router
title: "Phase 1 B6: Expo Router with native tabs"
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-b4-rerender-refactor, IMPL-2026-10-30-phase1-b5-react-compiler, IMPL-2026-10-30-phase1-b3-zustand-stores, ADR-0028, ADR-0043, ADR-0002, SRS]
---

# 2026-10-30 — Phase 1 B6: Expo Router with native tabs

**Status:** Code done and verified locally, in three code commits after the plan commit (§2). **Merged into `rehaul/v2` on 2026-10-30 as `1b7a8d7`, before B7 (`3d3fbaf`); pushed 2026-10-30 (through `3369418`).** The device check (§6.6) on TestFlight build 46 (`v1.4.0-tf.46`), 2026-10-30, **failed items 1 and 2**: every tab switch flickers, and on Notes in light mode the tab bar turns to dark colours. The fix is open (§6.6).
**Branch:** `phase1/b6-expo-router`, a worktree at `C:\vp\b6`, cut from `rehaul/v2` at `7034bba`. It merges with `phase1/b7-deferred-startup` without conflicts (§6.5).
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md), task B6. Decision: [ADR-0028](../architecture/adr/0028-expo-router.md) (Expo Router, native tabs); how it is built: [ADR-0043](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md). Follows [B5](2026-10-30-phase1-b5-react-compiler.md).

---

## 0. Read this first

- **The gate is green.**
  - Typecheck clean; lint 0 errors.
  - Jest **151/151 in 28 suites** (B5: 134 in 26). No guard assertion changed.
  - The four A1 guards, the "exactly once" test and the three DEF-004 tests pass.
  - The mutation check holds: without the clock store's per-second notification, the three timer guards fail at 24:59.
  - **Reassure equals B5** in every run: settings-only 1, Timer 13, Stats 1, Settings 2, Notes 1, leaf 12 (§4.1).
- **Deep links open each tab,** cold and warm, tested end to end through the same URL parsing the phone uses (§3.8).
- **B4's frozen tabs survive.** Native tabs have no freeze, and mount every tab at launch. A route wrapper, `FreezeOnBlur`, uses the same react-freeze mechanism as before. A hidden tab's `<TimerText>` commits nothing over 10 s and catches up on return, and the tabs are lazy again (§3.3).
- **B6 adds native code:** Expo Router's iOS module, `expo-glass-effect` and `@react-native-masked-view/masked-view`. It needs the new build either way (§3.9).
- **Your decision: the bytecode is 1 % over NFR-PERF-002's ceiling.** iOS bytecode **3,894,148 B**: +430,640 B (+12.4 %) over B5's 3,463,508 B, and **37,940 B over the 3,856,208 B ceiling** (the merged B6+B7 tree: 3,912,884 B, 56,676 B over). All of the growth is Expo Router itself (+400 KB of mapped bytecode, minus 164 KB for the React Navigation packages it replaces). The one lever found, Metro's tree shaking, measures 3,554,012 B, but it is an `UNSTABLE` bundler flag and untested in the app. Options are in §7.1.
- **One risk only a phone can show:** switching to a frozen tab may flash its background for a frame, because UIKit shows the tab before JavaScript unfreezes it. It is device check 1, with the fallback written down (§6.6).

## 1. Problem / Motivation

The app navigates with React Navigation 7's static API ([ADR-0002](../architecture/adr/0002-react-navigation-template.md)): a native stack holding a JavaScript bottom-tab navigator with a blurred tab bar (`src/navigation/index.tsx`). The approved plan replaces it with **Expo Router**, file-based, with an **iOS native tab bar** ([ADR-0028](../architecture/adr/0028-expo-router.md); Phase 1 plan, B6). The reasons are in the rehaul plan §4.1: web URLs, `/invite/[code]` universal links later, and web bundle splitting. The native tab bar is also the one place the design workflow allows glass: the system's own material, not a hand-rolled blur ([DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md); finding F10).

**Done when** (plan row): the guards and Reassure are green, deep links open each tab, and `src/navigation/` is gone.

A navigation rewrite touches what B1–B5 built and checked on TestFlight builds 43–45. Orientation in Expo Router 58.0.28 (the SDK 58 pin) found five things that would break silently:

1. **Native tabs don't freeze, and aren't lazy.** Neither `expo-router/native-tabs` nor react-native-screens 4.30's `Tabs.Screen` has a freeze option. The navigator preloads every tab right after launch (`usePreloadPlaceholderRoutes(..., lazyByDefault: false)`); a spike under Jest showed the Stats screen rendering at launch, unfocused. So B4's `freezeOnBlur` and its deliberate behaviour (B4 record §3.5) would be lost, and Stats (with its AdMob banner) and Settings (with its update check) would mount at every cold start.
2. **Expo Router 58 ships its own copy of React Navigation** (`expo-router/build/react-navigation/`), and no longer depends on `@react-navigation/*`. `useSlotClock.ts` read `NavigationContext` from `@react-navigation/native`: a different context object. Inside a router screen it would read `undefined`, treat the screen as always focused, and keep the ring's frame callback running while the Timer tab is hidden. Nothing would fail.
3. **Native tabs can't report the tab bar's height** (a documented limitation). Four screens called `useBottomTabBarHeight()`, which throws without the JavaScript tab navigator's context.
4. **The tab bar button can't be customised,** so `HapticTab` (and with it DEF-007's fix) had no place to go.
5. **The splash is hidden by the router** on its first mount (`ExpoRoot` → `internalMaybeHideAsync`), unless the app has called the public `preventAutoHideAsync()`.

## 2. What Changed

| Commit | Content |
|--------|---------|
| `16e188a` | The plan (this record's plan sections) and ADR-0043, before any code. |
| `a736b22` | **feat(b6):** the routes, the native tabs, `FreezeOnBlur`, the safe-area changes, the router's `NavigationContext`, the splash and root changes, the dependency swap, and the existing tests adjusted. |
| `65fa2ea` | **test(b6):** `router.test.tsx` and `splash.test.tsx`, over the real `app/` tree. |
| `62fef2e` | **chore(b6):** the React Compiler report covers `app/`. |
| `622d524` | This record, and the ADR-0028 and ADR-0002 status notes. |

| File | Change |
|------|--------|
| `index.tsx` | The entry imports `expo-router/entry` instead of registering `App`. |
| `app/_layout.tsx` | New. The root layout: renders `App` from `src/App.tsx` around a native stack holding `(tabs)` and `+not-found`. |
| `app/(tabs)/_layout.tsx` | New. `NativeTabs` with four triggers (Timer, Stats, Settings, Notes), SF Symbol icons typed against `IconSymbol`'s mapping, and the tab-press haptic. |
| `app/(tabs)/index.tsx`, `stats.tsx`, `settings.tsx`, `notes.tsx` | New. Each renders its screen inside `FreezeOnBlur`. |
| `app/+not-found.tsx` | New. The 404 screen, ported from `src/navigation/screens/NotFound.tsx`, in the app's theme colours. |
| `src/App.tsx` | `App` takes the router's navigator as `children` and provides the window's insets. `ThemedApp` keeps the notification listener (now `router.navigate('/')`), Gift Mode and the theme (`ThemeProvider`), and hides the splash once it has mounted. B7's two start-up calls are together under one comment, `AdManager.init()` in its own effect. |
| `src/components/FreezeOnBlur.tsx` | New. React-freeze's `Freeze`, frozen while the enclosing route isn't focused. |
| `src/components/tabPressHaptic.ts` | New, replacing `HapticTab.tsx`. The tab-press haptic, following the Haptics setting (DEF-007). |
| `src/hooks/useWindowInsets.tsx` | New. The window's safe-area insets, readable below a native tab (§3.4). |
| `src/hooks/useSlotClock.ts` | Reads the router's `NavigationContext`. |
| `src/screens/TimerScreen.tsx` | Pads its bottom by the tab's safe-area inset instead of the tab bar height. |
| `src/screens/FlyModeScreen.tsx` | The sheet's bottom padding reads the window's inset. |
| `src/screens/StatsScreen.tsx`, `SettingsScreen.tsx`, `LoveNotesScreen.tsx` | The tab bar padding is dropped: their `SafeAreaView` now covers the bar. |
| `src/navigation/` | Deleted. |
| `src/components/HapticTab.tsx`, `src/components/ui/TabBarBackground*.tsx` | Deleted. No custom tab button, no blur background (F10). `IconSymbol` stays. |
| `package.json`, `package-lock.json`, `app.json` | `expo-router` ~58.0.28 (`npx expo install`) and `react-freeze` ^1.0.4 added; `@react-navigation/bottom-tabs`, `elements`, `native-stack` and `native` removed; the `expo-router` config plugin added. |
| `src/__tests__/router.test.tsx` | New, 13 tests (§6.3). |
| `src/__tests__/splash.test.tsx` | New, 3 tests (§3.6). |
| `src/components/__tests__/tabPressHaptic.test.ts` | Was `HapticTab.test.tsx`: now drives the listener, plus one test that the setting is read at press time. |
| Six screen tests, `StatsScreen.hooks.test.tsx` | The tab-bar-height provider (or mock) is removed; nothing else. |
| `src/hooks/__tests__/useSlotClock.test.tsx` | Provides the router's `NavigationContext`. |
| `src/stores/__tests__/coldStartCompletion.test.tsx` | The header comment names today's late subscribers (§3.7). No assertion changed. |
| `scripts/react-compiler-report.js` | Transforms `app/` as well as `src/`. |
| `docs/architecture/adr/0043-…`, `0028-…`, `0002-…` | New ADR; ADR-0028 is built; ADR-0002 is superseded. |

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

**The root component stays in `src/App.tsx`.** `app/_layout.tsx` is a few lines that render `App` around the router's `Stack`. This keeps B7's merge small: B7 edits nothing in `App.tsx`, and its one call at merge (`onLayout={markFirstFrame}`) goes on `App`'s `GestureHandlerRootView`, which is still the outermost view. `App`'s contract:
- **Input:** `children`, the navigator to render once the stores are hydrated.
- **Output:** gesture root → safe-area provider → `WindowInsetsProvider` → `StoreGate` → `ThemedApp` → `ThemeProvider` → `children`, plus Gift Mode.
- **Side effects:** at module scope, as before: the Reanimated logger, the foreground notification handler, `SplashScreen.preventAutoHideAsync()`. In `ThemedApp`: the start-up work, the notification-tap listener, and the splash hide.

`ExpoRoot` wraps everything in its own `SafeAreaProvider` too. The app keeps its own, so `App`'s contract doesn't depend on the host; both measure the same window.

**The entry** stays `index.tsx`: it imports `./gesture-handler` first, as before, then `expo-router/entry` instead of `registerRootComponent(App)`. `expo-router/entry` brings in `@expo/metro-runtime` itself.

### 3.2 Native tabs

`NativeTabs` from `expo-router/native-tabs` (stable in SDK 58), over react-native-screens' `Tabs` (a `UITabBarController` on iOS).
- **Icons:** the same SF Symbols as before (`heart.fill`, `chart.bar.fill`, `gearshape.fill`, `heart.text.square.fill`), in a table typed `satisfies Record<string, IconSymbolName>`, so a name without an Android/web counterpart in `IconSymbol.tsx`'s mapping still fails `tsc`. Android's `md` icons wait for AN4.
- **Tab-switch animation `none`:** `NativeTabs` has no animation option; `UITabBarController` switches tabs without one. Nothing to configure.
- **The tab-press haptic (DEF-007):** `screenListeners={{ tabPress: tabPressHaptic }}`. The navigator emits `tabPress` for every native selection. `tabPressHaptic()` reads the Haptics setting from the settings store at the moment of the press (so it subscribes to nothing) and, on iOS, plays the same light impact as `HapticTab`. The difference: it fires when the tab is selected, not on press-in.
- **Theme:** `ThemeProvider` with `DarkTheme`/`DefaultTheme` from `expo-router` (the router's copy), chosen by `useTheme().isDark` as before. Each native tab paints the theme's background behind its screen. The bar itself follows the system's appearance, as the blur did (`systemChromeMaterial`).
- **Content insets:** `disableAutomaticContentInsets` on every trigger, so the router doesn't switch the first scroll view of each screen to automatic insets; the screens keep handling safe areas themselves (§3.4).

### 3.3 Frozen hidden tabs: `FreezeOnBlur`

```tsx
export function FreezeOnBlur({ children }) {
    const focused = useIsFocused(); // expo-router
    return <Freeze freeze={!focused}>{children}</Freeze>;
}
```

Each tab route renders its screen inside it. Contract:
- **Input:** the screen. **Must be rendered inside a route** (`useIsFocused` throws outside a navigator).
- **Output:** the screen while its route is focused; frozen otherwise. "Frozen" is react-freeze: a Suspense boundary whose child throws a pending promise. React doesn't render the subtree, and hides what it had committed.
- **Invariants:**
  - It is the mechanism B4 used. React Navigation's `freezeOnBlur` passed through react-native-screens' `Screen` to react-freeze's `Freeze`. So B4 §3.5 holds unchanged: a hidden tab stays mounted, its passive effects (store subscriptions, completion handlers, navigation listeners) keep running, and state it receives renders when it is shown again (the love note, the goal popup and the interstitial).
  - The wrapper sits **outside** its own `Freeze`, so its focus state does commit. B4 §5's warning against `useIsFocused` applies to a component inside the frozen tree, not to this one.
  - **Frozen from the first render** means a tab that isn't focused at launch is never rendered until first shown: the Suspender throws before rendering its children. The navigator's preload mounts only the wrapper, so the tabs are lazy again. Stats' banner and Settings' update check don't run at cold start (which also matters to B7's start-up work).
- **Checked in Jest** with the real tab navigator (`router.test.tsx`): a `<TimerText>` in the Timer route commits **0 times** over 10 s while Stats is shown, and **once** on return, showing the current time; at each cold start only the opened tab's screen has rendered. With the freeze removed, all five of those tests fail.

### 3.4 Safe areas instead of the tab bar height

Native tabs wrap each tab's content in its own `SafeAreaProvider` (`NativeTabsView.ios.js`). Its view sits inside the tab's view controller, so its **bottom inset includes the tab bar**. `useBottomTabBarHeight()` was the bar's height including the home indicator, so:

| Screen | Before | After |
|--------|--------|-------|
| Timer (both modes) | container `paddingBottom: tabBarHeight` | `paddingBottom: insets.bottom`, from the tab's provider |
| Fly sheet | `bottomInset={insets.bottom}`: the home indicator, read at the root | `useWindowInsets().bottom`: the same value, read from the root provider (below) |
| Stats, Settings, Notes | React Native's `SafeAreaView`, **plus** `tabBarHeight` on the banner, the scroll content and the list | `SafeAreaView` alone. Its insets are the native view's, which now include the tab bar, so the extra padding would count it twice. Notes keeps its `+ 8`; Settings keeps its `padding: 16`. |

`useWindowInsets()` is new because the Fly sheet's padding was the window's bottom inset (34 pt portrait, 21 pt landscape on a Face ID iPhone). Inside a tab, `useSafeAreaInsets()` returns about 83 pt instead, which would add a 49 pt band to the sheet. The root's insets are provided once in `App`, under a context of their own. Contract:
- **Output:** the root `SafeAreaProvider`'s insets.
- Outside the provider (tests), it falls back to `useSafeAreaInsets()`.
- **Re-renders** its readers only when the window's insets change (rotation).

Top insets stay from the tab's provider. They equal the window's on iPhone, and on iPad they also clear a tab bar placed at the top.

Two visible differences, both small:
- Settings' and Notes' content no longer scrolls under the bar; it ends at the bar's top edge. D2 restyles these screens.
- Under Jest, `react-native-safe-area-context` is mocked to zero insets, as before. The layout itself is device check 4.

The 720 pt content cap (`maxWidth: 720`) and landscape handling are inside the screens and don't change.

### 3.5 The router's copy of React Navigation

- `useSlotProgress` reads `NavigationContext` from `expo-router/react-navigation`, the object the router's `NavigationProvider` provides.
- It is marked deprecated there ("will be removed in a future SDK"). The comment at the import says what to do when it goes: let `FreezeOnBlur` provide the focus signal.
- `router.test.tsx` pins it: a component inside a frozen Timer tab reads a non-null navigation from that context and hears `focus`, `blur`, `focus` across a switch to Stats and back. That is the input `useSlotProgress` switches its frame callback on (B4 §3.3), which `useSlotClock.test.tsx` tests in turn.
- The four `@react-navigation/*` packages are removed, so the wrong import can't be made by accident, and Metro doesn't bundle a second copy.

### 3.6 Splash, Gift Mode, the notification tap, B7's start-up calls

- **Splash.**
  - The public `SplashScreen.preventAutoHideAsync()` at module scope (unchanged) sets `userControlledAutoHideEnabled` in `SplashScreenModule.swift`; the router's `internalMaybeHideAsync` then does nothing.
  - The module is evaluated when the router loads the root layout, during its first render. The router's own hide runs an animation frame after it mounts, so the prevent call comes first.
  - `ThemedApp` calls `SplashScreen.hideAsync()` in an effect on mount. It renders only below `StoreGate`, and a parent's effect runs after its children's, so the navigator and the first tab have committed: the old `onReady`.
  - **Checked** (`splash.test.tsx`): with the one-time migration held open, nothing renders and the splash stays up; when the migration finishes, the Timer renders and the splash hides once. On a later launch it hides on the first render. Moving the hide above `StoreGate` fails two of those tests.
- **Gift Mode:** unchanged, a sibling of the navigator inside `ThemedApp`; shown on a fresh install and gone once dismissed (tested).
- **Notification tap → Timer (FR-NTF-003):** `router.navigate('/')`, which also pops a stacked 404. Tested from Stats.
- **B7:** `useUpdateCheck(UPDATE_JSON_URL)` and `AdManager.init()` stay together in `ThemedApp`, verbatim, under `// Start-up work (B7 defers this)`. `AdManager.init()` is out of the listener effect, in its own effect.

### 3.7 DEF-004 under Expo Router

DEF-004's cause was React Navigation's `NavigationContainer` rendering nothing until `Linking.getInitialURL()` resolved (up to 150 ms), so the screens subscribed to completions after the clock's cold-start completion had fired. B3 fixed it in the store: a completion waits until a handler of its kind is registered.

**Under Expo Router on iOS that wait is gone.** `getInitialURLWithTimeout()` returns `expo-linking`'s synchronous `getLinkingURL()`, and `useLinking.native.js:88–100` builds the initial state synchronously when the URL is a string. The first tab mounts in the first render. Late subscribers still happen, for other reasons:
- Fly's lazy load (B1);
- a cold start through a deep link into another tab: the Timer tab is frozen from launch, so no Pomodoro handler exists until it is shown. Lazy JavaScript tabs behaved the same way before B6, and the pending completion waits without ticking (the second DEF-004 test);
- Android, where the router still races `Linking.getInitialURL()` against 150 ms.

So the B3 fix stays load-bearing, and the three tests stay as they are. Only the file's header comment changed, to name these causes, and the `MountAfter` helper's doc comment ("a subscriber that mounts late" instead of "the way the navigator's fallback does"). No assertion changed.

### 3.8 Deep links

The `valentinepomodoro` scheme stays in `app.json`. On iOS, `valentinepomodoro://stats` reaches the router as `getLinkingURL()` (cold) or a `url` event (warm). `extractExpoPathFromURL` turns it into host plus path, `stats`:

| URL | Opens |
|-----|-------|
| `valentinepomodoro://` | Timer |
| `valentinepomodoro://stats` | Stats |
| `valentinepomodoro://settings` | Settings |
| `valentinepomodoro://notes` | Notes |
| anything else | the 404 screen, with a link home |

**Tested end to end** (`router.test.tsx`): the real `app/` tree, with `expo-linking`'s `getLinkingURL` and `addEventListener` replaced, so each URL goes through the same parsing and state building as on the phone. Two things in the test harness made this work, both recorded in the test:
- `renderRouter`'s `initialUrl` is a server location that bypasses that parsing (in a spike, `valentinepomodoro://stats` opened `/`). The tests pass `initialUrl: null`.
- The router reads the launch URL only where `window` exists (its guard for server rendering), and Jest's environment has none. The file defines it for its own tests.

The device checks the scheme registration itself (device check 6).

**Changed paths:** the old automatic linking derived paths from screen names, so `love-notes` becomes `notes`. Nothing in the app or the docs links to the old paths (searched), so no redirect was added.

### 3.9 Dependencies and native code

**B6 adds native code**, so it needs a new build (the combined TestFlight build):
- `expo-router`'s iOS module: `ExpoHeadModule`, `LinkPreviewNativeModule`, `RouterToolbarModule` and the `ExpoHeadAppDelegateSubscriber` app-delegate subscriber (`expo-module.config.json`);
- its dependencies `expo-glass-effect` (`GlassEffectModule`, iOS) and `@react-native-masked-view/masked-view` (`RNCMaskedView`), both autolinked;
- the tab bar itself is react-native-screens' `Tabs`, part of the `RNScreens` pod already in build 45.

`react-freeze` is JavaScript; it was already installed as a react-native-screens dependency and is now a direct one. `npx expo install --check` reports every dependency up to date. `npx expo-doctor` passes 19 of 20 checks; the failure is `@expo/config-plugins` installed directly, which predates B6.

## 4. Mathematical / Statistical Details

### 4.1 Render counts

**Expected:** the Reassure scenarios render each screen without a navigator, so B6 changes their counts only if a screen's own render path changes. The screens lose `useBottomTabBarHeight()` (a context read, constant 0 in the tests). Timer and Fly gain `useSafeAreaInsets()`/`useWindowInsets()` reads, constants under the Jest mock. So every count should equal B5's.

**Measured** in this worktree: the pre-change baseline at `7034bba` (`npx reassure --baseline`, after `npm ci`), then three invocations at the B6 code. Each invocation does 3 measured runs after 1 warm-up.

| Scenario | B5 (record) | Baseline here, `7034bba` | B6, ×3 invocations (9 runs) |
|----------|---:|---:|---:|
| settings-only consumer | 1 | 1 | **1** |
| Timer screen (Classic) | 13 | 13 | **13** |
| Stats screen | 1 | 1 | **1** |
| Settings screen | 2 | 2 | **2** |
| Notes screen | 1 | 1 | **1** |
| `<TimerText>` leaf | 12 | 12 | **12** |

Every count was identical across all of its runs. Timing is advisory, as in CI: the Timer screen's mean render time was 16.0, 64.0 and 21.3 ms over the three invocations against the baseline's 23.7 ms; the 64.0 ran beside an `npm ci` in another worktree. The other scenarios are within 1 ms of the baseline.

The baseline column reproduces B5's numbers here, so the environment is comparable. The freeze adds nothing to these scenarios; its own check is §3.3, as B4's was.

### 4.2 The bytecode

Two bounds apply to the iOS Hermes bytecode $b$:
- **the ceiling, NFR-PERF-002:** $b < 3{,}856{,}208$ B (the SDK 58 baseline);
- **the reference:** B5's 3,463,508 B, which leaves $3{,}856{,}208 - 3{,}463{,}508 = 392{,}700$ B of headroom.

**Measured** with `npx expo export --platform ios --dump-sourcemap`, each output in a scratch folder. B5 was re-exported here from a detached worktree at `7034bba` and reproduced exactly.

| Build | iOS bytecode | Against B5 | Against the ceiling |
|-------|---:|---:|---:|
| B5, `7034bba` (re-measured) | 3,463,508 B | — | −392,700 B |
| **B6, `62fef2e`** | **3,894,148 B** | **+430,640 B (+12.43 %)** | **+37,940 B (+0.98 %)** |
| B6 with Metro tree shaking (measurement only) | 3,554,012 B | +90,504 B (+2.61 %) | −302,196 B |
| B5 with Metro tree shaking (for comparison) | 3,082,828 B | −380,680 B (−10.99 %) | −773,380 B |

**Where the growth is.** The source map attributes bytecode offsets to source files. Summing the mapped spans per package, B5 → B6:

| Package | Mapped bytes |
|---------|---:|
| `expo-router` (router, its React Navigation copy, native tabs, link preview, head, the JavaScript tabs and drawer router it exports) | +400,097 |
| `@react-navigation/core`, `elements`, `native`, `routers`, `bottom-tabs`, `native-stack` | −163,995 |
| `react-native-screens` (the `Tabs` components) | +13,846 |
| `color`, `color-convert`, `color-string`, `color-name`, `simple-swizzle` (used by the removed `elements`) | −20,571 |
| `expo-linking`, `@radix-ui/*`, `expo-status-bar`, `react-fast-compare`, `expo-glass-effect`, masked-view | +16,666 |
| `app/` routes, minus what left `src/` | +1,744 |
| everything else | +3,531 |
| **mapped total** | **+251,318** |

The unmapped part (string table, function headers) grew by 179,322 B in proportion. So the cost is Expo Router's, not the app's. Metro doesn't tree-shake by default, and `expo-router`'s main entry re-exports the JavaScript tabs, the drawer router, the sitemap and link previews whether or not the app uses them.

**Tree shaking** (`EXPO_UNSTABLE_TREE_SHAKING=1 EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1`, with Expo's default `experimentalImportSupport: true`; no config change) removes about 340 KB from B6. **Only the export was run**: the app wasn't launched with it, and no test covers it. It is an option for you (§7.1), not part of B6.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Native tabs (`expo-router/native-tabs`) | Expo Router's JavaScript tabs (`expo-router/js-tabs`), which keep `freezeOnBlur`, `tabBarButton`, the blur background and `useBottomTabBarHeight` exactly | ADR-0028 and the plan row decided native tabs; the design workflow allows glass only where the system draws it, and F10 drops the blurred bar. JavaScript tabs would have been the smaller change, but not the approved one, and no smaller in bytes: they come from the same router package. |
| Freeze with a route-level wrapper | Drop freezing; React's `<Activity>` (the router's `NavigationAwareActivity`); `screenLayout` on the navigator | Dropping it loses B4 §3.5's checked behaviour and lets the navigator mount every tab at launch. `<Activity mode="hidden">` runs effect cleanups, so a hidden Timer would stop handling completions. `screenLayout` works at runtime but isn't in `NativeTabs`' types. |
| Keep the root component in `src/App.tsx`; `app/_layout.tsx` renders it | Move `ThemedApp` into `app/_layout.tsx` | B7's merge call goes on `App`'s outermost view, and the start-up calls stay where B7 expects them. The merge preview is conflict-free (§6.5). |
| `disableAutomaticContentInsets` on every tab | Let the router set automatic insets on each screen's first scroll view | Automatic insets would add the status bar to the Timer's scroll view, which already pads by `insets.top + 20`. Manual insets keep the layout. |
| `useWindowInsets()` for the Fly sheet | `initialWindowMetrics`; accept a bigger sheet padding | `initialWindowMetrics` is fixed at launch, so it is wrong after a rotation (34 vs 21 pt). The bigger padding is a visible regression. |
| Remove the `@react-navigation/*` packages | Keep them installed | A stray import from them compiles and fails silently (§3.5). Removing them also keeps a second copy out of the bundle. |
| The haptic in a `tabPress` listener that reads the setting at press time | Drop it (native tab bars have no haptic by default); a hook in the layout | DEF-007's fix is on the must-keep list. Reading at press time needs no subscription, so the tab bar never re-renders for a setting. |
| Deep-link tests through the real tree, with `expo-linking` replaced | `renderRouter`'s `initialUrl`; a unit test of the router's internal URL parser | `initialUrl` bypasses the URL parsing; the parser is internal. Replacing the one native call keeps everything after it real. |
| A new requirement, FR-NAV-001, for deep links | Cite an existing requirement | None fits. The SRS entry is in §8. Until it lands, the plain docs check reports the test's `covers: FR-NAV-001` as undefined. |
| Leave the bytecode overage to you | Turn tree shaking on in B6 | Tree shaking changes how every module is bundled, under a flag named `UNSTABLE`, and was measured, not run. It is a release-wide change, so it needs its own task and device check. |

## 6. Verification

### 6.1 Commands

```bash
npm run typecheck
npm run lint
npx jest --ci
npx reassure --baseline   # before the change, at 7034bba
npx reassure              # after, ×3
node scripts/react-compiler-report.js
npx expo export --platform ios --dump-sourcemap --output-dir <scratch>
npx expo install --check
node scripts/docs/check-docs.mjs
```

### 6.2 Local results

- [x] **Typecheck** clean.
- [x] **Lint: 0 errors**, 37 warnings (B5: 38). B6's only change to the list: the one `no-empty-object-type` went with `src/navigation/index.tsx`. None of the new files has a warning.
- [x] **Jest: 151 passed, 28 suites** (B5: 134 in 26): +13 router tests, +3 splash tests, +1 haptic test. Before the change, a cold first run had one timeout in `StatsScreen.hooks.test.tsx` (the first test pays for the transforms); it passed alone and in a warm full run (134/134).
- [x] The guards: `timerTextTicks`, both `timerScreenTicks` tests and `flyModeGuard` pass. So do `useSessionClock.test.ts` ("fires completion exactly once…") and the three DEF-004 tests in `coldStartCompletion.test.tsx`.
- [x] **Mutation check on the guards:** with the clock store's `notify()` on a changed second deleted (`resampleAndComplete`), all three timer guards fail at 24:59 (`timerTextTicks.test.tsx:43`, `timerScreenTicks.test.tsx:85` and `:112`; four lines earlier than in B5, where the removed provider stood). The file was restored, byte-identical (sha256 checked).
- [x] **Reassure** equals B5 in all runs (§4.1).
- [x] **React Compiler report:** 44 functions compiled, the same 7 skipped as at B5, no worklet count changed. 38 at B5 − 4 removed (`HapticTab`, `BlurTabBarBackground`, `useBottomTabOverflow`, `NotFound`) + 10 new (`FreezeOnBlur`, `WindowInsetsProvider`, `useWindowInsets` and the 7 route components).
- [x] **Bytecode** measured (§4.2): over the ceiling by 37,940 B.
- [x] The Metro export bundles all seven `app/` routes and none of the removed packages (checked in the source map).
- [x] `npx expo install --check`: up to date.

### 6.3 The new tests, and how each was seen to fail

`src/__tests__/router.test.tsx`, over the real `app/` tree (only the Timer route is replaced by a probe in the two freeze tests):

| Test | Mutation that made it fail |
|------|----------------------------|
| A cold start from each of the four URLs opens its tab, and only that tab renders (4) | `FreezeOnBlur` never freezes: the other tabs render at launch |
| A link while the app is open switches tabs | Not mutation-checked |
| An unknown path opens the 404, which links home | Not mutation-checked |
| The tab bar is Timer, Stats, Settings, Notes, with their SF Symbols | Not mutation-checked |
| A tab press plays the haptic with Haptics on, and not off (2) | The `tabPress` listener is removed |
| A hidden tab commits nothing during a session and catches up when shown | `FreezeOnBlur` never freezes |
| A screen in a tab gets the router's navigation, and hears blur and focus while frozen | Not mutation-checked. With `@react-navigation/native`'s context it would record "no navigation"; that package is no longer installed, so the mutation can't be run |
| A notification tap opens the Timer tab | The listener navigates to `/settings` |
| Gift Mode shows on the first launch only | Not mutation-checked |

`src/__tests__/splash.test.tsx`: the splash is held from import; it stays up while the one-time migration runs and hides once the app has rendered; it hides on the first render on later launches. Seen to fail (two tests) with the hide moved above `StoreGate`.

Every mutated file was restored and checked byte-identical.

### 6.4 Docs

`node scripts/docs/check-docs.mjs --write` was run, and only this branch's files were committed (§8 explains). The plain check then reports 12 errors, all expected until the merge:
- two citations of `FR-NAV-001` (this record and `router.test.tsx`), which §8.3's SRS entry defines;
- `TRACEABILITY.md` out of date, including its link to the renamed `HapticTab.test.tsx`;
- stale backlink blocks in seven shared files, and in this record, whose block lists the traceability page as `--write` would regenerate it.

After the merge, applying §8 and running `--write` clears all of them.

### 6.5 The merge with B7, previewed

- `git merge-tree --write-tree phase1/b6-expo-router phase1/b7-deferred-startup` (at B7's `471e34f`): **no conflicts.** Both branches touch `SettingsScreen.tsx`, two lines apart in the imports and far apart below, and Git merges them.
- The merged tree, in a throwaway detached worktree (`1acd97f`, a merge commit on no branch; the worktree is removed), after `npm ci`:
  - typecheck clean; lint 0 errors, 37 warnings;
  - **Jest 197/197 in 33 suites** (B6's 151 plus B7's 46). A first run beside other work timed out once in `flyLazyLoad.test.tsx` (94.7 s for the suite); it passed alone and in a clean full run;
  - **iOS bytecode 3,912,884 B**: B6's 3,894,148 plus 18,736 B of B7, so **56,676 B (1.47 %) over the ceiling**.
  - Not checked here: B7's `markFirstFrame` call, which the parent adds at merge on `App`'s `GestureHandlerRootView` in `src/App.tsx` (B7 record §3.6). That view is unchanged by B6, and B7's `@/startup/deferredStartup` import resolves under Jest too (jest-expo maps `@/` to `src/`), so the router and splash tests, which render the real `App`, can load it.

### 6.6 Device (iPhone, TestFlight build 46): failed, items 1 and 2

Jest's mocks can't show the native tab bar, real safe areas, the scheme registration, or the timing between UIKit and JavaScript. Install over build 45 (so stats, notes and settings are real), on the iPhone. B7's own checklist (its record §6.5–6.6) runs on the same build.

**The build (2026-10-30, your go-ahead):**

| | |
|--|--|
| Command | `eas build --platform ios --profile production --non-interactive`, then `eas submit --platform ios --id bf625f5c-beb8-4fef-8130-ee0e798417c1 --non-interactive` |
| EAS build | `bf625f5c-beb8-4fef-8130-ee0e798417c1`, **v1.4.0, build 46**, SDK 58.0.0, built 09:02–09:07 UTC |
| Source | `3369418`: B6's merge `1b7a8d7`, B7's merge `3d3fbaf`, and the follow-up that wires `markFirstFrame`. Checked locally before the build: typecheck clean, lint 0 errors, Jest 197/197 in 33 suites, Reassure 1/13/1/2/1/12, `expo install --check` clean. CI green on `3369418` (run 41030329092) |
| Submission | `a4695d2b-7f17-439b-af67-72bf2d6469b3`, uploaded to App Store Connect, then Apple's processing |
| Tag | `v1.4.0-tf.46` (annotated, at `3369418`) |

**Result: failed on a physical iPhone, items 1 and 2 (2026-10-30).** You first reported the combined 19-item list as "all passes the verifications", then, using the build, reported two failures:

- **Item 1:** "for every page switch the screen kind of flicks and causes an unsettling feeling for the eyes". This is the blank frame ADR-0043 named as B6's one new risk: UIKit shows the tab while React still hides the frozen screen's content, and the content appears only when JavaScript unfreezes it.
- **Item 2:** "when i switch to notes in light mode the toggle bar kind of bugs out and turns itself to dark mode colors". The Notes screen paints only `colors.bg` and sets the status bar as Timer does, so nothing in its code is dark. The likely cause is the same blank frame: the Liquid Glass bar adapts to the empty view behind it. That is unconfirmed until a fixed build is on the phone.

The other nine items passed. The fix is open: ADR-0043's fallback (remove `FreezeOnBlur`) brings back what B4 §3.5 fixed (the interstitial over Stats, the goal popup dismissed unseen), so it needs Timer to hold its overlays until it is focused.

1. **No flash on switching tabs.** Switch between all four tabs several times, quickly and slowly, then again during a running session. A tab you have opened before must appear with its content, with no blank or background-coloured frame. *If it flashes:* that is the freeze (ADR-0043). The fallback is to remove `FreezeOnBlur` from the routes, then re-check item 8 and the cold-start cost; report it rather than accept it.
2. **The tab bar:** the system tab bar (on iOS 26, Liquid Glass), with the heart, chart, gear and note icons labelled Timer, Stats, Settings, Notes, in that order. Switching tabs has no animation. Dark mode: the bar follows the phone's appearance, as before.
3. **The tab haptic:** a light tap on each tab press with Settings → Haptics on; none with it off.
4. **Bottom edges, portrait and landscape:**
   - Timer in Classic: the Start, Skip and Reset buttons sit fully above the tab bar.
   - Fly: the sheet at peek and at full looks as on build 45, with no extra empty band at its bottom; the map ends at the tab bar.
   - Stats: the banner is fully visible above the tab bar; the 7-day chart is not covered.
   - Settings: scroll to the end; the last row is reachable and not under the bar.
   - Notes: scroll to the end; the last note is reachable.
   - Landscape: the same, plus no content under the notch; on an iPad, if one is available, the content is capped at 720 pt and the tab bar (at the top on iPadOS 18+) covers nothing.
5. **The timer still ticks** in Classic and Fly after switching to another tab and back; the ring keeps moving.
6. **Deep links**, typed into Safari's address bar or tapped in Notes:
   - with the app killed: `valentinepomodoro://` → Timer, `valentinepomodoro://stats` → Stats, `valentinepomodoro://settings` → Settings, `valentinepomodoro://notes` → Notes;
   - with the app open on another tab: the same four;
   - `valentinepomodoro://nope` → the 404 screen; "Go to Home" returns to Timer.
7. **A notification tap opens Timer:** start a 1-minute focus, switch to Stats, lock the phone, tap the notification. Then once more with the app killed after starting.
8. **B4's frozen-tab behaviour (B4 §3.5):** start a 1-minute focus with a 1-minute daily goal, switch to Stats, wait for it to end. Stats shows the credit while you are on it. The goal popup and the love note (then the interstitial, when the ad policy allows) appear when you return to Timer, not before.
9. **DEF-004 (cold-start completion):** start a 1-minute focus, kill the app, wait 2 minutes, relaunch: credited once. Then the same, relaunching with `valentinepomodoro://stats`: Stats opens without the credit; opening Timer credits it once.
10. **Launch:** the splash goes straight to the Timer, with no white frame and no "Loading…".
11. **Fly** still loads on first switch, picks airports, starts and lands (B1/B1b unchanged).

## 7. Findings and open items

1. **The bytecode is over NFR-PERF-002's ceiling by 37,940 B (0.98 %); the merged B6+B7 tree by 56,676 B (1.47 %)** (§6.5). **Your decision:**
   - **(a) Accept it for now, and revisit at E3 with the cold-start time in hand** (recommended). NFR-PERF-002 is a proxy for NFR-PERF-001 (time to interactive), which B7's build measures on the iPhone. The SRS entry in §8 records it as not met.
   - **(b) Add a task to turn on Metro's tree shaking.** Measured at 3,554,012 B (−340 KB, 302 KB under the ceiling). It changes how every module is bundled, under flags named `EXPO_UNSTABLE_*`, so it needs the full test run, the bundle checked for dropped side-effect imports, and its own device check.
   - **(c) Re-baseline NFR-PERF-002** to include the router, as the approved Expo Router decision's cost.
   - **Decided 2026-10-30: (a).** You accepted the overage for now; it is revisited at E3 with B7's TTI numbers. On the merged tree (B6, B7 and the `markFirstFrame` wiring) the iOS bytecode is 3,912,916 B, 56,708 B (1.47 %) over.
2. **Native tabs mount every tab at launch and don't freeze** (§1, §3.3). Fixed by `FreezeOnBlur`. The one residual risk is device check 1.
3. **Expo Router 58 vendors React Navigation** (§3.5). Anyone adding a navigation import should take it from `expo-router` or `expo-router/react-navigation`; the `@react-navigation/*` packages are gone, so the wrong one fails to resolve.
4. **`NavigationContext` from `expo-router/react-navigation` is deprecated upstream.** When an SDK removes it, move `useSlotProgress`'s focus signal to `FreezeOnBlur`.
5. **The test harness needed three workarounds,** each commented in the test files: `initialUrl: null` and a `window` global for the router's launch-URL path, the `expo-linking` functions installed once on the testing library's mock (the router reads it through a copy made on first use), and `setNotificationHandler` stubbed because the real one fails on jest-expo's event-emitter mock.
6. **Pre-existing, not B6's:** `expo-doctor`'s `@expo/config-plugins` warning.
7. **Not changed:** the Android `md` icons and Android's automatic bottom inset in native tabs (AN4); Settings' and Notes' content no longer scrolling under the bar (D2).

## 8. Shared-doc updates to apply at merge

This branch doesn't edit shared docs. Apply each of these when merging, then run `node scripts/docs/check-docs.mjs --write`. Commit hashes are this branch's; if the merge rewrites them, use the merged ones. Text to paste is in fenced blocks.

### 8.1 Phase 1 plan, the B6 row

Append to the row's "Done when" cell:

```markdown
<br>**Status, 2026-10-30: code done on `phase1/b6-expo-router` (`a736b22`, `65fa2ea`, `62fef2e`); the device check waits for the B6+B7 TestFlight build.** Expo Router 58.0.28 with the iOS native tab bar; `src/navigation/` is gone. Native tabs neither freeze nor stay lazy, so each tab route renders its screen inside `FreezeOnBlur` (react-freeze, as `freezeOnBlur` was), and B4 §3.5 holds. Deep links open each tab, cold and warm, tested end to end. Jest 151/151; lint 0 errors; Reassure unchanged from B5 (1/13/1/2/1/12); the guards' mutation check holds. **iOS bytecode 3,894,148 B, 37,940 B over NFR-PERF-002's ceiling**: all of it Expo Router; your decision ([B6 doc](2026-10-30-phase1-b6-expo-router.md) §7.1). Adds native code. [B6 doc](2026-10-30-phase1-b6-expo-router.md), [ADR-0043](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md).
```

### 8.2 ROADMAP, Stage B

Replace the B6 half of the `B6 Expo Router · B7 deferred start-up work | Not started` row with its own row (B7's record has its own):

```markdown
| | B6 Expo Router with native tabs; hidden tabs frozen by a route wrapper; deep links open each tab | **Code done** `a736b22`…`62fef2e` ([B6](../implementations/2026-10-30-phase1-b6-expo-router.md), [ADR-0043](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md)); guards green and mutation-checked; Reassure unchanged from B5; bytecode 37,940 B over NFR-PERF-002 (your decision); device check on the B6+B7 TestFlight build |
```

### 8.3 SRS

1. In §3's area table, after `| Web | `WEB` |`:

```markdown
| Navigation and deep links | `NAV` |
```

2. After §3.2.16 (Web), a new subsection:

```markdown
#### 3.2.17 Navigation (NAV)

#### FR-NAV-001
**Statement:** A `valentinepomodoro://` link shall open its tab: `valentinepomodoro://` Timer, `valentinepomodoro://stats` Stats, `valentinepomodoro://settings` Settings and `valentinepomodoro://notes` Notes, whether the link launches the app or arrives while it runs. Any other path shall open a not-found screen with a link to Timer.
**Pri:** Should · **Target:** Phase 1 (B6) · **Status:** implemented (B6, `a736b22`; device check on the B6+B7 TestFlight build pending)
**Verify:** T: `src/__tests__/router.test.tsx` (each URL cold and warm, through the router's own URL parsing); D: [B6 §6.6](../implementations/2026-10-30-phase1-b6-expo-router.md), item 6 · **Source:** PLAN-PHASE1 B6, [ADR-0028](../architecture/adr/0028-expo-router.md)
```

3. FR-NTF-003's last line becomes:

```markdown
**Pri:** Should · **Target:** v1 · **Status:** implemented · **Verify:** T: `src/__tests__/router.test.tsx` (since B6); D: [B6 §6.6](../implementations/2026-10-30-phase1-b6-expo-router.md), item 7
```

4. NFR-PERF-002's status, after "Re-measured at E3 before release.":

```markdown
**Not met after B6** (2026-10-30): iOS 3,894,148 B, 37,940 B (0.98 %) over the baseline, all of it Expo Router ([B6 record §4.2](../implementations/2026-10-30-phase1-b6-expo-router.md)); with B7 merged, 3,912,884 B (56,676 B over). Decision pending (B6 §7.1).
```

5. NFR-PERF-003's status, after the B5 sentence:

```markdown
B6, 2026-10-30, kept hidden tabs frozen under native tabs with a route wrapper (`FreezeOnBlur`), checked in Jest through the real tab navigator; every Reassure count unchanged.
```

and add `src/__tests__/router.test.tsx` to its Verify list.

6. DEF-007's Evidence cell: `HapticTab.tsx` becomes `` `tabPressHaptic.ts` (was `HapticTab.tsx`, until B6) ``.

7. DEF-004's "Fix in" cell, append:

```markdown
Under Expo Router (B6) the iOS navigator no longer waits for the launch URL; the fix stays load-bearing for Fly's lazy load, deep-link launches into another tab, and Android ([B6 §3.7](../implementations/2026-10-30-phase1-b6-expo-router.md)).
```

### 8.4 ARCHITECTURE

1. §1.3, a new first update note:

```markdown
> **Update, 2026-10-30 (B6):** B6 is code-complete on `phase1/b6-expo-router` (`a736b22`, `65fa2ea`, `62fef2e`; [B6 record](../implementations/2026-10-30-phase1-b6-expo-router.md), [ADR-0043](adr/0043-native-tabs-frozen-by-a-wrapper.md)). Expo Router 58 replaces `src/navigation/`: `index.tsx` imports `expo-router/entry`; `app/_layout.tsx` renders `App` (`src/App.tsx`) around a native stack with `(tabs)` and `+not-found`; `app/(tabs)/_layout.tsx` is the iOS native tab bar. Each tab route renders its screen inside `FreezeOnBlur`, which keeps hidden tabs frozen and lazy. Screens lay out by safe-area insets; the router vendors React Navigation, and the `@react-navigation/*` packages are gone. §5.2 and §5.3 below still describe React Navigation.
```

2. §5.3 Navigation, replaced (apply when the document is re-baselined after Stage B, or now in place of the old text):

```markdown
### 5.3 Navigation

Expo Router 58 (file routes in `app/`; [ADR-0028](adr/0028-expo-router.md), [ADR-0043](adr/0043-native-tabs-frozen-by-a-wrapper.md)).

- **Routes:** `app/_layout.tsx` renders `App` from `src/App.tsx` around a native `Stack` holding `(tabs)` and `+not-found`. `app/(tabs)/` holds `index` (Timer, Classic with the Fly switch), `stats`, `settings` and `notes`. URLs: `/`, `/stats`, `/settings`, `/notes`; the `valentinepomodoro://` scheme maps onto them (FR-NAV-001), and any other path is the 404.
- **The tab bar** is the iOS native one (`expo-router/native-tabs`, a `UITabBarController`), with SF Symbols typed against `IconSymbol`'s mapping. No switch animation. Its `tabPress` listener plays the haptic when Haptics is on (`tabPressHaptic.ts`, DEF-007).
- **Frozen, lazy tabs:** native tabs mount every tab at launch and never freeze, so each tab route renders its screen inside `FreezeOnBlur` (react-freeze, keyed on `useIsFocused`). A hidden tab stays mounted and keeps its effects; it renders nothing until shown again, and a tab never opened is never rendered.
- **Safe areas:** each tab has its own `SafeAreaProvider` whose bottom inset includes the bar. Timer pads by it; Stats, Settings and Notes rely on their `SafeAreaView`; the Fly sheet reads the window's inset through `useWindowInsets()`. Every tab sets `disableAutomaticContentInsets`.
- **One copy of React Navigation:** the router vendors it. `useSlotClock` reads `NavigationContext` from `expo-router/react-navigation`; nothing imports `@react-navigation/*`.
- **The splash** stays up until `ThemedApp` (below `StoreGate`) has mounted; the router's own hide is blocked by the public `preventAutoHideAsync()`.
```

3. §12's table, the B6 row:

```markdown
| Phase 1 B6 | Expo Router: `app/(tabs)/index`, `stats`, `settings`, `notes`, `+not-found`; the iOS native tab bar; hidden tabs frozen by `FreezeOnBlur`; the scheme is kept | `src/navigation/` | **Done** on `phase1/b6-expo-router` (`a736b22`…`62fef2e`); device check on the B6+B7 TestFlight build |
```

### 8.5 CHANGELOG, Unreleased

Under "Changed", after the B5 bullet:

```markdown
- **Stage B:** B6, navigation moves to Expo Router 58 with the iOS native tab bar (a736b22; [ADR-0043](docs/architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md)). The routes live in `app/`: Timer at `/`, then `/stats`, `/settings` and `/notes`, and `valentinepomodoro://` links open each tab. The blurred tab bar is gone (the system draws its own), and the tab haptic still follows the Haptics setting. Hidden tabs stay frozen and are still loaded only when first opened. The iOS bytecode is 3,894,148 B, 37,940 B over the SDK 58 baseline because of the router (NFR-PERF-002, decision pending). New native code: Expo Router's iOS module, `expo-glass-effect` and `@react-native-masked-view/masked-view`.
```

Under "Added", in the Stage B tests bullet, after "Classic's overlay order (630c35a)":

```markdown
; the router over the real `app/` tree: deep links, frozen tabs, the tab haptic, the notification tap and the splash (65fa2ea). Jest runs 151 tests in 28 suites at B6
```

(and drop "Jest runs 134 tests in 26 suites at B5." from that bullet). Under "Removed":

```markdown
- **Stage B:** `src/navigation/`, `HapticTab`, the blurred `TabBarBackground`, and the `@react-navigation/bottom-tabs`, `elements`, `native-stack` and `native` packages, which Expo Router replaces (a736b22).
```

### 8.6 TEST-STRATEGY §4, a guard row

```markdown
| `src/__tests__/router.test.tsx` | Deep links open each tab (FR-NAV-001); hidden tabs commit nothing and catch up on return, and the router's `NavigationContext` reaches a frozen screen (NFR-PERF-003, B4 §3.5); the tab haptic follows the setting (FR-SET-001); a notification tap opens Timer (FR-NTF-003). Mutation-checked in B6 | Any change to `app/`, the tab navigator or `FreezeOnBlur`; every Expo Router upgrade |
```

### 8.7 Documentation map (`docs/README.md`)

In "Implementation records", above the B5 row:

```markdown
| 2026-10-30 | [Phase 1 B6: Expo Router with native tabs](implementations/2026-10-30-phase1-b6-expo-router.md) |
```

### 8.8 ADR index

A new row after ADR-0042, and ADR-0002's status:

```markdown
| [ADR-0043](0043-native-tabs-frozen-by-a-wrapper.md) | Native tabs, frozen by a route wrapper, laid out by safe-area insets | accepted | 2026-10-30 |
```

```markdown
| [ADR-0002](0002-react-navigation-template.md) | React Navigation bottom tabs from the `with-react-navigation` template | superseded by ADR-0028 | 2026-01-07 |
```

and in the intro, "The first superseded record is ADR-0035, by ADR-0041 (Phase 1 B5)." gains: "ADR-0002 followed, by ADR-0028 (Phase 1 B6)."

## 9. The fix for build 46: tabs that never freeze

**Status:** Plan (this section is written before any code). Branch `phase1/b6-tabs-fix`, cut from `c628453` (B6 and B7 merged, the `markFirstFrame` wiring, build 46's result). Approved by you through the session that started this one: "Stop freezing tabs."

### 9.1 Problem

Build 46 failed two device checks (§6.6), and one more problem surfaced:

1. **Every tab switch flickers.** UIKit shows the new tab first; JavaScript then unfreezes it. React had hidden the frozen screen's committed content, so a frame of background shows. ADR-0043 named this risk. Nothing that hides committed content can avoid it on native tabs: react-freeze's Suspense, `display: none` and `<Activity>` all hide. Neither expo-router 58.0.28's `NativeTabs` nor react-native-screens 4.30.1's tabs offer a freeze that the native side waits for.
2. **On Notes in light mode, the tab bar turns to dark colours.** Probably the same blank frame: the Liquid Glass bar adapts to what is behind it. A second documented candidate: under native tabs, a `FlatList`'s scroll-edge detection can fail and make the bar transparent (Expo's known limitation; the fix is `disableTransparentOnScrollEdge`). Notes is the only screen with a `FlatList`.
3. **No banner in Stats.** It showed on build 45 and earlier; the interstitial works, so the SDK starts. Reading the banner's JavaScript and native code (`BaseAd.tsx`, `RNGoogleMobileAdsBannerView.mm`) and B7's `AdManager` change found nothing that proves a cause. The candidates are:
   - the banner laid out behind the native bar (Stats uses React Native's own `SafeAreaView`). The other bottom edges passing argues against this, but doesn't settle it;
   - the first request racing B7's deferred `MobileAds().initialize()`;
   - the freeze under Fabric (a frozen subtree is `display: none`, and Fabric unmounts those views; the banner view is then recycled and requests again).

### 9.2 Approach (planned)

1. **`FreezeOnBlur` is replaced by `LazyTab`, a latch that never hides.** A tab renders nothing until its route is first focused, or until start-up has gone idle after B7's interactive mark, whichever comes first. From then on it always renders its screen; nothing hides it again.
   - **Initial state:** `navigation?.isFocused() ?? true`, through the router's `NavigationContext` (the import `useSlotClock` already uses). Outside a navigator it renders at once.
   - **Latching:** a `focus` listener and the start-up callback, both subscribed in an effect, each `setState` only inside its callback (`react-hooks/set-state-in-effect` is at `error`).
2. **A new scheduler function, `runAfterInteractive`, in `src/startup/deferredStartup.ts`.**
   - `runAfterFirstFrame` can't carry the pre-render: in the eager arm it runs a task at registration, before the first frame, which would skew that arm against build 46.
   - `runAfterInteractive` waits for the interactive mark in both arms. `markFirstFrame()`'s idle callback notes the mark, then requests one more idle callback for these tasks. Under same-timeout FIFO that lands after B7's drain: interactive mark → ads and update check → tabs. It runs **one task per idle callback**, so each tab's first render is its own unit of work.
   - So neither B7 metric moves: TTI is the interactive mark, and TTI⁺ is max(interactive, `drainEnd`), where `drainEnd` is marked synchronously at the end of the drain.
   - **No fallback timer.** If `markFirstFrame()` never fires, a tab still renders on its first focus; only the pre-render is lost.
   - It returns a cancel function, like `runAfterFirstFrame`.
3. **Two focus hooks, safe outside a navigator** (`src/hooks/useScreenFocus.ts`):
   - `useScreenFocused()`: live focus, `useSyncExternalStore` over the route's `focus`/`blur` listeners, snapshot `navigation?.isFocused() ?? true`;
   - `useHasBeenFocused()`: latches true at the first focus.

   Every existing test and Reassure scenario renders screens without a navigator, where both are constantly true.
4. **Timer keeps B4 §3.5's behaviour without the freeze.** It used to get it from the freeze; now it is explicit:
   - `GoalReachedPopup` is an RN `Modal`, presented over the window, so without a gate a goal reached on Stats would open over Stats. `visible={!!goalPopup && focused}` gates it and its auto-dismiss timer (started in its `visible` effect).
   - `LoveNoteCard` mounts only while focused: its 8 s auto-dismiss starts on mount.
   - The interstitial effect returns early while not focused, with `focused` in its deps, so it fires on return.
   - **Fly has the same three:** its landing love note and its own `showIfReady` effect.
5. **Fly's frame callback stops while the Timer tab is hidden.** The freeze used to suspend Fly's 15 Hz `runOnJS(setMarkerCoord)` renders; without it, a hidden flight would re-render `FlyModeScreen` 15 times a second. The callback gets `setActive(focused)`, the pattern B4's `useSlotProgress` already uses on the device. The plane's position is a pure function of the clock (ADR-0019), so it is exact again on the first frame after return.
6. **The banner: gate it, and instrument it.**
   - `<BannerAd>` mounts only once Stats has been focused (`useHasBeenFocused`), so the pre-render never requests an ad for a screen nobody has opened (AdMob placement rules). Its container stays, so the layout before the ad loads is as before.
   - A small in-memory module, `src/ads/bannerStatus.ts`, records this launch's banner: requested, loaded (W×H), or failed (code and message). It also records where the container landed: its bottom edge in window coordinates (`measureInWindow`), against the window height minus the tab's bottom inset (the tab bar's top edge).
   - B7's hidden panel gets one line for it, and the share data gets it too. So build 47 tells "didn't load" (the error code) from "loaded behind the bar" (a bottom edge below the bar's top).
   - Stats' safe-area handling is **not** rewritten on a guess. It would also diverge from Settings, which the parent session is editing.
7. **Notes' bar (item 2):** nothing changes for it beyond the flicker fix. If build 47 still shows a dark bar on Notes, the fallback is `disableTransparentOnScrollEdge` on `NativeTabs`, a navigator-wide appearance change that needs its own check.

### 9.3 Tests and checks (planned)

- `router.test.tsx`, with `runAfterInteractive` mocked so a test fires the pre-render itself (its module state can't be reset between launches in one file):
  - a cold start renders only the focused tab until the pre-render fires; after it, all four render, and Stats has no banner host (`RNGoogleMobileAdsBannerView`) until Stats is focused;
  - after switching to Stats, Timer's content is still visible to queries. RNTL 14 excludes `display: none` elements by default, so this fails if hiding comes back;
  - a completion while Stats shows: no celebration, no love note, no `showIfReady`; back on Timer: the celebration, then the love note, then the ad.
  - Mutations: drop the focus gate, and the overlay test must fail; reintroduce a hiding wrapper, and the "still visible" test must fail.
- `deferredStartup.test.ts`: `runAfterInteractive`'s order in the deferred arm (after the interactive mark and the drain, one task per idle callback), that it waits for the mark in the eager arm, registration after the mark, and cancel.
- The banner: its status line from simulated load and failure events, and no banner host before Stats is focused.
- The gates: typecheck, lint 0 errors, full Jest, the A1 guards, the "exactly once" test, the three DEF-004 tests, the guards' mutation check, Reassure against a baseline re-taken at `c628453` (expected unchanged; a hidden Timer's leaf can now commit while hidden, which the scenarios don't cover), the compiler report, the iOS bytecode, and the cold-start module count (B7's record has 1,801).

## 10. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): B6
- [ADR-0028](../architecture/adr/0028-expo-router.md), [ADR-0043](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md), [ADR-0002](../architecture/adr/0002-react-navigation-template.md)
- [B4 record](2026-10-30-phase1-b4-rerender-refactor.md) §3.3, §3.5: the focus gating and frozen tabs this keeps
- [B3 record](2026-10-30-phase1-b3-zustand-stores.md) §0, §3.7: DEF-004
- [B5 record](2026-10-30-phase1-b5-react-compiler.md): the counts and bytecode this is measured against
- [Test strategy](../testing/TEST-STRATEGY.md): the guards and the mutation check
- [SRS](../srs/SRS.md): FR-NAV-001 (§8.3), FR-NTF-003, FR-SET-001, FR-TMR-005, FR-MIG-001, NFR-PERF-002, NFR-PERF-003

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- [React Navigation bottom tabs from the with-react-navigation template](../architecture/adr/0002-react-navigation-template.md)
- [Expo Router for navigation](../architecture/adr/0028-expo-router.md)
- [Native tabs, frozen by a route wrapper, laid out by safe-area insets](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md)
- [2026-10-29 — Phase 1 (v1.4): design system and local re-architecture, plan](2026-10-29-phase1-plan.md)
- ["Phase 1 B7: deferred start-up work, and an on-device TTI probe"](2026-10-30-phase1-b7-deferred-startup.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
