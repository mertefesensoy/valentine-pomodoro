---
id: IMPL-2026-11-05-phase2-b4-startup-reports
title: "Phase 2 B4: the table and function for anonymous start-up reports"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b3-functions, ADR-0051, SRS]
---

# 2026-11-05 — Phase 2 B4: the table and function for anonymous start-up reports

**Status:** Done on the server's side. C4 builds the phone's side.
**Branch:** `feat/phase2-b4-startup-reports`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, B4](2026-11-05-phase2-plan.md#stage-b-the-backend). The owner, 2026-11-05: "Build it for everyone in 1.5.0", "On by default, off switch" ([ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md)).

---

## 1. Problem / Motivation

The owner wants real launch times from real phones, with two random groups. Since a solo user has no account, the report has to work with the publishable key alone, which means anyone can call it. So this function is the one thing `anon` may do anywhere in the database, and the table must hold nothing that could identify a person, whatever a caller sends.

Requirements: [NFR-PERF-008](../srs/SRS.md#nfr-perf-008), [NFR-PRIV-001](../srs/SRS.md#nfr-priv-001).

## 2. What Changed

| File | Change |
|------|--------|
| `supabase/migrations/20261105150000_phase2_startup_reports.sql` | New: `startup_reports`, `report_startup`, and two daily `pg_cron` jobs. |
| `supabase/tests/startup_reports.test.sql` | New: 19 pgTAP checks. |

## 3. Implementation Approach

**The table** holds `day`, `arm`, `tti_ms`, `model`, `os` and `build`. Every column has a check. In particular, `model` must look like `iPhone13,2`, so a phone's name ("Mert's iPhone") can't land there even if a client sends it.

**`report_startup(p_arm, p_tti_ms, p_model, p_os, p_build) returns void`**

- **Who:** `anon` and `authenticated`. Nothing else is callable by `anon`, and a test lists it.
- **Effect:** inserts one row, with the time rounded to 10 ms. The day comes from the server.
- **A bad report** is dropped silently, with no error and nothing returned: a client has nothing useful to do about it, and a caller learns nothing.
- **Reading** needs the service role or the dashboard's SQL editor. Nobody reads with the publishable key.

**Retention:** a daily `pg_cron` job deletes rows over 90 days old (NFR-PRIV-001). A second daily job sweeps codes that expired over a day ago, using the partial index from B1, and never touches the review codes.

## 4. Mathematical / Statistical Details

**Rounding:** t' = 10 · round(t / 10), so 812 ms is stored as 810 ms. It's a small privacy step (exact timings can't be matched across reports), and it costs nothing against a 1,000 ms target.

**Reading the groups** is in the plan's §4: the difference of medians and the Hodges–Lehmann shift, with the warning that reports aren't independent.

**What this can't protect against.** The publishable key is public, and there's no identity to limit by, so anyone can send valid-looking rows. The check constraints bound the damage, not the volume. So a result should be read with its counts by build and day, and a sudden jump in volume should be doubted. If it becomes a real problem, the Free plan's limits surface it first, and a rate limit belongs at the edge, in a later version.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A function, with no table grant | An `INSERT` policy for `anon` | The function rounds the time, and sets the day itself, so a caller can't backdate a row or see a constraint's error |
| Drop bad reports silently | Return an error | The caller is an app that wouldn't act on it, and an error tells a stranger what passes |
| Only the day, not a timestamp | `created_at` | A precise time plus a model and build narrows down who sent it, and analysis only needs the day |
| `pg_cron` here | An Edge Function on a schedule | `pg_cron` is already part of the plan's stack, and it needs no secrets |
| A second job for expired codes | Leave them | `create_invite` only cleans up after people who come back; this catches the rest, with the index B1 built for it |

## 6. Verification

- [x] `supabase test db` in CI: `startup_reports.test.sql` (19 checks), on pull request #15.
- [x] `node scripts/docs/check-docs.mjs`: 0 errors.
- [x] **On the hosted project:** with the new `sb_publishable_` key on `apikey` alone, `report_startup` answers 204, and reading the table answers 401.

## 7. Related Docs

- [ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md), [Phase 2 plan](2026-11-05-phase2-plan.md) §0.3 and §4
- [SRS](../srs/SRS.md): NFR-PERF-001, NFR-PERF-008, NFR-PRIV-001
