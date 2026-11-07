---
id: IMPL-2026-11-07-phase2-f3-measures
title: "Phase 2 F3: what 1.5.0 measures on real phones and on the real project"
status: done
date: 2026-11-07
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-f2-testflight, ADR-0051, NFR-PERF-001, NFR-PERF-002, NFR-PERF-008]
---

# 2026-11-07 — Phase 2 F3: what 1.5.0 measures on real phones and on the real project

**Status:** Done. The rows come from the owner, from Supabase's SQL Editor, on build 64.
**Branch:** `docs/phase2-f3-measures`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, F3](2026-11-05-phase2-plan.md#stage-f-verify-and-ship).

---

## 1. Problem / Motivation

The plan's exit criteria ask for cold start against NFR-PERF-001, bytecode against NFR-PERF-002's new ceiling, and a clean N+1 review. None of those can be read from code: the first needs real launches, and the last needs the hosted project's own counters.

## 2. What Changed

| File | Change |
|------|--------|
| This record | The measurements and what they do and don't show. No code changes. |
| `docs/srs/SRS.md` | NFR-PERF-001, NFR-PERF-002 and NFR-PERF-008's statuses take the numbers. |

## 3. Implementation Approach

### Cold start (NFR-PERF-001, NFR-PERF-008)

From `public.startup_reports`, which the app fills after each clean cold start. Time to interactive is the first idle moment after the root's first layout, from the JS bundle's start, so **the native time before the bundle starts isn't in it** (no Mac for Instruments, as the SRS says).

| Build | Group | Model | Reports | Median | Fastest | Slowest |
|-------|-------|-------|---------|--------|---------|---------|
| 63 | deferred | `iPhone17,3` (iPhone 16) | 3 | 120 ms | 110 ms | 230 ms |
| 63 | eager | `iPhone14,7` (iPhone 14) | 3 | 110 ms | 100 ms | 140 ms |
| 64 | deferred | `iPhone17,3` (iPhone 16) | 40 | 80 ms | 70 ms | 120 ms |

**Against the 1.0 s target:** the median of 40 clean starts on build 64 is 80 ms, well inside it. **But that's a 2024 iPhone, and the requirement names an iPhone 12-class phone.** The nearest here is the iPhone 14, with only 3 starts, all on build 63, at 110 ms. A 1.0 s limit leaves a wide margin for an older chip, but that isn't what the requirement names, so §6's "met or decided by the owner" applied, and the owner decided: **"Accept it as met"**.

**The two groups can't be compared yet.** Build 64 has reports from one group only, since each install draws once and only one install reported. The comparison waits for reports from the field, under the plan's §4 limits.

### Bytecode (NFR-PERF-002)

4,600,384 B against the 4,640,000 B ceiling, measured at `96d77a1`, which differs from build 64's `16aaed7` only in a record. 39,616 B is left.

### Reassure

CI's `perf` job on PR #33, the last before build 64: render counts unchanged in every scenario, and stability 4.5 % to 4.7 %. Two screens got 2 ms faster. The one red line, a `TimerText`-sized leaf going from 0.0 to 1.0 ms, is the resolution of the timer at that size.

### The N+1 review

From `extensions.pg_stat_statements`, on every call since the project began, read at 18:12 UTC. At 17:08 UTC `report_startup` read 13 calls, against the 12 rows the table held at 16:57 plus a launch since, which is how we know the counter can be trusted here. The first line given to the owner filtered on `public.`, which PostgREST writes as `"public".`, so it missed the app's calls, and this is its replacement.

| Calls | Mean | Function |
|-------|------|----------|
| 163 | 2.6 ms | `home_snapshot` |
| 48 | 4.6 ms | `report_startup` |
| 5 | 13.5 ms | `create_invite` |
| 5 | 1.6 ms | `report_day` |
| 4 | 191.1 ms | `set_profile` (name and zone) |
| 3 | 252.1 ms | `set_profile` (another shape of arguments) |
| 3 | 12.9 ms | `preview_invite` |
| 3 | 1.9 ms | `mark_note_shown` |
| 1 | 5.7 ms | `unpair` |
| 1 | 3.9 ms | `export_my_data` |
| 1 | 4.0 ms | `send_note` |
| 1 | 16.6 ms | `redeem_invite` |

**There's no N+1.** Each screen makes one call: `home_snapshot` holds the whole partner view, and its 163 calls are the sheet's 10-second poll and the refreshes on returning to the foreground. Nothing calls per row. `mark_note_shown` is one call per note by design. These counters only show top-level calls, so the functions' own bodies were read as well: the only loops are the code generator, `create_invite`'s retries, and the review partners' seed.

**One slow call, which isn't an N+1:** `set_profile` averages about 200 ms because it validates the zone against `pg_catalog.pg_timezone_names`, a view that reads every zoneinfo file. It runs at sign-in, on saving a name and when the phone's zone changes, and never on a screen that's waiting to draw.

## 4. Mathematical / Statistical Details

The median here is `percentile_cont(0.5)`, which averages the two middle values of an even count. Times are rounded on the server to the nearest 10 ms, so a median can end in 5, as build 64's first six did at 95 ms. Reports carry no identifier, so a phone that launches often counts often, and they aren't independent (plan §4). With one install in the 40 rows, 80 ms describes that phone and not the population.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Leave `set_profile`'s check as it is for now | Validate with `now() at time zone p_tz` in an exception block | Not an N+1, rarely run, and a migration to an account function days before a submission needs its own care. It's small work for a later version |
| Rows from the owner | A connection from here | Secrets stay with the owner, and CI's credentials are for deploying |

## 6. Verification

- [x] Reassure: CI `perf` green on PR #33.
- [x] Bytecode under the ceiling.
- [x] N+1 review from the hosted project's counters, and the functions' bodies read.
- [x] Cold start: recorded, and the owner's decision on the iPhone 12-class gap: "Accept it as met".

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), F3 and §6
- [F2's record](2026-11-06-phase2-f2-testflight.md)
- [ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md)
- [B7's record](2026-10-30-phase1-b7-deferred-startup.md), for how the groups are compared
