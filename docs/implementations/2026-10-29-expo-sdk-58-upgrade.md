# 2026-10-29 — Expo SDK 54 → 58 upgrade and generated native projects

**Status:** Built. Both EAS native builds succeeded on SDK 58 (§6.2). The device checks are still to do (§6.3), and on-device iOS testing needs a TestFlight build.
**Branch:** `rehaul/v2` (local only, nothing pushed)
**Plan:** [2026-10-29-couples-rehaul-plan.md](2026-10-29-couples-rehaul-plan.md), §7 Phase 0, item 6 · follows [Phase 0 foundation](2026-10-29-phase0-foundation.md)

---

## 1. Problem / Motivation

The app was on Expo SDK 54 while SDK 58 is current. Phase 1 rebuilds the app on top of whatever SDK is underneath, so building it on a four-version-old base would mean redoing that work during a later upgrade.

Separately, the committed `android/` folder had silently drifted from `app.json` (Phase 0 doc, §5, finding 2).

Your decisions (2026-10-29):

- upgrade one SDK at a time
- switch to generated native projects (CNG)
- verify with EAS builds

## 2. What Changed

| Commit | Change |
|--------|--------|
| `f4bdd2e` | `android/` removed from git, and `/android` and `/ios` git-ignored (CNG). |
| `0c99c0b` | **Behaviour fix:** Android and web tab-bar icons (§5). This commit also contains the deletion of the old `react-native-maps+1.20.1.patch`, which was already staged. |
| `470d621` | **SDK 55**, see §3.2. |
| `c7135f3` | **SDK 56**, see §3.2. |
| `b12220f` | **SDK 57**, see §3.2. |
| `c051c9a` | **SDK 58**, see §3.2. |
| `e88fd65` | `eas.json`: `preview-simulator` profile (iOS simulator build, no device credentials needed). |

**Versions after the upgrade:**

| Package | SDK 54 | SDK 58 |
|---------|--------|--------|
| expo | 54.0.37 | 58.0.21 |
| react | 19.1.0 | 19.3.0 |
| react-native | 0.81.5 | 0.88.1 |
| react-native-reanimated / worklets | 4.1 / 0.5.1 | 4.7.1 / 0.13.0 |
| react-native-gesture-handler | 2.28 | 3.3.0 |
| react-native-maps | 1.20.1 | 1.29.11 |
| @react-native-community/datetimepicker | 8.4.4 | 9.2.1 |
| react-native-google-mobile-ads | 16.0.3 | 16.5.0 (held on v16, §4) |
| typescript | 5.9 | 6.0.3 |
| jest-expo | 54.0.18 | 58.0.13 |
| Minimum iOS | 15.1 | 16.4 (from SDK 56) |

## 3. Implementation Approach

### 3.1 Generated native projects (CNG)

Before deleting `android/`, a fresh `expo prebuild --platform android` was generated from today's `app.json` and diffed against the committed folder, ignoring CRLF line endings.

- **The only text difference was `versionName "1.2.4"` versus `"1.3.1"`.**
- Every binary (icons, splash images, the Gradle wrapper, the debug keystore) was byte-identical.

So the folder was a pure February prebuild with no custom native code. Android builds had been reporting version 1.2.4 regardless of `app.json`, and ignoring every `app.json` change since.

Release signing is unaffected: `eas.json` has no local credentials source, so EAS uses the keystore it already holds (the one that signed the 1.0.1 Play builds).

### 3.2 One SDK per step

Each step:

1. `npx expo install expo@^N`
2. Write every version from `npx expo install --check` into `package.json` in one pass.
3. `npm install`. If npm hits `ERESOLVE`, delete `node_modules` and `package-lock.json` and resolve fresh (§4).
4. Re-cut `patch-package` patches against the new library sources.
5. Fix whatever breaks.
6. **Gate:** `tsc`, lint with 0 errors, all 25 tests, and an iOS + Android export with `--dump-sourcemap`.
7. Commit.

| Step | What broke | Fix |
|------|-----------|-----|
| **55** (RN 0.83) | npm `ERESOLVE`: datetimepicker's *optional* peer `react-native-windows@*` resolved to a release needing RN 0.85 | Regenerated the lockfile; no override needed afterwards. |
| | `newArchEnabled` removed from the schema | Removed from `app.json` (New Architecture only now). |
| | The maps patch is pinned to 1.20.1 | Re-cut for 1.27.2, which still lacked both AIRMap nil guards. |
| | Reanimated 4.2 initialises worklets at import | `jest.mock('react-native-worklets', …)`. |
| | The `expo-symbols` name type changed, which exposed the icon bug | §5. |
| **56** (RN 0.85, TS 6, Hermes v1) | TypeScript 6 stopped auto-including `@types/*` | `tsconfig` `types: ['jest']`. |
| | `eslint-config-expo` 56 enables the React Compiler rules as errors (105) and lints `.claude/` | `.claude/**` ignored; compiler rules set to warnings until Phase 1 (§4). |
| | `@expo/config-plugins` is no longer hoisted, so the datetimepicker and AdMob plugins can't load | Declared as a devDependency at the exact version Expo uses. |
| | Top-level `splash` removed from the schema | Moved into the `expo-splash-screen` config plugin. |
| | Metro could not find `index.tsx` | OneDrive placeholder files (§5). |
| | Hermes v1 memory regression | No native build on 56; SDK 57 contains the fix. |
| **57** (RN 0.86) | Same `ERESOLVE` | Lockfile regenerated. |
| **58** (RN 0.88, React 19.3, GH 3) | The maps patch no longer applied | **Upstream 1.29.11 now has the insert nil guard** (the same code as this repo's patch); the patch is re-cut to the remove guard only. |
| | Reanimated 4.7.1 throws in Jest (`setCSSEventHandler` on JSReanimated) | A narrow Jest stub, with a remove-when-fixed note. |
| | Gesture Handler 3 | Its `Gesture.*` builder API is kept as deprecated, so `FlySheet` runs unchanged; it moves to the hook API in Phase 4. |
| | Removed RN APIs (`InteractionManager`, the `Touchable` root export, `Modal` `animated`, `StatusBar` `backgroundColor`/`translucent`) | Not used by the app (checked with grep). |

After the SDK 58 step, the timer-guard mutation check was re-run: removing `setDisplayTick` still fails `timerTextTicks`. The new Jest mocks did not make the guard trivially pass.

## 4. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| One SDK at a time | Jump straight to 58 | Your choice. It also proved its value: each break above is attributable to one SDK. |
| Regenerate the lockfile on `ERESOLVE` | `--legacy-peer-deps`, `--force`, a permanent `overrides` entry | The first two switch off peer checks for *every* package, in CI and on EAS too. The override worked, but became unnecessary once the lock was fresh. A major SDK upgrade re-resolves most of the tree anyway, and every step was re-verified. |
| Keep AdMob on 16.x | AdMob 17 now | 17.0 is a breaking API rewrite ("refreshed API, multiformat, ad pools"). Phase 5 rewrites the ad code anyway (consent, real ids, Plus gating), so migrate once, there. 16.5.0 builds against RN 0.88 if the EAS Android build passes. |
| React Compiler lint rules as warnings | Fix the 105 findings now | They flag exactly the v1 code that Phase 1's re-render refactor rewrites (Animated refs, `.value` writes, `Date.now()` in render). Fixing it twice is waste. The counts are recorded in `eslint.config.js`, and Phase 1 sets them back to `error`. |
| Declare `@expo/config-plugins` (doctor flags it) | Remove it | The AdMob 16 and react-native-maps plugins `require` it directly, and the build fails without it. The doctor's own advice says to ignore the flag in this case. Revisit when those plugins switch to `expo/config-plugins`. |
| Keep R8 (on by default in SDK 58) | Opt out with `android.enableMinifyInReleaseBuilds: false` | It shrinks the release APK, which is good for performance. The risk is reflection-based libraries crashing only in release builds, so the device check covers it (§6.3). The one-line opt-out exists if needed. |
| iOS simulator build for compile verification | An ad hoc device build | No iOS devices are registered on your Apple team (`Q885KHD85V`), so an ad hoc build would need an interactive Apple sign-in, which I don't do. The simulator build proves the native code compiles; testing on a real iPhone goes through TestFlight with your go-ahead. |

## 5. Findings

1. **Android tab icons were missing (fixed in `0c99c0b`).** The Android/web `IconSymbol` mapping still held the template's `house.fill` / `paperplane.fill` / … while the tab bar renders `heart.fill`, `chart.bar.fill`, `gearshape.fill` and `heart.text.square.fill`. An `as IconMapping` cast hid the gap. The mapping now uses `satisfies`, and the icon name type is its own keys, so an unmapped name fails `tsc`.
2. **OneDrive breaks Metro from SDK 56 on.** OneDrive had converted 9 older root files (`index.tsx`, `eas.json`, `.gitignore`, `README.md`, …) into cloud placeholder reparse points. Node reports them as symlinks, and SDK 56's new Node file watcher drops them, so Metro "can't find" `index.tsx`. A path without non-ASCII characters (`ü`) failed the same way, ruling that out.
   - Fixed locally by rewriting those files as normal files: same bytes, so git sees no change.
   - **OneDrive can do it again at any time.** The durable fix is to move the repository out of OneDrive (for example to `C:\dev\valentine-pomodoro`). That is your call; EAS and CI are unaffected because they check out from git.
3. **Bytecode grew about 19 % across the upgrade** (§6.1), mostly with the switch to Hermes v1 in SDK 56 and about 95 more modules. The plan's Phase 1 lazy-loading (Fly Mode, `airports.json`) is the recovery; the Phase 1 budget is now "below the SDK 58 baseline", re-measured with the pinned command.
4. **Minimum iOS is now 16.4.** iPhone 6s, 7 and the first-generation SE can no longer install updates. It's an Expo platform floor, not something the app can avoid.
5. **`npm audit` after the upgrade: 16 advisories** (0 critical, 3 high, 13 low), down from 39 on SDK 54.
   - All 3 high come from one `zod` < 4.6.6 used by `@expo/cli`, which is build tooling.
   - `expo` and `datetimepicker` show up only because npm propagates the advisory up through `via`. Checked against the SDK 58 source maps, `zod`, `@expo/cli` and `@expo/config` contribute no code to the app bundle.
   - npm's suggested fix (downgrade to `expo@51`) is wrong; the real fix arrives with an `@expo/cli` patch release.
6. **Android system bars don't follow the theme.** Prebuild warns `userInterfaceStyle: Install expo-system-ui`. `app.json` sets `"automatic"`, but without `expo-system-ui` Android ignores it. Phase 1's design work decides whether to add it (`npx expo install expo-system-ui`).
7. **Android has not shipped since 1.0.1** (EAS history: three production builds on 2026-01-09; iOS has had 1.3.x since). The first SDK 58 Android build is also the first Android update in months, with versionName finally matching `app.json`.

## 6. Verification

### 6.1 Local gates (all passed at every step)

| | SDK 54 (start) | SDK 55 | SDK 56 | SDK 57 | SDK 58 |
|--|----------------|--------|--------|--------|--------|
| `tsc` | ✓ | ✓ | ✓ | ✓ | ✓ (strict RN types) |
| Lint errors | 0 | 0 | 0 | 0 | 0 |
| Jest | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 |
| iOS bytecode (B) | 3,243,628 | 3,244,780 | 3,663,400 | 3,614,140 | 3,856,208 |
| Android bytecode (B) | 3,318,740 | 3,319,444 | 3,744,168 | 3,695,648 | 3,944,548 |
| Modules iOS / Android | 1,704 / 1,728 | 1,664 / 1,686 | 1,652 / 1,705 | 1,706 / 1,727 | 1,798 / 1,821 |
| expo-doctor | 18/18 | 20/20 | 20/22 | 20/21 | 19/20 |

Net change from SDK 54 to 58: iOS +18.9 %, Android +18.9 %. Bundled assets are unchanged at 1,615,828 B.

On SDKs 56–58, the remaining doctor flags are the accepted `@expo/config-plugins` note, plus the Hermes regression on 56 only.

### 6.2 Native builds (EAS)

| Build | Profile | ID | Result |
|-------|---------|----|--------|
| Android APK | `preview` (internal; release variant, so R8 applies) | `3450a78b-004c-4b47-8e48-8cd808f37c2c` | **FINISHED** 2026-10-29 14:34 UTC. SDK 58.0.0, **versionName 1.3.1**, which confirms the CNG switch fixed the stuck-at-1.2.4 problem. Compiled in 23 min 25 s. The APK is 108.5 MB because it is universal, carrying all four CPU architectures; the Play Store's app bundle delivers one architecture per device, so store downloads are much smaller. [Download APK](https://expo.dev/artifacts/eas/sCAxdroTc4sUKeo1QpNc35WMDgQXmZWA4q17UL8T5kY.apk) |
| iOS | `preview-simulator` | `363bb2ef-7ed1-49b1-b82d-a82987f1a0ae` | **FINISHED** 2026-10-29 14:02 UTC. SDK 58.0.0, app 1.3.1 (build 41); compiled in 7 min 22 s. This proves the iOS native build (pods, `useFrameworks: static`, the AIRMap patch, the AdMob 16.5 pod, the scene-lifecycle prebuild) compiles on SDK 58. It does not prove runtime behaviour on a device. |

### 6.3 Device checks (yours)

On the Android preview APK:

- [ ] The app launches and shows the splash (now from the `expo-splash-screen` plugin), then the timer.
- [ ] **Tab bar shows four icons** (heart, chart, gear, note): the fix from `0c99c0b`.
- [ ] A full focus → break cycle. The completion notification fires; in the foreground it shows a banner (SDK 58 shows foreground notifications by default; the app's handler already asks for banners).
- [ ] Open Stats immediately after a cold start (the Phase 0 crash fix).
- [ ] Fly Mode: pick airports, start, drag and double-tap the sheet (Gesture Handler 3 compatibility layer), let the plane land.
- [ ] Ads: an interstitial after the second completed session. These are still Google's test ids on Android, so test ads are expected.
- [ ] **R8:** anything crashing only in this build (ads, maps, notifications) is the reflection risk; report it and I'll add keep rules.

On iOS, after a TestFlight build (needs your go-ahead):

- [ ] The same list, plus a Fly Mode session with tier-1 airports (AIRMap nil guards: upstream insert plus the local remove).

## 7. Related Docs

- [Rehaul plan](2026-10-29-couples-rehaul-plan.md) · [Phase 0 foundation](2026-10-29-phase0-foundation.md)
- [AIRMap crash fix (May)](2026-05-05-airmap-insert-subview-crash-fix.md): the patch's origin
- Expo changelogs: [SDK 55](https://expo.dev/changelog/sdk-55) · [SDK 56](https://expo.dev/changelog/sdk-56) · [SDK 57](https://expo.dev/changelog/sdk-57) · [SDK 58](https://expo.dev/changelog/sdk-58)
- [Gesture Handler 3 upgrade guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3)
