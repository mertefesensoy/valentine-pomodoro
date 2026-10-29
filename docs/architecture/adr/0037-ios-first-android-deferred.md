---
id: ADR-0037
title: iOS first; Android deferred until the Play closed test
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0011, ADR-0026, ADR-0031, ADR-0032]
---

# ADR-0037: iOS first; Android deferred until the Play closed test

## Context

Google Play requires personal developer accounts created after 13 Nov 2023 to keep **at least 12 testers opted in to a closed test for 14 consecutive days** before production access. That isn't feasible yet (Phase 1 plan §0). Android has not shipped since 1.0.1 in January 2026, so no Android user has ever had Fly Mode (upgrade §5, finding 7).

The Android emulator runs on 2026-10-29 found two crashes:
- **R8 at launch.** R8 removed WorkManager's database constructor, so the app crashed on launch. Fixed with keep rules in `c70afd9`.
- **Fly Mode.** Fly needs a Google Maps key the app never had. Because the chosen mode is saved, every later launch crashed too.

The plan for Fly on Android changed three times that day (Phase 1 plan §6, item 7):
1. Hide Fly where it can't open. Built as `9372403`.
2. Then bring Fly to Android in v1.4 with a Maps key (tasks B8, B9).
3. Then defer Android entirely.

## Decision

The owner's decision on 2026-10-29: **v1.4 and the work after it target iOS only.** All Android work moves to Phase 1 §3b (AN0–AN6), and every device check runs on a physical iPhone through TestFlight (Phase 1 plan §0, §3b).

The `9372403` guard stays:
- `isFlyModeAvailable(os)` is true only for iOS.
- `resolveAppMode()` turns a stored or requested `'fly'` into `'default'` on Android and the web, both on read and on write, without rewriting storage. A single tap can never lock the app (hide-Fly doc §3).

## Consequences

**Positive**
- A smaller scope for v1.4. A0 passed on a physical iPhone running TestFlight build 42 (v1.4.0).
- The Android work done so far is kept: the R8 rules, the Fly guard, the emulator set-up at `C:\Android`, and the run-2 results.

**Negative**
- Play still has 1.0.1. The next Android release waits on AN0, the owner's 12-tester closed test.
- The Android layout findings wait in AN4: titles under the status bar, a white band hiding the Stats chart, the backdrop gap and the system-blue active tab. So do the adaptive, monochrome and notification icons, and the `expo-system-ui` decision.
- `PRODUCT.md`'s platform is `ios` until Android returns, when it becomes `adaptive` again.

## Alternatives considered

- **Ship Fly on Android in v1.4 with a Maps key (B8, B9).** Chosen earlier the same day, then deferred together with Android (Phase 1 plan §6, item 7).
- **Ship Android with Fly hidden** (option b, `9372403`). Superseded by deferring Android entirely, though the guard itself remains.

## Links

- [Phase 1 plan §0](../../implementations/2026-10-29-phase1-plan.md#0-decisions-you-made-2026-10-29) · [§3b](../../implementations/2026-10-29-phase1-plan.md#3b-deferred-android-after-v14) · [§6, items 7–8](../../implementations/2026-10-29-phase1-plan.md#6-verification-of-this-plan-and-open-items-for-your-approval) · [Stage A (A0)](../../implementations/2026-10-29-phase1-plan.md#stage-a--safety-nets-first-no-behaviour-change)
- [Hide Fly Mode §1](../../implementations/2026-10-29-android-hide-fly-mode.md#1-problem--motivation) · [§3](../../implementations/2026-10-29-android-hide-fly-mode.md#3-implementation-approach) · [§5](../../implementations/2026-10-29-android-hide-fly-mode.md#5-design-decisions)
- [R8 launch crash §1](../../implementations/2026-10-29-android-r8-workmanager-crash.md#1-problem--motivation)
- [SDK 58 upgrade §5](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#5-findings) · [§6.3](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#63-device-checks-yours)
- [`PRODUCT.md`, capabilities and constraints](../../../PRODUCT.md#capabilities-and-constraints)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
