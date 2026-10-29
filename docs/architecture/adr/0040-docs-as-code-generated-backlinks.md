---
id: ADR-0040
title: Docs as code, with generated backlinks and traceability
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0001, ADR-0038, DOCS, IMPL-2026-10-30-documentation-system]
---

# ADR-0040: Docs as code, with generated backlinks and traceability

> **Status note:** accepted and built (2026-10-30): [`DOCS.md`](../../process/DOCS.md), the [documentation map](../../README.md), `scripts/docs/check-docs.mjs` and the generated [traceability matrix](../../testing/TRACEABILITY.md). The CI docs check is non-blocking until the Phase 1 Stage B sessions finish.

## Context

The gaps listed on 2026-10-30 (documentation system §1):
- Docs linked forward but never back, and nothing checked the links, so they rotted silently.
- Docs lived all over the place: `PLAN.md` outside the repo, `DECISIONS.md` at the root, plans inside `implementations/`.
- There was no requirements spec that tests could point at.

## Decision

Docs live in the repo, are reviewed with the code they describe, and have one job each (documentation system §3.2):

1. **Stable IDs** in YAML front-matter, never reused. Implementation docs older than 2026-10-30 get an ID derived from their filename (DOCS §2–3).
2. **Relative Markdown links only.** Authors write forward links, and `node scripts/docs/check-docs.mjs --write` fills the marker block that ends each doc, as at the bottom of this one (DOCS §5).
3. **Traceability.** Tests declare `// covers: FR-…`, and the script builds `TRACEABILITY.md` (DOCS §5).
4. **The check fails** on a missing file or anchor, a duplicate `id`, an undefined requirement ID, or a stale generated block (DOCS §6). CI runs it, non-blocking until the Phase 1 Stage B sessions finish.
5. **Existing files keep their paths.** Running sessions and the memory cite them (documentation system §3.2).

**Coverage** $= \dfrac{|\{\text{requirements with at least one test or verification record}\}|}{|\{\text{requirements with status implemented}\}|}$. Requirements still `planned` are left out (documentation system §4.2).

## Consequences

**Positive**
- Backlinks cost nothing and can be checked, and a moved or broken link fails the check instead of rotting.
- Requirements, tests and decisions link both ways.

**Negative**
- Every doc needs front-matter and correct anchors, and a rename breaks links until fixed.
- While the check is non-blocking, a link broken mid-task by a running session doesn't turn CI red.
- `PRODUCT.md` and `DESIGN.md` belong to the Impeccable skill and carry no front-matter (DOCS §1).

## Alternatives considered

- **Hand-written "see also" sections.** Hand-kept backlinks are always stale (documentation system §5).
- **A blocking check from day one.** It would turn the running sessions' CI red without warning.
- **Reorganise `docs/` into folders now.** The active sessions and the memory cite the current paths.

## Links

- [Conventions §2](../../process/DOCS.md#2-front-matter) · [§3](../../process/DOCS.md#3-ids) · [§5](../../process/DOCS.md#5-links-and-backlinks) · [§6](../../process/DOCS.md#6-checking)
- [Documentation system §1](../../implementations/2026-10-30-documentation-system.md#1-problem--motivation) · [§3.2](../../implementations/2026-10-30-documentation-system.md#32-the-documentation-model) · [§3.3](../../implementations/2026-10-30-documentation-system.md#33-backlink-strategy) · [§4.2](../../implementations/2026-10-30-documentation-system.md#42-traceability-coverage) · [§5](../../implementations/2026-10-30-documentation-system.md#5-design-decisions-and-findings)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
