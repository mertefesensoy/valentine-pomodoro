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
6. [ ] **Owner's go-ahead:** `eas submit --platform ios --id <build-id>` to TestFlight.
7. [ ] Tag `vX.Y.Z-tf.<build>` and push it.
8. [ ] Device check on a physical iPhone, installed over the current store version ([test strategy §5](../testing/TEST-STRATEGY.md#5-device-check-protocol)).

**Release**

9. [ ] **Owner:** submit for App Store review in App Store Connect; release when approved.
10. [ ] Tag `vX.Y.Z` on the released commit and push it. From 1.4.0, the merge to `master` comes first ([BRANCHING.md](BRANCHING.md#the-transition-from-rehaulv2-now)).
11. [ ] **GitHub Release** (from v1.4.0 on), with the CHANGELOG section as its notes:
    ```bash
    gh release create vX.Y.Z --title "X.Y.Z" --notes-file <section>
    ```
12. [ ] **Owner's go-ahead:** set `latestVersion` in `update.json` on the `gh-pages` branch to the released version, and push. That file is the live one, read by every version's update prompt (iOS 1.0.3–1.3.0; non-iOS platforms from 1.3.1 on). Check `https://mertefesensoy.github.io/valentine-pomodoro/update.json` serves it.
13. [ ] Close the milestone in the [roadmap](../roadmap/ROADMAP.md) and record the release date in CHANGELOG.

## 4. Things that expire

| What | Expires | Action |
|------|---------|--------|
| iOS distribution certificate | **7 Jan 2027** | Renew before any later submission (an interactive Apple sign-in, yours) |
| Apple agreements | When Apple updates them | Accept them in App Store Connect → Business; an unaccepted agreement blocks uploads (seen 2026-10-29) |

## 5. Android (deferred)

When Android returns (the [roadmap Android track](../roadmap/ROADMAP.md#android-track--deferred)):
- the same version numbers
- `versionCode` from EAS
- a Play closed test of at least 12 testers for 14 days before production
- a staged rollout

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Valentine Pomodoro](../../README.md)
- [Documentation map](../README.md)
- [Branching model](BRANCHING.md)
- [Evaluation — xtool (cross-platform Xcode replacement) vs staying on Expo/EAS](../proposals/xtool-evaluation.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
<!-- backlinks:end -->
