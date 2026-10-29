---
id: ADR-0033
title: Upgrade Expo one SDK at a time, before the refactor
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0032, ADR-0034, ADR-0035, IMPL-2026-10-29-expo-sdk-58-upgrade]
---

# ADR-0033: Upgrade Expo one SDK at a time, before the refactor

## Context

The app was on Expo SDK 54, and the latest was SDK 58 (58.0.21), a bigger gap than the plan assumed (Phase 0 §5, finding 7). The rehaul plan upgrades *before* the Phase 1 refactor, so the two are not mixed (rehaul plan §4.1).

Phase 0 declined to jump straight to 58 (Phase 0 §7). There was no native toolchain to verify on, the maps patch was pinned to 1.20.1, AdMob and Reanimated pairings change per SDK, `android/` needed regenerating first, and Expo recommends one SDK at a time.

## Decision

The owner's decision on 2026-10-29 (SDK 58 upgrade §1): upgrade **one SDK at a time**, 54 → 55 → 56 → 57 → 58, and verify with EAS builds.

**Every step follows the same routine (upgrade §3.2):**
1. `npx expo install expo@^N`.
2. Write every version from `--check` into `package.json` in one pass.
3. Run `npm install`. On `ERESOLVE`, regenerate the lockfile.
4. Re-cut the `patch-package` patches against the new library sources.
5. Fix whatever breaks.
6. **Gate:** `tsc`, lint with 0 errors, all 25 tests, and an iOS and Android export with `--dump-sourcemap`.
7. Commit.

The commits are `470d621` (SDK 55), `c7135f3` (56), `b12220f` (57) and `c051c9a` (58).

## Consequences

**Positive**
- Each break traces to one SDK (upgrade §3.2 table), for example TypeScript 6's types at 56 and the maps patch at 58.
- The EAS Android APK and the iOS simulator build both succeeded on 58, and A0 later passed on a physical iPhone.

**Negative**
- **Bytecode grew about 18.9 %** from 54 to 58, mostly from Hermes v1 at SDK 56. The minimum iOS version rose to 16.4 (upgrade §5).
- **A wrong lint result.** The cached `expo lint` hid 2 lint errors, and the first CI run caught them (upgrade §6.1, correction).
- **Two decisions fell out of the stepping:** AdMob held on 16 ([ADR-0034](0034-admob-held-on-16.md)) and the React Compiler rules as warnings ([ADR-0035](0035-react-compiler-lint-warnings.md)).

## Alternatives considered

- **Jump straight to 58.** It couldn't be verified at the time, and breaks couldn't be attributed (Phase 0 §7).
- **`--legacy-peer-deps` or `--force` on `ERESOLVE`.** These switch off peer checks for every package, in CI and on EAS too (upgrade §4).

## Links

- [Phase 0 §5, finding 7](../../implementations/2026-10-29-phase0-foundation.md#5-new-findings-not-in-the-plan) · [§7](../../implementations/2026-10-29-phase0-foundation.md#7-design-decisions)
- [SDK 58 upgrade §1](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#1-problem--motivation) · [§3.2](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#32-one-sdk-per-step) · [§4](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#4-design-decisions) · [§5](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#5-findings) · [§6.1](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#61-local-gates-all-passed-at-every-step)
- [Rehaul plan §4.1](../../implementations/2026-10-29-couples-rehaul-plan.md#41-stack-changes)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
