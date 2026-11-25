---
id: RELEASE
title: Release process
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [BRANCHING, CHANGELOG, TEST-STRATEGY]
---

# Release process

## 1. Versions and build numbers

- **Marketing version:** [Semantic Versioning](https://semver.org/) `MAJOR.MINOR.PATCH`, held in `app.json` `expo.version`, with `package.json` kept equal.
  - **MINOR** for a feature release (each roadmap milestone).
  - **PATCH** for fixes only.
  - **MAJOR 2** for the public v2 launch.
- **Build numbers** (iOS `buildNumber`, Android `versionCode`) come from EAS (`appVersionSource: remote`, `autoIncrement` on the production profile). Never edit them by hand. The `ios.buildNumber` and `android.versionCode` values still in `app.json` are ignored for that reason (`eas.json` sets `appVersionSource: "remote"`); TestFlight build 42 shows the real counter.
- **A version that is live in the App Store can't take more uploads.** Bump the version before the next TestFlight build (as 1.3.1 → 1.4.0 showed).

## 2. Tags

| Tag | Meaning | Example |
|-----|---------|---------|
| `vX.Y.Z` | A store release: the commit the released build was made from. **Never moved, never reused.** | `v1.3.1` |
| `vX.Y.Z-android` | An Android build when it came from a different commit than iOS (history only) | `v1.0.1-android` |
| `vX.Y.Z-tf.N` | A TestFlight pre-release, build number N; a SemVer pre-release, so it sorts before `vX.Y.Z` | `v1.4.0-tf.42` |
| `vX.Y.Z-submitted` | The commit of the build submitted for App Store review (from 1.4.0). The release still gets `vX.Y.Z` on approval, on the commit that ships | `v1.4.0-submitted` |
| `archive/<slug>` | Preserved commits of a deleted branch; not a version | `archive/ios-ads-consent-1.2.3` |

- Tags are **annotated**, and the annotation records: platform, build number, EAS build id or date, source commit, and what is known about release to users.
- Push them by name: `git push origin vX.Y.Z`.
- Past versions were tagged on 2026-10-30 from the EAS build history; see the [documentation-system record](../implementations/2026-10-30-documentation-system.md#41-which-commit-a-version-tag-points-at).

## 3. Release checklist (iOS)

**Before building**
1. [ ] The roadmap milestone's exit criteria hold, and its plan's E-stage checks are done.
2. [ ] CI is green on the commit: typecheck, lint with 0 errors, tests, and the docs check.
3. [ ] [CHANGELOG.md](../../CHANGELOG.md): move "Unreleased" into `## [X.Y.Z] - YYYY-MM-DD`, written for users.
4. [ ] The version is bumped in `app.json` and `package.json`.

**Build and test**

5. [ ] **Owner's go-ahead:** `eas build --platform ios --profile production`.
   - [ ] **Keep its dSYMs** (from the first build after 1.5.2; [keep-dsyms record](../implementations/2026-11-16-keep-dsyms.md)).
     - `eas build:view <id> --json` should list a `buildArtifactsUrl`. That is the zip of `ios/build/*.dSYM.zip`, which `eas.json` uploads.
     - Download it before EAS expires the build's files, 30 days after the build.
     - Keep it outside EAS, named by version and build, for example `ValentinePomodoro-X.Y.Z-<build>.dSYM.zip`. A dSYM matches only its own build, and without it the app's frames in that release's crash logs stay bare addresses ([crash reports audit](../implementations/2026-11-15-crash-reports-audit.md)).
6. [ ] **Owner's go-ahead:** `eas submit --platform ios --id <build-id>` to TestFlight.
7. [ ] Tag `vX.Y.Z-tf.<build>` and push it.
8. [ ] Device check on a physical iPhone, installed over the current store version ([test strategy §5](../testing/TEST-STRATEGY.md#5-device-check-protocol)).

**Release**

9. [ ] **Owner:** submit for App Store review in App Store Connect; release when approved. When it goes in, tag `vX.Y.Z-submitted` on the build's commit and push it.
10. [ ] Tag `vX.Y.Z` on the released commit and push it. From 1.4.0, the merge to `master` comes first ([BRANCHING.md](BRANCHING.md#the-transition-from-rehaulv2-now)). To confirm that a version is live, add a throwaway value to the lookup (`https://itunes.apple.com/lookup?id=6757491918&cb=<anything new>`): the bare URL can trail a release by up to 24 hours ([audit](../implementations/2026-11-06-update-check-audit.md)).
11. [ ] **GitHub Release** (from v1.4.0 on), with the CHANGELOG section as its notes:
    ```bash
    gh release create vX.Y.Z --title "X.Y.Z" --notes-file <section>
    ```
12. [ ] **Only when the version also ships on Android, with the owner's go-ahead:** set `latestVersion` in `update.json` on the `gh-pages` branch to the released version, and push. That file is the live one, read by the update prompt of iOS 1.0.3–1.3.0 and of every non-iOS version from 1.3.1 on. An iOS-only release leaves it alone: Android would be told to install a version it doesn't have, and iOS doesn't need it. From 1.3.1 on, iOS asks Apple's lookup, and older iOS versions are already prompted by the file's version, with a link that opens the current App Store version. Check `https://mertefesensoy.github.io/valentine-pomodoro/update.json` serves it.
13. [ ] Close the milestone in the [roadmap](../roadmap/ROADMAP.md) and record the release date in CHANGELOG.

## 4. Things that expire

| What | Expires | Action |
|------|---------|--------|
| iOS distribution certificate | **7 Jan 2027** | Renew before any later submission (an interactive Apple sign-in, yours) |
| Apple agreements | When Apple updates them | Accept them in App Store Connect → Business; an unaccepted agreement blocks uploads (seen 2026-10-29) |

## 5. Android

Android returned on 2026-11-25 with 1.5.2's closed test ([the plan](../implementations/2026-11-25-android-closed-test-plan.md); the [roadmap Android track](../roadmap/ROADMAP.md#android-track--in-progress)).

**The rules:**
- **The same version numbers** as iOS.
- **`versionCode` comes from EAS** (remote, `autoIncrement`). 1.0.1 used 2, 5 and 6, and the next production build is 7.
- **Google Play's closed test before production:** at least 12 testers opted in for 14 consecutive days. Internal testing doesn't count. Then the owner applies for production access, and the release is staged.

**Before building**
1. [ ] CI is green on the commit, as for iOS.
2. [ ] **An EAS preview build (APK) runs on the emulator** (`C:\Android`, AVD `vp_api35`), installed fresh with `adb uninstall com.bengisu.valentinepomodoro` first, as a tester's would be.
   - `adb shell dumpsys package com.bengisu.valentinepomodoro` shows `targetSdk=36`, `USE_EXACT_ALARM`, and none of `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW` or the storage permissions.
   - `adb shell dumpsys alarm` shows a running session's end alarm with no window (exact, DEF-012).

**Build and check**

3. [ ] **Owner's go-ahead:** `eas build --platform android --profile production`, which gives an AAB.
4. [ ] `node scripts/android/check-16k.mjs <the .aab>` exits 0: every 64-bit native library is aligned to 16 KB.
5. [ ] **Owner:** upload the AAB to the closed track in Play Console, by hand (there's no Android `submit` profile), and send it for review.
6. [ ] Tag the build's commit `vX.Y.Z-ct.<versionCode>` and push it. This name is proposed and waits for the owner's answer (the plan's Q4).

**Release (after the 14 days)**

7. [ ] **Owner:** apply for production access, then release on a staged rollout.
8. [ ] Tag the released commit. When Android's build comes from a different commit than the iOS release of the same version, as 1.5.2's does, the tag is `vX.Y.Z-android` (§2), and CHANGELOG gets an `[X.Y.Z-android]` section, as `[1.0.1-android]` did. Otherwise it's `vX.Y.Z`, if iOS hasn't already tagged it. Then `update.json` (§3, step 12), since Android now has the version.

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Valentine Pomodoro](../../README.md)
- [Documentation map](../README.md)
- ["Phase 1 Stage E: verify and ship v1.4.0"](../implementations/2026-11-01-phase1-stage-e.md)
- ["URGENT: remove the unused audio background mode before the next submission (DEF-009)"](../implementations/2026-11-03-def-009-background-audio-mode.md)
- ["App Store featuring nomination: Meet Pomo & Doro"](../implementations/2026-11-04-featuring-nomination.md)
- ["Phase 2: GitHub deploys database changes on merge"](../implementations/2026-11-05-phase2-deploy.md)
- ["Phase 2 (v1.5.0): accounts, pairing by code, your partner's day and notes to them, plan"](../implementations/2026-11-05-phase2-plan.md)
- ["Phase 2 F1: pairing on, version 1.5.0"](../implementations/2026-11-06-phase2-f1-flag-on.md)
- ["Phase 2 F2: the first TestFlight build, and the check on two phones"](../implementations/2026-11-06-phase2-f2-testflight.md)
- [2026-11-06 — Update check audit: why the app said "latest version 1.4.0"](../implementations/2026-11-06-update-check-audit.md)
- [2026-11-06 — 1.4.2: the update check finds new versions when they're out](../implementations/2026-11-06-v142-update-check-fix.md)
- ["Phase 2 F5: shipping 1.5.0 on Supabase's Free plan, the submission and the release"](../implementations/2026-11-07-phase2-f5-submission.md)
- [2026-11-12 — Screen sleep audit: why the phone locks itself during a session (DEF-010)](../implementations/2026-11-12-screen-sleep-audit.md)
- [2026-11-12 — 1.5.1: the screen stays on while a session runs (DEF-010)](../implementations/2026-11-12-v151-screen-sleep-fix.md)
- [2026-11-13 — Mac version audit: can Valentine Pomodoro ship on the Mac?](../implementations/2026-11-13-mac-version-audit.md)
- [2026-11-15 — Crash reports audit: how to get a stack trace without a Mac](../implementations/2026-11-15-crash-reports-audit.md)
- [2026-11-15 — 1.5.2: one note after each focus, and the ad that follows it (DEF-011)](../implementations/2026-11-15-v152-note-sheet-once.md)
- [2026-11-16 — Keep each production build's dSYMs](../implementations/2026-11-16-keep-dsyms.md)
- [2026-11-25 — 1.5.2 on Android: the Play closed test, plan](../implementations/2026-11-25-android-closed-test-plan.md)
- [Branching model](BRANCHING.md)
- [Evaluation — xtool (cross-platform Xcode replacement) vs staying on Expo/EAS](../proposals/xtool-evaluation.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
<!-- backlinks:end -->
