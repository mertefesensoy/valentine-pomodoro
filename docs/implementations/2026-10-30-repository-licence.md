---
id: IMPL-2026-10-30-repository-licence
title: "The repository licence: FSL-1.1-ALv2 for the code, CC BY-ND 4.0 for the brand, a trademark policy"
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-brand-kit, ADR-0047]
---

# 2026-10-30 — The repository licence

**Status:** Done (2026-10-30). The plan was committed first (`b908965`). Not pushed: pushing needs the owner's OK.
**Branch:** `rehaul/v2`, in the main checkout (a small documents-only change; the Stage D and D4 sessions work on their own branches). Pushing needs the owner's OK.

---

## 1. Problem / Motivation

The repository is public but has no licence file, so by default all rights are reserved: people may read the code (and view and fork it on GitHub, under GitHub's terms), but have no right to use, copy or ship it, and nobody can legally contribute. The brand kit's licence (`brand/LICENSE-BRAND.md`, CC BY-ND 4.0) left the repository's own licence as an open question (brand-kit record §7.1).

The owner wants the code to stay open while the app stays protected. Asked to choose, **the owner chose FSL-1.1-ALv2** (2026-10-30), over keeping no licence, PolyForm Noncommercial, AGPL-3.0 and MIT/Apache-2.0.

**What FSL-1.1-ALv2 does** (the Functional Source License, by Sentry; SPDX `FSL-1.1-ALv2`, not OSI-approved):
- Anyone may use, copy, modify and redistribute the code for any purpose except a **Competing Use**: making it available in a commercial product or service that substitutes for the software, or offers the same or substantially similar functionality.
- Internal use, non-commercial education and research are named as permitted.
- **Each version becomes Apache-2.0 two years after it is made available.**
- It grants no trademark rights.

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-10-30-repository-licence.md` | This record |
| `LICENSE.md` | A short "which licence covers what" preamble, then the FSL-1.1-ALv2 text verbatim, with the two placeholders filled: `2026` (the first commit is 2026-01-07) and `Mert Efe Şensoy` |
| `TRADEMARKS.md` | The trademark policy: the marks (the working name and the future public name, the Same Page mark, the app icon, Pomo & Doro), unregistered (™); factual reference allowed; a fork or copy must not ship under the name, mark, icon or characters |
| `README.md` | "License" says what each licence covers and links the three files |
| `CONTRIBUTING.md` | A "Licence" section: outside contributions need a contributor licence agreement first, and none is set up yet |
| `package.json` | `"license": "FSL-1.1-ALv2"` |
| `brand/LICENSE-BRAND.md` | The tools and docs are FSL-1.1-ALv2; the brand licence also covers the same artwork in the app's art pipeline (below) |
| `brand/README.md` | "Usage rights" names the code's licence |
| `docs/implementations/2026-10-30-brand-kit.md` | §7.1 answered |
| `docs/README.md` | A records row |
| `CHANGELOG.md` | `[Unreleased]`: one bullet for the brand kit and one for the licence |

## 3. Implementation Approach

**Which licence covers what** (stated in `LICENSE.md`'s preamble and repeated in `README.md`; `brand/LICENSE-BRAND.md` agrees):

| What | Licence |
|------|---------|
| Everything not listed below: the app's code, scripts, tools (including `brand/tools/`), tests, docs and other assets (such as the UI icon set in `art/src/icons` and the sounds) | FSL-1.1-ALv2 (`LICENSE.md`) |
| **The brand files** in `brand/` (`svg/`, `png/`, `pdf/`, `eps/`, `web/`, `guide/`, `source/`) **and the same artwork in the app's art pipeline**: `art/src/identity`, `art/src/app-icon`, `art/src/splash` and `art/src/mascots`, every file the pipeline builds from them (in `art/out/logo`, `art/out/illustration`, `art/vc` and `art/steps`), and the app icons and splash images in `assets/images` | CC BY-ND 4.0 (`brand/LICENSE-BRAND.md`) |
| The agent skills and agents in `.claude/` | Their own licences (the `LICENSE` file in each skill's folder) |
| Baloo 2 (`brand/tools/fonts/`) | SIL Open Font License 1.1 |
| npm dependencies (not in the repository) | Their own licences |
| The names, the mark, the app icon and Pomo & Doro as trademarks | Not licensed by any of the above; see `TRADEMARKS.md` |

**Why the art paths must be named.** `brand/tools/check_brand.py` proves that the mark, the app icon, the splash marks and Pomo & Doro in `art/src` are byte for byte the brand's drawings. If those copies fell under FSL, anyone could take the mark from `art/` and redistribute a modified version, which the brand licence forbids. So both scope statements name them.

**Contributions.** FSL's licensor is "the party offering the Software". If an outside contributor's code landed under FSL with them as its licensor, the owner would be their licensee, and shipping the commercial app could be a Competing Use of that contribution. That is why FSL projects pair it with a contributor licence agreement (CLA). `CONTRIBUTING.md` says so; drafting a CLA is left for the first outside contribution (§7).

**What the licence reaches.** FSL covers "each version of the software that we make available under these Terms and Conditions, as indicated by our inclusion of these Terms and Conditions". So it covers the commits that include `LICENSE.md`. Earlier history stays all rights reserved, and so does `master` on GitHub (the default branch, 142+ commits behind) until `rehaul/v2` is merged into it.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| FSL-1.1-ALv2 (the owner's choice) | No licence; PolyForm Noncommercial; AGPL-3.0; MIT/Apache-2.0 | Public, readable code that others may learn from and contribute to, while nobody may ship a competing copy; each version opens fully after two years. AGPL would let renamed clones exist; PolyForm would block harmless commercial use |
| The ALv2 future licence | FSL-1.1-MIT | Apache-2.0 keeps a patent grant and excludes trademarks after the two years |
| A preamble in `LICENSE.md`, the FSL text verbatim below it | A separate `NOTICE`; the FSL text alone | The scope is in the file people and tools open first; the licence text itself is unchanged |
| The decision in this record, no ADR | A new ADR | Stage D has claimed ADR-0048, and a licence isn't architecture; this record is the convention for every change |
| The brand licence covers the art pipeline's copies of the artwork | Leave `art/` under FSL | The same drawings can't be under two licences that disagree |
| A trademark policy, not a registration | Register the name now | The public name is decided before launch (Phase 7); registration follows the name |

## 6. Verification

- [x] The FSL text in `LICENSE.md` matches the official template (`getsentry/fsl.software`, `FSL-1.1-ALv2.template.md`, downloaded 2026-10-30) byte for byte, with only the two placeholders filled: checked by the script that wrote it and by `diff` (identical). SPDX lists `FSL-1.1-ALv2`, not OSI-approved.
- [x] `git grep -i "no licen[cs]e file\|all rights reserved\|has no licen[cs]e\|no LICENSE"` finds no stale statement: what remains is history in records, ADR-0042 and the design-skills record (about Apple's HIG text), the xtool evaluation, and a third-party notice in a Lighthouse report.
- [x] `node scripts/docs/check-docs.mjs --write`: 110 docs, 0 errors.
- [x] `python brand/tools/check_brand.py`: every check passed. `package.json` parses, with `"license": "FSL-1.1-ALv2"`.
- [ ] The owner reads `LICENSE.md`'s preamble and `TRADEMARKS.md`.

## 7. Questions for the owner

1. **A contributor licence agreement**, before the first outside contribution is merged. Not drafted here.
2. **Trademark registration** of the public name, once it is chosen (Phase 7). A lawyer's job; nothing here is legal advice.

## 8. Related Docs

- [The brand kit](2026-10-30-brand-kit.md) §7.1 · [ADR-0047](../architecture/adr/0047-same-page-mark-and-the-colon-characters.md) · [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- ["The brand kit: brand/, after the Cassandra Collective and SuperconducTED kits"](2026-10-30-brand-kit.md)
<!-- backlinks:end -->
