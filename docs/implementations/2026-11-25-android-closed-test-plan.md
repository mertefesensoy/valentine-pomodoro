# 2026-11-25 — 1.5.2 on Android: the Play closed test, plan

**Status:** Plan approved by the owner's answers of 2026-11-25 (§7). Stage 1 is in progress in [its own record](2026-11-25-android-build1.md): the emulator run of `master` (EAS preview `a5522c6f`) is done, and build 1's changes are written and waiting for their own emulator check.
**Branch:** `feat/1.5.2-android`, cut from `5114cc7` (`master`, the merge of the iPhone App Store set, PR #48). Its app code is the code iOS 1.5.2 shipped from (`ad0832c`): the only change since is `eas.json`'s iOS dSYM path ([keep-dsyms record](2026-11-16-keep-dsyms.md)).
**Comes from:** the [Android track](../roadmap/ROADMAP.md#android-track--in-progress), tasks AN0–AN6 in the [Phase 1 plan §3b](2026-10-29-phase1-plan.md#3b-deferred-android-after-v14), and [ADR-0037](../architecture/adr/0037-ios-first-android-deferred.md).

---

## 1. Problem / Motivation

1.5.2 is live on the iPhone, iPad and Mac. Android hasn't had a build since 1.0.1 (January 2026), and that build never reached production.

Google Play holds back production access for personal developer accounts created after 13 November 2023. Each such app must first run a closed test. On 2026-11-25 the owner said they have enough testers to run it, so AN0 can start.

**What Play's help pages say** (re-read on 2026-11-25: [testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465), [setting up a test](https://support.google.com/googleplay/android-developer/answer/9845334), [target API](https://support.google.com/googleplay/android-developer/answer/11926878)):

- **The track:** only a **closed** test counts. Internal testing is "optional, but recommended" and doesn't meet the requirement. Someone opted in to the internal test can't join the closed test until they leave the internal one.
- **The rule:** at least 12 testers, opted in to the closed test without a break for the 14 days before the production-access application. A tester who leaves and rejoins starts their 14 days again.
- **Testers:** each needs a Google account. They're added by email list or Google Group, and each opts in through the test's link. The link exists only once the test is published, and it can take several hours to work.
- **Engagement counts:** Google can make a test run longer for "insufficient tester engagement".
- **The application** asks about the test, the app and its readiness:
  - **The test:** how easy recruiting was, whether testers used all the app's features, and the feedback and how it was collected.
  - **The app:** its audience, its value, and the expected installs in the first year.
  - **Readiness:** what changed because of the test, and how readiness was judged.
  - Google reviews the application in "seven days or less".
- **Target API:** new apps and updates must target API 36 (Android 16) from 31 August 2026.
- **Not covered by these pages:**
  - whether a new release on the closed track affects the count (nothing says it resets it);
  - whether, and for how long, Google reviews a closed-test release.

**The 14 days are the critical path.** Every day before build 1 is on the closed track adds a day to Android's release. So §3 splits the work in two:
- what must be in build 1;
- what can ship as updates to the closed track during the 14 days. Those updates also answer the application's "what changed because of the test".

## 2. What the audit of `master` found

The audit reads the code as built for Android:
- `npx expo config --type introspect` for the manifest;
- the libraries' own manifests and module configs in `node_modules`;
- EAS's build list and version counter.

Nothing has run on a device yet: that needs the preview build in §3, Stage 1.

| # | Finding | Weight |
|---|---------|--------|
| A1 | **Pairing signs in only with Apple** (`src/server/appleSignIn.ts`). `expo-apple-authentication` is Apple-only: its module config lists `"platforms": ["apple"]`. On Android, `AppleAuthenticationButton` renders nothing and `signInAsync` throws `UnavailabilityError`. `PAIRING_ENABLED` is `true`, so the Timer's partner page offers pairing whenever the timer is idle (`TimerScreen.tsx:519`). On Android that opens a sign-in page with no button on it: a dead end. These also hang off it:<br>• the general tutorial's pair step and 1.5's updater tutorial (`tutorials.ts:190`);<br>• Settings' account rows (`SettingsScreen.tsx:262, 404, 409`);<br>• the start-up report switch (`STARTUP_REPORTS_ENABLED = PAIRING_ENABLED`);<br>• the invite message, whose link is the App Store's (`PairScreen.tsx:65, 393`);<br>• account deletion, which exchanges an Apple authorization code (`supabase/functions/delete-account`). | Blocks build 1 |
| A2 | **Android's ad ids:**<br>• the AdMob app id and the interstitial id are Google's sample (test) ids;<br>• the banner id is the literal placeholder `REPLACE_WITH_ANDROID_BANNER_UNIT_ID`. That string isn't null, so `AdConfig.ts`'s fallback, `?? TestIds.BANNER`, never fires. In a release build, Stats' banner would fail on every request.<br>Real ids are AN5, the owner's. | Blocks build 1 (the banner) |
| A3 | **Unused permissions in the manifest.** It declares `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` (the `expo-audio` plugin: `recordAudioAndroid` defaults to true). It also declares `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (Expo's template).<br>The app records nothing, and 1.0.1-android dropped the first two for that reason (`d4c321f`). `RECORD_AUDIO` would put the microphone on the Play listing and into the Data safety form.<br>There's no media-playback foreground service (`enableBackgroundPlayback: false`). The ads SDK adds `AD_ID` when the manifest is merged, so the APK check confirms the final list. | Blocks build 1 |
| A4 | **Start-up reports from Android would be mislabelled.** On Android `Device.modelId` is null, so the report sends `unknown`. `Platform.Version` is the API level (`36`). The table accepts both (`model = 'unknown'`, `os ~ '^[0-9]{1,3}…'`). So an Android row would look like an iPhone row of an unknown model, and that would muddy the iOS 16.7 crash cross-check ([crash record](2026-11-15-crash-reports-audit.md)). | Blocks build 1, if A1 keeps accounts on |
| A5 | **1.4's and 1.5's screens have never run on Android.** The app targets API 36 (React Native 0.88: `minSdk 24`, `targetSdk 36`, `compileSdk 37`), and on Android 16 edge-to-edge is enforced with no opt-out. AN4's emulator findings were about the 1.3.1 screens, which have since been replaced. Still unchecked:<br>• the system bars;<br>• the back button and predictive back on the sheets;<br>• the notification icon (no `icon` is set for `expo-notifications`, so the status bar may show a white square);<br>• the themed (monochrome) icon. | Unknown until the emulator run |
| A6 | **Notifications.** The daily reminder has its own channel. A phase's end notification (`useNotifications.ts:49`) names none, so it falls into Expo's fallback channel. The manifest has no `SCHEDULE_EXACT_ALARM`, so Android may deliver a date trigger late in Doze. A phase-end notification that arrives minutes late is a real Android difference, to be measured on the emulator.<br>**Measured, 2026-11-25:** the channel worry was wrong, since the notification lands on the app's `timer` channel. The lateness was right: a 1-minute focus alerted 45 s late, at the end of Android's 75 % window. It is DEF-012, fixed with `USE_EXACT_ALARM` (Q5). | Blocks build 1 (DEF-012) |
| A7 | **Already fine:**<br>• `modules/mac-display-awake` is Apple-only, and its JavaScript side uses `requireOptionalNativeModule`, so it does nothing on Android. `IS_MAC` is false.<br>• The Fly guard (`9372403`) keeps Fly off on Android.<br>• API 36 meets Play's rule.<br>• `update.json` says 1.3.1, so Android 1.5.2 sees no update prompt. It stays untouched until Android is in production ([RELEASE.md §3](../process/RELEASE.md#3-release-checklist-ios), step 12). | None |
| A8 | **Versions and signing.**<br>• EAS's Android `versionCode` is 6, from 1.0.1's builds 2, 5 and 6 (2026-01-09). The next production build is 7.<br>• EAS holds the keystore that signed them.<br>• What Play received, and on which track, isn't recorded ([CHANGELOG, 1.0.1-android](../../CHANGELOG.md)).<br>• `eas.json` has no Android `submit` entry, so build 1 is uploaded by hand in Play Console. | Owner's facts, §7 |

## 3. The plan

### Stage 0 — Play Console, the owner's, starting now and alongside the code

None of this waits on a build, and all of it is the owner's: every form, upload, invitation and submission in Play Console.

- **Create the closed test** and its testers list. A Google Group is easiest to grow; an email list also works.
  - Recruit **15–20** testers, not exactly 12. Anyone who leaves during the 14 days no longer counts (§4).
  - Tell testers to stay opted in for the whole 14 days.
- **Fill in App content:**
  - privacy policy URL;
  - app access;
  - ads ("contains ads": yes);
  - content rating;
  - target audience (not children);
  - Data safety;
  - the government, financial and health declarations (none apply).
  The answers depend on §7's Q1. Once it's answered, this record gets a fill-in sheet drafted from [`privacy-policy.md`](../../privacy-policy.md) and Google's own disclosure for the ads SDK.
- **The store listing** in English and Turkish: short and full description, 512 px icon, 1024×500 feature graphic, and phone screenshots.
  - The iPhone set can't be reused: it shows Fly and the Apple button, which Android doesn't have.
  - An Android set comes from the emulator once build 1 runs.

### Stage 1 — build 1's contents (code)

Only what build 1 can't go without.

1. **Accounts on Android, by Q1.** The recommended answer: off on Android for build 1, in the same way as Fly.
   - `isPairingAvailable(os)` in `src/constants/features.ts` is true only on iOS. It replaces the bare `PAIRING_ENABLED` checks wherever a person can reach pairing:
     - the Timer's partner page;
     - the tutorials' pair step;
     - Settings' account rows;
     - partner note intake;
     - start-up reports.
   - iOS behaves exactly as now, and the tests pin it on both platforms.
2. **Ads, by Q2.** The recommended answer: Google's test ids for the whole closed test.
   - Testers tapping real ads can get an AdMob account flagged for invalid traffic.
   - The banner placeholder goes. It becomes Google's test banner id, or the fallback that fires when no id is set.
3. **Permissions.**
   - Set `recordAudioAndroid: false` on `expo-audio`.
   - Add `android.blockedPermissions` for `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`.
   - `MODIFY_AUDIO_SETTINGS` stays: it's a normal permission that `expo-audio` uses for audio focus, and it needs no declaration.
4. **An EAS preview build (APK) with the owner's go-ahead**, first of `master` as it is (Q3), then of Stage 1's changes. Each runs on the emulator (`C:\Android`, AVD `vp_api35`, Android 15). An Android 16 (API 36) image is added if the SDK manager can fetch one.
   - Check every screen in light and dark, in English and Turkish.
   - Check the sheets and the back button, the timer through a phase end with the app in the background, notifications, the tutorials, and the Stats banner.
   - **Fixed in build 1:** anything that crashes, hides content or puts a control out of reach.
   - **Left for Stage 3:** cosmetic findings (AN4).
5. **Version.** It stays **1.5.2**, as versionName, which matches iOS. The versionCode, 7, comes from EAS. A closed-test build is tagged `v1.5.2-ct.<versionCode>` (Q4).

### Stage 2 — build 1 on the closed track

1. **An EAS production build (AAB), with the owner's go-ahead.** `eas build --platform android --profile production`.
2. **Check the AAB before the upload**, with the SDK's `apkanalyzer`:
   - `targetSdkVersion` 36;
   - the final permission list;
   - no foreground-service types;
   - native libraries aligned for 16 KB pages. Google announced this rule for new apps and updates targeting Android 15 and later from 1 November 2025; the help pages read in §1 don't mention it, so the check runs either way.
3. **The owner uploads the AAB** to the closed track and publishes it. Testers opt in.
   - **Day 0** is the day the twelfth tester is opted in.
   - The tag goes on the build's commit, named in the build ask.

### Stage 3 — during the 14 days (updates to the closed track)

Each update is its own pull request, build and upload, and each is named in the production-access application.

- **Pairing on Android**, if Q1 says so. Sign in with Google:
  - an Android OAuth client with the Play app-signing and upload SHA-1s, plus a web client for Supabase;
  - Supabase's Google provider;
  - `signInWithIdToken({ provider: 'google' })`;
  - Google identities in `delete-account`;
  - the invite link chosen by platform;
  - the privacy policy and Data safety updated.
  An iPhone and an Android phone can pair, because pairing is on the server.
- **AN4's layout findings** from Stage 1.
- **Real AdMob ids (AN5)**, in the last update before production, if the owner wants revenue from day one.
- **Tester feedback.** One channel, such as the Google Group or a short form, and a log of what changed because of it. The application asks for both.

### Stage 4 — production (AN6)

1. **The owner applies for production access** once 12 or more testers have been opted in for 14 days.
2. **A staged rollout:** a percentage first, then a full release.
3. **After the release:**
   - `update.json`'s `latestVersion` (owner's go-ahead);
   - the tag `v1.5.2-android` (RELEASE §5, step 8; the `-ct.N` tags mark the closed-test builds);
   - CHANGELOG;
   - the roadmap's Android track closed;
   - `PRODUCT.md`'s platform back to `adaptive`;
   - ADR-0037 superseded.

## 4. Mathematical / Statistical Details

**When production access opens.** Let tester *i*'s current, unbroken opt-in begin on day *tᵢ*.

On day *D* the condition holds when at least 12 testers are still opted in with *tᵢ* ≤ *D* − 14. So the earliest day to apply is the twelfth-earliest *tᵢ* among the testers who stay, plus 14 days.

**Why recruit more than 12.** Suppose each tester independently leaves during the 14 days with probability *p*. The number who stay, *X*, is binomial: *X* ~ Bin(*n*, 1 − *p*). The test passes on time when *X* ≥ 12.

With an illustrative *p* = 0.1 (an assumption, not a measurement):

| Recruited *n* | P(*X* ≥ 12) |
|---|---|
| 12 | 0.9¹² ≈ 0.28 |
| 15 | 0.9¹⁵ + 15·0.9¹⁴·0.1 + 105·0.9¹³·0.01 + 455·0.9¹²·0.001 ≈ 0.94 |
| 20 | ≈ 0.9999 |

If a tester drops out, the fix is to add a replacement at once. But that tester's 14 days start on the day they join, so a drop-out late in the test pushes the date back by as many days as have passed.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one (recommended; Q1–Q4 decide) |
|----------|------------------------|--------------|
| Accounts off on Android in build 1, Google sign-in during the 14 days | Google sign-in before build 1; Apple's web sign-in on Android; Android solo-only until a later version | Starts the clock days sooner. Sign-in needs OAuth clients that depend on Play's signing certificate, a Supabase provider, a second path in `delete-account` and new privacy text, and none of that can be tested before an Android build exists. Apple's web flow on Android is unusual for Android users and needs an Apple Services ID. |
| Test ads for the closed test | Real Android ids from build 1 | Protects the AdMob account from testers' taps. Real ids come in the last update before production. |
| A platform gate, like Fly | Turning `PAIRING_ENABLED` off | The flag would turn pairing off on iOS too. The gate is the pattern ADR-0037 already uses, and tests pin both platforms. |
| Version 1.5.2 | 1.5.3 | The app code is 1.5.2's. The Android-only changes do nothing on iOS, and the next iOS version carries them. |
| Upload build 1 by hand | `eas submit` with a Google service account | No new credential. Google's API also needs one manual upload for each app before it accepts any; `eas submit` can follow later. |

## 6. Verification

**This plan:**
- [x] The audit's findings are traced to files and lines (§2). The introspected manifest, the libraries' module configs, and EAS's version counter (`eas build:version:get`: 6) were read on 2026-11-25.

**Each stage, once approved:**
- [x] Stage 1. `npm run typecheck`, `npm run lint` (0 errors), the contrast check, the docs check and Jest pass: 100 suites, 1010 tests ([build 1's record, §6](2026-11-25-android-build1.md#6-verification)). The tests that pin Android are:
  - `features.test.ts`: `isPairingAvailable` on each platform. An Android launch has pairing and the reports off, the general tutorial without its pair step, and no 1.5 tutorial. The Timer, Settings rows and `startPaired` all read that same flag, and the existing `PAIRING_ENABLED: false` suites cover their off path;
  - `settingsAndroid.test.tsx`: Settings with pairing, reports and Fly off;
  - `appConfig.test.ts`, `adConfig.test.ts`, `platformKey.test.ts`, `timeRowAndroid.test.tsx` and `useTabPageHeight.test.tsx`.
- [x] Stage 1, on the emulator: preview `a5522c6f` (`master`) and preview `0e4206bd` (build 1), installed clean. Screenshots are under `C:\Android\devicecheck\2026-11-25-v152\` ([build 1's record, §6.2](2026-11-25-android-build1.md#62-the-second-preview-build-0e4206bd-installed-clean-on-the-emulator)). A third preview build checks DEF-013 and the landscape height.
- [ ] Stage 2, on the AAB. `apkanalyzer` needs the SDK's build-tools, which aren't installed, so:
  - `node scripts/android/check-16k.mjs <aab>` exits 0;
  - the manifest's `targetSdk` and permissions come from `adb shell dumpsys package` on the preview APK of the same commit.
- [ ] Stage 2, the owner: the closed track shows build 7 as published, and the opt-in link works for a tester.
- [ ] Stage 4: Play Console says production access is granted.

## 7. Open questions for the owner

| # | Question | Recommended |
|---|----------|-------------|
| Q1 | Pairing, the partner's day and notes on Android: off in build 1 with Google sign-in during the test; Google sign-in before build 1; or off on Android for now | Off in build 1, Google sign-in during the test |
| Q2 | Ads during the closed test: Google's test ids, or real Android ids now | Test ids |
| Q3 | Go-ahead for an EAS Android preview build (APK) of `master` as it is, now, for the emulator run, so its findings come in while Stage 1's code is written. A second preview build then checks Stage 1's changes | Yes, now |
| Q4 | The tag for a closed-test build: `v1.5.2-ct.<versionCode>`, after `-tf.N` | `v1.5.2-ct.7` |
| Q5 | (Asked after the emulator run.) The session alerts' exact alarms on Android: `USE_EXACT_ALARM` with a Play declaration; `SCHEDULE_EXACT_ALARM` with a prompt; or later, in an update | `USE_EXACT_ALARM` |

**The owner's answers, 2026-11-25:**
- **Q1:** off in build 1, Google sign-in later.
- **Q2:** test ads.
- **Q3:** yes, build now. That gave EAS preview `a5522c6f`.
- **Q5:** `USE_EXACT_ALARM`.
- **Q4** was answered on 2026-11-26: `v1.5.2-ct.7`, on `8160119`, build 1's commit.
- Asked about Play Console, the owner answered with the package name `com.bengisu.valentinepomodoro`, which this record reads as "the app exists there". Its tracks and signing are still to be confirmed.

**Facts only Play Console has.** They were read in the owner's Play Console on 2026-11-26, at the owner's request, without changing anything:
- **The app exists.** `com.bengisu.valentinepomodoro` is on a personal developer account, with nothing in production.
- **Each versionCode's track:**
  - **2** (1.0.1) is on the internal test track, from 2026-01-09.
  - **5** (1.0.1) is inactive.
  - **6** (1.0.1) is on the closed track "Alpha". Its release is named "6 (1.0.2)", it was rolled out on 2026-01-10, and it covers 178 of 178 countries.
  - The highest is 6, so build 1's 7 is free.
- **Play App Signing is on.** The upload key's certificate in Play Console matches the one that signed `ValentinePomodoro-1.5.2-7.aab`:
  - SHA-1 `18:93:11:0E:6F:57:32:88:E4:D2:7A:96:C5:DA:DE:9C:B0:EF:0F:43`;
  - SHA-256 `0E:C8:B4:6B:59:7D:0F:04:6E:F2:AE:CD:67:FE:97:3F:B1:3C:AB:0F:C9:7A:81:33:11:B9:3C:42:B4:C1:6B:B6`.
  - On the AAB's side, `keytool -printcert -jarfile` read them. That's EAS's keystore, made 2026-01-09.
  - Play signs what it delivers with its own app-signing key (SHA-256 `DB:47:EC:CE:…:F6:19`).
- **The closed track "Alpha" exists and is active.** Build 1 goes there as a new release, and no new track is needed.
- **The dashboard's steps for production access:**
  - "Publish a closed test release" is done, by versionCode 6 in January.
  - "At least 12 testers opted in": 2 are opted in.
  - The 14 days haven't started.
- **Testers:** the track's only tester list is the email list "Team (Expo)", with 2 addresses.
  - The testers the owner gathered aren't on it yet. They need adding, to that list or to a new one, or through a Google Group, before the opt-in link means anything to them.
  - The feedback URL or email is empty.
  - Whether every tester has a Google account is the owner's to confirm.

## 8. Related Docs

- [ADR-0037: iOS first; Android deferred until the Play closed test](../architecture/adr/0037-ios-first-android-deferred.md)
- [Phase 1 plan §3b: AN0–AN6](2026-10-29-phase1-plan.md#3b-deferred-android-after-v14)
- [Roadmap, Android track](../roadmap/ROADMAP.md#android-track--in-progress)
- [RELEASE.md §5, Android](../process/RELEASE.md#5-android)
- [Hide Fly Mode where it can't open](2026-10-29-android-hide-fly-mode.md) · [R8 launch crash](2026-10-29-android-r8-workmanager-crash.md)
- [Phase 2 plan](2026-11-05-phase2-plan.md) (accounts and pairing) · [F4, the App Store listing](2026-11-06-phase2-f4-listing.md)
- [Crash reports audit](2026-11-15-crash-reports-audit.md) (start-up reports cross-check)
