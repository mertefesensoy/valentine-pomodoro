# Changelog

All notable changes to Valentine Pomodoro, newest first, in [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) format with [Semantic Versioning](https://semver.org/spec/v2.0.0.html): each version is its annotated git tag, dated by the EAS production build (UTC) the tag points at; the italic line under each heading gives the build number, the source commit and what is known about its release; `-android` marks the Android build and `-tf.N` a TestFlight pre-release; short SHAs in parentheses are the commits behind each bullet.

## [Unreleased]

*Nothing since 1.4.0.*

## [1.4.0] - 2026-11-02

*The iOS release of the v2 rehaul's Phase 1, from `rehaul/v2`. The release candidate is TestFlight build 59; this section is dated by its EAS production build (UTC), as every version here is. Android stays on 1.3.1 (iOS-first, below).*

**What's new for you**

- **Pomo & Doro**, the two little faces of your timer, show you around on your first visit and take turns explaining each screen in their own babble. Settings › About › Watch the tour again replays it.
- **A new look, the Sticker Diary:** Strawberry Milk by day and Midnight Plum by night, following your iPhone, with a new app icon.
- **Pick a length in one tap:** 25/5, 50/10, 90/20, or Custom with your own durations.
- **Two timer layouts:** the Ring, or Facing Pages.
- **Every focus you finish presses a sticker onto today's page**, toward a daily goal you set.
- **Stats is a stack of postcards,** one per day, switchable between sessions and minutes, with your goal and your love streak.
- **Love notes:** write your own, edit them in a full-height sheet, swipe to delete; restoring the defaults never removes yours.
- **English and Turkish** throughout, with a language choice in Settings.
- **Soft sounds** when a focus or a break starts and when you finish, which respect the silent switch and the Sound switch.
- **Settings** is a native list, with every number set on a wheel.
- Fly over the map as before. Everything you had in 1.3 comes with you.

**The engineering record**, by theme, follows.

*TestFlight builds 42–58 were cut on the way, each listed below with its source and device check: 42–47 from `rehaul/v2`, 48–58 from `phase1/stage-d`, which merged into `rehaul/v2` on 2026-11-02 (`96ce9dd`).*

The v2 rehaul's Phase 1. Each bullet names its theme: Phase 0 (the foundation), SDK 58, CNG, Android, iOS-first, Stage A (the Phase 1 safety nets), Stage B (the first Phase 1 changes), Docs (the 2026-10-30 documentation system and what followed it), Design (the design-skill stack), Brand (the brand kit), Licence and Stage D (the Phase 1 screens, D1–D5).

### Added

- **Brand:** The brand kit in `brand/`: the Same Page mark, the horizontal and stacked lockups, the app icon, Pomo & Doro, the web set and a guide, in SVG, PNG, PDF and EPS, drawn and checked by `brand/tools/` (a fresh build matches byte for byte); the colour mark became strawberry pages in a cocoa cover, the light splash with it (3156640).
- **Licence:** The repository is licensed FSL-1.1-ALv2, the brand files CC BY-ND 4.0, and the names and marks are covered by a trademark policy (`LICENSE.md`, `TRADEMARKS.md`).
- Design system (Phase 1 Stage C): Strawberry Milk and Midnight Plum themes with a contrast gate in CI; Baloo 2 chosen for the timer and headings; the Same Page mark, Pomo & Doro, 50 custom icons, a new iOS app icon (light, dark, tinted) and splash, and an identity sheet. No tomato anywhere in the design.
- **Stage D:** Classic rebuilt in the Sticker Diary design (Phase 1 D1): the Strawberry Milk and Midnight Plum themes, Baloo 2 with steady timer digits, The Ring and Facing Pages layouts, presets (25/5, 50/10, 90/20 and Custom), today's stickers with the sticker placement, the love note as a sheet, a mode sheet, the custom tab icons, a one-time welcome where Pomo & Doro become the Same Page mark, and English and Turkish groundwork.
- **Stage D:** Love notes: tap to edit in a full-height sheet, swipe or long-press to delete, a 280-character limit, and restoring the defaults never removes your own notes (D2).
- **Stage D:** Every screen, notification and alert in English and Turkish, and a Language choice in Settings (D3).
- **Stage D:** D4, the app's sounds, synthesised in SoundCraft 0.14 from its built-in synths: focus start, break start and completion (0.85–1.1 s and 10.9–13.7 KB each, mono AAC at a −1 dBFS peak, within 0.4 LU of each other), rebuilt byte for byte by `scripts/sound/build.mjs --check`; Fly's ambient loop re-encoded as mono AAC at 64 kbit/s and made seamless, so it no longer drops out and clicks every 70 s (its leading silence and fade-in trimmed, its end crossfaded into its start), 1.19 MB → 549 KB (a739f93, merged as 362b930). Classic plays the three sounds, which respect the silent switch and Settings › Sound and mix with your music (0e70b1a); the session-end and daily-reminder notifications carry the system's sound (d6d3009).
- **Stage D:** A tutorial with Pomo & Doro, who take turns showing you around (D5).
- **Phase 0:** A test harness (Jest, React Native Testing Library and Reassure) with 25 tests in 5 suites: the Pomodoro phase cycle (a long break after every 4th focus; skips don't count), the session clock (1 Hz countdown, pause and resume, completion fired exactly once, cold-start completion, two-slot preservation), the timer text ticking through `AppProvider`, worklet-versus-JS flight-path equivalence, and a Stats regression test; plus a Reassure render-count baseline (abc77ef, 70cfd8d).
- **Phase 0:** GitHub Actions CI on pushes to `master`, `rehaul/**` and `release/**` and on every pull request: typecheck, lint and unit tests, plus a Reassure render comparison on pull requests (9a24a62). After the first run, lint runs uncached, and `import/namespace` is off for TypeScript files, which `tsc` already checks (6708f03).
- **Phase 0:** Recorded baselines for lint, expo-doctor and the website's Lighthouse scores (993a51e); the v2 couples rehaul plan and the implementation-doc template (61054cd); `PRODUCT.md` and a seed `DESIGN.md` with the kawaii "Sticker Diary" direction pinned (67f0525); the Impeccable 4.8.0 and Emil Kowalski animation skills at project scope (ece7280).
- **Phase 0:** `privacy-policy.md`, written on `origin/master` on 2026-01-08 and merged when `master` became the trunk again (79c5675, fda4fef).
- **SDK 58:** An EAS `preview-simulator` profile that compiles the iOS app without device credentials (e88fd65).
- **Stage A:** The Phase 1 (v1.4) plan, approved by the owner on 2026-10-29, which puts every risky change behind a gate that already exists and has been seen to fail (334acaf, 2808f08, 9dc9885), and the decision that SoundCraft makes every app sound (bddcd20).
- **Stage A:** A1, timer guards on the real `TimerScreen` in Classic and in Fly mode (Istanbul → Lublin, a 25-minute flight). They drive the screen only through the UI, and all three timer guards fail when the clock's tick is removed (82317d3).
- **Stage A:** A2, Reassure baselines for the Timer, Stats, Settings and Notes screens and a `TimerText`-sized leaf. The counts were identical over three runs: 14 renders each over a 10-second session, 15 for Settings because `KeyboardAvoidingView` adds one commit at mount (8e211a9, 9f82c7f).
- **Stage A:** A3, typed fixtures of everything a v1.3.1 install keeps in AsyncStorage (all 13 keys), plus a fresh install, never-edited notes, a torn `session_clock` write and a 1.0.0-era stats-v1 user, each checked against the readers that ship today (57ebc65). Stage A is written up in fd96c12.
- **Stage A:** The A0 device check passed on a physical iPhone with TestFlight build 42 (v1.4.0), owner-reported: data from the App Store 1.3.1 install survived the update, and launch, the tabs, a focus/break cycle with notifications, Stats after a cold start, Fly Mode with tier-1 airports (including reset and re-pick), the interstitial, dark mode and landscape all passed (73aa110, 33036e4, 229298d).
- **Stage B:** `scripts/startup-modules.js`, which counts the modules a cold start evaluates, from a Metro export (5b10a78).
- **Stage B:** `scripts/react-compiler-report.js`, which counts the functions the React Compiler compiles and skips, with each skip's reason, and the files whose worklet count it changes (10811ce, f11082d).
- **Stage B:** B7, a start-up probe for measuring cold-start time-to-interactive on an iPhone without a Mac: timestamps from the JS bundle's start to the first layout and the first idle moment, and a hidden panel (a 1.5 s long-press on Settings → About's credit line) with a before/after switch, each arm's median and spread, and a share button. It stores nothing until the panel is opened (6ab3953, c4c6ab5).
- **Stage B:** Tests with each change: the runtime airport table (0d63145); storage, and the migration over every A3 fixture (dd1e894); store hydration, stats and Fly credit, and the cold-start completions behind DEF-004 (71d836f, e04cc8c); the tab haptic (ca21ef0); the clock store, its math and `<TimerText>` (b7461f1); the ring's SharedValues (43cf1a8); Timer's single commit on start (b838ebe); that Jest compiles with the React Compiler (10811ce); Classic's overlay order (630c35a); the router over the real `app/` tree: deep links, tabs that never hide and the held overlays (since the fix, 1fc37d8), the tab haptic, the notification tap and the splash (65fa2ea); and the start-up scheduler, probe and panel, ad readiness after the deferred start, and the deferred update check (6ab3953, 8c6bf3d, c4c6ab5, e0e8f26); the tabs' pre-render order and the banner's status (1fc37d8, 16a6752, 1865f75). Jest runs 134 tests in 26 suites at B5, 197 in 33 with B6 and B7 merged, and 216 in 35 with the B6 fix and the Settings keyboard fix (DEF-008) merged.
- **Design:** The design-skill stack and its per-screen workflow ([DESIGN-WORKFLOW](docs/process/DESIGN-WORKFLOW.md), [ADR-0042](docs/architecture/adr/0042-design-skill-stack.md)): the rest of Emil Kowalski's skills beside Impeccable, with his `apple-design` renamed `emil-apple-design`, and dickwu's Apple HIG reviewer, which is installed locally and git-ignored because it bundles Apple's copyrighted text (5292199, 10adac0).
- **Docs:** An [evaluation of xtool](docs/proposals/xtool-evaluation.md) against Expo/EAS. xtool can't build this app, and its build path breaches Apple's Xcode licence on a non-Mac; the owner decided to stay on Expo (7c7e66e).
- **Docs:** The documentation system (2026-10-30):
  - an [SRS](docs/srs/SRS.md) with stable requirement IDs, plus the [architecture](docs/architecture/ARCHITECTURE.md) and [ADRs](docs/architecture/adr/README.md)
  - the [roadmap](docs/roadmap/ROADMAP.md) and the [test strategy](docs/testing/TEST-STRATEGY.md)
  - the process docs ([branching](docs/process/BRANCHING.md), [release](docs/process/RELEASE.md), [conventions](docs/process/DOCS.md)) and [CONTRIBUTING.md](CONTRIBUTING.md)
  - this changelog, and a [documentation map](docs/README.md)
  - `scripts/docs/check-docs.mjs`, which checks links and IDs and generates backlinks and the [traceability matrix](docs/testing/TRACEABILITY.md), run as a non-blocking CI step (dca725c)
  - annotated tags for every EAS-built version (`v1.0.0`–`v1.3.1`, `v1.0.1-android`, `v1.4.0-tf.42`), each at the commit of that version's last finished production build, and two `archive/*` tags preserving the only commits never merged to `master`; since then, one for each TestFlight build (`v1.4.0-tf.43`–`v1.4.0-tf.45`) at its build's source commit

### Changed

- **Phase 0:** `master` is the trunk again: it was fast-forwarded to the release branch and merged with `origin/master` (fda4fef). `npm ci` works again, because the lockfile gained its missing optional platform bindings (730568c). `expo-application`, which the update check imports, is now declared (b79085a).
- **SDK 58:** Expo SDK 54 → 58, one SDK per step with typecheck, lint, tests and an iOS and Android export green after each (470d621, c7135f3, b12220f, c051c9a), after SDK 54's own patch updates (1c73500). The app now runs React 19.3.0, React Native 0.88.1 (New Architecture only, Hermes v1), Reanimated 4.7.1 with Worklets 0.13.0, Gesture Handler 3.3.0, react-native-maps 1.29.11 and TypeScript 6.0.3. Google Mobile Ads stays on 16.x (16.5.0) until the ad code is rewritten in Phase 5.
- **SDK 58:** The minimum iOS version is now 16.4, an Expo platform floor from SDK 56, so iPhone 6s, 7 and the first-generation SE can no longer install updates (c7135f3, 622a7f4).
- **SDK 58:** The local react-native-maps patch was re-cut for each maps release. On 1.29.11 it keeps only the guard on removing a subview, because upstream now ships the insert guard (470d621, c051c9a). The JS bytecode grew about 19 % across the upgrade (622a7f4).
- **CNG:** Native projects are generated from `app.json` at build time instead of being committed (f4bdd2e). The committed `android/` folder was a February prebuild that EAS never resynced, so Android builds had kept reporting versionName 1.2.4 and ignoring later `app.json` changes; the first SDK 58 APK reports 1.3.1 (5767c59).
- **Android:** Fly Mode is hidden where it can't open (Android and web). `isFlyModeAvailable()` is true only on iOS, a saved `fly` mode falls back to Classic, and the mode switcher is hidden there (9372403). On Android, opening Fly crashed for lack of a Google Maps API key, and the saved mode turned that into a crash on every later launch; no store build had Fly Mode on Android.
- **iOS-first:** v1.4 ships to iOS only (5da66f4). Android is deferred until the account can run Google Play's closed test (at least 12 testers for 14 consecutive days); this replaces the earlier plan to bring Fly Mode to Android in v1.4 with a Maps key (9dc9885), and corrects the record that Android 1.0.1 was in production on Google Play.
- **iOS-first:** The app version is 1.4.0 for every TestFlight build of the rehaul, because App Store Connect closes a released version to new uploads (a12ced4), and `ascAppId` is set so `eas submit` runs without prompting (a290d67).
- **Stage B:** B1, Fly Mode loads lazily. `TimerScreen` loads `FlyModeScreen` with `React.lazy` and `Suspense`, so Fly Mode, react-native-maps, expo-audio and the 648 KB airport JSON are evaluated on the first switch to Fly instead of at every cold start: 1,799 → 1,745 modules evaluated at an iOS cold start, 56 deferred. The bundle size is unchanged by B1 itself; B1b moves the airport data out (5b10a78). The device check passed on TestFlight build 43.
- **Stage B:** B1b, the 648 KB airport table ships as a bundled asset (`airports.jsonasset`) instead of being compiled into the Hermes bytecode. It is read with `expo-asset` and `expo-file-system` the first time Fly opens, then kept in memory. iOS bytecode 3,856,660 → 3,403,356 B (−11.75 %), Android 3,945,024 → 3,491,384 B (−11.50 %); the assets grow by the file's 648,483 B (0d63145). The device check passed on TestFlight build 43.
- **Stage B:** B2, app storage moves from AsyncStorage to MMKV (`react-native-mmkv` 4.3.2 with `react-native-nitro-modules` 0.37.1). On the first launch a one-time migration copies every AsyncStorage key and writes its done flag last, so a crash part-way re-runs to the same result; AsyncStorage stays untouched for one release as the fallback. An existing install with no saved love notes gets the v1.3.1 notes written explicitly, so a later change to the defaults can't replace the notes it shows today. The iOS bytecode is 3,430,632 B after it (dd1e894). The device check passed on TestFlight build 43, but B2 also made DEF-004 happen every time (see Fixed).
- **Stage B:** B3, app state moves into Zustand stores (settings, notes, stats, the session clock and UI) that hydrate synchronously from MMKV in a `StoreGate`, so the first frame shows stored values and Stats and Notes no longer show "Loading…". Every screen reads them through selectors, and `AppContext` is deleted (71d836f, ca21ef0). In the Reassure scenario where only a setting changes during a session, renders drop from 14 to 1. The device check passed on TestFlight build 44.
- **Stage B:** B4, the re-render refactor. A clock store emits once per displayed second, and only the `<TimerText>` leaf subscribes to it (b7461f1). The progress ring and Fly read SharedValues on the UI thread instead of re-rendering React (43cf1a8). The 1 Hz tick chain is gone, and the clock store's scheduler completes sessions (e9df252). Hidden tabs are frozen (040ad32), and starting a session on Timer commits once, not twice (b838ebe). One change you can see: a love note, goal popup or interstitial that comes due while another tab is showing now appears when you return to Timer. Before, the goal popup could dismiss itself unseen, and with love notes off the interstitial could open over Stats. The device check passed on TestFlight build 45.
- **Stage B:** B5, the React Compiler is on (6395aee), after its 94 rule findings were fixed and the five `react-hooks` compiler rules went back to `error` (7a849b3). Jest now compiles app code exactly when `app.json` turns the compiler on, through `jest.babelTransformer.js`, because jest-expo never tells Babel the compiler is supported (10811ce; [ADR-0041](docs/architecture/adr/0041-react-compiler-on.md)). Render counts are unchanged from B4. The iOS bytecode is 3,463,508 B, +0.96 % over B2 for B3–B5 together and still 10.2 % under the SDK 58 baseline (758881b). The device check passed on TestFlight build 45.
- **Stage B:** B6, navigation moves to Expo Router 58 with the iOS native tab bar (a736b22; [ADR-0043](docs/architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md)). The routes live in `app/`: Timer at `/`, then `/stats`, `/settings` and `/notes`, and `valentinepomodoro://` links open each tab. The blurred tab bar is gone (the system draws its own), and the tab haptic still follows the Haptics setting. Tabs are still loaded only when first opened or once start-up has gone idle, and since the fix for build 46 they are never frozen (1fc37d8). The iOS bytecode is 3,894,148 B, 37,940 B over the SDK 58 baseline because of the router, and 3,912,916 B with B7; the owner accepted the overage until E3 (NFR-PERF-002). New native code: Expo Router's iOS module, `expo-glass-effect` and `@react-native-masked-view/masked-view`.
- **Stage B:** B7, the Google Mobile Ads start and the launch's update check run after the first frame, in one idle callback, instead of during the first render. The interstitial is still loaded long before the 2nd completed session, and "Check for updates" works at once (8c6bf3d).
- **Stage D:** Settings is a native grouped list: numbers are set on a wheel, never typed, and light or dark follows your iPhone (D2).
- **Stage D:** Stats shows your week as a stack of day postcards, today in front, with your goal and love streak (D2).
- **Stage D:** New installs get new default love notes, in English or Turkish (D2).
- **Docs:** In a checkout that several sessions share, commits name their paths (`git commit -- <paths>`), so one session can't commit files another has staged (17639cd).

### Fixed

- **Phase 0:** The Stats tab could crash with "Rendered more hooks than during the previous render" when opened before stats finished loading. Every hook now runs before the loading return (70cfd8d).
- **Phase 0:** Android and web showed no tab-bar icons, because the icon mapping still held the template's symbols. Any unmapped symbol now fails the type check (0c99c0b).
- **Android:** The SDK 58 Android release build crashed about 3 seconds after every launch: R8 had removed the no-argument constructor that Room calls by reflection to open WorkManager's database. R8 keep rules for every `RoomDatabase` and WorkManager `InputMerger` subclass are now written through `expo-build-properties` (c70afd9), and a new build launches cleanly on the emulator (56857f6). The crash never reached a store build.
- **Stage B:** DEF-004: a Pomodoro or a flight that ended while the app was killed was cleared on relaunch, with no credit. In 1.3.1 it was a race; B2's faster storage load made it happen every time, so TestFlight build 43 has it. Completions now wait for a handler of their kind (e04cc8c), confirmed by build 44's device check.
- **Stage B:** Fly Mode credited its minutes without the session's start day or id, so a flight across midnight counted on the wrong day and a replayed completion wasn't de-duplicated (DEF-001). The streak's "yesterday" came from the current date, not the credited day, so a goal reached by a session that crossed midnight could reset the streak to 1 (DEF-003) (7863e50).
- **Stage B:** The stats de-duplication key wasn't restored on load, so it only protected within one run (DEF-002, 71d836f). The tab bar's haptic ignored the Haptics setting (DEF-007, ca21ef0); the Sound setting still has no effect until sounds arrive in D4.
- **Stage B:** TestFlight build 46 flickered on every tab switch, and could turn the tab bar dark on Notes: the native tab bar shows a tab before JavaScript unfreezes it. Tabs are no longer frozen; a hidden Timer holds its celebration, love note and interstitial until it is shown again, as before (1fc37d8). The Stats banner now loads only once Stats has been opened, and B7's hidden panel shows its load result, since build 46 showed no banner (16a6752, 1865f75; DEF-009).
- **iOS-first:** On iPhone, the Settings number fields (the durations, "Long break every N sessions" and the custom goal) opened a number pad with no way to close it, a bug since v1 (DEF-008). A "Done" bar now sits above the number pad, and scrolling the list also closes the keyboard; either way the field's value is applied, as before.

### Removed

- **Phase 0:** Dead template code and assets: the unregistered Home and Explore screens and everything only they used, the unused `WaveLines`, the unused `src/assets/images` set, the SpaceMono font and the first-render gate that waited for it, and `reset-project.js`; and the unused packages `geolib`, `expo-image`, `expo-status-bar` and `expo-web-browser` (b79085a).
- **CNG:** The committed `android/` folder; `/android` and `/ios` are now git-ignored (f4bdd2e).
- **SDK 58:** `newArchEnabled` from `app.json`, since SDK 55 runs the New Architecture only (470d621).
- **Stage B:** `src/navigation/`, `HapticTab`, the blurred `TabBarBackground`, and the `@react-navigation/bottom-tabs`, `elements`, `native-stack` and `native` packages, which Expo Router replaces (a736b22).
- **Stage D:** The first-launch gift screen is gone; the welcome is the only first-run screen, and the app's origin is in Settings › About (D2).
- **Docs:** All eight old `release/*` branches, deleted after each tip was confirmed reachable from `master` or a tag. GitHub Pages moved from `release/ios-1.1.0:/docs` to a new `gh-pages` branch, and the live `update.json` went from `latestVersion` 1.0.2 to 1.3.1. That revives the update prompt for users on 1.0.3–1.3.0. (Not commits; repository changes made on 2026-10-30.)

### Security

- **Phase 0:** `nanoid` 3.3.11 → 3.3.20, the only package with an `npm audit` advisory that ships in the app bundle. React Navigation uses it for fixed-size keys, so its advisories couldn't be triggered here (65c1d34). After the SDK 58 upgrade, `npm audit` reports 16 advisories, down from 39; the three high-severity ones come from `zod` inside `@expo/cli`, build tooling that contributes no code to the app (befaf99).

## [1.4.0-tf.58] - 2026-11-01

*iOS TestFlight build 58, a pre-release and not a store release, source 03e86ea. Built with EAS (build 0bdc6591) and uploaded to App Store Connect for TestFlight (submission 2162c61d); device check on a physical iPhone, 2026-11-01: passed, visual and sound, as reported by the owner.*

Its changes are listed under [1.4.0]. This build is build 57 with the fix from its device check: the tour keeps clear of Stats' ad banner, and its Stats step lights today's postcard (D5 record §3.12).

## [1.4.0-tf.57] - 2026-11-01

*iOS TestFlight build 57, a pre-release and not a store release, source 38b9f51. Built with EAS (build 3fabdef6) and uploaded to App Store Connect for TestFlight (submission da7cb4ee); device check on a physical iPhone, 2026-11-01: the tour stuck on its Stats step, under the ad banner, fixed in build 58.*

Its changes are listed under [1.4.0]. This build adds D5, the general tutorial: Pomo & Doro show you around in six steps over the real Timer, Stats and Notes (D5 record §3.8–3.11).

## [1.4.0-tf.56] - 2026-11-01

*iOS TestFlight build 56, a pre-release and not a store release, source 95f4d4b. Built with EAS (build dbf1152e) and uploaded to App Store Connect for TestFlight (submission aeb714e8); device check on a physical iPhone, 2026-11-01: passed at the default text size, and the sounds passed, as reported by the owner; the largest text size was seen on build 58.*

Its changes are listed under [1.4.0]. This build adds D3, every string in English and Turkish with Settings › Language, and D4's sounds wired in, with the Ring and Stats' today card resized (D1 record §3.22, D2 record §3.26, D3 record §3.6).

## [1.4.0-tf.55] - 2026-11-01

*iOS TestFlight build 55, a pre-release and not a store release, source 0441d3a. Built with EAS (build 894ddd56) and uploaded to App Store Connect for TestFlight (submission 8550bfd2); built for the finish reviews' captures, which the owner sent on 2026-11-01; D1's and D2's finish reviews returned ship.*

Its changes are listed under [1.4.0]. This build adds D2's finish-review fixes: Stats spans the width in landscape, the Minutes tracks end together, and Notes takes the same column as Stats and Settings on an iPad (D2 record §3.23).

## [1.4.0-tf.54] - 2026-11-01

*iOS TestFlight build 54, a pre-release and not a store release, source e6ff419. Built with EAS (build 46da142f) and uploaded to App Store Connect for TestFlight (submission 152deda0); device check on a physical iPhone, 2026-11-01: passed, as reported by the owner.*

Its changes are listed under [1.4.0]. This build adds build 53's fixes: Classic in landscape spans the width with the face at full height, and a page-coloured band sits under the status bar on the scrolling tabs (D2 record §3.20).

## [1.4.0-tf.53] - 2026-11-01

*iOS TestFlight build 53, a pre-release and not a store release, source 2ba4867. Built with EAS (build 116880a7) and uploaded to App Store Connect for TestFlight (submission 9de50124); device check on a physical iPhone, 2026-11-01: Classic in landscape and the status bar's band, fixed in build 54.*

Its changes are listed under [1.4.0]. This build adds the session notifications' fix (each phase's end message had arrived as the phase began) and build 52's eight device-check nits (D2 record §3.17–3.18).

## [1.4.0-tf.52] - 2026-10-31

*iOS TestFlight build 52, a pre-release and not a store release, source 3f24c41. Built with EAS (build 9222d622) and uploaded to App Store Connect for TestFlight (submission e7baeb2f); device check on a physical iPhone: eight nits and the notifications' timing, fixed in build 53.*

Its changes are listed under [1.4.0]. This build adds build 51's fixes and D2's review round, break-ui fixes and copy review (D2 record §3.11–3.15).

## [1.4.0-tf.51] - 2026-10-31

*iOS TestFlight build 51, a pre-release and not a store release, source d96eb7c. Built with EAS (build 1c2a4c52) and uploaded to App Store Connect for TestFlight (submission f432937f); device check on a physical iPhone: three findings (the Notes rows, Fly's camera button, the goal presets), fixed in build 52.*

Its changes are listed under [1.4.0]. This build adds D1's finish-review fixes and D2: Settings as a native grouped list, the theme following the phone, the gift screen retired, Notes with a full-height editor and Stats as a stack of postcards (D1 record §3.20, D2 record §3.6–3.9).

## [1.4.0-tf.50] - 2026-10-31

*iOS TestFlight build 50, a pre-release and not a store release, source 98f6a1f. Built with EAS (build 5ff314d5) and uploaded to App Store Connect for TestFlight (submission 9a02ba7c); device check on a physical iPhone, 2026-10-31: passed, as reported by the owner.*

Its changes are listed under [1.4.0]. This build moves Fly's Modes button to the top right, where the compass was (D1 record §3.18).

## [1.4.0-tf.49] - 2026-10-31

*iOS TestFlight build 49, a pre-release and not a store release, source 9f0de71. Built with EAS (build 2fe5428c) and uploaded to App Store Connect for TestFlight (submission c2a26f6b); device check on a physical iPhone, 2026-10-31: one finding, Fly's Modes button, fixed in build 50.*

Its changes are listed under [1.4.0]. This build adds the fixes from build 48's device check and the reanimated one-time welcome, with the presets 25/5, 50/10, 90/20 and Custom (D1 record §3.16–3.17).

## [1.4.0-tf.48] - 2026-10-30

*iOS TestFlight build 48, a pre-release and not a store release, source 61fd06e. Built with EAS (build 59a5248c) and uploaded to App Store Connect for TestFlight (submission 72b11e9c); device check on a physical iPhone: five findings, fixed in build 49.*

Its changes are listed under [1.4.0]. This build adds D1: Classic rebuilt in the Sticker Diary design, the one-time v1.4 welcome, the new app icon and splash, and the English and Turkish groundwork (D1 record).

## [1.4.0-tf.47] - 2026-10-30

*iOS TestFlight build 47, a pre-release and not a store release, source 659b352. Built with EAS (build cf42f8a6) and uploaded to App Store Connect for TestFlight (submission f8557f2b); device check on a physical iPhone, 2026-10-30: passed, as reported by the owner. Tab switches no longer flicker, the Notes tab bar stays light, the Stats banner shows again, and the Settings number pad can be closed.*

Its changes are listed under [1.4.0]. This build contains everything there up to 659b352: build 46's, plus the fix for its tab flicker and Stats banner (B6, 63f1db2) and the Settings keyboard fix (DEF-008, b3c16b7).

## [1.4.0-tf.46] - 2026-10-30

*iOS TestFlight build 46, a pre-release and not a store release, source 3369418. Built with EAS (build bf625f5c) and uploaded to App Store Connect for TestFlight (submission a4695d2b); device check on a physical iPhone, 2026-10-30: B7's passed; B6's failed two items. Switching tabs flickers, and the tab bar turns dark on Notes in light mode.*

Its changes are listed under [1.4.0]. This build contains everything there up to 3369418, through B6 and B7.

## [1.4.0-tf.45] - 2026-10-30

*iOS TestFlight build 45, a pre-release and not a store release, source 6eaeb50, whose app code is identical to 758881b. Built with EAS (build 0eb8ca72) and uploaded to App Store Connect for TestFlight (submission 844c25a5); passed the B4 and B5 device check on a physical iPhone (d7f46d2).*

Its changes are listed under [1.4.0]. This build contains everything there up to 6eaeb50, through B5. Only docs came after it.

## [1.4.0-tf.44] - 2026-10-30

*iOS TestFlight build 44, a pre-release and not a store release, source 1e2316b. Built with EAS (build 7fcac2fb) and uploaded to App Store Connect for TestFlight (submission 977f92f0, 1bdcff8); passed its device check on a physical iPhone, including sessions that ended while the app was killed (d3fe740).*

Its changes are listed under [1.4.0]. This build contains everything there up to 1e2316b: B1, B1b, B2 and B3, with DEF-001–004 and DEF-007's haptics fixed. It does not contain B4, B5 or the design-skill stack.

## [1.4.0-tf.43] - 2026-10-29

*iOS TestFlight build 43, a pre-release and not a store release, source 9c5b0ce, whose app code is identical to dd1e894. Built with EAS (build 73ad1446) at 21:43 UTC, already 30 October in local time, and uploaded to App Store Connect for TestFlight (submission b145e4cd, de8d4cb); passed its device check on a physical iPhone (97c48b7). It has DEF-004, found afterwards in B3 (c77037d).*

Its changes are listed under [1.4.0]. This build contains everything there up to 9c5b0ce: B1, B1b and B2. It does not contain B3 or anything after it.

## [1.4.0-tf.42] - 2026-10-29

*iOS TestFlight build 42, a pre-release and not a store release, source a12ced4. Built with EAS and uploaded to App Store Connect for TestFlight (33036e4); passed the A0 device check on a physical iPhone (229298d).*

Its changes are listed under [1.4.0]. This build contains everything there up to a12ced4. It does not contain what came after: the A2 and A3 test baselines, the `ascAppId` setting, and Stage B from B1 on.

## [1.3.1] - 2026-05-05

*iOS build 41 (last of builds 37–41), source c527044. Live on the App Store since 2026-05-11.*

### Added

- The chosen Fly Mode camera mode is remembered (339283f).
- A double tap on the Fly sheet toggles it open and closed (339283f).

### Changed

- Pomodoro and Fly Mode share one session clock with a separate slot for each, replacing the two independent timers that had run side by side, so a paused flight and a Pomodoro session both survive a mode switch (339283f).
- Fly Mode camera: three modes (follow the plane, show the route, and free, entered by panning or rotating the map), cycled with one button, plus the globe/flat map toggle in the sheet header; they replace 1.3.0's camera views (30795d7).
- The plane's position on the map is computed from the session clock on the UI thread, instead of trailing it by up to a second (339283f).
- The Fly sheet has two snap points instead of three; the middle one clipped the controls and hid the timer pill. The sheet keeps its snap across rotation, and its haptics follow the Haptics setting (339283f).
- The update prompt checks on every cold launch, with no 24-hour throttle and no per-version silencing. On iOS it reads the live App Store version through the iTunes Lookup API; Android keeps the self-hosted JSON (e12c84a, 3513282, bcbc3b9).

### Fixed

- On iOS 18 with the New Architecture, the Fly sheet ignored swipes (5954108).
- Resuming a flight after switching modes showed "Start Flight" while the countdown ran unseen, and "Start Flight" then reused the stale remaining time (5954108).
- Fly Mode crashed natively in react-native-maps' AIRMap on iOS, first seen in TestFlight build 39. The app no longer renders null map children (30795d7), a `patch-package` patch adds nil and bounds guards inside AIRMap, and the airport dots wait for `onMapReady` (c527044).

## [1.3.0] - 2026-04-17

*iOS build 36 (last of 8 builds, 27–36), source 7574284. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- Fly Mode, a second way to focus: pick an origin and a destination from a searchable airport list, and the session lasts one-fifth of a realistic flight between them (900 km/h cruise plus 45–75 minutes for taxi, climb and descent, clamped to 5–180 minutes), with the plane animated along the great-circle route on a map (3833511, e1e8264, b82dbed, 9c9699d).
- A mode switcher between Classic and Fly; the last mode is remembered (3833511).
- An ambient cabin sound during flights, with an Ambient Sounds switch under Fly Mode in Settings. It plays with the iPhone's mute switch on and mixes with other audio (3833511, e1e8264).
- A flight in progress is saved when you switch to Classic and restored, paused, when you return; switching to Fly pauses a running Pomodoro (b82dbed).
- A swipeable Fly dashboard, a bottom sheet in portrait and a side panel in landscape, with a floating timer pill when it is collapsed (7574284).

### Changed

- Landscape and iPad: the Timer scrolls instead of clipping and respects safe areas; Settings and Notes keep text inputs above the keyboard; content is capped at 720 points wide on tablets; the Stats banner adapts to the width (7574284).
- The airport picker and the love-note card follow dark mode (6691293).
- Switches on iOS use the white system thumb (3833511).

## [1.2.5] - 2026-03-22

*iOS build 26 (last of builds 21–26), source 3993eb0. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Changed

- The iOS time pickers for the reminder and quiet hours are spinners below their row, closed with a Done button (af009f6).
- The Stats banner is a large banner in its own framed strip (af009f6).
- Switches show a darker thumb when off (080c6a9), and the About credit line spells the developer's name correctly (348ad21).

### Fixed

- Content no longer sits under the tab bar on the Timer, Settings and Notes screens, and the Stats banner sits above it (080c6a9, 348ad21).

### Removed

- The App Tracking Transparency usage description (`NSUserTrackingUsageDescription`) from the iOS Info.plist (3993eb0).

## [1.2.4] - 2026-03-17

*iOS build 20 (last of builds 17–20), source 66d2dcf. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- A banner ad at the bottom of Stats, requesting non-personalized ads (fcbc867).
- An About section in Settings with a link to the developer's website (fcbc867).
- An App Tracking Transparency usage description in the iOS Info.plist (66d2dcf).

### Changed

- iOS ads use the app's own AdMob app and interstitial IDs, with SKAdNetwork identifiers; the Android IDs are still Google's samples (9ef6f20).
- Ads request non-personalized ads only (f588882).
- An interstitial can follow every 2nd completed focus session instead of every 3rd, still at least 2 minutes apart (fcbc867).
- iOS builds use static frameworks, through `expo-build-properties` (9ef6f20).
- The deep-link scheme is `valentinepomodoro://`, replacing the template's `helloworld://` (fcbc867).
- A generated `android/` native project is committed to the repository (f588882).

### Fixed

- The daily reminder uses an explicit daily trigger, and a failed reschedule now switches the reminder off instead of leaving it shown as on (fcbc867).

### Removed

- `expo-tracking-transparency` (f588882).

## [1.2.3] - 2026-02-19

*iOS build 16, source e59f6db. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- Interstitial ads through Google Mobile Ads after completed focus sessions: at most one every 3 sessions and 2 minutes apart, shown only after the goal popup and the love note have closed, with the counters saved across launches (e59f6db). The config committed at this tag still uses Google's sample AdMob app and ad-unit IDs; the app's own iOS IDs arrive in 1.2.4.
- An `app-ads.txt` file (e59f6db).

## [1.2.2] - 2026-02-18

*iOS build 15 (last of builds 14–15), source b5ded38. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Changed

- The animated background is rebuilt as "Premium Calm": slow aurora sheets, six soft bokeh hearts and faint sparkles, and a static gradient when Reduce Motion is on (b5ded38).
- The Stats goal line is drawn with SVG, so the dashed line renders the same on iOS and Android (97a3d2d).
- Expo is updated to ~54.0.33 (97a3d2d).

### Fixed

- The wave-line layer from 1.2.1 is rewritten without Reanimated worklets, and Reanimated's logger is set to warn, to avoid worklet-runtime crashes in release builds (8a20e06); the rebuilt background no longer draws it (b5ded38).
- When scheduling a reminder fails, the switched-off state is now saved too (b5ded38).

## [1.2.1] - 2026-02-18

*iOS build 13, source b824bbc. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- Animated wave lines, a subtle contour layer in the background (398d488).

### Changed

- The Stats chart shows one dashed goal line across the chart instead of a marker per day (398d488).

### Fixed

- The goal-reached popup and the love-note card no longer overlap: a love note that arrives during the popup is queued and shown afterwards (398d488).
- The daily-reminder switch is disabled while a change is in progress, the reminder is marked on only if scheduling succeeded, and the web build reports reminders as unsupported (398d488).

## [1.2.0] - 2026-02-17

*iOS build 12, source d52f707. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date). The tagged commit's `app.json` still reads 1.1.0; the bump to 1.2.0 was committed afterwards (ca47a12).*

### Added

- A daily focus goal and streaks: set a goal under Goals & Streaks in Settings, track the current and best streak, and get a celebration popup when the day's goal is reached (d52f707).
- A daily reminder notification at a chosen time, with optional quiet hours (d52f707).
- Tapping a notification opens the Timer (d52f707).

### Changed

- Stats move to a new store (`stats_v2`) that also keeps each day's goal and the streaks; existing stats are copied over (d52f707).
- A focus session is credited to the day it started, so a session that crosses midnight counts on the right day, and each session carries an ID so it can't be counted twice (d52f707).

## [1.1.0] - 2026-01-12

*iOS build 11 (last of builds 9–11), source 3c5feee. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- A calm animated background behind the timer: crossfading aurora gradients with drifting, glowing heart bokeh, still when Reduce Motion is on (d99c23e, 2f5dfb2, 0531882, e90daae, 21a8052, 3c5feee).
- A Background Animations switch in a new Experience section of Settings (d99c23e).

### Changed

- The Love Notes screen follows the app theme (d99c23e).

## [1.0.3] - 2026-01-12

*iOS build 6, source 766ba44. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- Light, dark or system appearance, chosen in a new Appearance section of Settings (c5319fa, ac6f8e1).
- A soft update prompt: at most once a day, the app reads a version file hosted on GitHub Pages and offers the store link when a newer version exists; Settings gains a Check for Updates button (d17141c).

### Changed

- The Timer, Settings and Stats screens and the navigation follow the theme (ac6f8e1, befe401, 9112ab8, 766ba44).

## [1.0.2] - 2026-01-11

*iOS build 5, source 0a6886e. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- The Stats chart switches between sessions and minutes (6884c52).

### Changed

- Android config: `versionCode` 1, and the unused `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` permissions removed (d4c321f); `expo-audio` removed from the config plugins (9aab3d7).

### Fixed

- Completed focus sessions are counted reliably: Stats updates use functional state updates, and loaded stats are merged once instead of overwriting newer counts (1b57da7, 1cad83f).
- Saves of settings, notes and stats are queued in order, and settings and love-note updates no longer act on stale state (f73b7c2, 6884c52).
- Session completion reads the latest timer state and runs outside the state updater, and the one-second ticker can no longer run twice (5ce6cc6, 6ba257f, 0a6886e).

## [1.0.1-android] - 2026-01-09

*Android build 6 (builds 2 and 5 came from d4c321f), source 8e9f5ce on a side branch off 1.0.1. Built with EAS for Google Play. Not in production on Google Play: the account has not passed Play's closed-test requirement (5da66f4). It may have reached a testing track; that is not recorded.*

Everything in 1.0.1, plus:

### Changed

- `versionCode` 1, and the unused `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` permissions removed (d4c321f; also in 1.0.2).

### Removed

- `expo-audio`, to satisfy Android 15's restriction on foreground services at boot (8e9f5ce).

Two later fixes on the same branch were never built: functional state updates for the stats increment (a9b2d9f) and `__DEV__` guards around debug logs (6475bda). The `archive/release-android-1.0.1` tag preserves them.

## [1.0.1] - 2026-01-07

*iOS build 4, source 237a8e5. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- Rotation and iPad support, with a responsive Timer layout (f4f9f1c).

### Fixed

- Changes in Settings and Stats reach every screen: app-wide state lives in one React Context, memoized so it doesn't re-render every consumer needlessly, and Love Notes uses it too (04404c7, 7aef192).
- The long-break cycle no longer counts a completed focus twice, and Skip and Reset ignore repeated taps during a transition (ad57bd9).

## [1.0.0] - 2026-01-07

*iOS build 3, source 4278bd6. Released on the App Store (confirmed by the owner on 2026-10-30; the release date is not recorded, so the date shown is the build date).*

### Added

- A Pomodoro timer with focus, short-break and long-break phases (a long break every 4 focus sessions by default). It counts from timestamps, so it stays correct in the background and completes a session that ended while the app was closed, exactly once (5d0a3c8, 1695dda, 93770a1, 9dc42d2).
- A local notification when a session ends; scheduling a notification never blocks Start, Pause, Resume, Reset or Skip (1695dda, 8ed9676, d80ae7e).
- Love notes: a note card after each completed focus session, never the same note twice in a row, from 20 seed notes you can add to, edit, delete, preview and reset (2c3667f, c949803).
- Settings for the three durations, the long-break interval, notifications, sound, haptics and love notes (ec900a8, 4aa531a).
- Stats: today's and all-time sessions and minutes, and a 7-day chart (657ee11).
- Gift Mode: a first-launch welcome with animated hearts and a personal message (19dc852, 42409bf).
- A circular progress ring, haptics and button animations (d836c0a).
- The app icon, splash screen and EAS build configuration, on Expo SDK 54 with React Native 0.81.5 (42409bf, adc5bb3, 40489e2, 4278bd6).

[Unreleased]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0...rehaul/v2
[1.4.0]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.3.1...v1.4.0
[1.4.0-tf.58]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.57...v1.4.0-tf.58
[1.4.0-tf.57]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.56...v1.4.0-tf.57
[1.4.0-tf.56]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.55...v1.4.0-tf.56
[1.4.0-tf.55]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.54...v1.4.0-tf.55
[1.4.0-tf.54]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.53...v1.4.0-tf.54
[1.4.0-tf.53]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.52...v1.4.0-tf.53
[1.4.0-tf.52]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.51...v1.4.0-tf.52
[1.4.0-tf.51]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.50...v1.4.0-tf.51
[1.4.0-tf.50]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.49...v1.4.0-tf.50
[1.4.0-tf.49]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.48...v1.4.0-tf.49
[1.4.0-tf.48]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.47...v1.4.0-tf.48
[1.4.0-tf.47]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.46...v1.4.0-tf.47
[1.4.0-tf.46]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.45...v1.4.0-tf.46
[1.4.0-tf.45]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.44...v1.4.0-tf.45
[1.4.0-tf.44]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.43...v1.4.0-tf.44
[1.4.0-tf.43]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.4.0-tf.42...v1.4.0-tf.43
[1.4.0-tf.42]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.3.1...v1.4.0-tf.42
[1.3.1]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.2.5...v1.3.0
[1.2.5]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.0.1...v1.0.2
[1.0.1-android]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.0.1...v1.0.1-android
[1.0.1]: https://github.com/mertefesensoy/valentine-pomodoro/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mertefesensoy/valentine-pomodoro/releases/tag/v1.0.0
