---
id: ADR-0011
title: Verify notifications and backgrounding on a real device
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0037]
---

# ADR-0011: Verify notifications and backgrounding on a real device

> **Status note:** still in force. The *vehicle* changed: v1 used Expo Go, and since 2026-10-29 every check runs on a physical iPhone from an EAS build through TestFlight (the owner's decision, Phase 1 plan §0). The decision, a physical device, stands.

## Context

The behaviours that matter most here are local notifications and the timer surviving the background. These are the ones a simulator shows least faithfully: DECISIONS §11 records that the iOS Simulator doesn't support local notifications, and that background behaviour differs on real devices.

## Decision

Test notifications and timer backgrounding on a physical iPhone. The Android emulator supports notifications, but a physical device is still recommended (DECISIONS §11).

## Consequences

**Positive**
- The device-check gate catches release-only failures that unit tests can't see. The first SDK 58 Android release build crashed on every launch because R8 removed WorkManager's database constructor. That was found by the device-check run and fixed in `c70afd9` before any release.
- Phase 1 now treats device checks as gates. A0 passed on a physical iPhone running TestFlight build 42 (v1.4.0), including data surviving the update from App Store 1.3.1.

**Negative**
- Checks were deferred instead of run. All of about 60 items in `docs/device-check-backlog.md` were unchecked (finding F7). A TDZ crash shipped through three tasks, the "first concrete evidence" that deferred checks let breaking bugs pile up (plane doc §5).
- Each check now costs an EAS build and a TestFlight submission, each needing the owner's go-ahead. There is no Mac here for a simulator (Phase 1 plan §0).
- An emulator is not a phone. Gestures, haptics and performance still need hardware (SDK 58 upgrade §6.3).

## Alternatives considered

- **The iOS Simulator.** It doesn't support local notifications (DECISIONS §11).
- **Only the Android emulator.** Used for the October Android runs, but "an emulator is not a phone" (SDK 58 upgrade §6.3).
- **Expo Go,** v1's vehicle. The rehaul plan says to judge motion "in a release build on the slowest test device, never in Expo Go" (§5.3).

## Links

- [`DECISIONS.md` §11](../../../DECISIONS.md#11-testing-strategy-real-device-required)
- [Rehaul plan §1.2, finding F7](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it) · [§5.3](../../implementations/2026-10-29-couples-rehaul-plan.md#53-motion-emil-kowalski-animate-expo-mit)
- [Phase 1 plan §0](../../implementations/2026-10-29-phase1-plan.md#0-decisions-you-made-2026-10-29) · [Stage A (A0)](../../implementations/2026-10-29-phase1-plan.md#stage-a--safety-nets-first-no-behaviour-change)
- [SDK 58 upgrade §6.3](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#63-device-checks-yours)
- [R8 launch crash §1](../../implementations/2026-10-29-android-r8-workmanager-crash.md#1-problem--motivation)
- [Clock-driven plane §5](../../implementations/2026-04-20-plane-clock-driven.md#5-design-decisions)

## Backlinks
<!-- backlinks:start -->
- [The plane's position is a pure function of the clock](0019-clock-driven-plane.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
