---
id: IMPL-2026-11-05-phase2-c4-startup-report
title: "Phase 2 C4: the phone's side of the anonymous start-up report"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b4-startup-reports, IMPL-2026-10-30-phase1-b7-deferred-startup, ADR-0051, SRS]
---

# 2026-11-05 — Phase 2 C4: the phone's side of the anonymous start-up report

**Status:** Done, apart from the checks that need the deployed project and TestFlight. The record was written before the code.
**Branch:** `feat/phase2-c4-startup-report`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, C4](2026-11-05-phase2-plan.md#stage-c-the-clients-data-layer-needs-b). The owner, 2026-11-05: "Build it for everyone in 1.5.0", "On by default, off switch", "Half and half" ([ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md)).

---

## 1. Problem / Motivation

The owner wants real launch times from real phones rather than hand-timed runs, and a comparison of the two start-up orders that Phase 1 built and never recorded. The server's side is B4. This is the phone's: join a group once, measure as the probe already does, send one report, and let the person turn it off.

Requirement: [NFR-PERF-008](../srs/SRS.md#nfr-perf-008). It's the first thing a solo phone ever sends, so it has to be exact about what leaves.

## 2. What Changed

| File | Change |
|------|--------|
| `src/startup/startupReport.ts` | New: builds and sends the report. |
| `src/startup/startupVariant.ts` | A launch with no setting from the hidden panel now uses the install's group. |
| `src/server/config.ts` | New: the project's URL and publishable key, from `app.json`. |
| `src/constants/features.ts` | `STARTUP_REPORTS_ENABLED`, which follows `PAIRING_ENABLED`. |
| `src/App.tsx` | Schedules the report. |
| `src/constants/defaults.ts`, `src/types/index.ts` | `shareStartupTimings`, on by default. |
| `src/screens/SettingsScreen.tsx` | The Privacy group, behind the flag. |
| `src/i18n/en.json`, `src/i18n/tr.json` | Its words, drafts for the copy proof (D6). |
| `app.json` | `extra.supabaseUrl` and `extra.supabasePublishableKey` (NFR-SEC-002). |
| `package.json` | `expo-device`, for the iPhone model. |
| `src/startup/__tests__/startupReport.test.ts` | New: exactly what's sent, when, and when not. |
| `src/constants/__tests__/presets.test.tsx`, `src/__fixtures__/storage/v131.ts` | An existing install gets the new setting by the merge, and the fixture still describes only what v1.3.1 wrote. The migration itself isn't touched. |

## 3. Implementation Approach

**Which launch, and when.** A report is this launch's own, sent through `runAfterInteractive`. That task runs in its own idle slice, after the interactive mark and after the deferred drain, in both groups. So the time it reports was already measured before the request starts, and TTI⁺ doesn't move either. The other choice was to send the previous launch's report on the next launch, which loses no killed launches, but it needs a write to storage on every launch, and the B7 record's invariant is that ordinary users store nothing. A launch killed within its first second is rare, and is no great loss to a median.

**`buildStartupReport(row, build, model, os): StartupReport | null`** is a pure function of the probe's row.

- **Returns null** unless the row is one of B7's clean runs (`isCleanRun`) with a usable bundle-start time (`ttiOf(row, 'jsStart')`), which is NFR-PERF-001's definition. So a launch that went to the background, a first launch running the one-time migration, or a failed clock check sends nothing.
- **Holds only:** the group, the time rounded to a whole millisecond (the server rounds to 10 ms), the model, the iOS version and the build. Nothing else exists to send.

**`sendStartupReport()`** reads the switch, then posts to `/rest/v1/rpc/report_startup`, with the publishable key on the `apikey` header and no `Authorization` header, on plain `fetch`. It's fire and forget: it never retries, never shows anything, and never throws. It's not on Query, because this runs for solo users, in front of everything that loads only for pairing. `expo-device` is imported only here, when it's needed.

**The groups.** `resolveLaunchArm()` still gives the hidden panel's setting first. With none, it uses `startup_group_v1`, a new key: read it, or on the first launch draw it (`Math.random() < 0.5` is `deferred`, else `eager`) and store it. A separate key keeps the panel's: writing `startup_variant_v1` would turn on the probe's storage for every install (`hasStartupSetting`), which breaks B7's invariant. Before the one-time storage migration has finished, it answers `deferred` and writes nothing. Such a launch isn't a clean run anyway.

**The switch, `shareStartupTimings`,** defaults to on through the existing merge, so existing installs get it with no migration. It's a privacy choice, so Reset settings leaves it alone, and it's not in the reset's list. Turning it off stops the reports. It leaves the install in its group, since the group only sets an order of work that's already safe.

**`STARTUP_REPORTS_ENABLED`** follows `PAIRING_ENABLED`. Until Stage F the app sends nothing and shows no switch, so `master` stays releasable under 1.4's privacy labels.

## 4. Mathematical / Statistical Details

**The time:** TTI = I − b₀, the interactive mark minus the bundle's start ([B7 record §4](2026-10-30-phase1-b7-deferred-startup.md#4-mathematical--statistical-details)), the same quantity as NFR-PERF-001's.

**The groups:** each install draws once, with probability ½ each. Reports are compared as the plan's §4 says, with its warning: a phone that launches often counts often.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Send this launch's, after the interactive mark | Send the previous launch's on the next | See §3. It needs no write on the start-up path |
| Plain `fetch` | The small client, or Query | This runs for solo users, and must never load what only pairing needs |
| A separate storage key for the group | `startup_variant_v1` | Writing that one would turn on the probe's storage for everyone |
| Stay in the group with the switch off | Move to `deferred` | The group isn't personal data, and moving people would blur the comparison |
| The flag follows `PAIRING_ENABLED` | A separate value to flip | Both reach people together, with one set of privacy labels |

## 6. Verification

- [x] `npx jest src/startup/__tests__/startupReport.test.ts` passes, 21 tests: the exact request, once, only after the interactive mark; none with the switch off or the flag off; none for a launch that isn't clean; the group is drawn once and kept; the panel's choice wins; nothing is written before the migration.
- [x] `npx tsc --noEmit`, `npm run lint`, `npx jest --ci` (528 tests) and `node scripts/docs/check-docs.mjs` pass.
- [x] **On the hosted project, with B4 deployed:** a real request with the publishable key on `apikey` alone answered 204, 2026-11-05. It carried an unknown group, so nothing was written. Reading `startup_reports` the same way answered 401.
- [ ] **Needs a device, at Stage F:** reports arrive from TestFlight.

## 7. Related Docs

- [ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md), [B4's record](2026-11-05-phase2-b4-startup-reports.md), [B7's record](2026-10-30-phase1-b7-deferred-startup.md)
- [SRS](../srs/SRS.md): NFR-PERF-001, NFR-PERF-008, NFR-PRIV-001, NFR-SEC-002
