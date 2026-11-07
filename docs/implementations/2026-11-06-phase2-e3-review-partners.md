---
id: IMPL-2026-11-06-phase2-e3-review-partners
title: "Phase 2 E3: partners for App Review"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b3-functions, ADR-0049, SRS]
---

# 2026-11-06 — Phase 2 E3: partners for App Review

**Status:** Built, green in CI, dry-run on the real project, and tried on a phone before the submission. The codes are in App Review's notes, and never in this repository.
**Branch:** `feat/phase2-e3-review-partners`, one pull request into `master`. **Merging deploys,** since it adds a migration.
**Plan task:** [Phase 2 plan §3, E3](2026-11-05-phase2-plan.md#stage-e-reliability-and-policy). Done when the reviewer's path works on a clean install, which a device has to show at F2.

---

## 1. Problem / Motivation

App Review signs in with its own Apple ID, so there's no demo login to give it, and pairing takes two people. The reviewer needs someone to pair with, and that person's day and a note to look at.

The plan's line, one account with a few single-use codes, doesn't survive the code:

- **One account can pair once.** `couple_members.user_id` is unique, and `check_invite` answers `partner_paired` once the code's owner is in a couple. So the first reviewer to redeem makes every other code say "That person is already paired." Each code needs its own account.
- **A sample day goes stale overnight.** `home_snapshot` shows a partner's row only for today's date in their time zone, and the last review took about 23 hours. A row written once shows "Nothing yet today" the next day. So a job writes it again. It runs every 6 hours, since their day's sheet always says when it last updated, and "Updated 22 hours ago" would make a demo look dead.
- **A reviewer would never see a note arrive,** since nobody is on the other side to write one.

The owner, 2026-11-06: "3 accounts, "Review Partner" (Recommended)" and "Yes, one note on pairing (Recommended)".

## 2. What Changed

| File | Change |
|------|--------|
| `supabase/migrations/20261106120000_phase2_review_partners.sql` | The functions, the daily job and the note's trigger. It makes no accounts. |
| `supabase/tests/review_partners.test.sql` | What they do, and that nobody else can call them. |

## 3. Implementation Approach

**The owner runs one line,** `select * from public.seed_review_partners();`, in Supabase's SQL editor, when the submission is near. It returns the three codes for the review notes. Afterwards, `select public.remove_review_partners();` takes it all away.

**The codes are drawn when that runs,** with the existing `random_invite_code()`, so they're never in this public repository. Anyone with a code could pair with a review partner before Apple does.

### The functions

All of them are callable only by `postgres`, which is who the SQL editor runs as. The partners' ids are three fixed UUIDs, which aren't secret: nothing can be done with them. On hosted Supabase `postgres` isn't a superuser, and CI's local stack can't show whether it may write to `auth.users`, so a dry run on the real project is what proves it (§6).

| Function | Takes and returns | Effects |
|----------|-------------------|---------|
| `review_partner_ids()` | Nothing; the three ids | None |
| `seed_review_partners()` | Nothing; each open code with its name | Makes any missing account, sets its name to "Review Partner", its time zone to UTC and its language to English. Gives a code to any account that's neither paired nor already holding one. Writes today's day. Safe to run again, which is how a used code gets replaced |
| `refresh_review_partner_days()` | Nothing | Writes today's row for each partner that exists: 2 sessions, 50 minutes, a 120-minute goal not yet reached. Does nothing when none exist. A job runs it every 6 hours, at 00:05 UTC and so on |
| `remove_review_partners()` | Nothing | Deletes the accounts. The existing cascades take their profiles, codes, days and couples, so a reviewer still paired is simply unpaired |

**The trigger.** After a row goes into `couple_members`, if it's a review partner's, one note goes to the other member: "Hi! This is a sample note from your review partner." Its first line is the id check, so a real pairing does nothing else. It's an `AFTER` trigger, so at the end of the statement both members' rows are there.

**The accounts.** They have no email, password or Apple identity, so nobody can sign in as them, and in-app deletion can't reach them, since that exchanges a code with Apple. Only `remove_review_partners()` can. Their rows set the token columns to empty strings and `instance_id` to the nil UUID, as Supabase's own sign-up does: NULL in those columns breaks the dashboard's user list, and without that `instance_id` they wouldn't appear in it.

## 4. Mathematical / Statistical Details

None. The 50 minutes are stored as `focus_ms` = 50 × 60,000 = 3,000,000.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Three accounts, with one code each. The owner: "3 accounts, "Review Partner" (Recommended)" | One account, as the plan said; one per code on demand | One account can pair only once. Three covers a review, a retry and the owner's own test |
| Functions in a migration, called by hand | A SQL file the owner pastes | pgTAP tests the real thing in CI, and it's one line to run |
| The job runs every 6 hours | Daily, as the question to the owner said | Daily would read "Updated 22 hours ago". It's the same job with the same cost, and it does nothing with no partners |
| The note comes from a trigger. The owner: "Yes, one note on pairing (Recommended)" | The daily job; a job every minute | The note is there the moment they pair, with no job running for ever |
| UTC for the partners | The reviewer's time zone | `home_snapshot` uses the partner's zone, and UTC lines up with the job's schedule |

## 6. Verification

- [x] **A local check on PGlite, not CI:** `review_partners.test.sql` 33 of 33, and the existing `functions`, `rls` and `index_review` 80, 35 and 3, with the new migration applied. It stubs `auth.users`, so it can't prove the real table accepts the row.
- [x] pgTAP in CI (`supabase/tests/review_partners.test.sql`): no accounts until seeded, three codes that never expire, safe to run twice, a reviewer pairs and sees the day and the note, a real couple gets no note, a second code for a paired partner answers `partner_paired`, and nobody but `postgres` can call them.
- [x] The guards.
- [x] **A dry run on the real project, with the owner, after the deploy,** marked as working on build 64 (`r-seed`, `r-remove`), and the server counted the seed's calls: the line runs and returns three codes, Authentication › Users still loads, and `remove_review_partners()` takes them away. Nobody can reach them meanwhile, since the flag is off.
- [x] **On a device, at F2, moved to F5:** the owner tried a code when seeding them for the submission: "Yes, it worked". Before that, the owner's `r-pair` and `r-note` are marked as working, but the server has no record of that pairing ([F2's record](2026-11-06-phase2-f2-testflight.md)). A clean install signs in, types a code, sees "Review Partner", pairs, sees the day, and gets the note after a focus.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), E3 and F4
- [B3's record](2026-11-05-phase2-b3-functions.md)
