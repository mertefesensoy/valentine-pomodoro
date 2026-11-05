---
id: IMPL-2026-11-05-phase2-b3-functions
title: "Phase 2 B3: the database functions and the delete-account Edge Function"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b1-tables, IMPL-2026-11-05-phase2-b2-rls, ADR-0049, ADR-0050, SRS]
---

# 2026-11-05 — Phase 2 B3: the database functions and the `delete-account` Edge Function

**Status:** Done, apart from the check against Apple with a real account, at Stage D. The record was written before the code.
**Branch:** `feat/phase2-b3-functions`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, B3](2026-11-05-phase2-plan.md#stage-b-the-backend).

---

## 1. Problem / Motivation

B2 lets people read their own rows and write nothing. Everything that changes data goes through these functions, so each one is where its rule lives: a code's expiry and limit, a day that can only grow, a note's length and rate. Deleting an account needs more than the database can do, because Apple requires the token to be revoked, so that one is an Edge Function.

Requirements: [FR-PAR-001](../srs/SRS.md#fr-par-001), [FR-PAR-002](../srs/SRS.md#fr-par-002), [FR-PAR-003](../srs/SRS.md#fr-par-003), [FR-NTE-003](../srs/SRS.md#fr-nte-003), [FR-ACC-003](../srs/SRS.md#fr-acc-003), [FR-ACC-004](../srs/SRS.md#fr-acc-004).

## 2. What Changed

| File | Change |
|------|--------|
| `supabase/migrations/20261105140000_phase2_functions.sql` | New: the functions below, and exactly who can call them. |
| `supabase/tests/functions.test.sql` | New: pgTAP on each function, including replays, the limits and deletion. |
| `supabase/tests/index_review.test.sql` | New: 100,000 `daily_stats` rows, and the plans of the two hot queries. |
| `supabase/functions/delete-account/handler.ts` | New: the deletion flow, with its dependencies passed in. |
| `supabase/functions/delete-account/index.ts` | New: the Deno entry point that wires the real ones. |
| `src/__tests__/deleteAccountHandler.test.ts` | New: the flow's order and its failures, under Jest. |
| `tsconfig.json`, `eslint.config.js` | Leave `supabase/functions/*/index.ts` to Deno. |
| `supabase/config.toml` | `delete-account` checks its own token. |

## 3. Implementation Approach

**Every function** is `security definer` with an empty `search_path` and fully qualified names, revoked from `public` and `anon`, and granted to `authenticated` by name. A signed-out call has no `auth.uid()`, and fails.

**Expected outcomes come back as a status, not an error,** and that matters for one reason besides tidiness: raising would roll back the transaction, and with it the recorded failed try. The app reads `status`. Errors are kept for what shouldn't happen.

| Function | Input | Returns | Rule |
|---|---|---|---|
| `set_profile` | name, time zone, locale, each optional | status | Saves only what's given. A name is trimmed to 1–60 characters; a time zone must be one Postgres knows, because `home_snapshot` depends on it |
| `create_invite` | none | status, code, expires_at | 24 hours. Cancels your earlier open code. Random from the 31-symbol alphabet, by rejection sampling so that each symbol is equally likely, retrying on the rare collision |
| `preview_invite` | code | status, inviter's name | Shows who it is. Counts a wrong code towards the limit |
| `redeem_invite` | code | status, couple, partner's name | Creates the couple and both members. Replaying it as the same person returns the same result |
| `unpair` | none | status | Deletes the couple, so the members and the notes go by cascade. Each person keeps their own days |
| `report_day` | day, ms, sessions, goal hit, goal minutes | status | Keeps the largest ms and sessions, and ORs the goal (plan §4). Unpaired, it writes nothing |
| `send_note` | client id, text | status, id | Your partner only. 1–280 characters after trimming. At most 20 a day. A repeated client id returns the first note |
| `mark_note_shown` | note id | status | Recipient only, and the first time counts |
| `home_snapshot` | none | everything the app shows | One request: you, the couple, your partner, their today, their latest update, your undelivered notes, your open code |
| `export_my_data` | none | JSON | Your profile, your couple, your days, the notes you wrote and received (FR-ACC-004) |

**Status values for a code:** `ok`, `invalid`, `expired`, `used`, `own_code`, `already_paired`, `partner_paired`, `rate_limited`.

**`redeem_invite`'s concurrency.** Two people can redeem each other's codes at the same moment. It takes advisory locks on both user ids in sorted order, so the second waits and then sees the first's couple, with no deadlock. A unique violation on `couple_members.user_id` is caught as `partner_paired`.

**`delete-account`.** `handle(request, deps)` does this, in order, and stops at the first failure:

1. Read the bearer token, and ask Supabase who it belongs to (`GET /auth/v1/user`). A stranger gets a 401.
2. Read the fresh `authorization_code`, which the app gets by asking the person to confirm with Apple.
3. Sign a client secret (ES256, five minutes, with the `.p8` key) and exchange the code at Apple's `/auth/token`.
4. Revoke the resulting refresh token at Apple's `/auth/revoke`.
5. Delete the user (`DELETE /auth/v1/admin/users/{id}`, with the secret key on `apikey`, since Supabase's new keys aren't JWTs). The triggers from B1 do the rest.

If Apple refuses, nothing is deleted, the app says so, and the person can try again. Deletion is last and is one call, so the database is never left half-gone. One gap to know about: if step 4 succeeds and step 5 fails, Apple's token is already revoked while the account remains. A retry still works while the person's Supabase session is valid, because they get a fresh code from Apple. The header step 5 sends is checked against the real project after the first deployment, with one `curl` by the owner.

## 4. Mathematical / Statistical Details

**A uniform code.** `gen_random_bytes` gives bytes from 0 to 255. Taking `byte % 31` directly would favour the first eight symbols, because 256 = 8 × 31 + 8. So bytes of 248 or more are thrown away: 248 = 8 × 31, and each remaining residue has exactly 8 byte values. Each symbol has probability 1/31, which is what the plan's 31⁶ figure assumes.

**The limit.** A fixed window: on a failure, if the last failure is over an hour old, the count restarts at 1; otherwise it adds 1. At a count of 5 within the hour, `preview_invite` and `redeem_invite` answer `rate_limited` without looking the code up. That gives at most 5 guesses an hour and 120 a day, as the plan's §4 assumes.

**A day can only grow.** `report_day` sets focus_ms' = max(focus_ms, reported), and the same for sessions; goal_hit' = goal_hit OR reported. `goal_minutes` is simply the latest reported, because it isn't a total, so a late replay can briefly show an older goal. A goal's size isn't a count anyone is credited for, and the next report corrects it.

**Your partner's today:** day = (now() at time zone their tz)::date. Without a row for that date, `partner_today` is null, and the app says "Nothing yet today".

**A note for C1 and D1.** If two people redeem each other's codes at the same moment, the second call may find its inviter's code gone and answer `already_paired`, though it's paired with exactly the person typed. So the client treats `already_paired` as "refresh the snapshot", never as an error.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A separate `preview_invite` | A confirm flag on `redeem_invite` | The two have different effects, and a boolean argument that decides whether something irreversible happens is an easy mistake |
| The limit counts only `invalid`, `expired` and `used` | Every failure | Your own code, or being already paired, isn't a guess |
| 20 notes a day | No limit; a per-minute limit | A partner's inbox can't be flooded, and it never comes near real use. The plan says only "rate-limited", so the number is mine and is easy to change |
| The Edge Function's flow as a pure handler | All in `index.ts` | It can be tested under Jest, with no Deno and no real Apple. The real check against Apple comes with a real account |
| Refuse to delete if Apple's revoke fails | Delete anyway and log it | The plan and Apple both call for the revoke, and a failed revoke is usually a passing outage. The person can try again |

## 6. Verification

- [x] `supabase test db` in CI: `functions.test.sql` (80 checks) and `index_review.test.sql` (3), on pull request #12.
- [x] On the hosted project: `delete-account` answers 401 `{"status":"not_signed_in"}` with no token, and `home_snapshot`, `profiles` and `invites` answer 401 to the publishable key alone.
- [x] `npx jest src/__tests__/deleteAccountHandler.test.ts` passes: 10 tests.
- [x] `npx tsc --noEmit`, `npm run lint`, `npx jest --ci` and `node scripts/docs/check-docs.mjs` pass.
- [ ] **Needs a real account, at Stage D:** the function deletes a real user, and the token no longer works with Apple.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), B3, §4 and §5
- [B1's record](2026-11-05-phase2-b1-tables.md), [B2's record](2026-11-05-phase2-b2-rls.md)
- [SRS](../srs/SRS.md): FR-PAR-*, FR-NTE-003, FR-ACC-003, FR-ACC-004
