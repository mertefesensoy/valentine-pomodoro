# 2026-11-25 — Android build 1 for the Play closed test: what changed, and the emulator checks

**Status:** In progress. The code, tests and docs are in the working tree of `feat/1.5.2-android`, not committed. The full Jest suite passes (100 suites, 1010 tests).

**The emulator run.** The second preview build (`0e4206bd`) was installed clean and checked on the emulator, and everything in §6.2 passed. It also found two Android bugs (§1, E10 and E11), and their fixes came after that build:
- **DEF-013:** the reminder's time rows;
- **the landscape page height.**

Both are checked in Jest only, and wait for a third preview build. DEF-014, the tour scrim's undimmed sides, is an older Android bug, cosmetic, and left for a closed-track update.

**Update, 2026-11-25:**
- **Committed and in review.** `9065fc7` (build 1) and `d1b822a` (exact alarms, on its own) are in PR #49, with CI green.
- **The third preview build (`f912401f`) verified DEF-013 and E11** on the emulator (§6.4).
- **It also found two Android bugs, both in `master` too:**
  - **DEF-016:** a font-size or display-size change crashes the next `router.push`. It's fixed in config by `plugins/withConfigChanges.js`, uncommitted, with Jest and the introspected manifest only so far.
  - **DEF-015:** the tour sometimes ends at Notes. Its cause isn't known yet.

**Later the same day:**
- **On the owner's "Yes, both",** the DEF-016 fix was committed as `8b79df8`.
- **The fourth preview build (`e44c8a48`) verified it on the emulator,** and the English Play screenshots were taken with it (§6.5).

**Not done yet:**
- the Turkish screenshots;
- DEF-014 and DEF-015;
- the production AAB;
- the owner's Play Console steps (Stage 0 and Stage 2 of the [plan](2026-11-25-android-closed-test-plan.md)).

**Branch:** `feat/1.5.2-android`, cut from `5114cc7` (`master`, the merge of PR #48). The app code there is iOS 1.5.2's (`ad0832c`).
**Plan:** [the closed-test plan](2026-11-25-android-closed-test-plan.md), Stage 1. The owner's answers (2026-11-25):
- pairing off on Android in build 1, with Sign in with Google later;
- Google's test ads for the closed test;
- a preview build of `master` now;
- `USE_EXACT_ALARM` for the session alerts.

---

## 1. Problem / Motivation

Build 1 is what testers install on day 0 of Google Play's 14-day closed test.

**Two sources of evidence decided what must change:**
- [the plan's audit](2026-11-25-android-closed-test-plan.md#2-what-the-audit-of-master-found);
- the first Android run of 1.4's and 1.5's screens, on the Android 15 emulator, with EAS preview build `a5522c6f` of `master`. Screenshots are kept under `C:\Android\devicecheck\2026-11-25-v152\`.

**What the run found:**

| # | Seen on the emulator | Why it matters |
|---|----------------------|----------------|
| E1 | The Timer, the tutorial and Settings all offer "Pair with your partner". The sheet's only way in is Sign in with Apple, which Android lacks (plan A1). | A dead end on the main screen. |
| E2 | **Every tab's last ~80 dp sits under the tab bar.** The Timer's Start button is cut off. At the end of Settings' scroll, the group after About, the destructive Reset, is behind the bar and can't be reached. | A control out of reach. |
| E3 | Stats has no banner: the Android id is a placeholder (plan A2). | An empty box; no test ad either. |
| E4 | The APK asks for `RECORD_AUDIO` and `SYSTEM_ALERT_WINDOW` (`dumpsys package`; plan A3). | The microphone on the Play listing, and a Data safety answer. |
| E5 | **A phase's end alert is an inexact alarm.** A 1-minute focus alerted 45 s late (DEF-012). | Up to ~19 minutes late for a 25-minute focus on a locked phone. |
| E6 | Settings says "Light or dark follows your iPhone." Other lines name iOS Settings or the App Store. | iPhone wording on Android. |
| E7 | Settings shows a Fly group (Ambient sounds), and Fly doesn't exist on Android. | A setting for nothing. |
| E8 | The privacy policy link is only in the start-up timings group, which pairing's gate hides on Android. | Play's User Data policy wants the policy inside the app as well as on the listing. |
| E9 | The status bar's notification icon is a solid grey circle (no icon set). The tab bar takes Material You's lavender surface and a grey-blue pill. The switches have Material's teal knob. | Off-brand on every screen; cosmetic. |
| E10 | (On `0e4206bd`.) **Turning on the daily reminder popped three time dialogs** at once. Once they were cancelled, the time rows were empty (DEF-013). | The reminder's time can't be seen or changed. |
| E11 | (On `0e4206bd`.) **In landscape, the Timer's face runs under the tab bar, and Start and Skip are out of sight.** The page sized itself from the window's height, which on Android includes the bar. | A control out of reach in landscape. |
| E12 | (On both builds.) **The tour's scrim leaves the page undimmed to the left and right of the opening**, with a thin strip across the opening's middle (DEF-014). | Cosmetic. The tour works, and nothing is hidden. |

**What passed without a change:**
- **Launch:** no crash. The update from the 1.3.1 preview install kept the data: the 1.3.1 welcome-back and the update tour played.
- **Edge to edge:** system bars and content are right at the top.
- **Fly:** it stays hidden in the Modes sheet.
- **Back button:** it closes the Modes sheet.
- **Notifications:** they land on the app's `timer` channel.
- **Native libraries:** all 60 64-bit ones are aligned to 16 KB (`check16k`, §4).
- **API level:** `targetSdk=36`.

## 2. What Changed

| File | Change |
|------|--------|
| `src/constants/features.ts` | `isPairingAvailable(os)` is true only on iOS, and `PAIRING_ENABLED` is that value, read once at load. Start-up reports follow it, as before, so on Android both are off. |
| `src/constants/__tests__/features.test.ts` | Pins the gate on both platforms. A fresh registry with Platform set to Android shows pairing and reports off, the general tutorial without its pair step, and no 1.5 tutorial. |
| `src/ads/AdConfig.ts` | `adUnitIdOr(configured, testId)`: an id without an ad unit id's shape, such as a placeholder or nothing, falls back to Google's test id. The banner and the interstitial use it. |
| `src/ads/__tests__/adConfig.test.ts` | New. Pins `adUnitIdOr`, and that `app.json`'s real iOS ids and the Android test ids pass it unchanged. |
| `src/screens/__tests__/settingsAndroid.test.tsx` | New. With pairing, reports and Fly off, Settings still opens the privacy policy, and shows no timings switch, no Fly group and no pairing row. Both tests fail on `master`'s screen. |
| `app.json` | The changes below. |
| `plugins/withExactAlarms.js` | New. A config plugin that declares `USE_EXACT_ALARM`, and `SCHEDULE_EXACT_ALARM` with `maxSdkVersion="32"`. |
| `plugins/withConfigChanges.js` | New. Adds `fontScale`, `density` and `fontWeightAdjustment` to the main activity's `android:configChanges`, so those settings no longer recreate it and crash the next `router.push` (DEF-016). |
| `src/constants/__tests__/appConfig.test.ts` | DEF-009's `expo-audio` entry now also pins `recordAudioAndroid: false`. New: the blocked permissions, the plugin in `app.json`, and its manifest output. |
| `src/i18n/index.ts` | `hasKey(key)`: whether English has the key. |
| `src/i18n/platformKey.ts` | New. `platformKey(key, os)`: `<key>Android` on Android when it exists, otherwise `key`. |
| `src/i18n/__tests__/platformKey.test.ts` | New. iOS keeps every key; Android gets its sibling; a key without one is unchanged; no Android line names the iPhone, iOS or the App Store, in English or Turkish. |
| `src/i18n/en.json`, `src/i18n/tr.json` | Four Android lines in each language (§3.4). |
| `src/screens/SettingsScreen.tsx` | Three changes:<br>• the notifications notice and its button and the appearance footer go through `platformKey`;<br>• the Fly group renders only where `isFlyModeAvailable()`;<br>• the Privacy group always shows the policy link, with the timings switch and its footer only where start-up reports are on. |
| `src/hooks/useUpdateCheck.ts` | The update prompt's message goes through `platformKey` ("on Google Play"). |
| `app/(tabs)/_layout.tsx` | On Android only: the tabs keep expo-router's safe-area wrapper, and the bar takes the paper, a `primarySoft` indicator and the cocoa inks. |
| `src/components/LazyTab.tsx` | On Android only, a tab's screen gets its own `SafeAreaProvider`. |
| `src/components/settings/SettingsList.tsx` | On Android only:<br>• `SwitchRow` gets a cocoa knob on the pink track when on, and a paper knob on `edgeStrong` when off;<br>• `TimeRow` becomes `AndroidTimeRow`, a row with its time that opens the system dialog when tapped (DEF-013). |
| `src/components/settings/__tests__/timeRowAndroid.test.tsx` | New. On Android the row shows "7:00 PM" for 19:00, mounts no picker, opens the dialog on a tap and takes only a "set". On iOS the inline picker stays. The Android tests fail on `master`'s `TimeRow`. |
| `src/hooks/useTabPageHeight.ts` | New. A tab page's height: the window's on iOS; on Android, the frame of `LazyTab`'s provider, which ends at the bar. |
| `src/hooks/__tests__/useTabPageHeight.test.tsx` | New. Pins both platforms. |
| `src/screens/TimerScreen.tsx`, `src/screens/StatsScreen.tsx` | Their layout height comes from `useTabPageHeight()`. That fixes the Timer's landscape face (E11) and Stats' compact layout and banner measurement. |
| `scripts/design/android-notification-icon.mjs` | New. Renders the notification icon from the brand's white mark with headless Chrome, and checks it. |
| `scripts/android/check-16k.mjs` | New. Play's 16 KB page-size check on an APK or AAB, without the SDK's build-tools. |
| `assets/images/notification-icon.png` | New. 96×96, white on transparent, from `brand/svg/valentine-pomodoro-mark-single-white.svg`. |
| `docs/srs/SRS.md` | DEF-012, DEF-013 and DEF-014, with FR-NTF-001's, FR-NTF-002's and FR-ONB-001's acceptance lines and known deviations. |
| `CHANGELOG.md` | The Unreleased section for Android build 1. |
| `docs/process/RELEASE.md` | §5 Android: the checks and steps this build used. |
| `docs/implementations/2026-11-25-android-closed-test-plan.md` | The owner's answers and the emulator's findings. |
| `docs/implementations/2026-11-25-android-build1.md` | This record. |
| `docs/README.md` | Its index row. |

**The `app.json` changes:**
- `android.blockedPermissions`: `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`;
- `expo-audio`: `recordAudioAndroid: false`;
- `expo-notifications`: `icon` and `color` (`#B03158`, `primaryInk`);
- `admobBannerIdAndroid`: Google's adaptive test banner id;
- `./plugins/withExactAlarms`.

## 3. Implementation Approach

### 3.1 Pairing off on Android: one flag, made platform-aware

Every place a person can reach accounts already reads `PAIRING_ENABLED`:
- the Timer's offer, the partner note intake and the glance;
- the tutorials;
- Settings' rows;
- `startPaired`;
- the start-up reports, through `STARTUP_REPORTS_ENABLED`.

1.4 shipped with it off. So making the flag false on Android gives Android the code path 1.4 ran on real iPhones, rather than a new one.

**`isPairingAvailable(os = Platform.OS): boolean`**
- **Contract:** true only for `'ios'`. That includes the iPhone and iPad app on a Mac, where Sign in with Apple works. It is pure.
- `PAIRING_ENABLED` is `isPairingAvailable()`, evaluated once when the module loads. `Platform.OS` can't change while the process lives.
- The tests that mock `PAIRING_ENABLED` keep working unchanged.

**What stays reachable:**
- **The `/pair` and `/partner` routes** can still be reached by a deep link. Nothing in the app makes one: the invite message carries a code and a store link. A guard there would be the third layer, so it is left for Stage 3, when Google sign-in makes the routes real on Android.
- **The invite's store link** is the App Store's. It is reachable only on iOS until then.

### 3.2 Ad ids: a shape check instead of `??`

**`adUnitIdOr(configured: unknown, testId: string): string`**
- **Contract:** returns `configured` when it is a string matching `^ca-app-pub-\d+/\d+$` (an ad unit id; an app id has `~`), otherwise `testId`. It is pure.
- **Debug builds** still always use the test ids.
- `app.json` now names Google's adaptive test banner for Android, next to the test app id and test interstitial already there. All three are replaced together by the real ids (AN5), in the last update before production.

### 3.3 Permissions

**Blocked permissions:** `android.blockedPermissions` writes `tools:node="remove"` entries, so a permission is removed from the merged manifest whichever library declares it. `recordAudioAndroid: false` stops `expo-audio`'s plugin adding the microphone in the first place.

**Kept:**
- `MODIFY_AUDIO_SETTINGS`, a normal permission that `expo-audio` uses for audio focus.
- `FOREGROUND_SERVICE`. It is untyped, comes from a library, and no typed foreground service is declared, so Play asks no foreground-service declaration.

**`addExactAlarmPermissions(manifest)`** (in `plugins/withExactAlarms.js`; the owner's choice, 2026-11-25):
- **Contract:** on a parsed `AndroidManifest.xml`, it ensures one `USE_EXACT_ALARM` entry and one `SCHEDULE_EXACT_ALARM` entry with `android:maxSdkVersion="32"`. An existing entry is updated in place, never duplicated, and nothing else is touched.
- **Why the two:**
  - `expo-notifications` schedules an exact alarm (`setExactAndAllowWhileIdle`) whenever `canScheduleExactAlarms()` is true, and that is always true below Android 12.
  - On Android 13 and later, `USE_EXACT_ALARM` makes it true, granted at install.
  - On 12 and 12L, `SCHEDULE_EXACT_ALARM` is granted at install.
  - From Android 14, `SCHEDULE_EXACT_ALARM` starts denied and would need a trip to system settings, hence the `maxSdkVersion`.
- Google Play allows `USE_EXACT_ALARM` for apps whose core function is a timer. It asks for a declaration in Play Console's App content, which is the owner's (§7).

### 3.4 Android wording

**`platformKey(key, os = Platform.OS): string`**
- **Contract:** on Android, returns `<key>Android` when English has it, otherwise `key`. On any other OS, returns `key`. It is pure for a given `os`.
- Because a key without an Android sibling is returned unchanged, the notifications notice can pass both `denied` (which has one) and `failed` (which doesn't) through it.
- The parity test in `i18n.test.ts` already holds English and Turkish to the same keys and placeholders.

| Key | Android, English | Android, Turkish |
|-----|------------------|------------------|
| `settings.notifications.denied` | Notifications are off for this app in your phone's settings, so the reminder can't be set. | Bu uygulamanın bildirimleri telefonunun ayarlarında kapalı, bu yüzden hatırlatıcı kurulamıyor. |
| `settings.notifications.openSettings` | Open app settings | Uygulama ayarlarını aç |
| `settings.appearance.footer` | Light or dark follows your phone. | Açık ya da koyu görünüm telefonunu izler. |
| `updates.availableMessage` | Version {{version}} is available on Google Play with the latest improvements and fixes. | {{version}} sürümü, en son iyileştirmeler ve düzeltmelerle Google Play'de. |

These eight strings haven't been through the owner's copy review yet (§7).

### 3.5 Tab insets on Android

**On iOS**, `UITabBarController` puts its bar in the screen's safe area. So `useSafeAreaInsets().bottom` already includes the bar, and the screens pad by it (Phase 1 B6). Each tab therefore sets `disableAutomaticContentInsets`.

**On Android**, the Material bar is drawn over the content. The root `SafeAreaProvider` reports only the gesture strip. So the content ran about 80 dp under the bar (E2).

**The fix, on Android only:**
1. The triggers pass `disableAutomaticContentInsets={false}`. expo-router then wraps the tab in react-native-screens' `SafeAreaView`, with the bottom edge and `insetType: 'all'`: the system bars and the tab bar.
2. `LazyTab` wraps the screen in its own `SafeAreaProvider`. That provider measures the insets of the padded frame: the status bar at the top, and nothing at the bottom, since the frame ends above the bar.

The screens keep their code. Their `insets.bottom` is 0 there, instead of the gesture strip a second time.

Before measuring, the nested provider starts from its parent's insets, so the first frame of a tab may sit one gesture strip higher. iOS renders as before: `LazyTab` returns its children unwrapped.

### 3.6 Cosmetic, Android only

**The tab bar:**
- `backgroundColor` is `paper`. It applies on iOS too, where it would replace the Liquid Glass bar, so all of these are passed on Android only.
- `indicatorColor` and `rippleColor` are `primarySoft`.
- Icons and labels are `inkSoft`, and `primaryInk` when selected.

**The switches:**
- On: `onPrimary` on `primary`.
- Off: `paper` on `edgeStrong`.

**The notification icon:**
- It is the brand's single-white Same Page mark, at 88 px in a 96 px square (a 1 dp margin at xxxhdpi).
- The plugin scales it to each density.
- `color` tints the shade's header and the app name.

### 3.7 The reminder's time rows on Android (DEF-013)

`TimeRow` mounted `@react-native-community/datetimepicker` with `display="compact"`, iOS's chip that opens a popover. Android has no such mode. There the component's job is to open the dialog: it does so when it mounts, and it draws nothing in its place.

**`AndroidTimeRow({ label, hhmm, onChange })`**
- **What it renders:** a `Pressable` row with the label and the time. The time is written as the Timer writes a clock time (`toLocaleTimeString` in `en-US` or `tr-TR`, hour and minutes), so "7:00 PM" in English and "19:00" in Turkish.
- **On a tap:** `DateTimePickerAndroid.open({ value, mode: 'time', is24Hour: language === 'tr', onChange })`.
- **Only a `set` event calls `onChange`**, with `hhmm` of the chosen time. A dismissal changes nothing.
- **iOS keeps its compact picker unchanged.** The platform is read at render, so the tests can switch it.

The dialog itself is Android's Material dialog, in the system theme's teal. Theming it needs an Android style resource, so it's left for AN4.

### 3.8 The page height on Android (E11)

**`useTabPageHeight(): number`**
- **iOS:** `useWindowDimensions().height`, exactly as before.
- **Android:** `useSafeAreaFrame().height`, the frame of the nearest `SafeAreaProvider`. Inside a tab that's `LazyTab`'s (§3.5), whose frame ends at the tab bar.
- **Contract:** `height - insets.top - insets.bottom` is the page's free height on both platforms. Both hooks are called every time, so the hook order is stable.
- **Who uses it, as `pageHeight`, only where an inset is taken from it:**
  - the Timer: the landscape face's height and the Ring's fallback room;
  - Stats: the banner's distance from the bar, which keeps the tour's bubble off the ad.
- **What keeps the window's `height`:** the thresholds and proportions, which were tuned on it. Those are the Timer's `compactHeight`, Stats' `compact` and `short`, and the stacked Ring's 36 %. Otherwise a small Android phone in portrait, one bar shorter, would switch to the landscape layout.
- **Not Notes:** it uses the height only for `contentInset`, which only iOS has.

## 4. Mathematical / Statistical Details

**Inexact alarm delay (DEF-012).**
- For an inexact alarm with wait *w* (from scheduling to the trigger time), Android may deliver it anywhere in [*t*, *t* + 0.75·*w*].
- The emulator's `dumpsys alarm` showed a window of +44.991 s for a 58 s wait, and 0.75 × 58 ≈ 43.5 s. The scheduling moment sits a little before the dump, which accounts for the difference.
- So for a 25-minute focus, the alert may come up to 0.75 × 25 = 18.75 minutes late.
- An exact alarm has a window of 0.

**Contrast of the new pairs.** WCAG relative luminance, ratio (L₁ + 0.05)/(L₂ + 0.05). The floor is 3:1 for non-text UI and 4.5:1 for text:

| Pair | Strawberry Milk | Midnight Plum |
|------|-----------------|---------------|
| Switch on: `onPrimary` / `primary` | 6.76 | 9.33 |
| Switch off: `paper` / `edgeStrong` | 3.75 | 4.37 |
| Selected tab: `primaryInk` / `primarySoft` | 5.10 | 6.22 |
| Unselected tab: `inkSoft` / `paper` | 5.98 | 7.92 |

**16 KB pages.** `scripts/android/check-16k.mjs` reads each `lib/arm64-v8a` and `lib/x86_64` `.so` in an APK or AAB, and exits 1 if any is under 16 KB. The value it reports is the smallest `p_align` of the ELF's `PT_LOAD` segments, which must be ≥ 16384. On `a5522c6f`, all 60 libraries have 16384, and every stored entry starts on a 16 KB zip boundary.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| `PAIRING_ENABLED` made platform-aware | Gate each reach point separately | One switch already controls them all, and its off path is the one 1.4 shipped. |
| A shape check for ad ids | Delete the placeholder and keep `??` | Both are done: the shape check also stops the next placeholder. |
| `USE_EXACT_ALARM` with `SCHEDULE_EXACT_ALARM` up to API 32 | `SCHEDULE_EXACT_ALARM` with a settings prompt; ship late alerts and fix them in an update | The owner's choice. No prompt, and Google's documented pattern for timers. |
| A nested `SafeAreaProvider` on Android | Add a fixed 80 dp to every screen; keep the wrapper and accept a doubled gesture inset | No constant to drift with Material's bar height, and no change to any screen. |
| `platformKey` with `…Android` siblings | Make the iOS lines platform-neutral | iOS keeps the exact words the owner approved; only Android gets new ones. |
| The notification icon from the brand SVG, by a script | Draw a new icon in VectorCraft | It's the existing mark, and the script makes it again from source and checks it. VectorCraft isn't on this machine's PATH (`vc` is Vercel's CLI). |
| The tab bar, switches and icon in build 1 | Leave them for AN4 | They are small, Android-only and on every screen. The second preview build checks them with everything else. |

## 6. Verification

### 6.1 Done here

- [x] **Tests:**
  - `features.test.ts` failed with the gate broken (3 failures) and passes with it.
  - The full Jest run gave 97 suites and 999 tests passed, before the exact-alarm plugin.
  - Then `appConfig.test.ts` passed (6 tests), and the i18n, ads, Settings and update-check suites passed (94 tests).
- [x] **Static checks:**
  - `npm run typecheck` is clean.
  - ESLint gives 0 errors. The two warnings in the changed files (`AdManager.ts:1`, `useUpdateCheck.ts:85`) were already in `master`.
- [x] **The introspected manifest** (`npx expo config --type introspect`):
  - the four permissions marked `tools:node="remove"`;
  - `USE_EXACT_ALARM`;
  - `SCHEDULE_EXACT_ALARM` with `maxSdkVersion` 32;
  - the notification icon and colour meta-data.
- [x] **The baseline, on the emulator,** with preview `a5522c6f` of `master` (§1).
- [x] **After the last change, every local CI step passes:**
  - typecheck;
  - lint: 0 errors, and 31 warnings, all in `master` already;
  - Jest: 100 suites, 1010 tests;
  - the contrast check: 60 pairs, 0 under the floor;
  - the docs check.
  The database and performance steps aren't touched here, so CI runs them.
- [x] **iOS is unchanged at the config level.** `npx expo config --type introspect` gives a byte-identical iOS Info.plist, entitlements, Expo plist and Podfile properties for `HEAD`'s `app.json` and this branch's.

### 6.2 The second preview build (`0e4206bd`), installed clean on the emulator

The first five items below were checked on 2026-11-25, after `adb uninstall`. The screenshots are in `C:\Android\devicecheck\2026-11-25-v152\build1\`.

- [x] **Install:**
  - the 16 KB check gives 60 libraries and 0 under;
  - `targetSdk=36`;
  - no `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW` or storage permissions;
  - `USE_EXACT_ALARM` is granted at install;
  - `SCHEDULE_EXACT_ALARM` is absent on API 35, as `maxSdkVersion` 32 intends.
- [x] **A new install:**
  - the welcome ("Meet Pomo & Doro.");
  - the tour without a pair step;
  - the Timer's strip reads "Pomo & Doro are ready when you are", with no pairing;
  - no crash.
- [x] **The first focus:** Android's notification prompt appeared at Start. Then, in the background:
  - `dumpsys alarm` showed `window=0` and `exactAllowReason=policy_permission`;
  - "Focus complete" **posted 39 ms after its time** (DEF-012 fixed);
  - the notification shows the mark in a `#B03158` circle.
- [x] **The main path:**
  - the note opened once on return, and Back closed it;
  - after the second focus, in the foreground, the note was followed by Google's test interstitial, closed with its ✕;
  - Stats shows the test adaptive banner above the bar, with both sessions counted;
  - Notes: "Add", typing, Save → 21 notes.
- [x] **Layout and look:**
  - Start and Skip sit clear of the tab bar;
  - Settings scrolls to "Reset settings";
  - Settings shows no partner group, no Fly group, and a Privacy group with only the policy link;
  - "Light or dark follows your phone." / "Açık ya da koyu görünüm telefonunu izler.";
  - the paper tab bar with the pink pill, and the cocoa and paper switch knobs, in light and in dark (Midnight Plum);
  - Turkish throughout, after the relaunch the language change asks for;
  - the Focus wheel is Android's dropdown, and it set 1 minute.
- [x] **DEF-013 and E11, on the third preview build** (see §6.4).
- [ ] DEF-014 (the tour scrim) is open for a closed-track update.

### 6.4 The third preview build (`f912401f`, from `d1b822a`, the PR's head)

**Conditions.** The run is from 2026-11-25. Screenshots are in `C:\Android\devicecheck\2026-11-25-v152\build1-p3b\`.
- The emulator's host-GPU rendering crashed after two hours. The PC had 2.5–4.5 GB free, and host-GPU boots then segfaulted.
- So this pass ran with software rendering (`-gpu swiftshader_indirect`) and Android's animation scales at 0. The app takes that as Reduce Motion.

**Checks:**
- [x] **Install:** 60 64-bit libraries, 0 under 16 KB; `targetSdk=36`; `USE_EXACT_ALARM` granted; none of the blocked permissions.
- [x] **DEF-013:**
  - turning on the daily reminder brought Android's notification prompt, then the rows, with **no time dialog**;
  - "Reminder time" reads 7:00 PM;
  - a tap opened **one** dialog, and choosing 8 and OK made the row read 8:00 PM.
- [x] **E11, landscape:**
  - the Ring's face fits above the bar, and the right column scrolls to Start and Skip;
  - Facing pages scrolls to the pages' foot and to Start and Skip.
- [x] **Facing pages in portrait** (its first Android run): both pages, the solo line on the partner's page, and Start and Skip clear of the bar.
- [x] **A small phone** (`wm size 720x1280`, `wm density 320`, so 360×640 dp):
  - the Timer scrolls to Start and Skip;
  - Settings reaches Reset settings;
  - Stats scrolls.
- [x] **The whole tour with Next:** presets, Today, Modes (Ring and Facing pages, with no Fly on Android), the Stats lead, Stats, the Notes lead, Notes, as in `master`.
  - The tab leads' ribbon hangs from the top rather than at the tab, in `master` too.
  - The test banner isn't dimmed on Stats during the tour.
- [ ] **DEF-015, open:** in 4 of 7 runs the tour ended as it reached Notes (SRS §3.4).
- [x] **DEF-016 found, and fixed in config:**
  - changing the display density or the font size, then tapping Modes, crashed both `f912401f` and `master`'s `a5522c6f`, every time;
  - `plugins/withConfigChanges.js` is the fix. Its emulator check needs the next preview build.
- [x] **The Play phone screenshots** were taken on the fourth build (§6.5).

### 6.5 The fourth preview build (`e44c8a48`, from `8b79df8`)

The run was on 2026-11-25, with the same emulator conditions as §6.4. Screenshots are in `build1-p3b\`, prefixed `p4`.
- [x] **Install:** 60 64-bit libraries, 0 under 16 KB.
- [x] **DEF-016, density:** after `wm density 360`, Modes opened. The app stayed alive and the crash buffer was empty.
- [x] **DEF-016, font size:**
  - after `settings put system font_scale 1.3`, the Timer re-laid out with larger text, without restarting: no second `Running "main"`;
  - then Modes opened, with no crash.
- [x] **Back out of the app, then reopen** (a fresh root in the same JavaScript runtime): Modes opened normally. So DEF-016's trigger is the configuration-change recreation the fix removes, not any remount.
- [ ] **An observation for a closed-track update:** after that Back-and-reopen, the Timer's strip drew without its two small mascots, until the process was restarted. Cosmetic; cause not looked into.
- [x] **The Play phone screenshots**, English, light (one dark), at 1080×1920 (9:16). The status bar is clean (Android's demo mode, the clock set to the device's time), and airplane mode is on so no test ad shows. They're saved as opaque RGB PNGs in `art/out/store-play/phone/en/`:
  - `01-timer`;
  - `02-focus` (running);
  - `03-facing-pages`;
  - `04-love-note`;
  - `05-notes`;
  - `06-stats`, empty on a fresh install, with the banner's reserved space showing;
  - `07-dark`.

  Animations were off, so the idle Ring shows its progress cap as a dot. A Turkish set isn't taken yet.

### 6.3 Left for the owner

- [ ] The copy review of §3.4's eight strings.
- [ ] Play Console: the exact-alarm declaration, with everything in the plan's Stage 0.

## 7. Related Docs

- [The closed-test plan](2026-11-25-android-closed-test-plan.md)
- [Hide Fly Mode where it can't open](2026-10-29-android-hide-fly-mode.md) (the same gate pattern)
- [Phase 1 B6, expo-router](2026-10-30-phase1-b6-expo-router.md) (the tab insets on iOS)
- [DEF-009](2026-11-03-def-009-background-audio-mode.md) (the `expo-audio` pin)
- [SRS §3.4, DEF-012](../srs/SRS.md#34-known-deviations-as-built-found-2026-10-30)
