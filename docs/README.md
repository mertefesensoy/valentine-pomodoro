---
id: DOCS-MAP
title: Documentation map
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [DOCS]
---

# Documentation map

Start here. Every document in the repo is listed below. The rules for writing them are in [DOCS.md](process/DOCS.md).

## Reading order for someone new (human or Claude session)

1. [PRODUCT.md](../PRODUCT.md): who it's for and why
2. [SRS](srs/SRS.md): what it must do
3. [Roadmap](roadmap/ROADMAP.md): where we are, what's next
4. [Architecture](architecture/ARCHITECTURE.md): how it's built, and the [decisions](architecture/adr/README.md) behind it
5. [Test strategy](testing/TEST-STRATEGY.md): how we know it works
6. [CONTRIBUTING.md](../CONTRIBUTING.md): how to work here
7. The current phase plan: [Phase 1 (v1.4)](implementations/2026-10-29-phase1-plan.md)

## Product and design

| Document | What it is |
|----------|------------|
| [PRODUCT.md](../PRODUCT.md) | Users, purpose, positioning, principles (Impeccable `init`) |
| [DESIGN.md](../DESIGN.md) | "The Sticker Diary" design system (seed; regenerated in Phase 1 E4) |
| [README.md](../README.md) | Project overview and quick start |

## Requirements, roadmap, architecture

| Document | What it is |
|----------|------------|
| [SRS](srs/SRS.md) | Software requirements: as built and to be built, each with an ID, a target and a verification method |
| [Roadmap](roadmap/ROADMAP.md) | Milestones, phases and the status board |
| [Architecture](architecture/ARCHITECTURE.md) | As-built and target architecture, runtime views, storage keys, risks |
| [ADR index](architecture/adr/README.md) | Architecture decision records |

## Plans (one per phase or initiative)

| Document | Status |
|----------|--------|
| [v2 couples rehaul plan](implementations/2026-10-29-couples-rehaul-plan.md) | Approved 2026-10-29: the master plan for phases 0–7 |
| [Phase 1 (v1.4) plan](implementations/2026-10-29-phase1-plan.md) | Approved; in progress |
| [Scale plan](scale-plan.md) | 2026-04-20; audited in the rehaul plan §2.3 |
| [Proposal: ticket-cutting (boarding pass)](proposals/ticket-cutting-feature.md) | Folded into Phase 4b (FR-FLY-006) |

## Implementation records (newest first)

| Date | Record |
|------|--------|
| 2026-10-30 | [Phase 1 B3: Zustand stores, hydrated synchronously](implementations/2026-10-30-phase1-b3-zustand-stores.md) |
| 2026-10-30 | [Documentation system, release history, branch cleanup](implementations/2026-10-30-documentation-system.md) |
| 2026-10-29 | [Phase 1 B2: MMKV and the one-time migration](implementations/2026-10-29-phase1-b2-mmkv-migration.md) |
| 2026-10-29 | [Phase 1 B1b: airports.json as a runtime asset](implementations/2026-10-29-phase1-b1b-airports-asset.md) |
| 2026-10-29 | [Phase 1 B1: lazy Fly Mode](implementations/2026-10-29-phase1-b1-lazy-fly-mode.md) |
| 2026-10-29 | [Phase 1 Stage A: safety nets](implementations/2026-10-29-phase1-stage-a.md) |
| 2026-10-29 | [Android: hide Fly Mode](implementations/2026-10-29-android-hide-fly-mode.md) |
| 2026-10-29 | [Android R8 WorkManager crash](implementations/2026-10-29-android-r8-workmanager-crash.md) |
| 2026-10-29 | [CI first run lint fix](implementations/2026-10-29-ci-first-run-lint-fix.md) |
| 2026-10-29 | [Expo SDK 54 → 58 upgrade](implementations/2026-10-29-expo-sdk-58-upgrade.md) |
| 2026-10-29 | [Phase 0: foundation](implementations/2026-10-29-phase0-foundation.md) |
| 2026-05-05 | [AIRMap insert-subview crash fix](implementations/2026-05-05-airmap-insert-subview-crash-fix.md) |
| 2026-04-20 | [Plane driven by the clock](implementations/2026-04-20-plane-clock-driven.md) |
| 2026-04-20 | [MapView nil-child fix](implementations/2026-04-20-mapview-nil-child-fix.md) |
| 2026-04-20 | [Camera simplification](implementations/2026-04-20-camera-simplification.md) |
| 2026-04-19 | [Timer unification (`useSessionClock`)](implementations/2026-04-19-timer-unification.md) |
| 2026-04-19 | [Sheet two-snap](implementations/2026-04-19-sheet-two-snap.md) |
| 2026-04-19 | [Camera: five modes](implementations/2026-04-19-camera-five-modes.md) |
| 2026-04-17 | [Landscape and Fly sheet](implementations/2026-04-17-landscape-and-fly-sheet.md) |
| 2026-04-17 | [Fly Mode iOS bugs](implementations/2026-04-17-fly-mode-ios-bugs.md) |
| 2026-04-17 | [App Store update check](implementations/2026-04-17-app-store-update-check.md) |
| — | [Template for new records](implementations/_TEMPLATE.md) |

## Testing

| Document | What it is |
|----------|------------|
| [Test strategy](testing/TEST-STRATEGY.md) | Levels, tools, guards, gates, the device-check protocol |
| [Traceability](testing/TRACEABILITY.md) | Generated: requirement → tests → docs |
| [Device-check backlog](device-check-backlog.md) | The legacy Fly Mode device checks (retired by Phase 4c) |
| [Baselines 2026-10-29](baselines/2026-10-29/) | Lint, expo-doctor and website Lighthouse at the start of the rehaul |

## Process

| Document | What it is |
|----------|------------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to work here: plan, branch, test, document, commit |
| [Documentation conventions](process/DOCS.md) | Front-matter, IDs, statuses, backlinks, the checker |
| [Branching model](process/BRANCHING.md) | Trunk-based with release tags; the `rehaul/v2` transition |
| [Release process](process/RELEASE.md) | Versions, tags, the release checklist, expiring credentials |
| [CHANGELOG.md](../CHANGELOG.md) | Every version since 1.0.0 |

## History and archive

| Document | What it is |
|----------|------------|
| [v1 plan, 2026-01-07](history/2026-01-07-v1-plan.md) | The plan v1 was built from (a copy of the out-of-repo `PLAN.md`) |
| [DECISIONS.md](../DECISIONS.md) | The v1 decision log; its decisions now live as ADRs |
| [Phase 4 test guide](archive/PHASE4_TEST.md) | Archived; superseded by the test strategy |
| [privacy-policy.md](../privacy-policy.md) | The v1 privacy policy (replaced in Phase 2, NFR-PRIV-002) |

## Backlinks
<!-- backlinks:start -->
- [Changelog](../CHANGELOG.md)
- [Contributing](../CONTRIBUTING.md)
- [Valentine Pomodoro](../README.md)
- [Docs as code, with generated backlinks and traceability](architecture/adr/0040-docs-as-code-generated-backlinks.md)
- [Documentation system, release history and branch cleanup](implementations/2026-10-30-documentation-system.md)
- [Documentation conventions](process/DOCS.md)
- [Requirements traceability (generated)](testing/TRACEABILITY.md)
<!-- backlinks:end -->
