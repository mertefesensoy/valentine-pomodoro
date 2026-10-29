---
id: ADR-0020
title: A public couples product on the existing bundle id
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0008, ADR-0030, IMPL-2026-10-29-couples-rehaul-plan]
---

# ADR-0020: A public couples product on the existing bundle id

## Context

The app began as a private gift. Version 1.3.1 on the App Store is local-only: no backend and no accounts (rehaul plan §1.1). On 2026-10-29 the owner decided to turn it into a public couples study app (rehaul plan §0, "Identity").

## Decision

The app becomes a **public couples product**, with a new name and brand. It **keeps the bundle id `com.bengisu.valentinepomodoro`**, so existing installs, Bengisu's stats included, update in place (rehaul plan §0).

Rules that follow from this:
- **The App Store listing carries over.** Its name can change on the same bundle id, so the listing, its reviews and its users stay (rehaul plan §3.1).
- **Updates keep data.** Every storage migration is idempotent and keeps every existing key (`PRODUCT.md`, hard constraints).
- **Solo stays free of accounts.** It needs no account, as today; an account is needed only to pair (`PRODUCT.md`).
- **Heritage.** Bengisu's name appears only as an origin line in About, and her own install keeps its notes (Phase 1 plan §0).

## Consequences

**Positive**
- Existing users and the store listing come along. The first v2 release they see is an update, not a new app.
- It forces migration discipline early. The A3 fixtures capture all 13 keys a v1.3.1 install can hold (Stage A §3.3), and B2 must pass them before shipping.

**Negative**
- Every release now carries real user data through migrations, a risk the plan tracks (§10). It is mitigated by idempotent migrations and by keeping AsyncStorage for one release.
- The bundle id keeps the original name. Only the display name and the brand change.
- **TBD (owner, before Phase 7):** the public name. The candidates are Pomo Pair, Tomatwo, Pomo & Doro and Two Tomatoes, after the owner's own store and trademark checks.

## Alternatives considered

- None is recorded. The reason given for keeping the id is that installs update in place and the listing carries over (rehaul plan §0, §3.1).

## Links

- [Rehaul plan §0](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29) · [§3.1](../../implementations/2026-10-29-couples-rehaul-plan.md#31-name-and-brand-decision-needed-before-phase-7-working-name-until-then) · [§10](../../implementations/2026-10-29-couples-rehaul-plan.md#10-risks)
- [`PRODUCT.md`, capabilities and constraints](../../../PRODUCT.md#capabilities-and-constraints) · [brand commitments](../../../PRODUCT.md#brand-commitments)
- [Phase 1 plan §0](../../implementations/2026-10-29-phase1-plan.md#0-decisions-you-made-2026-10-29)
- [Phase 1 Stage A §3.3](../../implementations/2026-10-29-phase1-stage-a.md#33-a3-the-v131-storage-fixtures)

## Backlinks
<!-- backlinks:start -->
- [MMKV for local storage, with a one-time migration from AsyncStorage](0030-mmkv-storage.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
