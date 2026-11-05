---
id: IMPL-2026-11-05-phase2-deploy
title: "Phase 2: GitHub deploys database changes on merge"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b1-tables, RELEASE]
---

# 2026-11-05 — Phase 2: GitHub deploys database changes on merge

**Status:** Done. It runs once the owner's two repository secrets are in place.
**Branch:** `chore/phase2-supabase-deploy`, one pull request into `master`.
**Plan:** an addition to [Phase 2 plan §3](2026-11-05-phase2-plan.md), which didn't say how migrations reach the hosted project.

---

## 1. Problem / Motivation

The migrations and the Edge Function have to reach the hosted project, and doing that takes the database password or an access token, which Claude must never hold. The owner was asked to choose between GitHub deploying on merge and running one command each time, and answered "GitHub deploys on merge (Recommended)".

## 2. What Changed

| File | Change |
|------|--------|
| `.github/workflows/deploy-supabase.yml` | New: on a push to `master` that touches `supabase/**`, links the project, applies new migrations and deploys `delete-account`. |

## 3. Implementation Approach

**When it runs:** on a push to `master` touching `supabase/**` or the workflow itself, or by hand from the Actions tab. It runs only after a pull request's merge, so `db`'s pgTAP run has already passed. `concurrency` queues two deployments rather than running them together, and never cancels one halfway.

**What it needs,** both set by the owner in GitHub's repository secrets, never in the repo:

- `SUPABASE_ACCESS_TOKEN`: from the Supabase dashboard, Account › Access Tokens.
- `SUPABASE_DB_PASSWORD`: the database password chosen when creating the project.

The project's reference isn't a secret (it's in the app's URL), so it's written in the workflow.

**The Apple secrets** live in Supabase, not GitHub: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_CLIENT_ID`, `APPLE_PRIVATE_KEY`, in Edge Functions › Secrets. Only the Edge Function reads them.

**`supabase db push`** applies only the migrations the project hasn't recorded, in order, so a run with nothing new does nothing. Migrations are written to run once and are never edited after merging: a change is always a new file.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Deploy on merge | The owner runs one command each time | **The owner's choice.** It costs about 3 minutes once instead of a password prompt per change. The merge OK is the gate |
| Two repository secrets | Environment secrets with a required reviewer | Nothing here reaches real users until `PAIRING_ENABLED` turns on, and each merge already has the owner's OK. A reviewer gate can be added when real couples depend on it |
| The CLI pinned at 2.121.0 | `latest`; 3.0.0 | `latest` can break a passing deployment. 3.0.0 was 3 days old, and 2.121.0 is the newest over two weeks old |
| Secrets not used by any other job | One shared environment | The `check`, `db` and `perf` jobs never see them, so a test can't print them |

## 6. Verification

- [ ] After the owner sets the secrets, merging this runs the workflow, and it ends green.
- [ ] After that, the project's Database › Migrations page lists the applied files.
- [ ] A merge touching only `src/` doesn't run it (the `paths` filter).

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), Stage B
- [RELEASE.md](../process/RELEASE.md)
- [SRS](../srs/SRS.md): NFR-SEC-002
