---
id: ADR-0034
title: Hold react-native-google-mobile-ads on v16 until Phase 5
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0025, ADR-0032, ADR-0033]
---

# ADR-0034: Hold `react-native-google-mobile-ads` on v16 until Phase 5

## Context

The app shipped with AdMob 16.0.3 on SDK 54, while upstream was at 17.4.0 (Phase 0 §5, finding 7). Version 17.0 is a breaking API rewrite ("refreshed API, multiformat, ad pools"). Phase 5 rewrites the ad code anyway, for consent, real ids and Plus gating ([ADR-0025](0025-couple-subscription-and-capped-ads.md)).

## Decision

Stay on **16.x**, at 16.5.0 on SDK 58, and migrate to 17 once, in Phase 5 (SDK 58 upgrade §4). Phase 1 changes only where the ad appears on screen, not its policy (Phase 1 plan §5; D1).

As built: `package.json` has `"react-native-google-mobile-ads": "^16.5.0"`.

## Consequences

**Positive**
- The ad code is migrated once, not twice. The 16.5.0 build passed on EAS against React Native 0.88 (upgrade §6.2).
- `AdPolicy` (one interstitial per 2 sessions and 120 s) is unchanged. On the iPhone the interstitial appeared after the 2nd session, with real iOS ids (upgrade §6.3).

**Negative**
- **A doctor flag.** AdMob 16's config plugin `require`s `@expo/config-plugins` directly, so it is declared as a devDependency and the expo-doctor flag is accepted (upgrade §4).
- **Test ids on Android.** Android keeps Google's test ids until Phase 5 (Phase 1 §3b, AN5).
- **No web build.** `npx expo export --platform web` fails, because the library imports a native component. Phase 6 needs platform-split ad modules (Phase 0 §4).
- **Library versions it pulls in.** The ads SDK most likely pulls in WorkManager 2.9.1 and Room 2.5.0, which R8 broke. The fix keeps their constructors with R8 rules instead of forcing newer versions underneath AdMob (R8 doc §5).

## Alternatives considered

- **AdMob 17 now.** A breaking rewrite, done again in Phase 5 (upgrade §4).

## Links

- [SDK 58 upgrade §2](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#2-what-changed) · [§4](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#4-design-decisions) · [§6.2](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#62-native-builds-eas) · [§6.3](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#63-device-checks-yours)
- [Phase 0 §4](../../implementations/2026-10-29-phase0-foundation.md#4-measurements-the-baselines) · [§5](../../implementations/2026-10-29-phase0-foundation.md#5-new-findings-not-in-the-plan)
- [Phase 1 plan §5](../../implementations/2026-10-29-phase1-plan.md#5-design-decisions-and-findings) · [§3b](../../implementations/2026-10-29-phase1-plan.md#3b-deferred-android-after-v14)
- [R8 launch crash §5](../../implementations/2026-10-29-android-r8-workmanager-crash.md#5-design-decisions)

## Backlinks
<!-- backlinks:start -->
- [A couple subscription (Plus) plus capped free-tier ads](0025-couple-subscription-and-capped-ads.md)
- [Upgrade Expo one SDK at a time, before the refactor](0033-one-sdk-at-a-time.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
