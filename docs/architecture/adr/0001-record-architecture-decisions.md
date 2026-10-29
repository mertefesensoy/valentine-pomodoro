---
id: ADR-0001
title: Record architecture decisions
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [DOCS, IMPL-2026-10-30-documentation-system]
---

# ADR-0001: Record architecture decisions

## Context

Decisions are scattered. `DECISIONS.md` holds 15 v1 decisions from 2026-01-07 and three open questions that were never closed. Its "Future Enhancements" list is out of date (rehaul plan §2.2). The v2 decisions sit in tables inside dated implementation docs: the rehaul plan (§0, §9), the Phase 0, SDK 58 and Phase 1 docs.

The documentation-system record (2026-10-30) names the gap. With no architecture doc, "every session re-derives how the clock, context and storage fit together". Nothing records what was decided, when, or what replaced what. Several sessions edit the repo at once, so a decision kept in only one doc's table is easy to miss or contradict.

## Decision

Every significant architecture choice gets a record at `docs/architecture/adr/NNNN-slug.md`, one decision per file (DOCS §1).

- IDs are `ADR-NNNN`. They are permanent and never reused (DOCS §3).
- The status is `proposed`, `accepted`, `superseded`, `deprecated` or `rejected` (DOCS §4).
- A record is never edited to reverse its decision. A new decision gets a new record. The old one becomes `superseded`, with `superseded_by`, once its successor is accepted and in force.
- Each record cites its sources with relative links and ends with the generated backlinks block (DOCS §5).
- The decisions in `DECISIONS.md`, and those made since, are back-filled as ADR-0002 onward in the order they were made. The index is [README.md](README.md).
- **Back-filled statuses.** A choice the owner decided is `accepted`, as is one that is already built. A plan recommendation the owner has not confirmed separately stays `proposed` until it is built.

## Consequences

**Positive**
- One place answers "why is it built this way?", with a source for each answer.
- A replaced decision stays readable and points at what replaced it.
- Commits can cite the decision they implement (DOCS §5).

**Negative**
- Back-filled records repeat decisions that also live in their source docs. When a source changes, its ADR has to change with it.
- Statuses are judged from the written record. Where a source is ambiguous, the record says so.

## Alternatives considered

- **Keep extending `DECISIONS.md`.** It has no IDs, no statuses and no backlinks, and it has already gone stale (rehaul plan §2.2).
- **Leave decisions in each implementation doc's "Design Decisions" table.** That is where they are made, but nothing links them across docs or records when one replaces another.

## Links

- [Conventions §1: where each kind of document lives](../../process/DOCS.md#1-where-each-kind-of-document-lives) · [§3 IDs](../../process/DOCS.md#3-ids) · [§4 statuses](../../process/DOCS.md#4-statuses) · [§5 links and backlinks](../../process/DOCS.md#5-links-and-backlinks)
- [Documentation system §1](../../implementations/2026-10-30-documentation-system.md#1-problem--motivation) · [§3.2 the documentation model](../../implementations/2026-10-30-documentation-system.md#32-the-documentation-model)
- [Rehaul plan §2.2](../../implementations/2026-10-29-couples-rehaul-plan.md#22-decisionsmd)
- [`DECISIONS.md`](../../../DECISIONS.md)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
