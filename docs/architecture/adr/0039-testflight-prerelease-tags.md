---
id: ADR-0039
title: TestFlight builds get SemVer pre-release tags (-tf.N)
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0038, IMPL-2026-10-30-documentation-system]
---

# ADR-0039: TestFlight builds get SemVer pre-release tags (`-tf.N`)

## Context

Version 1.4.0, the first rehaul release, is not released yet. Build 42 is on TestFlight (EAS build `7e7249e8`, submission `d5a8509d`), where A0 passed on a physical iPhone.

The version is 1.4.0 rather than 1.3.x for a store reason: the App Store's live 1.3.1 is closed to new uploads (`a12ced4`; Phase 1 plan, A0 status). Under [ADR-0038](0038-trunk-based-branching-and-tags.md), every shipped build needs a tag that identifies its commit, and a release tag must never move (documentation system §5).

## Decision

A TestFlight build is tagged with a **SemVer pre-release tag**, `vX.Y.Z-tf.<build>`. The first is `v1.4.0-tf.42`. The plain `vX.Y.Z` tag is cut only at the store release (documentation system §5).

The commit rule is the one in [ADR-0038](0038-trunk-based-branching-and-tags.md): the tag points at the `gitCommitHash` the EAS build recorded.

## Consequences

**Positive**
- `v1.4.0` will mean exactly the build users get from the store, and it never moves.
- Every TestFlight build is identifiable. Pre-release tags sort before the release under SemVer.

**Negative**
- One more tag per TestFlight build, and a tag for each build that is tested but never released.
- Whoever cuts the release must create `v1.4.0` at the submitted build, separately from the `-tf.N` tags. The full step list is to be written in `docs/process/RELEASE.md`, which doesn't exist yet.

## Alternatives considered

- **Tag `v1.4.0` now.** Rejected: 1.4.0 isn't released, and a release tag must never move (documentation system §5).

## Links

- [Documentation system §2](../../implementations/2026-10-30-documentation-system.md#2-what-changed) · [§5](../../implementations/2026-10-30-documentation-system.md#5-design-decisions-and-findings)
- [Phase 1 plan, Stage A (A0 status)](../../implementations/2026-10-29-phase1-plan.md#stage-a--safety-nets-first-no-behaviour-change)
- [SDK 58 upgrade §6.3](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#63-device-checks-yours)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
