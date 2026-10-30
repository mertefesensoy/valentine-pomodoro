---
id: ADR-0002
title: React Navigation bottom tabs from the with-react-navigation template
status: superseded
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0028]
superseded_by: [ADR-0028]
---

# ADR-0002: React Navigation bottom tabs from the `with-react-navigation` template

> **Status note:** superseded by [ADR-0028](0028-expo-router.md) once Phase 1 B6 built Expo Router with native tabs (branch `phase1/b6-expo-router`, 2026-10-30; [B6 record](../../implementations/2026-10-30-phase1-b6-expo-router.md)). `src/navigation/`, `HapticTab` and the blurred tab bar are gone; the template's `IconSymbol` stays.

## Context

v1 started on 2026-01-07 on Expo SDK 54 (managed workflow). It is navigation-first: four bottom tabs for Timer, Stats, Settings and Notes.

## Decision

Create the app with `npx create-expo-app --example with-react-navigation`, not the blank template. The example comes with React Navigation bottom tabs already wired (DECISIONS §1).

As built today: React Navigation 7 with the static API (rehaul plan §1.1). `package.json` declares `@react-navigation/bottom-tabs` ^7.4.0.

## Consequences

**Positive**
- No manual wiring of the navigation dependencies. DECISIONS.md estimates this saved about an hour of setup.
- It follows Expo's pattern for navigation-first apps.

**Negative**
- Template leftovers stayed in the repo until Phase 0: `HelloWave`, `ParallaxScrollView`, `Explore.tsx`, `Home.tsx`, the logo images and `scripts/reset-project.js` (finding F8). Phase 0 traced the import graph and removed them (`b79085a`).
- On Android, the template's icon mapping still held its own names (`house.fill`, `paperplane.fill`). An `as IconMapping` cast hid the gap, so the tab icons were missing until `0c99c0b` (SDK 58 upgrade doc §5, finding 1).

## Alternatives considered

- **`--template blank-typescript`.** It would have needed the React Navigation setup by hand (DECISIONS §1).

## Links

- [`DECISIONS.md` §1](../../../DECISIONS.md#1-template-choice-with-react-navigation-example)
- [Rehaul plan §1.1](../../implementations/2026-10-29-couples-rehaul-plan.md#11-what-the-app-is-today-verified-against-code-not-docs) · [§1.2, finding F8](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it)
- [Phase 0 §3.4, cleanup](../../implementations/2026-10-29-phase0-foundation.md#34-cleanup)
- [SDK 58 upgrade §5, finding 1](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#5-findings)
- Successor: [ADR-0028 Expo Router](0028-expo-router.md), built in Phase 1 B6 ([ADR-0043](0043-native-tabs-frozen-by-a-wrapper.md))

## Backlinks
<!-- backlinks:start -->
- [Expo Router for navigation](0028-expo-router.md)
- [Native tabs, frozen by a route wrapper, laid out by safe-area insets](0043-native-tabs-frozen-by-a-wrapper.md)
- [Architecture decision records](README.md)
- ["Phase 1 B6: Expo Router with native tabs"](../../implementations/2026-10-30-phase1-b6-expo-router.md)
<!-- backlinks:end -->
