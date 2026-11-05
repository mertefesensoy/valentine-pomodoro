---
id: BRANCHING
title: Branching model
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [RELEASE, CONTRIBUTING, IMPL-2026-10-30-documentation-system]
---

# Branching model: trunk-based with release tags

Decided 2026-10-30 (your choice). It replaces the old habit of one long-lived `release/*` branch per store version.

## Rules

1. **`master` is the trunk and is always releasable:** CI is green, and every merged change has its doc.
2. **Work happens on short-lived branches cut from `master`**, named `<type>/<slug>`. The types follow the commit types: `feat`, `fix`, `docs`, `build`, `test`, `chore`, `refactor`. Examples: `feat/b3-zustand-stores`, `fix/stats-hooks-crash`. A branch lives for days, not months.
3. **Branches merge to `master` through a pull request** with CI green. One concern per PR; the PR description links the plan task and cites requirement IDs.
4. **Releases are tags, never branches.** Every store build is made from a commit on `master` and tagged; see [RELEASE.md](RELEASE.md) for the names. A hotfix for a released version branches from its tag (`fix/1.4.1-crash` from `v1.4.0`), is tagged when built, and is merged back to `master`.
5. **Parallel Claude sessions** each work on their own branch or worktree. Two sessions never commit in the same checkout without committing by explicit path (no `git add -A`, no `commit -a`, no branch switches, no stash).
6. **Don't rewrite pushed history:** no force-push to `master` or to a shared branch.

## The transition from `rehaul/v2` (now)

**Finished on 2026-11-05: `rehaul/v2` is deleted, and the rules above apply to all work.** `rehaul/v2` was the **integration branch for Phase 1** and the only long-lived exception. It exists because two sessions are working in it right now, and switching their checkout mid-task would break their trees.

1. **Until v1.4.0 ships:** sessions keep committing to `rehaul/v2`. TestFlight builds are tagged `v1.4.0-tf.<build>`.
2. **When v1.4.0 is approved for the store:** `master` fast-forwards to `rehaul/v2` (it's an ancestor, so no merge commit), the store build is made from `master`, `v1.4.0` is tagged there, and `rehaul/v2` is deleted. For 1.4.0, the owner moved `master` early, at submission (2026-11-02, [Stage E §3.9](../implementations/2026-11-01-phase1-stage-e.md)). 1.4.0 went live on 2026-11-04 and was tagged on 2026-11-05, and `rehaul/v2` was deleted the same day. 1.4.1 branches from `master` rather than from the tag: since `v1.4.0` the app's code differs there only by its fix.
3. **From then on:** the rules above apply to all work, with pull requests into `master`.

## Branches today (2026-10-30)

| Branch | Role | Fate |
|--------|------|------|
| `master` | Trunk (holds `v1.4.0`, tagged on `bce65cc`) | Stays the trunk |
| `rehaul/v2` | Phase 1 integration branch | **Deleted** 2026-11-05; its last commit, `c184337`, is on `master` |
| `gh-pages` | **Publishing only**: GitHub Pages serves it at `https://mertefesensoy.github.io/valentine-pomodoro/`. It holds `update.json` and nothing else, and is never merged. | Permanent |

All eight old `release/*` branches were deleted on 2026-10-30 after every commit was proven reachable from `master` or a tag. Their history lives in the version tags and in `archive/release-android-1.0.1` and `archive/ios-ads-consent-1.2.3`. `release/ios-1.1.0` went last, after Pages moved from its `/docs` folder to `gh-pages`.

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Contributing](../../CONTRIBUTING.md)
- [Documentation map](../README.md)
- ["Phase 1 Stage E: verify and ship v1.4.0"](../implementations/2026-11-01-phase1-stage-e.md)
- ["URGENT: remove the unused audio background mode before the next submission (DEF-009)"](../implementations/2026-11-03-def-009-background-audio-mode.md)
- ["Phase 2 (v1.5.0): accounts, pairing by code, your partner's day and notes to them, plan"](../implementations/2026-11-05-phase2-plan.md)
- [Release process](RELEASE.md)
<!-- backlinks:end -->
