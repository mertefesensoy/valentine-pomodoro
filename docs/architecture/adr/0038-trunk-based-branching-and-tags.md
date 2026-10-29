---
id: ADR-0038
title: Trunk-based branching with version tags; GitHub Releases from v1.4.0
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0039, ADR-0040, IMPL-2026-10-30-documentation-system]
---

# ADR-0038: Trunk-based branching with version tags; GitHub Releases from v1.4.0

## Context

Before the rehaul, `master` was 53 commits behind `release/ios-1.3.0` (finding F4). By 2026-10-30 there were 8 `release/*` branches in a half-GitFlow pattern, two of them with work never merged. There were no tags except a stray local `v1.0.0` on a commit that was never built, and no changelog. Nobody could say what was in the version users had (documentation system §1).

## Decision

- **`master` is trunk.** This was the owner's decision on 2026-10-29 (rehaul plan §0, "Branch"), carried out in Phase 0: a fast-forward to the release branch, then a `--no-ff` merge of `origin/master` (`fda4fef`), with no history rewritten. `rehaul/v2` is cut from it.
- **Every shipped version gets an annotated tag** at the commit of its **last finished EAS production build**, per platform. The annotation lists every build of that version. For builds $B(p, v)$ ordered by creation time, the tag points at `gitCommitHash` of the last one (documentation system §4.1).
- **Commits that were never merged are kept as `archive/*` tags.** A `release/*` branch is deleted only after its tip is proven reachable from `master` or from a tag.
- **Release history** lives in `CHANGELOG.md`, git tags, and GitHub Releases from v1.4.0 (DOCS §1).

**Done on 2026-10-30:**
- 17 tags were pushed: 15 version tags (`v1.0.0` to `v1.3.1`, `v1.0.1-android` and `v1.4.0-tf.42`) and 2 `archive/*` tags.
- 7 `release/*` branches were deleted, locally and on GitHub.

## Consequences

**Positive**
- Every shipped version can be identified, and nothing is lost. All 16 branch tips checked as reachable.

**Negative**
- **One branch stays.** `release/ios-1.1.0` can't be deleted yet, because GitHub Pages publishes the live `update.json` from it, and that file still says `latestVersion: 1.0.2`. Moving Pages is a settings change that waits for the owner (documentation system §5).
- **TBD (docs-system session):** the full model is to be written up in `docs/process/BRANCHING.md` and `RELEASE.md`. Neither exists yet.
- Versions before 1.4.0 have tags and changelog entries, but no GitHub Release.

## Alternatives considered

- **Tag the release-branch tips.** Rejected: the tips were not always what was built. `release/android-1.0.1` sits two unbuilt commits past the shipped build.
- **One `v1.0.1` tag.** Rejected: iOS and Android 1.0.1 were built from different commits, hence `v1.0.1-android`.
- **Rebase the release branch, or reset `master`.** Rejected because both rewrite history (Phase 0 §7).

## Links

- [Documentation system §1](../../implementations/2026-10-30-documentation-system.md#1-problem--motivation) · [§2](../../implementations/2026-10-30-documentation-system.md#2-what-changed) · [§3.1](../../implementations/2026-10-30-documentation-system.md#31-git-cleanup-done) · [§4.1](../../implementations/2026-10-30-documentation-system.md#41-which-commit-a-version-tag-points-at) · [§5](../../implementations/2026-10-30-documentation-system.md#5-design-decisions-and-findings)
- [Conventions §1](../../process/DOCS.md#1-where-each-kind-of-document-lives)
- [Rehaul plan §0](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29) · [§1.2, finding F4](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it)
- [Phase 0 §3.1](../../implementations/2026-10-29-phase0-foundation.md#31-trunk) · [§7](../../implementations/2026-10-29-phase0-foundation.md#7-design-decisions)

## Backlinks
<!-- backlinks:start -->
- [TestFlight builds get SemVer pre-release tags (-tf.N)](0039-testflight-prerelease-tags.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
