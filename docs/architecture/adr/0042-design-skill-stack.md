---
id: ADR-0042
title: Design work runs on Impeccable, the Apple HIG skill and Emil Kowalski's skills, in a fixed precedence
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [DESIGN-WORKFLOW, ADR-0001, IMPL-2026-10-30-design-skills]
---

# ADR-0042: Design work runs on Impeccable, the Apple HIG skill and Emil Kowalski's skills, in a fixed precedence

> **Status note:** accepted and installed (2026-10-30). The skills are used from Phase 1 Stage C (C4 `shape classic`) onward. The workflow is in [DESIGN-WORKFLOW.md](../../process/DESIGN-WORKFLOW.md).

## Context

The owner wants the rehaul's design to read as a product, not a school project (2026-10-30). Two packs were installed on 2026-10-29:

- **Impeccable:** visual and UX design, critique and audit.
- **Ten of Emil Kowalski's sixteen skills:** motion and interaction.

Neither reviews the app against Apple's platform conventions. The app is iOS-first ([ADR-0037](0037-ios-first-android-deferred.md)), and App Review enforces several of those conventions. The owner asked for [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill), a reviewer grounded in Apple's Human Interface Guidelines (123 pages, with React Native translations), and for Emil's whole pack.

Three facts shaped the decision:

- **The packs overlap and sometimes conflict.** Impeccable bans decorative glass, while the HIG ships Liquid Glass; the HIG prefers system fonts and SF Symbols, while the brief pins a rounded face and custom icons.
- **Emil's pack has its own `apple-design` skill** (Apple's motion principles for the web), which collides by name with dickwu's.
- **dickwu's skill bundles Apple's guideline text** (Apple Inc. copyright, reproduced from the public HIG), and has no license file. This repository is public.

## Decision

1. **Three owners, one pipeline.** Each layer has one owner, and every screen runs the same steps in [DESIGN-WORKFLOW.md §2](../../process/DESIGN-WORKFLOW.md#2-the-pipeline-for-every-screen):
   - **Impeccable:** product and visual identity, critique and audit (≥ 16/20)
   - **The Apple HIG skill:** platform fit (no Critical findings)
   - **Emil Kowalski:** motion, interaction, and worst-case UI data
2. **Precedence when they disagree**, highest first:
   - App Review and accessibility requirements
   - the pinned brief in `DESIGN.md`
   - Emil's rules for motion
   - otherwise, the stricter rule
   Known tensions and their resolutions are tabled in DESIGN-WORKFLOW §3.
3. **All sixteen of Emil's skills are installed** (MIT, LICENSE per skill). His `apple-design` is renamed `emil-apple-design`; only the `name:` field changes, and his content is unchanged. dickwu's HIG reviewer keeps `apple-design`, the name the owner asked for.
4. **The Apple HIG skill is installed locally and git-ignored**, never committed, so this public repo doesn't republish Apple's text. It is pinned to `ff4ebdd`, and the reinstall command is documented.

## Consequences

**Positive**
- Every screen gets a platform review before it's built and after: HIG problems (navigation, sheets, targets, Dynamic Type, paywall presentation) surface in review, not in App Review.
- Disagreements between the packs have a written answer, instead of being re-argued in every session.
- The web (Phase 6) and Swift (Phase 7) skills are already in place.

**Negative**
- **The Apple skill isn't in the repo.** A new machine or a cloud session has to reinstall it (one command), and a design review run without it silently lacks the HIG layer. DESIGN-WORKFLOW §4 says so.
- Three packs means three update streams. Updates are pulled deliberately, with each `SKILL.md` diff read, and the pinned commits recorded.
- More review steps per screen. That's accepted: the screens are few and each is a product surface.

## Alternatives considered

- **Commit the Apple skill** like the others. Rejected: it would republish Apple's guideline text from the owner's public account. It also has no license file to rely on.
- **Install it user-wide** (`~/.claude/skills`). Workable, but it then applies to every project. A project-local, git-ignored copy keeps it scoped to this app and records its pin here.
- **Keep Emil's `apple-design` under its own name and skip dickwu's.** Rejected: Emil's is a web translation focused on motion and materials; dickwu's is the HIG reviewer the owner asked for.
- **No precedence rule.** Rejected: Impeccable's "the brief wins" and the HIG's platform defaults would pull each screen in opposite directions with no tie-break.

## Links

- [DESIGN-WORKFLOW.md](../../process/DESIGN-WORKFLOW.md)
- [Rehaul plan §5: the design system](../../implementations/2026-10-29-couples-rehaul-plan.md#5-design-system-impeccable--emil-kowalski--vectorcraft)
- [Phase 0 §3.5: the first skill installs](../../implementations/2026-10-29-phase0-foundation.md#35-skills)
- [Design-skills record](../../implementations/2026-10-30-design-skills.md)

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../../CHANGELOG.md)
- [Architecture decision records](README.md)
- [Design skills — Apple HIG skill and the full Emil Kowalski pack](../../implementations/2026-10-30-design-skills.md)
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../../implementations/2026-10-30-phase1-stage-c-design.md)
- ["Phase 1 Stage D (D1–D4): the screens in the Sticker Diary design, plan"](../../implementations/2026-10-30-phase1-stage-d.md)
- [Design workflow — Impeccable, Apple HIG and Emil Kowalski skills](../../process/DESIGN-WORKFLOW.md)
<!-- backlinks:end -->
