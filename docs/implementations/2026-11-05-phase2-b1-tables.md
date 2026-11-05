---
id: IMPL-2026-11-05-phase2-b1-tables
title: "Phase 2 B1: supabase/ in the repo, and this phase's tables"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, ADR-0021, ADR-0049, ADR-0051, SRS]
---

# 2026-11-05 — Phase 2 B1: `supabase/` in the repo, and this phase's tables

**Status:** Done. The migration applies on a clean database in CI's `db` job. Nothing is deployed to the hosted project yet.
**Branch:** `feat/phase2-b1-schema`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, B1](2026-11-05-phase2-plan.md#stage-b-the-backend).

---

## 1. Problem / Motivation

Everything in 1.5.0 that isn't on the phone needs a schema: who's in a couple, what a code can do, a day's totals and a note. The plan takes the tables from [rehaul §4.3](2026-10-29-couples-rehaul-plan.md#43-database-schema-indexes-and-rls), this phase's only, and changes them where the owner's decisions require it.

## 2. What Changed

| File | Change |
|------|--------|
| `supabase/config.toml` | New: the local setup CI uses. Postgres 17, as the hosted project reports. |
| `supabase/migrations/20261105120000_phase2_tables.sql` | New: six tables, their triggers and indexes. |
| `.github/workflows/ci.yml` | New `db` job: applies the migrations to a clean database on GitHub's runner. |
| `.gitignore` | Ignores the Supabase CLI's local state. |

## 3. Implementation Approach

**Nothing is reachable unless a later migration grants it.** The hosted project was created with "Automatically expose new tables" off and automatic RLS on, while a local `supabase db start` has neither. So this migration makes them behave alike: it revokes the default privileges, enables row-level security on every table and revokes each table from `anon` and `authenticated`. After B1 alone, the tables can't be reached at all. B2 adds what's allowed.

**The tables:**

| Table | Holds | Notes |
|---|---|---|
| `profiles` | A person: `display_name`, `tz`, `locale` | `id` is `auth.users.id`, cascading. A trigger on `auth.users` creates the row. The name is nullable, because Apple sends it only on the first sign-in, in the native response, and the client saves it just after. `failed_redeems` and `failed_redeems_at` carry the limit on wrong codes (plan §4) |
| `couples` | One pairing: `id`, `created_at` | The later columns (`home_tz`, `plus_until`, `goal_minutes`) wait for their phases |
| `couple_members` | Who's in which couple | Unique `user_id`: one couple per person (FR-PAR-002). Deleting a member deletes the couple, by trigger, so a deleted account dissolves it |
| `invites` | A code: `created_by`, `expires_at`, `used_at`, `used_by` | The check pins the 31-symbol alphabet. There's no `couple_id`, unlike the rehaul's, because the couple is created at redemption. `expires_at` is never null; seeded review codes use `'infinity'` (plan E3). A partial unique index allows one open code per person, and doesn't apply to those |
| `daily_stats` | A day's totals | The rehaul's key, `(owner_kind, owner_id, day_key)`, kept for Phase 3. `goal_minutes` added, as FR-PAR-003 shows a goal. A trigger deletes a person's rows with their profile, since `owner_id` can't have a foreign key to two tables |
| `love_notes` | A note to your partner | 1 to 280 characters (`NOTE_MAX_LENGTH`). `couple_id` cascades, so unpairing and deleting an account remove notes by one path. `client_id`, unique per author, makes a retry of `send_note` safe |

**Function contracts:**

- `handle_new_user()`: an `after insert` trigger on `auth.users`. Inserts the `profiles` row. Runs as its owner, with an empty `search_path`.
- `dissolve_couple()`: an `after delete` trigger on `couple_members`. Deletes the couple the member was in, which cascades to the other member and the notes. The cascade fires the trigger again, and that second delete finds nothing.
- `delete_user_stats()`: an `after delete` trigger on `profiles`. Deletes that person's `daily_stats`.

## 4. Mathematical / Statistical Details

**The code alphabet:** A–Z and 2–9 without I, L and O: 23 letters and 8 digits, 31 symbols, as the check `^[A-HJKMNP-Z2-9]{6}$` states (plan §4).

**Units:** `focus_ms` stays in milliseconds, as the plan's §4 and Phase 3's `session_credits` have it. The phone counts minutes, so C3 sends minutes × 60,000.

**Lengths:** `char_length` counts code points, and the phone's 280 counts UTF-16 units, so a note the phone accepts never exceeds the server's limit.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| The limit's state on `profiles` | A seventh table, `invite_attempts` | The plan keeps to six tables, and two columns are enough. B2 grants `SELECT` on `profiles` by column, so a partner can't read them |
| `expires_at not null`, `'infinity'` for review codes | Null meaning "never" | A forgotten null can't then create an immortal code. `create_invite` (B3) always sets 24 hours, and only the seed script can write `'infinity'` |
| Triggers for the cascades that foreign keys can't do | Doing it in `delete-account` | Deleting a row in `auth.users` must be enough, however it's done, so nothing can be left behind |
| `db` job in CI from this task | Wait for B2 | "Migrations apply on a clean database" is B1's own exit, and this machine has no Docker |

## 6. Verification

- [x] CI's `db` job (`supabase db start`) applies the migration to a clean database.
- [x] A local run on PGlite, with a stub for `auth`, applies it and exercises the triggers. This is a pre-check only: CI is the gate.
- [ ] Applied to the hosted project: at deployment, the owner's step.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), B1, §4 and §0.3
- [Rehaul plan §4.3](2026-10-29-couples-rehaul-plan.md#43-database-schema-indexes-and-rls)
- [ADR-0021](../architecture/adr/0021-supabase-backend.md), [ADR-0049](../architecture/adr/0049-account-only-at-pairing.md)
- [SRS](../srs/SRS.md): FR-PAR-001, FR-PAR-002, FR-PAR-003, FR-ACC-003, NFR-SEC-001
