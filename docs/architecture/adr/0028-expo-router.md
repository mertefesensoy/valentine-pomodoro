---
id: ADR-0028
title: Expo Router for navigation
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0002, ADR-0029, ADR-0043]
supersedes: [ADR-0002]
---

# ADR-0028: Expo Router for navigation

> **Status note:** accepted on 2026-10-29 as part of the approved rehaul plan and Phase 1 plan. **Built in Phase 1 B6** on branch `phase1/b6-expo-router` (2026-10-30): Expo Router 58.0.28 with native tabs ([B6 record](../../implementations/2026-10-30-phase1-b6-expo-router.md)). How the native tabs keep B4's frozen tabs, the safe areas and the tab haptic is [ADR-0043](0043-native-tabs-frozen-by-a-wrapper.md). It supersedes [ADR-0002](0002-react-navigation-template.md). The device check runs on the combined B6 and B7 TestFlight build.

## Context

v1 uses React Navigation 7's static API ([ADR-0002](0002-react-navigation-template.md)). v2 needs things the static API doesn't give directly (rehaul plan §4.1):
- web URLs for the web app
- universal-link invites at `/invite/[code]`
- per-route bundle splitting on the web

## Decision

Replace the static navigation with **Expo Router**, which is file-based and built on React Navigation (rehaul plan §4.1, §9).

The Phase 1 shape (task B6):
- **Routes:** file routes `app/(tabs)/index` (Classic, with the Fly switch), `stats`, `settings` and `notes`, plus `+not-found`.
- **Behaviour:** tab switches have no animation, and the `valentinepomodoro://` scheme is kept.
- **Native tabs:** an iOS tab bar. The Android navigation bar and rail wait with the rest of Android.
- **Done when:** the guards and Reassure stay green, deep links open each tab, and the old `src/navigation` is removed.

## Consequences

**Positive**
- Web URLs, invite deep links and web bundle splitting come with it. It is built on React Navigation, so screen code ports (§9).
- `expo-linking` was kept in Phase 0's cleanup because the router needs it (Phase 0 §3.4).

**Negative**
- It is a navigation rewrite inside v1.4, the first release existing users see from the rehaul. The release also carries the redesign, the storage migration and the re-render refactor (Phase 1 plan §1).
- On native there are no chunks. Hermes runs one bytecode bundle, so the splitting benefit is web-only (§6.1).

## Alternatives considered

- **Stay on React Navigation's static API.** It has none of the web URL, invite-link or splitting benefits (§9).

## Links

- [Rehaul plan §4.1](../../implementations/2026-10-29-couples-rehaul-plan.md#41-stack-changes) · [§6.1](../../implementations/2026-10-29-couples-rehaul-plan.md#61-every-item-you-asked-for) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions)
- [Phase 1 plan §1](../../implementations/2026-10-29-phase1-plan.md#1-problem--motivation) · [Stage B (B6)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates)
- [Phase 0 §3.4](../../implementations/2026-10-29-phase0-foundation.md#34-cleanup)

## Backlinks
<!-- backlinks:start -->
- [React Navigation bottom tabs from the with-react-navigation template](0002-react-navigation-template.md)
- [Native tabs, frozen by a route wrapper, laid out by safe-area insets](0043-native-tabs-frozen-by-a-wrapper.md)
- [Architecture decision records](README.md)
- ["Phase 1 B6: Expo Router with native tabs"](../../implementations/2026-10-30-phase1-b6-expo-router.md)
<!-- backlinks:end -->
