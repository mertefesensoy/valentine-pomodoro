---
id: IMPL-2026-10-30-documentation-system
title: Documentation system, release history and branch cleanup
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [DOCS, SRS, ARCHITECTURE, ROADMAP, TEST-STRATEGY, RELEASE, BRANCHING]
---

# 2026-10-30 — Documentation system, release history and branch cleanup

**Status:** Done (2026-10-30). The git cleanup, the Pages move and the documentation set are complete; follow-ups are in §8.
**Branch:** `rehaul/v2` (docs commits local until you decide when to push the branch; only tags were pushed)

---

## 1. Problem / Motivation

This is your first app, and it predates the engineering discipline you have now. The gaps (your list, 2026-10-30):

| Gap | What existed | Risk |
|-----|--------------|------|
| No requirements spec | The rehaul plan, `PRODUCT.md` and phase plans hold decisions, but no single list of what the product must do, each item testable | Nobody can say whether v2 is "done"; tests can't point at what they verify |
| No architecture doc | Only knowledge in code comments and dated implementation docs | Every session re-derives how the clock, context and storage fit together; the documented re-render trap is easy to miss |
| No roadmap doc | Phase lists inside two plan docs | Status is scattered over plan tables and session memory |
| No testing doc | The tests exist (41) but no strategy, no gate rules, no device-check protocol in one place | Gates get skipped (your memory note: a TDZ crash shipped because device checks were deferred) |
| Branches all over the place | 8 `release/*` branches, half-GitFlow, two with unmerged work | Shipped code was unidentifiable; one Android release lived only on a side branch |
| No tags, no releases, no changelog | One stray, never-pushed local `v1.0.0` tag pointing at an unbuilt commit | No way to answer "what is in the version users have?" |
| No backlink strategy | Docs link forward, never back; no link checking | Docs rot silently; moving a file breaks links nobody notices |
| Docs all over the place | `PLAN.md` outside the repo, `DECISIONS.md` at root, plans inside `implementations/`, `PHASE4_TEST.md` archived | No entry point; no reading order |

## 2. What Changed

| File / ref | Change |
|------------|--------|
| 15 version tags `v1.0.0`…`v1.3.1`, `v1.0.1-android`, `v1.4.0-tf.42` | Annotated tags at the exact commit of each version's last finished EAS production build (§4.1). Pushed. |
| 2 archive tags | `archive/release-android-1.0.1` and `archive/ios-ads-consent-1.2.3` preserve the only commits that were never merged. Pushed. |
| 8 `release/*` branches | Deleted locally and on GitHub after proving every tip reachable from `master` or a tag. |
| `gh-pages` branch, GitHub Pages source | New publishing branch holding only `update.json` (`latestVersion` 1.3.1), `.nojekyll` and a README. Pages now publishes from `gh-pages:/` instead of `release/ios-1.1.0:/docs`, which let that last old branch be deleted (§5, finding 1; approved by you 2026-10-30). |
| `docs/README.md` | New: the documentation map and reading order. |
| `docs/process/DOCS.md` | New: conventions (front-matter, IDs, statuses, backlinks, where each kind of doc lives). |
| `docs/process/BRANCHING.md` | New: the trunk-based model and the `rehaul/v2` → `master` transition. |
| `docs/process/RELEASE.md` | New: versioning, tag rules, build and submit steps, the release checklist. |
| `CONTRIBUTING.md` | New: how to work in the repo (commits, branches, docs, gates). |
| `CHANGELOG.md` | New: every version from 1.0.0, from git history and EAS records. |
| `docs/srs/SRS.md` | New: the v2 requirements spec, as built and to be built. |
| `docs/architecture/ARCHITECTURE.md` | New: as-built and target architecture. |
| `docs/architecture/adr/*` | New: architecture decision records. |
| `docs/roadmap/ROADMAP.md` | New: phases, milestones, status. |
| `docs/testing/TEST-STRATEGY.md` | New: test levels, gates, device-check protocol. |
| `docs/testing/TRACEABILITY.md` | New, generated: requirement → test → status. |
| `docs/history/2026-01-07-v1-plan.md` | New: a versioned copy of the original `PLAN.md` that lives outside the repo. |
| `scripts/docs/check-docs.mjs` | New: link checker, backlink writer, traceability generator. |
| `DECISIONS.md` | A banner pointing at the ADR index; the content is kept. |
| `README.md` | Rewritten: the old one says "no server connections" and points at Expo Go. |
| `.github/workflows/ci.yml` | A docs-check step (non-blocking until the Stage B sessions finish, §5). |

## 3. Implementation Approach

### 3.1 Git cleanup (done)

1. Read all 41 EAS builds with `eas build:list --json`. Each records `appVersion`, `appBuildVersion` and `gitCommitHash`.
2. For each (platform, version), tag the commit of the **last finished production build**. The annotation lists every build of that version, so no evidence is lost.
3. Tag the two unmerged branch tips as `archive/*`.
4. Prove reachability: for every local and remote `release/*` tip, `git merge-base --is-ancestor <tip> master` or `git tag --contains <tip>` must hit. All 16 did.
5. Push the tags **before** deleting branches, then `git push origin --delete` the seven branches and `git branch -D` them locally.

### 3.2 The documentation model

Docs as code, in the repo, reviewed with the code they describe. Each document has one job; nothing is duplicated, things are linked.

| Kind | Lives in | Answers | Changes when |
|------|----------|---------|--------------|
| Product truth | `PRODUCT.md`, `DESIGN.md` (root; owned by the Impeccable skill) | Who it's for, how it looks | Brand or audience decisions |
| Requirements | `docs/srs/SRS.md` | What it must do, testably | A feature is added, changed or dropped |
| Architecture | `docs/architecture/` | How it's built and why | A structural change; every significant choice gets an ADR |
| Roadmap | `docs/roadmap/ROADMAP.md` | What's next, in what order, and the status | Every phase or task status change |
| Plans | `docs/implementations/YYYY-MM-DD-*-plan.md` | How a phase will be done | Before the phase starts |
| Implementation records | `docs/implementations/YYYY-MM-DD-*.md` | What one change did, why, how it was verified | Every meaningful change (your CLAUDE.md rule) |
| Testing | `docs/testing/` | How we know it works | A new test level, gate or device checklist |
| Process | `docs/process/`, `CONTRIBUTING.md` | How we work: branches, releases, docs | A process change |
| Release history | `CHANGELOG.md`, git tags, GitHub Releases from v1.4.0 | What each version contains | Every release |

**Existing files keep their paths** (`docs/implementations/*`, `docs/device-check-backlog.md`, `docs/scale-plan.md`, `docs/proposals/*`). Two active sessions, their briefs and the memory all reference them; the map indexes them instead of moving them. Consolidation is a follow-up for when no session is running.

### 3.3 Backlink strategy

Three mechanisms, each enforced by the script:

1. **Stable IDs.** Every document has an `id` in its front-matter (`SRS`, `ADR-0022`, `IMPL-2026-10-29-phase0-foundation`). Every requirement has an ID (`FR-TMR-003`, `NFR-PERF-002`). IDs never change and are never reused, even if the file moves.
2. **Links both ways.** Authors write forward links only (plain relative Markdown links). `scripts/docs/check-docs.mjs` computes the reverse: every doc that carries the markers `<!-- backlinks:start -->` / `<!-- backlinks:end -->` gets an auto-written "Referenced by" list.
3. **Traceability.** Tests name the requirement they verify (`// covers: FR-TMR-003`). Implementation docs name what they implement. The script builds `docs/testing/TRACEABILITY.md` (requirement → tests, docs, status) and lists requirements nothing covers.

The script also fails on broken relative links and anchors in any doc.

## 4. Mathematical / Statistical Details

### 4.1 Which commit a version tag points at

For a version *v* on platform *p*, let *B(p, v)* be its finished EAS production builds ordered by creation time. The tag points at `gitCommitHash` of the last element of *B(p, v)*.

The last build is the one most likely submitted: every version's builds are a short run of fixes ending in the submitted one, and the build number increases monotonically. Where several builds share a version (1.3.0 had builds 27–36), the annotation lists them all.

### 4.2 Traceability coverage

Coverage = |{requirements with at least one test or verification record}| / |{requirements with status `implemented`}|. Requirements still `planned` are excluded, so the number measures the built product, not the backlog.

## 5. Design Decisions and findings

| Decision | Alternatives | Why |
|----------|--------------|-----|
| Tags at the last EAS build per version | Tag the release-branch tips | The branch tips were not always what was built (`release/android-1.0.1`'s tip is two unbuilt commits past the shipped build). EAS records the built commit. |
| `v1.0.1` plus `v1.0.1-android` | One `v1.0.1` tag | iOS and Android 1.0.1 were built from different commits; one tag can't hold both. |
| `v1.4.0-tf.42`, not `v1.4.0` | Tag `v1.4.0` now | 1.4.0 isn't released. A release tag must never move, so TestFlight builds get SemVer pre-release tags (`-tf.<build>`); `v1.4.0` is cut at the store release. |
| Move Pages to a `gh-pages` branch, then delete `release/ios-1.1.0` | Keep the old branch as the Pages source; publish from `master:/docs` | **Finding 1:** GitHub Pages (legacy) was publishing from `release/ios-1.1.0:/docs`, so deleting that branch would have unpublished the live `update.json`. That file still said `latestVersion: 1.0.2`, and **versions 1.0.3–1.3.0 read it for their update prompt, so their users were never told about any update.** `master:/docs` was rejected because Pages would also render every doc as a public website (Jekyll), and a Jekyll build error would block the file the app depends on. A dedicated branch holds one file and can't break. It was built with git plumbing (`hash-object` / `mktree` / `commit-tree`), so the shared working tree was never checked out. The build was triggered by hand and verified live at 1.3.1 before the old branch was deleted. |
| Backlinks written by a script | Hand-written "see also" sections | Hand-kept backlinks are always stale. The script makes them free and checkable in CI. |
| Docs check non-blocking in CI at first | Blocking from day one | The two running sessions write docs too; a link they break mid-task shouldn't turn their CI red without warning. It becomes blocking when they finish (follow-up). |
| No file moves now | Reorganise `docs/` into folders | The active sessions edit `phase1-plan.md` and their own docs, and memory and briefs cite current paths. |

## 6. Verification

- [x] `git tag -l` lists 17 tags; `git ls-remote --tags origin` lists the same 17.
- [x] Every deleted branch tip is reachable: `git merge-base --is-ancestor <tip> master` or `git tag --contains <tip>`.
- [x] `https://mertefesensoy.github.io/valentine-pomodoro/update.json` returns 200 with `latestVersion` 1.3.1, served by Pages build `9cfc479` (`gh-pages`), and still 200 after `release/ios-1.1.0` was deleted.
- [x] `node scripts/docs/check-docs.mjs` exits 0 (85 docs, 102 requirements, 0 errors), and `--write` reaches a fixed point: a second run rewrites nothing.
- [x] The checker was seen to catch what it claims to: broken links and missing anchors on its first run (31 errors before the missing files existed), stale backlink blocks, and links copied into generated tables. **Two of its own bugs were found and fixed by reading its output, not its exit code.** Generated blocks fed back into the next run (no fixed point). Marker examples inside code were treated as real blocks and filled, mangling `DOCS.md` §5 and §3.3 here; both were restored.
- [x] Every SRS requirement has an ID and a status; 93 of 95 had a target, and the 2 missing targets were added. **Explicit acceptance criteria exist for 18 of 95 requirements and a verification method for 57.** Rather than invent detail for features months away, the SRS now states completeness rules: a statement without an Accept field is its own acceptance criterion, and a phase plan isn't ready until its requirements have explicit Accept and Verify (the definition of ready, also in the roadmap). This is a deliberate gap, not a finished state; see follow-up 2.
- [x] All 78 Markdown files under `docs/` are reachable from the [documentation map](../README.md) within two links (directly, or through the ADR index).
- [x] Traceability: 14 of 22 implemented Must requirements have an automated test. The 8 without one are listed in [TRACEABILITY.md](../testing/TRACEABILITY.md) and are the test backlog for v1.4.0 (NFR-MAINT-002).
- [x] The code was cross-checked against the SRS while the architecture was being written. **Seven deviations were found and recorded** as DEF-001…DEF-007 ([SRS §3.4](../srs/SRS.md#34-known-deviations-as-built-found-2026-10-30)), each with a fix task. The most important: Fly Mode credits without start-day attribution or de-duplication, and the de-duplication key is lost on restart.

## 8. Follow-ups

1. **Make the docs check blocking in CI** (drop `continue-on-error`) once the Phase 1 Stage B sessions stop writing docs.
2. **Complete the SRS acceptance criteria** for Phase 1's remaining requirements (C, D and E tasks) before those stages start; later phases do this in their own plans.
3. **Close the test gaps** in TRACEABILITY.md before v1.4.0, and add `// covers:` comments to existing tests when they are next edited. They weren't added now, because the Stage B session was editing tests.
4. **Fix DEF-001…DEF-007** in the plan tasks named in SRS §3.4, each test-first. DEF-004 needs a failing cold-start test for Fly before any change.
5. **Re-baseline ARCHITECTURE.md after Stage B**: it describes `5b10a78`, before B1b and B2.
6. **Consolidate docs** (for example, move plans to `docs/plans/`) only when no session is running, then fix links with the checker.
7. **Decide a license** (yours): the public repo has none.
8. **Retire `docs/update.json`** on `rehaul/v2` (the live file is on `gh-pages`) once nothing references it, or document it as the template.

## 7. Related Docs

- [Documentation map](../README.md) · [Conventions](../process/DOCS.md) · [SRS](../srs/SRS.md) · [Roadmap](../roadmap/ROADMAP.md)
- [Rehaul plan](2026-10-29-couples-rehaul-plan.md) · [Phase 1 plan](2026-10-29-phase1-plan.md)

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- [Record architecture decisions](../architecture/adr/0001-record-architecture-decisions.md)
- [Trunk-based branching with version tags; GitHub Releases from v1.4.0](../architecture/adr/0038-trunk-based-branching-and-tags.md)
- [TestFlight builds get SemVer pre-release tags (-tf.N)](../architecture/adr/0039-testflight-prerelease-tags.md)
- [Docs as code, with generated backlinks and traceability](../architecture/adr/0040-docs-as-code-generated-backlinks.md)
- [Architecture decision records](../architecture/adr/README.md)
- [Documentation conventions](../process/DOCS.md)
- [Release process](../process/RELEASE.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
