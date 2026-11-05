---
id: IMPL-2026-11-05-phase2-c3-report-day
title: "Phase 2 C3: a paired person's day reaches the server"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b3-functions, IMPL-2026-11-05-phase2-c2-home, SRS]
---

# 2026-11-05 — Phase 2 C3: a paired person's day reaches the server

**Status:** Done, apart from the two-phone check at Stage F. The record was written before the code.
**Branch:** `feat/phase2-c3-report-day`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, C3](2026-11-05-phase2-plan.md#stage-c-the-clients-data-layer-needs-b). Requirement: [FR-PAR-003](../srs/SRS.md#fr-par-003).

---

## 1. Problem / Motivation

For your partner to see your day, your day's totals have to reach the server, whenever a focus is credited, including from a library with no signal, and only while you're paired. A paired person's stats history stays on the phone: uploading it waits for 1.6.0 (FR-MIG-003).

## 2. What Changed

| File | Change |
|------|--------|
| `src/server/dayReports.ts` | New: watches the stats store, keeps a small queue, and sends it. |
| `src/server/timeZone.ts` | New: tells the server this phone's time zone when it changes. |
| `src/server/runtime.ts` | Starts them, and runs them on returning to the foreground. |
| `src/server/__tests__/dayReports.test.ts` | New: offline, replay, across midnight, unpaired, and no history. |
| `src/server/__tests__/home.test.ts` | Counts `home_snapshot` itself, now that the runtime makes other calls beside it. |

## 3. Implementation Approach

**It listens and never reaches in.** `startDayReports()` subscribes to the stats store and looks only at which days' objects changed. The session engine, the clock store and the stats store's own code aren't touched, as the plan requires.

**The queue** is one MMKV key, `day_reports_pending_v1`: a map from a day to that day's latest totals. It's small by construction, since each day appears once and a later change simply replaces it. It survives the app being killed.

**`flushDayReports()`** sends what's queued, oldest day first, one at a time, with only one flush running.

| The answer | What happens |
|---|---|
| `ok` | Removed from the queue |
| `invalid` | Removed: sending it again can't help |
| `not_paired` | The whole queue is emptied: the server says nothing should be sent |
| `Offline`, `ServerError` or `SessionEnded` | Kept, and the flush stops until the next chance |

**When:** on a credited focus, at the runtime's start, and on returning to the foreground. At the start and on the foreground it also queues today, so a person's day shows up as soon as they pair, not only after their next focus.

**Paired only.** A person with an account but no couple, waiting for their partner, sends nothing: every entry point checks the cached snapshot's `couple`. With no snapshot yet, it sends nothing either. `report_day` also refuses on the server.

**No history.** Only today and yesterday are ever queued. Yesterday is there because a session that crosses midnight is credited to the day it started. So a rehydrate of the whole store can't upload the past (FR-MIG-003).

**Units:** the store counts minutes, and the server keeps milliseconds, so `p_focus_ms` = `focusMinutes` × 60,000.

**The time zone.** `home_snapshot` finds a partner's today from `profiles.tz`. So `syncTimeZone()` sends the phone's zone through `set_profile` when it differs from the last one sent (`profile_tz_v1`), at the start and on the foreground. A failure just tries again next time.

## 4. Mathematical / Statistical Details

**Why a queue of latest totals is safe.** The server keeps max(stored, reported) for minutes and sessions, and ORs the goal (plan §4). So sending a day twice changes nothing, and sending days out of order can't lower one. A failed send only has to be repeated, never reconciled.

**Which days:** a day d is queued only when d ≥ today − 1, comparing local calendar dates.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Its own small queue | TanStack's persisted mutations | Totals for a day replace each other, which a list of mutations wouldn't do. This is a map, about 40 lines |
| Subscribe to the store | Call it from `incrementFocus` | The plan keeps server code out of the stats path, and a solo user's store stays exactly as it was |
| Queue today at start and on foreground | Only after a credited focus | Your partner would otherwise see nothing until your next session, even with sessions done today |
| Today and yesterday only | Any changed day | A rehydrate changes every day's object, and history waits for 1.6.0 |

## 6. Verification

- [x] `npx jest src/server/__tests__/dayReports.test.ts`: offline, replay, across midnight, unpaired, a refused session, and that history isn't uploaded.
- [x] `npx tsc --noEmit`, ESLint, `npx jest --ci` and `node scripts/docs/check-docs.mjs` pass.
- [ ] **On two phones, at Stage F:** each sees the other's day update after a focus and a return to the foreground.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), C3 and §4
- [B3's record](2026-11-05-phase2-b3-functions.md), [C2's record](2026-11-05-phase2-c2-home.md)
- [SRS](../srs/SRS.md): FR-PAR-003, FR-MIG-003
