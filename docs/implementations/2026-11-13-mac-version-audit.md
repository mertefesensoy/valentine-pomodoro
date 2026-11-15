# 2026-11-13 — Mac version audit: can Valentine Pomodoro ship on the Mac?

**Status:** Done. This is a read-only audit: no app code, `app.json`, dependency, App Store Connect setting, tag or build changed. The owner's decisions are in [§8](#8-the-owners-decisions). None of the Mac checks has been run, because the project has no Mac ([§6.2](#62-checks-that-need-an-apple-silicon-mac-testflight-on-build-65)).
**Addendum (2026-11-15):** [§9](#9-addendum-2026-11-15-every-feature-on-a-mac-and-the-ads) covers whether every feature and the ads come over intact, and gives the design for a Mac-only banner. Its questions Q10–Q12 are new. Still read-only.
**Branch:** none. Written on a detached `HEAD` at `e1fcb1e` (`master`, which is 1.5.1's TestFlight build 65), and left uncommitted.

All times are UTC unless marked TR (Turkey, UTC+3).

---

## 1. Problem / Motivation

The owner asked: "for the next update is it possible for us to publish the valentine pomodoro app for a mac version. Run an audit".

### The answer

**Valentine Pomodoro is already on the Mac App Store, and nobody has ever run it on a Mac.** Apple makes compatible iPhone and iPad apps available on Apple Silicon Macs automatically, unless the developer opts out.

On 2026-11-13 at 19:38 UTC (22:38 TR), the app's US and TR store pages both said "Designed for iPad. Not verified for macOS." Their Compatibility sections list "Mac: Requires macOS 12.0 or later and a Mac with Apple M1 chip or later". Apple Vision is listed too. **Confirmed:** I fetched the store pages, and Apple says the App Store "automatically makes compatible iOS apps available" ([Running your iOS apps in macOS](https://developer.apple.com/documentation/apple-silicon/running-your-ios-apps-in-macos)).

So the next update already reaches Mac users, as the same binary. The real questions are whether it works there, and whether to keep offering it. The project has no Mac ([CON-004](../srs/SRS.md#con-004)), so nobody has seen it run on one.

### Routes, ranked

| Rank | Route | Effort | Main risks | Verdict |
|------|-------|--------|------------|---------|
| 1 | **"Designed for iPad"** on Apple Silicon Macs: the same iOS binary, already live | **Small** in code, a few days at most. It needs an Apple Silicon Mac for TestFlight | Six risks, none tested on a Mac: (1) 1.5.1's keep-awake fix may not keep a Mac's display on; (2) Google states no Mac support for AdMob; (3) the UI sounds ignore the owner's silent-mode rule, since a Mac has no switch; (4) where the Liquid Glass tab bar sits under the title bar is unknown; (5) the privacy policy says "iPhone"; (6) the iPad layout has never been captured | **Recommended.** Keep the listing. Test build 65 on a Mac through TestFlight. Fix what breaks in a normal update. Then press Verify Compatibility |
| 2 | **Mac Catalyst**: a real Mac build from the same code, sharing the bundle ID | **Large**: weeks, plus a Mac with Xcode | EAS Build can't build it. React Native's prebuilt frameworks fail Catalyst builds from 0.84 on (an open issue), so React Native would have to be built from source. The ads library compiles AdMob out, so the Mac makes no ad revenue. Releasing it replaces the Designed for iPad listing, and universal purchase can't be undone | Later, and only if route 1 proves too limited |
| 3 | **The web build in a desktop wrapper** (Electron or Tauri) | **Extra large** | The web bundle fails to build today. Sign-in, token storage, the map, ads and notifications have no web versions. AdSense bars ads inside software apps. Guideline 4.2 rejects thin web wrappers. Joining the iOS app record is undocumented | Not as a Mac route. Phase 6's web app may make it cheaper later ([roadmap](../roadmap/ROADMAP.md)) |
| 4 | **`react-native-macos`**: a native AppKit app | **Extra large**, a second dependency tree | Its newest release is 0.83.0, five minors behind the app's React Native 0.88.1. Expo Router and react-native-screens have no macOS support, and neither do maps, ads, notifications, audio, Apple sign-in, the secure store, haptics or the date picker. Keep-awake compiles to a no-op on macOS | Not feasible on this stack |

### Ruled out

| Suspect | Finding |
|---------|---------|
| "A Mac version needs a new build" | Not for route 1. Availability is set at app level, covers every version, and needs no build ([App Store Connect Help](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-of-iphone-and-ipad-apps-on-macs-with-apple-silicon)). Confirmed. |
| A fixed, phone-sized Mac window | The window is resizable. The app supports iPad multitasking: `UIRequiresFullScreen` is false and all four orientations are declared ([§3.1](#31-the-apps-configuration-and-layout)). Apple gives such apps resizable windows. Confirmed in config and by Apple. |
| The rule in the macOS 27 release notes that apps built with the latest SDK must adopt the scene-based life cycle "or they fail to launch" | Expo SDK 58 already ships `ExpoAppSceneDelegate`. Its comment says iOS 27 asserts the same rule (`node_modules/expo/ios/Expo/ExpoAppSceneDelegate.swift:11-12`). Confirmed in code. |
| A consent form failing on the Mac | The app has no consent form and no tracking prompt. It asks only for non-personalised ads (`src/ads/AdManager.ts:55`, `src/screens/StatsScreen.tsx:346`). Confirmed in code. |

---

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-13-mac-version-audit.md` | This report. |
| `docs/README.md` | Adds this report's row to the implementation records index. |
| `docs/srs/SRS.md`, `docs/roadmap/ROADMAP.md`, `docs/process/RELEASE.md`, `docs/testing/TEST-STRATEGY.md` | Only their generated backlinks blocks changed: `check-docs --write` added a link to this report. |
| `docs/testing/TRACEABILITY.md` | Regenerated by `check-docs --write`: CON-004 now lists this report. |

No app code, dependency, `app.json`, tag, build or App Store Connect setting changed.

**Evidence and sources:**
- The raw evidence and both research notes, with every URL, are in the shared notes folder: `C:\Users\senso\AppData\Roaming\Claude\side-session-notes\local_12266aec-2d3a-44fd-b425-5f6a2018fb36\`.
- "Confirmed" means read on the cited official page, podspec, registry entry or installed source. This session or its two research agents did the reading.
- These were re-read in this session: Apple's two iOS-apps-on-Mac pages, the App Store Connect availability and TestFlight pages, the live store pages, the npm registry and Expo's additional-platforms page.

---

## 3. Implementation Approach: what each route runs into

### 3.1 The app's configuration and layout

`npx expo config --type introspect` writes nothing. It shows:
- `LSRequiresIPhoneOS` is true.
- `UIRequiresFullScreen` is false.
- All four orientations are declared, on iPhone and on iPad.
- There is no `UIBackgroundModes` key, so DEF-009 holds.
- The entitlements are Sign in with Apple and `aps-environment`.

Apple: an app that supports iPad multitasking gets **resizable windows** on the Mac, and UIKit reports the `.pad` idiom there, so the Mac gets the iPad layout. **Confirmed** ([Adapting iOS code](https://developer.apple.com/documentation/apple-silicon/adapting-ios-code-to-run-in-the-macos-environment)).

Every screen sizes itself from `useWindowDimensions`, so the layout follows the window as it's resized ([§4](#4-mathematical--statistical-details)). The code is in `TimerScreen.tsx:413-420`, `StatsScreen.tsx:137`, `SettingsScreen.tsx:254` and `useResponsive.ts:17-24`.

The iPad layout has never been seen on a device: no iPad capture exists ([store screenshots record](2026-11-01-app-store-screenshots.md)).

**Input** (confirmed, Apple):
- A click becomes one touch; macOS supports one touch at a time.
- The trackpad pinches, scrolls and rotates.
- A **Touch Alternatives** tab is added to the app's Settings window by itself. With it, Space taps, the arrow keys swipe, and Option turns the trackpad into a touch surface.

The app has no keyboard shortcuts and no hover handling: `git grep` finds no `onKeyPress`, `keyCommand` or `onHover` in `src/` or `app/`. Confirmed.

### 3.2 Route 1: Designed for iPad (already live)

**What App Store Connect offers** (confirmed, [availability](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-of-iphone-and-ipad-apps-on-macs-with-apple-silicon) and [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/test-iphone-and-ipad-apps-on-macs-with-apple-silicon) pages):
- **Where:** Pricing and Availability → "Apple Silicon Mac Availability" → "Make this app available". It's set per app, covers every version, and needs no Info.plist key.
- **Opting out:** the Mac App Store stops offering the app. "Users who previously downloaded the app for Mac can still use it, but can't download it again" (Apple's running-in-macOS page).
- **Verify Compatibility:** the developer's own statement that the app works well, and it removes "Not verified for macOS". The option then disappears from App Store Connect. That it can't be undone is plausible.
- **Minimum macOS:** Apple works it out from `MinimumOSVersion` (16.4). The store shows 12.0.
- **TestFlight:** "Test iPhone and iPad apps on Apple silicon Macs" is enabled per tester group, and then that group's builds install on an Apple Silicon Mac. This is the only way the project can check route 1.
- **App Review, price and purchases:**
  - No App Review guideline is about iOS apps on Mac (confirmed, [guidelines](https://developer.apple.com/app-store/review/guidelines/), updated 2026-10-16). A separate Mac review wasn't found and is plausibly not needed, since availability is automatic.
  - The listing and price are the same, and in-app purchases and subscriptions keep working (confirmed, Apple). That matters for Phase 5's subscription.
  - The privacy labels carry over (plausible).
  - The Mac listing shows the iPad screenshots (plausible).

**Each dependency on route 1.** The binary is the same one the iPhone gets, so code that's compiled only for Catalyst plays no part.

| Dependency | What happens on a Mac | Status |
|------------|-----------------------|--------|
| `react-native-maps` (Fly) | `Platform.OS` is `'ios'`, so Fly is offered (`src/constants/features.ts:25`). `MKMapView` is available on Mac. Pinch and rotate come from the trackpad; with a mouse only, Touch Alternatives | Availability confirmed. The flyover globe, the camera moves and the sheet dragged with a mouse are plausible. **Check M4** |
| `react-native-google-mobile-ads` | Google's SDK runs inside the binary. Google documents iOS only, and no Mac support is stated. SDK 11.9.0 fixed "a crash when the SDK ran on macOS". On a Mac the advertising identifier is all zeros and SKAdNetwork does nothing (Apple). Whether ads fill is undocumented | Absence of support confirmed ([quick start](https://developers.google.com/admob/ios/quick-start), [release notes](https://developers.google.com/admob/ios/rel-notes)). Serving is plausible, probably lower fill. **Check M5** |
| `expo-notifications` | The session-end notification uses a date trigger and the default sound (`src/hooks/useNotifications.ts:49-58`). `UNUserNotificationCenter` and its calendar and time-interval triggers are available on Mac | Availability confirmed. The prompt and delivery are plausible. **Check M7** |
| `expo-audio` | The UI sounds use `.ambient` (`playsInSilentMode: false`, `src/audio/uiSounds.ts:61`); the hum uses `.playback` (`src/hooks/useFlyModeAudio.ts:70`). A Mac has no silent switch, so the start and finish sounds and the voices always play at the system volume. That departs from the owner's 2026-11-05 rule that they obey silent mode | Apple's `.ambient` docs confirmed. The Mac behaviour is plausible. **Owner Q5** |
| `expo-apple-authentication`, Supabase | The bundle ID is the same, so Supabase's existing Apple client ID applies. `ASAuthorizationAppleIDProvider` is available on Mac. A forum report says it works on M1 | Availability confirmed. Working is plausible. **Check M6** |
| `expo-keep-awake` (1.5.1's fix) | It only sets `UIApplication.isIdleTimerDisabled` (`node_modules/expo-keep-awake/ios/KeepAwakeModule.swift:52-56`). The property is available on Mac. One unresolved Apple forum report says an iOS app on a Mac still went to the screen saver | **Unverified, with one report against it** ([forum 698318](https://developer.apple.com/forums/thread/698318)). **Check M3** |
| `expo-secure-store` | The Keychain. Apple's TN3137: iOS apps on Mac use the data-protection keychain, with access groups from the entitlements, as on iOS | Confirmed ([TN3137](https://developer.apple.com/documentation/technotes/tn3137-on-mac-keychains)) |
| `react-native-mmkv`, Nitro | Same binary. Apple notes that on a Mac a person can browse the app's data container in the Finder, which holds the diary and stats | Plausible works. The Finder note is confirmed (Apple) |
| `expo-haptics` | The tab-press haptic (`src/components/tabPressHaptic`) | Plausibly does nothing, with no crash (third-party test) |
| Reanimated, worklets, gesture-handler | Same binary. Apple maps standard gestures to the trackpad | Plausible |
| NativeTabs (Liquid Glass tab bar) | The `.pad` idiom gives the iPadOS 26 floating tab bar | Plausible. Where it sits under the Mac title bar is unknown. **Check M8** |
| Update check | `Platform.OS === 'ios'`, so it calls the same lookup (`src/hooks/useUpdateCheck.ts:114`). For a third-party Designed for iPad app, the lookup returned one iOS record with the iOS version. "Update" opens an `apps.apple.com` link | Plausible: seen on one other app, and undocumented. That the link opens the Mac App Store is plausible |
| Start-up reports (`report_startup`) | The server keeps only models matching `^(iPhone\|iPad\|iPod)…` and silently drops anything else (`supabase/migrations/20261105150000_phase2_startup_reports.sql:13,36`). Apple says lower-level APIs may report Mac values, so a Mac's report is probably dropped, with no error | Confirmed in code. The Mac's model value is plausible |

**Privacy policy:** it describes the app "on iPhone" and lists "your iPhone model" and "your iOS version", in both languages ([privacy-policy.md](../../privacy-policy.md)). On a Mac that wording is inaccurate. A change goes through the owner's English and Turkish copy review.

**Detecting the Mac, if a fix needs it:** `expo-device` already returns `DeviceType.DESKTOP` when `isiOSAppOnMac` is true (`node_modules/expo-device/ios/DeviceModule.swift:87-90`), so JavaScript can tell without new native code. Apple asks for this check to be "your last choice".

### 3.3 Route 2: Mac Catalyst

- **Expo:**
  - No Catalyst target, prebuild option or EAS support: `eas build -p` takes only `android`, `ios` or `all`. Its [additional platforms page](https://docs.expo.dev/modules/additional-platform-support.md) names only macOS and tvOS. **Confirmed.**
  - Expo does merge Catalyst compile fixes. One for expo-file-system landed in 58.0.12, and the app has 58.0.13. **Confirmed** ([PR 52359](https://github.com/expo/expo/pull/52359)).
- **React Native:**
  - Core has a `mac_catalyst_enabled:` switch in `react_native_post_install`, and the prebuilt core includes a Catalyst slice.
  - From 0.84 on, Catalyst builds fail on the prebuilt frameworks with "bundle format is ambiguous". The issue is open, confirmed by users on 0.85 to 0.87, with no maintainer reply ([issue 55540](https://github.com/react/react-native/issues/55540)). On 0.88 it's plausible.
  - The workaround is building React Native from source.
- **Ads:**
  - `react-native-google-mobile-ads` wraps all of Google's SDK in `#if !TARGET_OS_MACCATALYST`. Its podspec drops both Google SDKs when `MAC_CATALYST` is set (`RNGoogleMobileAds.podspec:54,64`).
  - `initialize` then has an empty body, so its promise never settles (`RNGoogleMobileAdsModule.mm:93-111`). Nothing awaits `AdManager.init()` (`src/App.tsx:53`), so nothing hangs. `showIfReady` only skips (`src/ads/AdManager.ts:83-97`).
  - **No ads and no revenue on the Mac. Confirmed in code.**
- **Other modules:**
  - `expo-notifications` has Catalyst branches already (`NotificationRecords.swift:43,73,210,267`).
  - react-native-maps' default subspec is Apple Maps with no Google pods, so it should compile, but nobody upstream has tested it (plausible).
  - Keep-awake compiles its iOS branch under Catalyst, so the same unverified idle-timer question applies.
- **The store:**
  - A Catalyst build may share the iOS bundle ID under universal purchase. Releasing it replaces the Designed for iPad listing and moves those users over.
  - Once two platforms are approved, neither can be removed. **Confirmed** ([Add platforms](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-platforms/), where Apple's universal purchase page now redirects).
- **The project:** Catalyst needs Xcode on a Mac, which the project doesn't have (CON-004).

### 3.4 Route 3: `react-native-macos`

- **The version gap:**
  - npm's `latest` is **0.83.0** (2026-09-30), which tracks React Native 0.83.10. Nothing exists for 0.84 to 0.88, and the app runs 0.88.1. **Confirmed** (registry).
  - React Native 0.83 is Expo SDK 55 (plausible), and Reanimated 4.7 needs React Native 0.86 or later (confirmed). So this route means a second, older dependency tree.
- **No macOS target in the podspecs.** These declare none (confirmed; Expo says the podspec "is the source of truth for autolinking"):
  - `expo-router`, `expo-notifications`, `expo-apple-authentication` and `expo-haptics`: iOS only.
  - `expo-audio`, `expo-secure-store`, `expo-localization`, `expo-application`, `expo-device` and `expo-splash-screen`: iOS and tvOS.
  - `react-native-screens`: iOS, tvOS and visionOS.
  - `react-native-maps` and `react-native-google-mobile-ads`: iOS only.
  - `@react-native-community/datetimepicker`: iOS and visionOS.
  - `@react-native-picker/picker`: its New Architecture branch is iOS and tvOS.
- **Declaring macOS isn't proof of working with 0.88.** These do declare it: MMKV, Nitro, Reanimated, worklets, gesture-handler, svg, safe-area-context, async-storage and `expo-keep-awake`.
- **Keep-awake does nothing on macOS:** `setActivated` is compiled only `#if os(iOS) || os(tvOS)` (`KeepAwakeModule.swift:52`). That would bring DEF-010 back. Confirmed in code.
- **NativeTabs:** on a platform with no implementation, `NativeTabsView.js` throws "You are using NativeTabs on an unsupported platform". The throw is confirmed; that a macOS build resolves to that file is plausible.
- **No Expo workflow:** no prebuild, `run:macos` or EAS for macOS. Microsoft's guide calls Expo modules on macOS experimental (confirmed).

### 3.5 Route 4: the web build in a wrapper

- **The export fails today.**
  - The command: `npx expo export --platform web`, writing into the scratchpad.
  - It failed after 62 s and 1,988 modules: "Importing native-only module … codegenNativeComponent on web". The import comes from `react-native-google-mobile-ads`'s banner, by way of `src/ads/AdManager.ts`.
  - Exit code 1. **Confirmed.**
- **Ads are only the first blocker.** Metro stops at the first error, so others are plausible:
  - `react-native-maps` imports the same codegen specs.
  - `expo-secure-store`'s web module is `export default {}` (`build/ExpoSecureStore.web.js`), so Supabase's tokens couldn't be stored.
  - `expo-apple-authentication` doesn't support the web (confirmed, Expo docs).
- **Already web-ready** (confirmed in code and docs):
  - NativeTabs has a web version (`NativeTabsView.web.js`, Radix tabs).
  - MMKV falls back to localStorage.
  - expo-audio, expo-keep-awake (Wake Lock API), expo-haptics (Vibration API) and Reanimated have web support.
  - Reminders already turn off on the web (`src/stores/settingsStore.ts:91`).
- **What a wrapper adds:**
  - **Sign-in:** Sign in with Apple on the web needs a Services ID, and the Supabase OAuth secret must be regenerated every 6 months (confirmed, [Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple)).
  - **Ads:** AdSense bars Google ads inside software apps (confirmed, per the research notes).
  - **Mac App Store:** Electron and Tauri both have official guides (sandboxed builds). Guideline 2.4.5 sets the Mac App Store rules, and 4.2 rejects repackaged websites (confirmed).
  - **The app record:** joining the iOS app's record from a wrapper is undocumented (plausible).

### 3.6 Every listed dependency, on every route

Labels: **C** means confirmed (official page, podspec, registry or installed source). **P** means plausible. **NF** means searched for and not found.

| Dependency | 1. Designed for iPad | 2. Catalyst | 3. `react-native-macos` | 4. Web in a wrapper |
|------------|----------------------|-------------|-------------------------|---------------------|
| `react-native-maps` (Fly) | `MKMapView` is available (C). Fly is shown, and its gestures map to the trackpad (P) | The default subspec is Apple Maps with no Google pods. `MKMapView` is on Catalyst 13.1+ (C). Compiles: untested upstream (P) | No: the podspec is `:ios` only (C) | None (C). Its codegen specs would also break the bundle (P) |
| `react-native-google-mobile-ads` | The SDK runs. Google states no Mac support (C). Fill on a Mac: P | Compiled out: no ads, and `initialize` never settles (C) | No macOS target (C) | None, and the export fails here (C). AdSense bars ads inside software apps (C) |
| `expo-notifications` | The APIs are available (C). Prompt and delivery: P | Already has Catalyst branches (C). Behaviour: P | No macOS target (C) | Not supported (C). Web Push is Phase 6 |
| `expo-audio` (silent mode, Fly's hum) | `AVAudioSession` is available. No silent switch, so the UI sounds always play (P) | `AVAudioSession` is on Catalyst 13.1+ (C). Works: P | No macOS target, and `AVAudioSession` isn't on AppKit (C) | Supported, with limits (C) |
| `expo-apple-authentication`, Supabase | The provider is available, and the bundle ID is the same (C). Works: P | Available on Catalyst 13.1+, and the bundle ID may be shared (C). Works: P | No macOS target (C) | Not supported (C). It would need Supabase's OAuth flow, a Services ID, and a secret regenerated every 6 months (C) |
| `react-native-mmkv`, Nitro | Same binary (P). The data container is visible in the Finder (C) | The iOS podspec covers Catalyst; Catalyst itself: NF (P) | Both podspecs declare macOS (C). Works with 0.83: P | MMKV falls back to localStorage (C) |
| `expo-keep-awake` (1.5.1) | Sets `isIdleTimerDisabled`. One report says it doesn't stop a Mac's screen saver (P) | Its iOS branch compiles, so the same question applies (P) | Declares macOS, but `setActivated` does nothing there (C) | Wake Lock API, where the browser has it (C) |
| `expo-secure-store` | Keychain, as on iOS (C, TN3137) | The iOS podspec covers Catalyst. Keychain: P | No macOS target (C) | Empty web module, so no token storage (C) |
| `expo-haptics` | Probably does nothing (P) | Probably does nothing (P) | No macOS target (C) | Vibration API, likely nothing on a Mac (P) |
| Reanimated, worklets | Same binary (P) | Catalyst: NF (P) | Declare macOS, but Reanimated 4.7 needs React Native 0.86 or later (C) | Reanimated runs in pure JS (C). Worklets become plain functions (P) |
| NativeTabs (`expo-router`, `react-native-screens`) | The iPad floating tab bar (P). Its place under the title bar: NF | `expo-router`'s iOS podspec covers Catalyst. The tab bar on Catalyst: NF | No macOS target for either, and NativeTabs throws on an unsupported platform (C) | A web fallback "loosely based on iPad design" (C) |

---

## 4. Mathematical / Statistical Details

**Which layout a Mac window gets.** Let the window be $W \times H$ points and the side safe-area insets $i_l, i_r$. Let $x_l = 24$ (`space.xl`), $C = 500$ (`COMPACT_HEIGHT`) and $R = 560$ (`READABLE_WIDTH`).

- **Compact height:** when $H < C$, the timer leads and a column trails, as on a landscape iPhone.
- **Page width:**

  $$p = \begin{cases} W - i_l - i_r - 2x_l & H < C \\ \min(W, R) - 2x_l & \text{otherwise} \end{cases}$$

- **The Ring's cap:** $\min(0.86\,p,\ 340)$ at the default text size.
- **Fly** uses its landscape side sheet when $W > H$, with a sheet width of $\min(0.42\,W,\ 400)$ (`FlySheet.tsx:89-90`).
- **Stats and Settings** use the same $\min(W, R)$ column (`StatsScreen.tsx:137`, `SettingsScreen.tsx:254`).

So a window at least 560 pt wide and 500 pt tall shows the phone column centred, the iPad layout. A wide, short window switches to the landscape layout, and widening the window past 560 pt adds only margin. This comes from the code; none of it has been seen on a Mac (check M2).

---

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Recommend route 1 | Catalyst first | It's already live and costs no new build. Every fix ships to iPhone, iPad and Mac in one update, and the ads keep running. Catalyst needs Xcode, a source build of React Native, and gives up the ads |
| Keep the Mac listing while it's tested | Opt out at once | Opting out stops new downloads but leaves existing Mac users on whatever they have. Testing first costs a day if a Mac is at hand. Without one, opting out is the safer default (Q2) |
| Hold off on Verify Compatibility until §6.2 passes | Verify now | It's a public statement the app works well on macOS, and the option disappears once used |
| Prefer fixes that run on every platform | `isiOSAppOnMac` branches | Apple calls the check "your last choice". `expo-device` gives it from JavaScript if one is needed |
| Rank web below Catalyst | Web first, since Phase 6 plans it | As a Mac app, the web build loses the map, ads, notifications and native sign-in, and risks guideline 4.2. Its value is Phase 6's browser app, not the Mac |
| A read-only audit | Building guards now | The owner asked for an audit, and the answers in §8 decide the fixes |

---

## 6. Verification

### 6.1 Runnable checks (no Mac needed)

Run from the repository root. Each command below was re-run exactly as written on 2026-11-13, and gave the result shown.

- [x] **The live listing.** Expect `<p class="attributes …">Free · Designed for iPad. Not verified for macOS.</p>`. The page's embedded data repeats the phrase for other apps, so this matches only the app's own line:
  ```bash
  curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15" "https://apps.apple.com/us/app/valentine-pomodoro/id6757491918" | grep -o '<p class="attributes[^>]*>[^<]*</p>' | head -1
  ```
- [x] **The generated Info.plist keys.** Expect `UIRequiresFullScreen` false and four iPad orientations:
  ```bash
  npx expo config --type introspect --json
  ```
- [x] **The web build.** Expect exit code 1 and the codegen error of §3.5:
  ```bash
  npx expo export --platform web --output-dir <a scratch folder>
  ```
- [x] **The podspecs' platforms.** Expect `:ios` only, or `:ios` and `:tvos`, for all but `expo-keep-awake` (§3.4):
  ```bash
  for p in expo-router expo-notifications expo-audio expo-apple-authentication expo-secure-store expo-haptics expo-keep-awake; do echo "$p: $(grep -h -A3 's.platforms' node_modules/$p/ios/*.podspec | tr -s ' \n' ' ')"; done
  ```
  For the three that keep their podspec at the package root, expect `:ios` 15.1; iOS, tvOS and visionOS; and iOS 12.0 only:
  ```bash
  grep -n -E "s\.platforms? *=|deployment_target" node_modules/react-native-maps/react-native-maps.podspec node_modules/react-native-screens/RNScreens.podspec node_modules/react-native-google-mobile-ads/RNGoogleMobileAds.podspec
  ```
- [x] **The Catalyst guards.** Expect 7 hits:
  ```bash
  grep -c TARGET_OS_MACCATALYST node_modules/react-native-google-mobile-ads/ios/RNGoogleMobileAds/RNGoogleMobileAdsModule.mm
  ```
- [x] **react-native-macos's newest release.** Expect 0.83.0:
  ```bash
  curl -s https://registry.npmjs.org/react-native-macos/latest | grep -o '"version":"[^"]*"' | head -1
  ```

### 6.2 Checks that need an Apple Silicon Mac (TestFlight on build 65)

None has been run yet. They follow the [device-check protocol](../testing/TEST-STRATEGY.md#5-device-check-protocol), on the Mac.

- [ ] **M1, install:** in App Store Connect, enable "Test iPhone and iPad apps on Apple silicon Macs" for a tester group, then install build 65 from TestFlight for Mac.
- [ ] **M2, windows:** resize the window from small to full screen. The Ring, the pages, Stats, Settings and Notes follow it, and a short window switches to the landscape layout.
- [ ] **M3, keep-awake (DEF-010):** set the Mac's display to sleep after 1 minute, start a focus, and don't touch anything. Note whether the display stays on, and whether the screen saver starts. Then pause, and it should sleep.
- [ ] **M4, Fly:** the map, the flyover, the sheet dragged with a mouse and with a trackpad, and the hum through a whole flight.
- [ ] **M5, ads:** the interstitial after the second session, and the Stats banner. Note whether they fill.
- [ ] **M6, account:** Sign in with Apple, pairing by code (typed on the keyboard), a note to the partner, quitting and reopening (the tokens persist), and deleting the account.
- [ ] **M7, notifications and sound:** the permission prompt, the session-end notification with the app in the background, and the UI sounds with the Mac's volume low.
- [ ] **M8, the tab bar and alerts:** where the Liquid Glass tab bar sits under the title bar; the skip and end alerts; the Settings pickers; Touch Alternatives.
- [ ] **M9, the update check:** while 1.5.0 is live, "Check for updates" in Settings shows "You're up to date" / "You have the latest version (1.5.1)." (`updates.upToDateTitle` and `updates.upToDateMessage`). After the next release, "Update" opens the Mac App Store.

---

## 7. Related Docs

- [SRS](../srs/SRS.md): [CON-004, no Mac](../srs/SRS.md#con-004), and §2.3's platform list, which has no Mac.
- [Screen sleep audit](2026-11-12-screen-sleep-audit.md) and [1.5.1's fix](2026-11-12-v151-screen-sleep-fix.md): what check M3 tests.
- [Update check audit](2026-11-06-update-check-audit.md): the lookup that check M9 covers, and this report's format.
- [DEF-009](2026-11-03-def-009-background-audio-mode.md): why no background audio mode, on any platform.
- [Store screenshots](2026-11-01-app-store-screenshots.md): the iPad set the Mac listing shows, and the missing iPad capture.
- [Roadmap](../roadmap/ROADMAP.md): Phase 5's subscription (in-app purchases work on Mac) and Phase 6's web app.
- [Release process](../process/RELEASE.md): a Mac check would join its device-check step.
- [Privacy policy](../../privacy-policy.md): the "iPhone" wording.

---

## 8. The owner's decisions

### 8.1 Questions

Each recommendation is a default, and nothing is built until the owner answers.

| # | Question | Recommendation | Why |
|---|----------|----------------|-----|
| Q1 | The app is on the Mac App Store today, marked "Not verified for macOS". **Keep it there, or opt out until it has been tested?** | **Keep it**, if Q2 is yes, and test within days | Opting out stops new downloads only, so it doesn't help anyone who already installed it |
| Q2 | **Do you, or someone you trust, have an Apple Silicon Mac** (M1 or later, macOS 12 or later) for the TestFlight checks in §6.2? | Without one, **opt out** until someone does | No one on the project can see what Mac users get (CON-004) |
| Q3 | If the display doesn't stay on (M3), is that acceptable on a Mac? | **Yes, accept it**, and mention it in the store's notes | No documented way for an iOS app to hold a Mac's display awake was found (plausible). macOS's own power API would need a Catalyst or native build |
| Q4 | **Should ads run on the Mac?** | **Yes, if M5 shows they fill**; otherwise hide them on Mac with `Device.deviceType` | Google states no Mac support, but it fixed a crash "when the SDK ran on macOS" in 11.9.0 |
| Q5 | A Mac has no silent switch, so the start and finish sounds and the voices always play there. Is that fine? | **Yes.** The Settings sound switch still turns them off | It's the Mac's normal behaviour, and your 2026-11-05 rule is about the iPhone's switch |
| Q6 | **Should Fly Mode be offered on the Mac?** | **Yes**, unless M4 fails | The map is Apple Maps, which macOS provides |
| Q7 | May the privacy policy say "device" instead of "iPhone", in English and Turkish? | **Yes**, in the next update, through the copy review | It's inaccurate for Mac users today |
| Q8 | **Press Verify Compatibility** once §6.2 passes? | **Yes** | It removes "Not verified", and the option can't be used twice |
| Q9 | Is a full Mac app (Catalyst) a goal, or is Designed for iPad enough? | **Designed for iPad** for now; revisit after Phase 5 | Catalyst means local Xcode builds and no ads, and it replaces this listing |

### 8.2 Who does what

| Step | Owner | Code (a session) |
|------|-------|------------------|
| Look at Apple Silicon Mac Availability in App Store Connect, and keep it or opt out (Q1, Q2) | ✔ | |
| Enable TestFlight Mac testing for a group, and run §6.2 on a Mac | ✔ | Writes the checklist into the device-check record |
| Fixes that §6.2 finds (layout, Fly, ads), shipped in a normal iOS update | Go-ahead for the build | ✔ |
| The privacy policy wording (Q7) | Copy review | ✔ drafts it in both languages |
| Widen the start-up report's model check to accept Macs (optional) | Go-ahead for a migration | ✔ |
| Keyboard shortcuts, such as Space to start or pause (optional, Apple recommends them) | Go-ahead | ✔ |
| Verify Compatibility (Q8) | ✔ | |

### 8.3 Noted, out of scope

- **Apple Vision Pro:** the store page also lists "Apple Vision: Requires visionOS 1.0 or later". The same default applies. It deserves its own short look, or an opt-out.
- **Release-process gap:** a release has never checked the Mac or Vision listings. If the owner keeps the Mac listing, [RELEASE.md](../process/RELEASE.md)'s device check should add a Mac pass.

---

## 9. Addendum, 2026-11-15: every feature on a Mac, and the ads

This section was added by the 1.5.2 session. It is read-only, like the rest: no code, build, setting or tag changed. The labels are §3.6's: **C** confirmed, **P** plausible, **NF** searched for and not found.

### 9.1 The request

The owner checked 1.5.2's build 66 on a phone ("all checks pass"), then asked:

> i also want to bring macs in this update as well but audit what can we do on macs and can we bring every feature intact properly including ads. And if we can't for example do any full screen ads then for macs only we should have always a ad banner at the bottom of the application

**What has changed since §1:**
- 1.5.2's build 66 (`b1fb060`, tag `v1.5.2-tf.66`) is on TestFlight and passed its iPhone check.
- If the Mac availability is left as it is, 1.5.2 reaches Macs as the same binary, as Designed for iPad, like every version before it.
- Nobody has run any build on a Mac yet (CON-004). The checks M1–M9 in §6.2 now apply to build 66.

### 9.2 Can every feature come over intact?

**Not yet: one feature very likely breaks, one is unknown, and the rest are plausible but untested.**

| Feature | On a Mac | What it would take | Label |
|---------|----------|--------------------|-------|
| **The screen stays on (DEF-010, 1.5.1)** | **Probably not.** expo-keep-awake only sets `UIApplication.isIdleTimerDisabled`. Two Apple forum threads say it doesn't keep an iPad app's Mac display awake: [698318](https://developer.apple.com/forums/thread/698318) (the screen saver still starts on an M1) and [740654](https://developer.apple.com/forums/thread/740654) ("This solution does not help", October 2023). Neither has an answer from Apple | `ProcessInfo.beginActivity(options: .idleDisplaySleepDisabled, reason:)` while a session runs, and `endActivity` on pause or end. Apple documents it on iOS 7.0+, iPadOS and Mac Catalyst as "A flag to require the screen to stay powered on". Gate it on `isiOSAppOnMac` in native code, so the iPhone keeps 1.5.1's path unchanged. It would be **the repository's first native module**: there is no `modules/` or `ios/` folder, so it would be a local Expo module autolinked at EAS prebuild, and it needs a new build | The failure: P (two reports). The API's availability: C (Apple's documentation data). Its effect in an iPad app on a Mac: NF |
| **Full-screen ads** | Unknown ([§9.3](#93-the-ads-on-a-mac)) | A Mac test (M5) | NF |
| **The Stats banner** | Unknown, as for the interstitial. Its width comes from the screen, not the window ([§9.4](#94-the-mac-only-banner-if-its-needed)), so in a narrow window it may be wider than the window | A `width` from the window if it stays | Serving: NF. The width: C in code |
| The Timer, the Ring, the facing pages, Stats, Settings, Notes | The iPad layout in a resizable window (§3.1, §4) | M2 | P |
| Fly (Apple Maps, the sheet, the hum) | §3.2's table | M4 | P |
| Sign in with Apple, pairing, partner notes | §3.2's table | M6 | P |
| Notifications | §3.2's table | M7 | P |
| Sounds | They always play, since a Mac has no silent switch | Q5 | P |
| Haptics | Nothing on a Mac, with no crash | Nothing | P |
| The update check | §3.2's table | M9 | P |
| Start-up reports | The server drops a Mac's report | An optional migration (§8.2) | C in code |

### 9.3 The ads on a Mac

**What's known:**
- The app ships Google's iOS SDK 13.5.0 (`react-native-google-mobile-ads` 16.5.0's `sdkVersions`). That is past 11.9.0's fix for a crash "when running on MacOS". **C.**
- Google's iOS release notes, up to 13.12.0 (2026-11-02), mention macOS only for that fix. They mention Apple silicon only for an arm64 simulator slice (7.69.0). Google documents iOS and states no Mac support. **C** ([release notes](https://developers.google.com/admob/ios/rel-notes)).
- No report was found of AdMob interstitials or banners filling, or failing, in an iPad app on a Mac. Three searches were run on 2026-11-15, two of them extended. **NF.**
- On a Mac, the SDK's full-screen view controller would cover the app's window, not the whole Mac screen, since an iPad app's screen there is its window. **P.**

**So the owner's "if we can't do any full screen ads" can't be answered from here.** Only check M5 settles it: an interstitial after the second session, on an Apple Silicon Mac with build 66 from TestFlight. If the Mac's ads don't fill, the banner below probably wouldn't fill either, since both come from the same SDK and the same account. M5 should note the Stats banner too.

### 9.4 The Mac-only banner, if it's needed

This is a design, and nothing is built.

- **Only on a Mac.** It shows when `Device.deviceType === DeviceType.DESKTOP`. expo-device 58 returns that when `ProcessInfo.isiOSAppOnMac` is true (`node_modules/expo-device/ios/DeviceModule.swift:88`, **C**). The iPhone and iPad layouts don't change.
- **One banner for the whole app.**
  - It sits in its own slot at the window's bottom, below the navigator in `app/_layout.tsx`, so it stays under every tab and the screens are laid out above it, not under it.
  - Form sheets present above it.
  - On a Mac, the Stats banner is hidden, or Stats would show two.
- **It doesn't depend on the tab bar.** With the iPad idiom the tab bar should float at the top (**P**), which would leave the bottom free. But §6.2's M8 lists its place on a Mac as unknown, so the banner keeps its own slot either way.
- **Its width comes from the window.**
  - The library sizes an anchored adaptive banner from `UIScreen.mainScreen.bounds`, less the key window's safe area, not from the window (`RNGoogleMobileAdsCommon.mm:211-216`, **C**).
  - It takes a `width` prop, and a change to it requests a new banner (`RNGoogleMobileAdsBannerView.mm:60-62`, **C**).
  - So the Mac banner passes `width` from `useWindowDimensions`, debounced until about a second after a resize ends, so that dragging the window's edge doesn't send a request per frame.
- **The interstitial** either stays beside the banner on a Mac or is replaced by it (Q11).
- **Placement policy:** AdMob's guidance is to keep ads away from controls, to avoid accidental clicks. The slot keeps a gap above it, and a pointer makes misclicks less likely than a finger. **P.**
- **What can be tested:** Jest can prove the branch. With `DESKTOP`, the root banner shows and Stats' hides; otherwise neither changes. It proves nothing about a Mac.
- **Cost:** JavaScript only, with no native change, but it ships in a build.

### 9.5 What "in this update" costs

- **Build 66 as it is:** it passed its iPhone check. Submitting it delivers DEF-011's fix to everyone now, and Macs get the same binary with the gaps above.
- **Any Mac code** (the banner, the keep-awake module) means:
  - a new build, numbered by EAS;
  - 1.5.2's device check repeated on an iPhone;
  - checks M1–M9 on an Apple Silicon Mac.
- **Without a Mac**, both changes would ship untested on the one platform they're for.

### 9.6 Questions (2026-11-15)

| # | Question | Recommendation | Why |
|---|----------|----------------|-----|
| Q2 | (Still open.) Is an Apple Silicon Mac (M1 or later) available for TestFlight? | Needed for everything below | Every Mac answer here waits on one |
| Q10 | Submit build 66 now and do the Mac work in 1.5.3, or hold 1.5.2 for a rebuild? | **Submit build 66 now** | It's checked, and it doesn't make Macs any worse than 1.5.1 does |
| Q11 | If Mac ads fill, should the banner replace the interstitial on a Mac or run beside it? | **Run M5 first.** If the interstitial works, keep it and don't add the banner. Add the banner only if it fails | That is the owner's own condition |
| Q12 | Without a Mac, build the banner and the keep-awake module anyway, untested? | **No.** Wait for a Mac | The iPhone check would catch a crash, but neither change can be seen doing its job anywhere except on a Mac, and ad code nobody has seen working puts the AdMob account at risk |

### 9.7 The owner's answers (2026-11-15)

| # | Answer, verbatim | What it means |
|---|------------------|---------------|
| Q10 | "Hold 1.5.2 for Mac" | Build 66 isn't submitted. 1.5.2 is rebuilt with the Mac work and checked again on an iPhone and on a Mac. |
| Q2 | "Yes, M1 or later" | §6.2's checks can run, on the new build. Build 66 can give a baseline first. |
| Q11 | "Both" | On a Mac, the interstitial as on an iPhone, plus the always-on bottom banner, whether or not the interstitial works. |
| Q12 | "Build them untested" | Moot, since a Mac is available. It also means the owner accepts building before the Mac check. |

The work is in [1.5.2's Mac record](2026-11-15-v152-mac.md). Q1, Q3–Q9 of §8 are still open. Q4 is overtaken by Q11, and Q8 (Verify Compatibility) waits for the Mac check.
