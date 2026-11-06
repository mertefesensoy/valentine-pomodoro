---
id: IMPL-2026-11-06-phase2-f1-flag-on
title: "Phase 2 F1: pairing on, version 1.5.0"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-d5-tutorial, IMPL-2026-11-05-phase2-c4-startup-report, ADR-0049, ADR-0051, RELEASE, SRS]
---

# 2026-11-06 — Phase 2 F1: pairing on, version 1.5.0

**Status:** Built and passing locally. The device check is F2's.
**Branch:** `feat/phase2-f1-flag-on`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, F1](2026-11-05-phase2-plan.md#stage-f-verify-and-ship): turn `PAIRING_ENABLED` on, 1.5.0 in `app.json` and `package.json`, `ios.usesAppleSignIn`, and the CHANGELOG.

---

## 1. Problem / Motivation

Stages A to E built 1.5.0 behind a flag, so that `master` stayed releasable. A build can't be tested until the flag is on. From this merge, **`master` builds the app with pairing on.**

## 2. What Changed

| File | Change |
|------|--------|
| `src/constants/features.ts` | `PAIRING_ENABLED` is `true`, which also turns on the start-up reports. |
| `app.json` | Version 1.5.0, and `ios.usesAppleSignIn`. |
| `package.json`, `package-lock.json` | Version 1.5.0. |
| `CHANGELOG.md` | The 1.5.0 section. |
| `jest.setup.ts` | Tests run with the reports off unless a suite turns them on. |
| `src/constants/__tests__/features.test.ts` | It now checks the real values, with the flag on. |
| `src/screens/__tests__/classic.test.tsx`, `classicWorstCase.test.tsx` | The Ring's idle line is the short one, beside the Pair line. |
| `src/screens/__tests__/settings.test.tsx` | "With pairing off" becomes "with no account". |
| Six suites that mock the flag | Each names both flags. |

## 3. Implementation Approach

**Most of the 14 tests that failed with the flag on were about one thing.** With the reports on, each install draws its start-up group at random, so `resolveLaunchArm()` is a coin flip when nothing is stored. `deferredStartup`, `adReadiness` and `useUpdateCheck` failed when the coin said `eager`, and a rerun might pass by luck. So the test world pins it: `jest.setup.ts` mocks `STARTUP_REPORTS_ENABLED` to `false`, and the suites about the reports (`startupReport`, `soloLaunch`, `settingsPrivacy`) turn it on themselves. That keeps B7's machinery tested on one path, and it keeps `router.test.tsx`'s count of queued tasks about tabs.

**A rule for later:** a suite's own mock of `constants/features` replaces the setup's, and `...jest.requireActual()` brings in the real `true`. So a suite that mocks the flags must name both, or it's a coin flip again.

**What ships is what's asserted.** The Ring's idle line and Settings are 1.5.0's real screens, so those tests changed to say what 1.5.0 shows. The tour's suites stay pinned to the shipped tour, as D5 did, because `tutorial15.test.tsx` covers the new one.

**The entitlement.** `npx expo config --type introspect` already shows `com.apple.developer.applesignin` before this change, because `expo-apple-authentication`'s plugin adds it. `ios.usesAppleSignIn` is what the plan says, and it's what the Expo documentation asks for. Nothing has ever run Sign in with Apple on a device, so F2 is what proves it.

**Left alone:** `tour.invite.lead` isn't used with the flag on, since the new step's lead brings the tour back to the Timer. It stays, since the flag-off tour is still tested, and the repository has no check for unused strings.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Pin the reports off in `jest.setup.ts` | One mock in each of the suites that failed | Any suite that renders a screen can reach the coin, and one that passed today could fail tomorrow |
| Test the Ring's real idle line | Pin the flag off in the Classic suites | They'd go on testing a screen nobody will see |
| The CHANGELOG's date is the first build's | Waiting for the release date | RELEASE.md asks for the section before building. The release date goes in at the end, as 1.4.0's did |

## 6. Verification

- [ ] `npx tsc --noEmit`, lint, contrast, and the full Jest suite with the real flag on.
- [ ] `npx expo config --type introspect`: the entitlement is there, and `UIBackgroundModes` has no `audio`.
- [ ] Bytecode under 4,640,000 B.
- [ ] **On two phones, at F2:** the plan's §6.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), F1 and §6
- [D5's record](2026-11-06-phase2-d5-tutorial.md): the suites that had to flip
- [RELEASE.md](../process/RELEASE.md)
