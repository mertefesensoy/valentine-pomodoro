---
id: DOCS
title: Documentation conventions
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [DOCS-MAP, IMPL-2026-10-30-documentation-system]
---

# Documentation conventions

How every document in this repo is written, named, linked and checked. If a rule here and a habit disagree, this file wins. Change it the same way as code: in a commit, with a reason.

## 1. Where each kind of document lives

| Kind | Path | One document per |
|------|------|------------------|
| Product truth | `PRODUCT.md`, `DESIGN.md` at the repo root | the product. Both are owned by the Impeccable skill: don't add front-matter or restructure them; edit through `/impeccable`. |
| Requirements | `docs/srs/SRS.md` | the product (all releases, each requirement tagged with its target release) |
| Architecture | `docs/architecture/ARCHITECTURE.md` | the system |
| Architecture decisions | `docs/architecture/adr/NNNN-slug.md` | decision |
| Roadmap | `docs/roadmap/ROADMAP.md` | the product |
| Phase plans | `docs/implementations/YYYY-MM-DD-<phase>-plan.md` | phase, written before it starts |
| Implementation records | `docs/implementations/YYYY-MM-DD-<slug>.md`, from [`_TEMPLATE.md`](../implementations/_TEMPLATE.md) | meaningful change |
| Proposals (not yet planned) | `docs/proposals/<slug>.md` | idea |
| Testing | `docs/testing/` | strategy, generated traceability, device checklists |
| Process | `docs/process/`, plus [`CONTRIBUTING.md`](../../CONTRIBUTING.md) at the root | process |
| Release history | [`CHANGELOG.md`](../../CHANGELOG.md), git tags, GitHub Releases (from v1.4.0) | release |
| History | `docs/history/` | superseded artefact worth keeping |
| Archive | `docs/archive/` | retired doc, with a banner saying what replaced it |

**Every new document is added to the [documentation map](../README.md) in the same commit.**

## 2. Front-matter

Every document under `docs/` (and `CONTRIBUTING.md`, `CHANGELOG.md` excepted) starts with YAML front-matter:

```yaml
---
id: ADR-0022                 # stable, unique, never reused (§3)
title: Server owns session time
status: accepted             # see §4
date: 2026-10-29             # created; ISO 8601
owner: Mert Efe Şensoy
related: [SRS, ADR-0024]     # optional: IDs this doc depends on
supersedes: []               # optional
superseded_by: []            # optional
---
```

Implementation docs written before 2026-10-30 have no front-matter. Their ID is derived from the filename (`IMPL-<filename without .md>`), and the script accepts them. Add front-matter when you next edit one, unless another session is editing it.

## 3. IDs

| Thing | Pattern | Example |
|-------|---------|---------|
| Functional requirement | `FR-<AREA>-<NNN>` | `FR-TMR-003` |
| Non-functional requirement | `NFR-<CATEGORY>-<NNN>` | `NFR-PERF-002` |
| Constraint | `CON-<NNN>` | `CON-004` |
| Architecture decision | `ADR-<NNNN>` | `ADR-0022` |
| Implementation record | `IMPL-YYYY-MM-DD-<slug>` | `IMPL-2026-10-29-phase0-foundation` |
| Other documents | an upper-case short name | `SRS`, `ROADMAP`, `TEST-STRATEGY`, `RELEASE`, `BRANCHING`, `DOCS` |

Requirement areas and categories are listed in [SRS §3](../srs/SRS.md#3-specific-requirements). An ID, once published, is permanent. A dropped requirement keeps its ID with status `dropped`, and a replaced one points at its successor.

## 4. Statuses

| For | Allowed values |
|-----|----------------|
| Documents | `draft` → `approved` (or `accepted` for ADRs) → `superseded` / `archived`; plans also use `in-progress` and `done` |
| ADRs | `proposed`, `accepted`, `superseded`, `deprecated`, `rejected` |
| Requirements | `implemented` (in the code on `rehaul/v2` or `master`), `planned` (has a target release), `deferred` (no target yet), `dropped` |

## 5. Links and backlinks

- **Link with relative Markdown links** (`[SRS](../srs/SRS.md#fr-tmr-003)`), never absolute GitHub URLs to files in this repo. Relative links work on GitHub, in editors and offline.
- **Write forward links only.** Backlinks are generated. A document that wants them ends with:

  ```markdown
  ## Backlinks
  <!-- backlinks:start -->
  <!-- backlinks:end -->
  ```

  `node scripts/docs/check-docs.mjs --write` fills the block with every document that links here. Never edit inside the markers by hand.
- **Cite requirement IDs in plain text** (`FR-TMR-003`); the script finds them anywhere in docs and tests.
- **Tests declare what they verify** with a comment near the `describe` or `it`:

  ```ts
  // covers: FR-TMR-005, FR-TMR-006
  ```

  The script turns these into [`TRACEABILITY.md`](../testing/TRACEABILITY.md).
- **Commits cite IDs** when they implement or change a requirement or decision: `feat(b2): MMKV migration (FR-MIG-002, ADR-0030)`.

## 6. Checking

```bash
node scripts/docs/check-docs.mjs
```

That command checks; adding `--write` also regenerates the backlinks and `TRACEABILITY.md`. The check fails when:

- a relative link points at a missing file, or an anchor at a missing heading
- two documents share an `id`
- a requirement ID is cited but not defined in the SRS
- a generated block or `TRACEABILITY.md` is out of date (fix it with `--write`)

CI runs the check on every push (non-blocking until the Phase 1 Stage B sessions finish; see the [documentation-system record](../implementations/2026-10-30-documentation-system.md)).

## 7. Writing style

- **Plain, specific, auditable.** Say what is true, with the evidence: a commit, a file and line, a measurement.
- **State contracts** for functions and modules: inputs, outputs, side effects, invariants.
- **Mark what isn't known** as `TBD` with the owner of the answer, rather than guessing.
- **Dates** are ISO 8601 (`2026-10-30`). Times are UTC unless marked.
- **English** for all docs. Turkish appears only in examples and copy that is shown to users.

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Documentation map](../README.md)
- [Record architecture decisions](../architecture/adr/0001-record-architecture-decisions.md)
- [Trunk-based branching with version tags; GitHub Releases from v1.4.0](../architecture/adr/0038-trunk-based-branching-and-tags.md)
- [Docs as code, with generated backlinks and traceability](../architecture/adr/0040-docs-as-code-generated-backlinks.md)
- [Architecture decision records](../architecture/adr/README.md)
- [Documentation system, release history and branch cleanup](../implementations/2026-10-30-documentation-system.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
