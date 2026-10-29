---
id: ADR-0030
title: MMKV for local storage, with a one-time migration from AsyncStorage
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0008, ADR-0010, ADR-0020, ADR-0029]
---

# ADR-0030: MMKV for local storage, with a one-time migration from AsyncStorage

> **Status note:** accepted on 2026-10-29 as part of the approved rehaul plan and Phase 1 plan. **Not built yet** (Phase 1 B2). "Accepted" records the decision; build status is tracked in the [roadmap](../../roadmap/ROADMAP.md).

## Context

v1 stores JSON blobs in AsyncStorage, which reads asynchronously, so the screens hydrate after the first render. A v1.3.1 install can hold 13 keys, including `stats_v2`, `love_notes`, `session_clock` and `ad_policy_v1` (Stage A §3.3). The bundle id stays, so those keys must survive the update ([ADR-0020](0020-public-product-same-bundle-id.md)).

## Decision

Use **react-native-mmkv**, falling back to localStorage on the web (rehaul plan §4.1).

**The one-time migration (B2).**
- **Copy first.** Before any store hydrates, a migrator copies every AsyncStorage key into MMKV.
- **Flag last.** It writes `migration.asyncstorage_v1 = done` only after the copy.
- **Keep the source.** AsyncStorage stays untouched for one release, as a fallback.
- **Notes rule.** An existing install with no `love_notes` key gets the v1.3.1 default notes written explicitly, so the new name-free defaults reach fresh installs only ([ADR-0008](0008-seeded-love-notes-and-one-time-gift-screen.md)).

## Consequences

**Positive**
- Synchronous reads, so the first frame needs no loading flash. The vendor's benchmark claims about 10–30× the speed of AsyncStorage; that is to be re-measured in Phase 1 (§4.1).
- A crash between the copy and the flag simply re-runs an identical copy, and keeping AsyncStorage makes a rollback build possible (Phase 1 plan §5).

**Negative**
- It touches every user's real data, Bengisu's included.
  - **Before shipping:** the A3 fixtures cover a full v1.3.1 install, a fresh install, notes never edited, a torn `session_clock` and a 1.0.0 stats-v1 user.
  - **On a real device:** E1 installs TestFlight v1.4 over App Store 1.3.1 and checks every value.
- Leftover keys (`stats` v1, `update_meta`, `fly_session`) are copied as they are. Dropping them is a decision for after the rollback window (Stage A §7).

## Alternatives considered

- **Keep AsyncStorage.** Asynchronous reads cause the start-up flash (§9).
- **SQLite.** The data is key-value shaped, so it isn't needed on the client (§9).
- **Delete AsyncStorage after copying, or write the flag first.** Rejected in favour of a safe re-run and a rollback path (Phase 1 plan §5).

## Links

- [Rehaul plan §4.1](../../implementations/2026-10-29-couples-rehaul-plan.md#41-stack-changes) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions) · [§10](../../implementations/2026-10-29-couples-rehaul-plan.md#10-risks)
- [Phase 1 plan, Stage B (B2)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates) · [Stage E (E1)](../../implementations/2026-10-29-phase1-plan.md#stage-e--verify-and-ship) · [§5](../../implementations/2026-10-29-phase1-plan.md#5-design-decisions-and-findings)
- [Phase 1 Stage A §3.3](../../implementations/2026-10-29-phase1-stage-a.md#33-a3-the-v131-storage-fixtures) · [§7](../../implementations/2026-10-29-phase1-stage-a.md#7-findings-for-later-sessions)

## Backlinks
<!-- backlinks:start -->
- [Stats stored as a per-day map keyed by YYYY-MM-DD](0010-per-day-stats-map.md)
- [Zustand for app state, TanStack Query for server state](0029-zustand-and-tanstack-query.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
