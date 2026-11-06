---
id: IMPL-2026-11-06-phase2-e3-review-partners
title: "Phase 2 E3: partners for App Review"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b3-functions, ADR-0049, SRS]
---

# 2026-11-06 — Phase 2 E3: partners for App Review

**Status:** Plan. Written before the code.
**Branch:** `feat/phase2-e3-review-partners`, one pull request into `master`. **Merging deploys,** since it adds a migration.
**Plan task:** [Phase 2 plan §3, E3](2026-11-05-phase2-plan.md#stage-e-reliability-and-policy). Done when the reviewer's path works on a clean install, which a device has to show at F2.

---

## 1. Problem / Motivation

App Review signs in with its own Apple ID, so there's no demo login to give it, and pairing takes two people. The reviewer needs someone to pair with, and that person's day and a note to look at.

The plan's line, one account with a few single-use codes, doesn't survive the code:

- **One account can pair once.** `couple_members.user_id` is unique, and `check_invite` answers `partner_paired` once the code's owner is in a couple. So the first reviewer to redeem makes every other code say "That person is already paired." Each code needs its own account.
- **A sample day goes stale overnight.** `home_snapshot` shows a partner's row only for today's date in their time zone, and the last review took about 23 hours. A row written once shows "Nothing yet today" the next day. So it's written daily.
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

All of them are callable only by `postgres`, which is who the SQL editor runs as. The partners' ids are three fixed UUIDs, which aren't secret: nothing can be done with them.

| Function | Takes and returns | Effects |
|----------|-------------------|---------|
| `review_partner_ids()` | Nothing; the three ids | None |
| `seed_review_partners()` | Nothing; each open code with its name | Makes any missing account, sets its name to "Review Partner", its time zone to UTC and its language to English. Gives a code to any account that's neither paired nor already holding one. Writes today's day. Safe to run again, which is how a used code gets replaced |
| `refresh_review_partner_days()` | Nothing | Writes today's row for each partner that exists: 2 sessions, 50 minutes, a 120-minute goal not yet reached. Does nothing when none exist. A daily job runs it at 00:05 UTC |
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
| The note comes from a trigger. The owner: "Yes, one note on pairing (Recommended)" | The daily job; a job every minute | The note is there the moment they pair, with no job running for ever |
| UTC for the partners | The reviewer's time zone | `home_snapshot` uses the partner's zone, and UTC lines up with the job's schedule |

## 6. Verification

- [ ] pgTAP in CI (`supabase/tests/review_partners.test.sql`): no accounts until seeded, three codes that never expire, safe to run twice, a reviewer pairs and sees the day and the note, a real couple gets no note, a second code for a paired partner answers `partner_paired`, and nobody but `postgres` can call them.
- [ ] The guards.
- [ ] **On the real project, with the owner, before the submission:** the line runs, it returns three codes, and Authentication › Users still loads.
- [ ] **On a device, at F2:** a clean install signs in, types a code, sees "Review Partner", pairs, sees the day, and gets the note after a focus.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), E3 and F4
- [B3's record](2026-11-05-phase2-b3-functions.md)
