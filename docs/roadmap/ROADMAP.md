---
id: ROADMAP
title: Roadmap — Valentine Pomodoro v2
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [SRS, ARCHITECTURE, IMPL-2026-10-29-couples-rehaul-plan, IMPL-2026-10-29-phase1-plan]
---

# Roadmap

**Where we are (2026-10-30):**
- Phase 0 is done.
- Phase 1 (v1.4.0, iOS): Stage A is done. B1, B1b and B2 are done, and their device check passed on TestFlight build 43. **B3 is next.**
- The App Store has v1.3.1. On TestFlight, `v1.4.0-tf.42` passed the A0 device check, and `v1.4.0-tf.43` (B1, B1b, B2) passed its device check on 2026-10-30.

This page is the **single status board**. Each phase links to its plan, which holds the task detail; each task's "done" evidence lives in its implementation record. **Update the status here in the same commit as the work.** Requirements per phase are in the [SRS](../srs/SRS.md) (field `Target`).

## Milestones

| Milestone | Version | Platforms | Contents | Status |
|-----------|---------|-----------|----------|--------|
| M0 Foundation | — (internal) | — | Tests, CI, SDK 58, CNG, cleanup | **Done** 2026-10-29 |
| **M1 Redesign + local re-architecture** | **1.4.0** | iOS | Phase 1 | **In progress** |
| M2 Accounts and pairing | 1.5.0 (proposed) | iOS | Phase 2 | Planned |
| M3 Studying together | 1.6.0 (proposed) | iOS | Phase 3 | Planned |
| M4 Modes | 1.7–1.9 (proposed) | iOS | Phase 4a–4e | Planned |
| M5 Plus | 1.10 (proposed) | iOS | Phase 5 | Planned |
| M6 Web | 1.11 (proposed) | iOS + web | Phase 6 | Planned |
| **M7 Public launch** | **2.0.0** | iOS + web | Phase 7: rename, rebrand, store listing | Planned |
| MA Android return | TBD | Android | The Android track (below) | Deferred |

The version numbers after 1.4.0 are a proposal. Each phase's plan confirms its version before the phase starts.

## Phases

### Phase 0 — Foundation and safety net · **Done**

| Item | Status | Record |
|------|--------|--------|
| `master` trunk, `rehaul/v2` branch | Done | [Phase 0](../implementations/2026-10-29-phase0-foundation.md) |
| Jest + RNTL + Reassure, the first 25 tests, CI | Done | [Phase 0](../implementations/2026-10-29-phase0-foundation.md) |
| Stats crash fix, Android tab icons | Done | [Phase 0](../implementations/2026-10-29-phase0-foundation.md), [SDK 58](../implementations/2026-10-29-expo-sdk-58-upgrade.md) |
| Expo SDK 54 → 58, CNG | Done | [SDK 58 upgrade](../implementations/2026-10-29-expo-sdk-58-upgrade.md) |
| CI first run, lint fix | Done | [CI first run](../implementations/2026-10-29-ci-first-run-lint-fix.md) |
| Android R8 crash fix | Done (kept for Android's return) | [R8 crash](../implementations/2026-10-29-android-r8-workmanager-crash.md) |
| Fly hidden where it can't run | Done | [Hide Fly](../implementations/2026-10-29-android-hide-fly-mode.md) |
| Documentation system, tags, branch cleanup, Pages move | Done 2026-10-30 | [Docs system](../implementations/2026-10-30-documentation-system.md) |

### Phase 1 — v1.4.0: design system and local re-architecture (iOS) · **In progress**

Plan: [Phase 1 plan](../implementations/2026-10-29-phase1-plan.md) (approved 2026-10-29). Stages B and C can run side by side; D needs C, and E is last.

| Stage | Tasks | Status |
|-------|-------|--------|
| A — Safety nets | A0 iPhone check (TestFlight build 42), A1 guards on both screens, A2 Reassure per screen, A3 v1.3.1 storage fixtures | **Done** ([Stage A](../implementations/2026-10-29-phase1-stage-a.md)) |
| B — Local re-architecture | B1 lazy Fly | **Done** `5b10a78` ([B1](../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md)); device check passed on `v1.4.0-tf.43` |
| | B1b `airports.json` out of the bundle | **Done** `0d63145` ([B1b](../implementations/2026-10-29-phase1-b1b-airports-asset.md)); device check passed on `v1.4.0-tf.43` |
| | B2 MMKV + migration | **Done** `dd1e894` ([B2](../implementations/2026-10-29-phase1-b2-mmkv-migration.md)); device check passed on `v1.4.0-tf.43` (EAS `73ad1446`), 2026-10-30 |
| | B3 Zustand stores, hydrated synchronously; `AppContext` deleted; DEF-001–004 and DEF-007 (haptics) fixed | **Done locally** `71d836f`…`e04cc8c` ([B3](../implementations/2026-10-30-phase1-b3-zustand-stores.md)); not pushed; device check needs a TestFlight build |
| | B4 re-render refactor (gate-checked) · B5 React Compiler · B6 Expo Router · B7 deferred start-up work | Not started |
| C — Design system and art | C1 theme tokens and contrast check · C2 display face · C3 VectorCraft pipeline and first art · C4 `/impeccable shape classic` | Not started |
| D — Screens | D1 Classic rebuilt · D2 Stats/Settings/Notes/Gift restyled, emoji removed · D3 EN/TR · D4 SoundCraft sounds | Not started |
| E — Verify and ship | E1 migration on an iPhone · E2 device checklist · E3 measurements · E4 release prep | Not started |

**Exit criteria** (the Phase 1 plan's "Phase 1 exit"):
- the timer guards are green
- Reassure shows 14 → ≤ 2 renders
- the compiler lint rules are at `error`
- the migration is verified on an iPhone
- the device checklists pass
- `airports.json` is out of the bytecode
- the Classic audit scores ≥ 16/20
- `DECISIONS.md` Q1 is closed
- `DESIGN.md` is regenerated in scan mode

### Phase 2 — Backend, accounts and pairing · Planned

From [rehaul plan §7](../implementations/2026-10-29-couples-rehaul-plan.md#7-roadmap). Requirements: FR-ACC-*, FR-PAR-*, FR-MIG-003, NFR-SEC-001, NFR-PRIV-*.

- **Needs from you:** a Supabase project and a custom domain.
- **Work:** the schema, RLS and pgTAP tests; anonymous sign-in, then Apple, Google or email; account deletion and data export; local-to-cloud upload; invite links and the website `/invite`; Sentry; the new privacy policy.

### Phase 3 — Shared room and presence · Planned

Requirements: FR-SYN-*, FR-SOC-001, FR-NTE-003, FR-STA-007, FR-NTF-004, NFR-PERF-006.

The server-owned session engine, clock-offset sync, Realtime, server pushes, presence, intentions, cheers, partner notes and the couple streak. It is verified on two physical phones.

### Phase 4 — Modes · Planned

| Sub-phase | Mode | Tier | Requirement |
|-----------|------|------|-------------|
| 4a | Shared Garden | Free | FR-MOD-002 |
| 4b | Fly Together, illustrated map, boarding pass | Plus | FR-FLY-005, FR-FLY-006 |
| 4c | Real map option (phones) | Plus | FR-FLY-007 |
| 4d | Study-date Room | Plus | FR-MOD-003 |
| 4e | Shared Pet | Plus | FR-MOD-004 |

### Phase 5 — Monetization · Planned

Requirements: FR-MON-*, FR-ADS-001 rule 4, FR-ADS-002, FR-STA-008, FR-SET-003.

- **Needs from you:** RevenueCat, store products and AdMob production ids.
- **Work:** AdMob 16 → 17, which is a breaking API rewrite. Review the `archive/ios-ads-consent-1.2.3` tag first.

### Phase 6 — Web app and website · Planned

Requirements: FR-WEB-*, FR-MON-005 (web), NFR-PERF-007. The Expo web build, Web Push, the web paywall, the website redesign and Lighthouse CI.

### Phase 7 — Hardening and launch (v2.0.0) · Planned

Polish and harden passes, a Realtime load test, Maestro end-to-end tests, the rename and rebrand, the store listing and a staged rollout. Widgets and Live Activity if time allows.

### Android track · Deferred

**Waits for:** Google Play's closed test (at least 12 testers for 14 consecutive days), which is yours to run.

**Tasks AN0–AN6** are in the [Phase 1 plan §3b](../implementations/2026-10-29-phase1-plan.md#3b-deferred-android-after-v14).

**Kept so it can resume:** the R8 keep rules, the Fly guard, the emulator setup, and the `v1.0.1-android` and `archive/release-android-1.0.1` tags.

## How this roadmap is kept

- A phase starts only when its plan doc is approved, and it's marked **In progress** here in the same commit. The plan isn't ready for approval until every SRS requirement it targets has explicit **Accept** criteria and a **Verify** method (the [definition of ready](../srs/SRS.md#3-specific-requirements)).
- A task is **Done** only when its plan's "done when" holds, with evidence in an implementation record linked from this table.
- Device checks are part of "done", not a backlog (your memory rule).
- A release closes its milestone. The tag, the [CHANGELOG](../../CHANGELOG.md) entry and (from 1.4.0) the GitHub Release follow [RELEASE.md](../process/RELEASE.md).

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Contributing](../../CONTRIBUTING.md)
- [Valentine Pomodoro](../../README.md)
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- [The server owns session time in the shared room](../architecture/adr/0022-server-owns-session-time.md)
- [Server push for shared-session completion and partner actions](../architecture/adr/0023-server-push-for-shared-sessions.md)
- [One session engine; modes are skins](../architecture/adr/0024-one-session-engine-modes-as-skins.md)
- [Expo Router for navigation](../architecture/adr/0028-expo-router.md)
- [Zustand for app state, TanStack Query for server state](../architecture/adr/0029-zustand-and-tanstack-query.md)
- [MMKV for local storage, with a one-time migration from AsyncStorage](../architecture/adr/0030-mmkv-storage.md)
- [2026-10-29 — v2 Couples Rehaul: Plan](../implementations/2026-10-29-couples-rehaul-plan.md)
- [Documentation system, release history and branch cleanup](../implementations/2026-10-30-documentation-system.md)
- [Release process](../process/RELEASE.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
