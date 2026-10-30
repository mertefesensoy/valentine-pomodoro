---
id: IMPL-2026-10-30-design-skills
title: Design skills — Apple HIG skill and the full Emil Kowalski pack
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0042, DESIGN-WORKFLOW]
---

# 2026-10-30 — Design skills: Apple HIG skill and the full Emil Kowalski pack

**Status:** Done. The skills are installed, the workflow and decision are recorded, and nothing in the app changed.
**Branch:** `rehaul/v2`

---

## 1. Problem / Motivation

You asked for two skill packs for the design phases: "real product level genius design work instead of a design that we would see in a school project".

- **[dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill):** a reviewer grounded in Apple's Human Interface Guidelines.
- **[emilkowalski/skills](https://github.com/emilkowalski/skills):** motion and interaction craft.

Ten of Emil's sixteen skills were already installed (2026-10-29, [Phase 0 §3.5](2026-10-29-phase0-foundation.md#35-skills)). Nothing checked the app against iOS conventions, even though the app is iOS-first and App Review enforces several of them.

## 2. What Changed

| File | Change |
|------|--------|
| `.claude/skills/apple-design/` | dickwu/apple-design-skill at `ff4ebdd`: `SKILL.md`, the README, `references/` (123 HIG pages plus guides), `scripts/`. **Git-ignored** (§5). |
| `.claude/skills/{mobile-native,write-swift,prototype,pick-ui-library,ask-sonner}/` | The five remaining Emil skills at `a81dbca`, each with its MIT LICENSE |
| `.claude/skills/emil-apple-design/` | Emil's `apple-design`, with `name:` changed to `emil-apple-design` to avoid the clash; content unchanged; MIT LICENSE |
| `.gitignore` | Ignores `.claude/skills/apple-design/` |
| `docs/process/DESIGN-WORKFLOW.md` | New: which skill owns which layer, the per-screen pipeline, the precedence rules and known tensions, and how to reinstall |
| `docs/architecture/adr/0042-design-skill-stack.md` | New: the decision |
| This record | New |

## 3. Implementation Approach

1. **Read before installing.**
   - **The Apple skill** is a 422-line `SKILL.md` with a five-lens review process, 123 HIG pages, and three curated guides: cross-platform translations (including React Native), a code-audit checklist, and Liquid Glass. Its one script, `pull-hig.mjs`, only fetches from developer.apple.com, and was not run.
   - **Emil's repo** was still at `a81dbca`, the commit installed on 2026-10-29, so the ten existing skills needed no update. The six new ones are Markdown only.
2. **Resolve the name clash.** Both packs ship a skill named `apple-design`. dickwu's keeps the name (it's the one you asked for). Emil's is installed as `emil-apple-design` with only its `name:` field changed. A check over all eighteen `SKILL.md` files shows every name is unique.
3. **Keep Apple's text out of the public repo** (§5).
4. **Write the workflow down**, so the packs work as one process rather than three opinions ([DESIGN-WORKFLOW.md](../process/DESIGN-WORKFLOW.md)).

## 4. Mathematical / Statistical Details

Not applicable (no formulas or algorithms).

## 5. Design Decisions

| Decision | Alternatives | Why |
|----------|--------------|-----|
| Git-ignore the Apple skill | Commit it like the others | It reproduces Apple's HIG text (Apple's copyright, as its README says) and has no license file. This repository is public, so committing it would republish that text from your account. The cost is one reinstall command per machine (DESIGN-WORKFLOW §4). |
| Install all sixteen Emil skills | Only the RN-relevant ten (as on 2026-10-29) | You asked for the pack. The six added skills cover the web app (Phase 6), Swift widgets and Live Activity (Phase 7), and explicit-only exploration tools; they load only when relevant, so they cost nothing otherwise. |
| A fixed precedence: App Review and accessibility, then the brief, then motion rules, then the stricter rule | Let each review stand alone | The packs conflict (glass, system fonts, SF Symbols vs. the Sticker Diary brief). Without a tie-break, every session would re-argue them. |

## 6. Verification

- [x] `.claude/skills/` holds 18 skills, and the `name:` fields are unique: `grep -h "^name:" .claude/skills/*/SKILL.md | sort | uniq -d` prints nothing.
- [x] `git check-ignore -v .claude/skills/apple-design/SKILL.md` matches the new `.gitignore` rule, so nothing from that folder can be committed.
- [x] Every committed skill folder has its LICENSE (Emil: MIT; Impeccable: Apache-2.0 with NOTICE).
- [ ] **A new session** lists `apple-design` among its skills. Skills are discovered at session start, so the running Phase 1 sessions won't see the new ones until they restart.
- [ ] The first use is task C4 (`/impeccable shape classic`, then `/apple-design` on the brief), recorded in its own implementation record.

## 7. Related Docs

- [DESIGN-WORKFLOW.md](../process/DESIGN-WORKFLOW.md) · [ADR-0042](../architecture/adr/0042-design-skill-stack.md)
- [Phase 1 plan](2026-10-29-phase1-plan.md): Stages C and D are where the skills are used.

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [Design work runs on Impeccable, the Apple HIG skill and Emil Kowalski's skills, in a fixed precedence](../architecture/adr/0042-design-skill-stack.md)
<!-- backlinks:end -->
