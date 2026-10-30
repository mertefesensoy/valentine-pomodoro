---
id: ADR-INDEX
title: Architecture decision records
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [DOCS, ADR-0001]
---

# Architecture decision records

One record per significant decision, in the order the decisions were made. [ADR-0001](0001-record-architecture-decisions.md) explains why these exist and how a status is assigned. The conventions are in [DOCS.md](../../process/DOCS.md#4-statuses).

Two rules for reading the statuses:
- **`accepted`** means the decision is made: the owner decided it or approved the plan containing it, whether or not it is built yet. Each record's status note says whether it is built. **`proposed`** is a recommendation not yet decided.
- **A record is `superseded` only once its successor is built.** Until then the old record stays `accepted` and names its successor in a status note, as the v1 decisions do. The first superseded record is ADR-0035, by ADR-0041 (Phase 1 B5). ADR-0002 followed, by ADR-0028 (Phase 1 B6).

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | accepted | 2026-10-30 |
| [ADR-0002](0002-react-navigation-template.md) | React Navigation bottom tabs from the `with-react-navigation` template | superseded by ADR-0028 | 2026-01-07 |
| [ADR-0003](0003-expo-audio.md) | expo-audio for sound, not expo-av | accepted | 2026-01-07 |
| [ADR-0004](0004-timestamp-based-timer.md) | Timestamp-based timer | accepted | 2026-01-07 |
| [ADR-0005](0005-notification-id-tracking.md) | Track and cancel only the session's own notification | accepted | 2026-01-07 |
| [ADR-0006](0006-duration-captured-at-start.md) | Capture the planned duration when a session starts | accepted | 2026-01-07 |
| [ADR-0007](0007-pomodoro-defaults-manual-next-phase.md) | Pomodoro defaults (25/5/15, long break every 4) and a manual start for each phase | accepted | 2026-01-07 |
| [ADR-0008](0008-seeded-love-notes-and-one-time-gift-screen.md) | Seeded love notes and a one-time gift screen | accepted | 2026-01-07 |
| [ADR-0009](0009-svg-progress-ring.md) | Progress ring drawn with react-native-svg `stroke-dashoffset` | accepted | 2026-01-07 |
| [ADR-0010](0010-per-day-stats-map.md) | Stats stored as a per-day map keyed by `YYYY-MM-DD` | accepted | 2026-01-07 |
| [ADR-0011](0011-real-device-testing.md) | Verify notifications and backgrounding on a real device | accepted | 2026-01-07 |
| [ADR-0012](0012-system-fonts.md) | System fonts only | accepted | 2026-01-07 |
| [ADR-0013](0013-valentine-colour-palette.md) | Valentine colour palette | accepted | 2026-01-07 |
| [ADR-0014](0014-hand-built-bar-chart.md) | Hand-built 7-day bar chart, no chart library | accepted | 2026-01-07 |
| [ADR-0015](0015-idempotent-completion.md) | Session completion is idempotent | accepted | 2026-01-07 |
| [ADR-0016](0016-unified-session-clock.md) | One unified session clock (`useSessionClock`) with two slots | accepted | 2026-04-19 |
| [ADR-0017](0017-no-null-in-mapview-child-map.md) | Never return `null` inside a MapView child `.map()` | accepted | 2026-04-20 |
| [ADR-0018](0018-three-camera-modes.md) | Three Fly Mode camera modes and a restored globe toggle | accepted | 2026-04-20 |
| [ADR-0019](0019-clock-driven-plane.md) | The plane's position is a pure function of the clock | accepted | 2026-04-20 |
| [ADR-0020](0020-public-product-same-bundle-id.md) | A public couples product on the existing bundle id | accepted | 2026-10-29 |
| [ADR-0021](0021-supabase-backend.md) | Supabase as the backend | accepted | 2026-10-29 |
| [ADR-0022](0022-server-owns-session-time.md) | The server owns session time in the shared room | accepted | 2026-10-29 |
| [ADR-0023](0023-server-push-for-shared-sessions.md) | Server push for shared-session completion and partner actions | accepted | 2026-10-29 |
| [ADR-0024](0024-one-session-engine-modes-as-skins.md) | One session engine; modes are skins | accepted | 2026-10-29 |
| [ADR-0025](0025-couple-subscription-and-capped-ads.md) | A couple subscription (Plus) plus capped free-tier ads | accepted | 2026-10-29 |
| [ADR-0026](0026-illustrated-map-real-map-plus.md) | An illustrated map for everyone; the real map as a phone-only Plus extra | accepted | 2026-10-29 |
| [ADR-0027](0027-vectorcraft-art-soundcraft-sounds.md) | VectorCraft for all vector art; SoundCraft for all app sounds | accepted | 2026-10-29 |
| [ADR-0028](0028-expo-router.md) | Expo Router for navigation | accepted | 2026-10-29 |
| [ADR-0029](0029-zustand-and-tanstack-query.md) | Zustand for app state, TanStack Query for server state | accepted | 2026-10-29 |
| [ADR-0030](0030-mmkv-storage.md) | MMKV for local storage, with a one-time migration from AsyncStorage | accepted | 2026-10-29 |
| [ADR-0031](0031-lazy-fly-mode.md) | Load Fly Mode lazily | accepted | 2026-10-29 |
| [ADR-0032](0032-continuous-native-generation.md) | Generate the native projects from `app.json` (CNG) | accepted | 2026-10-29 |
| [ADR-0033](0033-one-sdk-at-a-time.md) | Upgrade Expo one SDK at a time, before the refactor | accepted | 2026-10-29 |
| [ADR-0034](0034-admob-held-on-16.md) | Hold `react-native-google-mobile-ads` on v16 until Phase 5 | accepted | 2026-10-29 |
| [ADR-0035](0035-react-compiler-lint-warnings.md) | React Compiler lint rules as warnings until Phase 1 B5 | superseded by ADR-0041 | 2026-10-29 |
| [ADR-0036](0036-airports-json-out-of-bundle.md) | Move `airports.json` out of the JS bundle | accepted | 2026-10-29 |
| [ADR-0037](0037-ios-first-android-deferred.md) | iOS first; Android deferred until the Play closed test | accepted | 2026-10-29 |
| [ADR-0038](0038-trunk-based-branching-and-tags.md) | Trunk-based branching with version tags; GitHub Releases from v1.4.0 | accepted | 2026-10-30 |
| [ADR-0039](0039-testflight-prerelease-tags.md) | TestFlight builds get SemVer pre-release tags (`-tf.N`) | accepted | 2026-10-30 |
| [ADR-0040](0040-docs-as-code-generated-backlinks.md) | Docs as code, with generated backlinks and traceability | accepted | 2026-10-30 |
| [ADR-0041](0041-react-compiler-on.md) | The React Compiler is on, and Jest compiles app code the way Metro does | accepted | 2026-10-30 |
| [ADR-0042](0042-design-skill-stack.md) | Design work runs on Impeccable, the Apple HIG skill and Emil Kowalski's skills, in a fixed precedence | accepted | 2026-10-30 |
| [ADR-0043](0043-native-tabs-frozen-by-a-wrapper.md) | Native tabs, frozen by a route wrapper, laid out by safe-area insets | accepted | 2026-10-30 |
| [ADR-0045](0045-theme-tokens-and-contrast-gate.md) | Theme tokens in one JSON file, proved by a blocking contrast gate | accepted | 2026-10-30 |
| [ADR-0046](0046-display-face-baloo-2.md) | Baloo 2 for the timer, headings and sticker captions; the system face for everything else | accepted | 2026-10-30 |
| [ADR-0047](0047-same-page-mark-and-the-colon-characters.md) | The Same Page mark, Pomo & Doro as The Colon's two round characters, and no tomato anywhere | accepted | 2026-10-30 |

**Where the decisions come from:**
- **v1 (2026-01-07):** [`DECISIONS.md`](../../../DECISIONS.md). Its open questions Q1–Q3 are answered in ADR-0003 and ADR-0027 (Q1), ADR-0008 (Q2) and ADR-0014 (Q3).
- **April 2026:** the Fly Mode implementation records in `docs/implementations/2026-04-*`.
- **2026-10-29/30:** the [rehaul plan](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29), the [Phase 0](../../implementations/2026-10-29-phase0-foundation.md), [SDK 58 upgrade](../../implementations/2026-10-29-expo-sdk-58-upgrade.md) and [Phase 1](../../implementations/2026-10-29-phase1-plan.md#0-decisions-you-made-2026-10-29) docs, and the [documentation-system record](../../implementations/2026-10-30-documentation-system.md).

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../../CHANGELOG.md)
- [Contributing](../../../CONTRIBUTING.md)
- [Valentine Pomodoro - Design Decisions Log](../../../DECISIONS.md)
- [Valentine Pomodoro](../../../README.md)
- [Documentation map](../../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../ARCHITECTURE.md)
- [Record architecture decisions](0001-record-architecture-decisions.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../../srs/SRS.md)
<!-- backlinks:end -->
