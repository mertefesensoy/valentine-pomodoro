---
id: IMPL-2026-11-08-pgtap-partner-day-clock
title: "pgTAP: a partner's today read back by the partner's own date, so the test can't fail late in the UTC evening"
status: in-progress
date: 2026-11-08
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-07-phase2-f5-submission]
---

# 2026-11-08 — pgTAP: a partner's today, read back by the partner's own date

**Status:** In progress.
**Branch:** `fix/pgtap-partner-day-clock`, one pull request into `master`.
**Found by:** CI's `db` job on PR #38, which changes only docs, at 23:41 UTC on 2026-11-07.

---

## 1. Problem / Motivation

`supabase/tests/functions.test.sql` test 55, "and holds their today", failed with `have: NULL`, `want: 2`. The pull request changed no SQL, so the test depends on the clock.

Ana's profile is set to `Europe/Istanbul` (line 36). Her reports then write `current_date`, which is the date in the database session's zone, UTC in CI. `home_snapshot` looks up a partner's today in the partner's own zone, `(now() at time zone partner.tz)::date`, which is right. From 21:00 to midnight UTC, Istanbul is already on the next day, so the lookup finds no row for "today". A run in those three hours fails, and any other run passes.

**The app isn't affected.** A phone reports its own local date, and `syncTimeZone` keeps the profile's zone in step with the phone, so the reporter's date and the zone `home_snapshot` uses agree. Only the test mixed a UTC date with an Istanbul profile.

## 2. What Changed

| File | Change |
|------|--------|
| `supabase/tests/functions.test.sql` | Ana's four reports use her own date, `(now() at time zone 'Europe/Istanbul')::date`, as her phone would |
| This record | The cause, the fix and how it was shown |

## 3. Implementation Approach

Lines 121 to 124 change from `current_date` to Ana's local date, with a comment saying why. The tests that check validation (negative minutes, a day far ahead) and Cem's unpaired report keep `current_date`, since no zone is read back for them. Bora's tests already report `(now() at time zone 'Pacific/Auckland')::date`, which is the pattern this follows.

`now()` is fixed for the whole transaction, and the file is one transaction, so the date Ana reports and the date `home_snapshot` derives come from the same instant and can't differ.

## 4. Mathematical / Statistical Details

For a zone with offset $o$ hours, its local date differs from the UTC date when the UTC hour $h$ satisfies $h + o \ge 24$ or $h + o < 0$. For Istanbul, $o = +3$, so the failing window is $21 \le h < 24$: three hours a day, 12.5 % of runs at random times. For the reproduction below, Honolulu ($o = -10$) has a different date from Istanbul when $h \ge 21$ or $h < 10$, which covers the hours this was run in.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Report Ana's own local date | Set Ana's zone back to UTC before reporting | The test would no longer check what the app does: a non-UTC partner's day read back by their zone |
| Change only the test | Change `home_snapshot` to read by the server's date | The function is right, and it's what 1.5.0 in App Review runs |

## 6. Verification

- [x] The local pre-check (PGlite, never committed), at 23:57 UTC with the session zone set to `Pacific/Honolulu`: the old file fails test 55 exactly as CI did, `not ok (NULL vs 2) - and holds their today`, and the new one passes all 80.
- [x] The same, with no zone set: 80 of 80, and every other test file passes as before.
- [ ] CI's `db` job on this pull request.
- [ ] **Deploying this:** a change under `supabase/` triggers `deploy-supabase.yml`, which runs `supabase db push` (no new migration, so nothing to apply) and redeploys `delete-account` unchanged.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), §6's pgTAP criterion
- [F5's record](2026-11-07-phase2-f5-submission.md)
