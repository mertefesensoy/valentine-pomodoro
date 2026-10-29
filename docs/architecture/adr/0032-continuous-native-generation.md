---
id: ADR-0032
title: Generate the native projects from app.json (CNG)
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0033, ADR-0034, ADR-0037, IMPL-2026-10-29-expo-sdk-58-upgrade]
---

# ADR-0032: Generate the native projects from `app.json` (CNG)

## Context

The tracked `android/` folder was generated once (`f588882`) and never regenerated, while `app.json` changed many times. EAS does not sync `app.json` into an existing native folder, so Android builds had been ignoring later changes (Phase 0 §5, finding 2):
- **A stuck version.** Builds reported `versionName 1.2.4` whatever `app.json` said.
- **A hard-coded test ad id.** `AndroidManifest.xml:15` used the AdMob **test** app id with `tools:replace`, so fixing `app.json` alone would not have fixed Android ads.

A fresh `expo prebuild` diffed against the folder showed one text difference, the `versionName`. Every binary was byte-identical, so the folder held no custom native code (SDK 58 upgrade §3.1).

## Decision

The owner's decision on 2026-10-29 (SDK 58 upgrade §1): use **generated native projects (CNG)**. `android/` was removed from git, and `/android` and `/ios` are git-ignored (`f4bdd2e`). All native configuration goes through `app.json` and config plugins.

## Consequences

**Positive**
- The first SDK 58 Android build reported `versionName 1.3.1`, confirming the drift is gone. `expo-doctor` reached 18/18 at that point.
- Release signing is unaffected. `eas.json` has no local credentials source, so EAS keeps using the keystore that signed the 1.0.1 Play builds.

**Negative**
- Every native change must be written as config. The R8 keep rules that fixed the Android launch crash live in `app.json`, under `expo-build-properties` → `android.extraProguardRules`, because an edit to `proguard-rules.pro` would not survive a rebuild (R8 doc §5).
- Patches to native library code still go through `patch-package`, as the AIRMap guard does ([ADR-0017](0017-no-null-in-mapview-child-map.md)).
- No native build can run on this Windows machine, so every native check needs an EAS build (Phase 0 §6.2).

## Alternatives considered

- **Keep committing `android/`.** It had already drifted silently from `app.json` (Phase 0 §5, finding 2).
- **For the R8 rules: edit `android/app/proguard-rules.pro` directly.** It is generated and git-ignored, so the edit would be lost (R8 doc §5).

## Links

- [Phase 0 §5, finding 2](../../implementations/2026-10-29-phase0-foundation.md#5-new-findings-not-in-the-plan) · [§6.3](../../implementations/2026-10-29-phase0-foundation.md#63-still-open-in-phase-0)
- [SDK 58 upgrade §1](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#1-problem--motivation) · [§3.1](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#31-generated-native-projects-cng) · [§6.2](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#62-native-builds-eas)
- [R8 launch crash §3](../../implementations/2026-10-29-android-r8-workmanager-crash.md#3-implementation-approach) · [§5](../../implementations/2026-10-29-android-r8-workmanager-crash.md#5-design-decisions)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
