---
id: IMPL-2026-11-01-phase1-stage-e
title: "Phase 1 Stage E: verify and ship v1.4.0"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-stage-d, IMPL-2026-11-01-phase1-d5-tutorial, RELEASE, BRANCHING, SRS]
---

# 2026-11-01 — Phase 1 Stage E: verify and ship v1.4.0

**Status:** In progress.
- **S1 done** (2026-11-01): build 58's device check passed, visual and sound ("All visual tests are passed", "Yes, sounds passed").
- **D5's verdict: ship** (2026-11-01). The finish review's captures were waived ("Skip, as in D2"), so the device check stands as the verdict.
- **The owner's answers, 2026-11-02:**
  - the merge: "do it";
  - closing Stage D: "we can close it";
  - E1: "there was no valuable data in any way so this is also check";
  - the release candidate: "go for it";
  - the listing: "yes walk me through that".
- **S2 and S3 done** (2026-11-02): DESIGN.md and `.impeccable/design.json` record D3–D5 (the tour's motion row, its four tokens and its components; the sounds; the language choice), and every Stage D record says Done.
- **M1 done** (2026-11-02): `phase1/stage-d` merged into `rehaul/v2` as `96ce9dd`, with `rehaul/v2` as first parent (§3.6).
- **M2 done** (2026-11-02, `ad86dc3`): the Stage D plan's §9 and the D4 record's §10 applied to the shared docs, each brought to its final state. SRS 1.1 adds FR-ONB-001 and FR-ONB-002 (implemented for v1.4) and marks FR-SET-002, FR-SET-004, FR-SET-005, FR-NTE-002, NFR-UX-003 and NFR-I18N-001 implemented.
- **E3, in part** (2026-11-02): Reassure meets F1's criterion, settings-only 14 → 1 (§4); the bytecode is measured (§4). The cold-start TTI waits for the release candidate, and the bytecode decision is the owner's, with it.
- **E4 done** (2026-11-02):
  - CHANGELOG: `[1.4.0] - 2026-11-02`, opening with a list for users, then the engineering record and entries for TestFlight builds 48–58;
  - DECISIONS.md: Q1–Q3 closed;
  - the Phase 1 exit criteria checked in the [Phase 1 plan](2026-10-29-phase1-plan.md);
  - DESIGN.md current (`0194c8a`);
  - the ROADMAP's stale Stage C row closed;
  - the SRS's release-scope row brought up to date.
  
  `app.json` and `package.json` say 1.4.0, and EAS numbers the build remotely (`appVersionSource: remote`, `autoIncrement`).
- **E1: accepted by the owner** without a fresh run. 1.3.1's data has already survived the update on a real iPhone twice: A0 on build 42, and B2's MMKV migration on build 43 (the Phase 1 plan, Stage A and B2). The migration code was last changed in B3 (`71d836f`), before builds 44–58, and no install the owner tests holds data worth comparing.

The plan below was written before any of its steps. The owner, 2026-11-01: "wonderful everything is looking just like how i want it. All visual tests are passed. I think it is time to prepare the app for shipping."

**Branch:** `phase1/stage-d` until it merges into `rehaul/v2`; then `rehaul/v2`, which `master` fast-forwards to at release ([BRANCHING.md](../process/BRANCHING.md#the-transition-from-rehaulv2-now)).
**Plan:** the [Phase 1 plan](2026-10-29-phase1-plan.md) Stage E (E1–E4) and its exit criteria, run through the [release process](../process/RELEASE.md) §3.

---

## 1. Problem / Motivation

Stage D's screens are built and seen on the phone: D1–D3 on builds 48–56, D4's sounds wired, and D5's tour on builds 57–58. The owner reports every visual check passed. What stands between that and v1.4.0 in the App Store:
- Stage D's own close: the tour's FINISH step, and the records' statuses.
- The merge into the Phase 1 integration branch, with its shared-doc updates.
- Stage E's checks:
  - the migration from the App Store's 1.3.1 on a real phone;
  - the final checklist;
  - the measurements, the bytecode budget's decision among them;
  - the release paperwork.
- The release candidate, the store listing, the review, and the release steps.

## 2. What Changed

| File | Change |
|------|--------|
| This record (new) | The shipping plan, then what each step found |
| Stage D's records, its plan, DESIGN.md, `.impeccable/design.json` | S1–S3: closed (`faa141d`, `0194c8a`) |
| `.gitattributes`, generated backlinks and TRACEABILITY, `src/components/stickers/art/markColour.ts` | M1: the merge's resolutions and the regenerated mark (`96ce9dd`, `d3f62be`) |
| SRS, ROADMAP, CHANGELOG, ARCHITECTURE, ADR index, ADR-0027, ADR-0048, DECISIONS.md, DESIGN-WORKFLOW, TEST-STRATEGY, docs/README, the rehaul plan | M2: Stage D's shared-doc updates (`ad86dc3`) |
| CHANGELOG, DECISIONS.md, ROADMAP, SRS §2.6, the Phase 1 plan | E4: the release section, Q2 and Q3, the exit criteria |

## 3. Implementation Approach: the ordered steps

Each step names who acts. Every push, merge, EAS build, TestFlight submission, store submission and `update.json` change waits for the owner's explicit word, each time (the standing rule).

### 3.1 Close Stage D

| # | Step | Who | Done when |
|---|------|-----|-----------|
| S1 | **Record the device checks** on build 58: D5's step 9; D3's every screen in Turkish at the largest text size; D1's Ring idle, running and paused; D2's Stats captures. **D4's sounds aren't visual:** the silent switch, the music mix, the Sound switch and the babble's level need the owner's own word | Claude, the owner | Each record's device-check line says passed, in the owner's words |
| S2 | **D5 FINISH:** the finish review against the direction contract, its verdict, and DESIGN.md's "Tutorial (first run)" motion row with the tour's new tokens (`scrim`, `scrimStrong`, `pomoInk`, `doroInk`) | Claude, sub-agents; captures from the owner | The verdict is ship, and DESIGN.md records the tour |
| S3 | **The records' statuses:** D1–D5 and the Stage D plan's checklist (§6) closed | Claude | Every Stage D record says Done |

### 3.2 Merge

| # | Step | Who | Done when |
|---|------|-----|-----------|
| M1 | **`phase1/stage-d` into `rehaul/v2`.** Stage D is 134 commits ahead; `rehaul/v2` has 14 of its own (the licence and the brand docs), so this is a merge commit. `master` stays an ancestor of `rehaul/v2`, so the release can still fast-forward | **The owner's go-ahead**, then Claude | The merge is committed and the guards are green on it |
| M2 | **The shared-doc updates** gathered in the [Stage D plan](2026-10-30-phase1-stage-d.md) §9, applied on `rehaul/v2`: the SRS (`FR-ONB-001` and `FR-ONB-002`, D3's amendments, statuses), ROADMAP, CHANGELOG, ARCHITECTURE, TEST-STRATEGY and the docs index | Claude | The docs check is green; each update is ticked in §9 |

### 3.3 Stage E

| # | Step | Who | Done when |
|---|------|-----|-----------|
| E1 | **Migration on a phone:** the release candidate installed over the App Store's 1.3.1 on an iPhone with real data (sessions on two days, edited notes, the reminder, settings, an ad-policy state). It needs a phone running the store's 1.3.1, not a TestFlight build | The owner | Every value survives, compared with the screens before the update |
| E2 | **The v1.4 checklist** on the release candidate: dark mode, the largest text size, Turkish, Reduce Motion, landscape, iPad if there is one, and the sounds. Most of it passed on builds 56–58; this is the last pass on the build that ships | The owner | Every item passes |
| E3 | **Measurements:** | Claude; the owner reads the TTI from the hidden diagnostics panel | Recorded here and in the Phase 1 record |
| | - Reassure against the 2026-10-29 baseline (`docs/baselines/`). | | |
| | - The bytecode with the pinned export. NFR-PERF-002's ceiling is 3,856,208 B; it was 7.34 % over at build 56, and the tour adds more. **The decision is the owner's:** accept and amend, or trim. | | |
| | - Cold-start TTI on the iPhone. | | |
| E4 | **Release paperwork:** | Claude | Each item done and checked by the docs check |
| | - CHANGELOG's Unreleased becomes `## [1.4.0] - <date>`, written for users. | | |
| | - DECISIONS.md Q1–Q3 closed, and the Phase 1 record written. | | |
| | - DESIGN.md regenerated in scan mode, its tokens and `.impeccable/design.json` current. | | |
| | - The ROADMAP's milestone. | | |
| | - `app.json` and `package.json` already say 1.4.0. | | |

### 3.4 Release candidate and release (RELEASE.md §3)

| # | Step | Who |
|---|------|-----|
| R1 | **The release candidate:** an EAS production build from `rehaul/v2`'s head with TestFlight submission, tagged `v1.4.0-tf.<n>`; E1 and E2 run on it | **The owner's go-ahead**, then Claude; the owner checks |
| R2 | **The store listing:** "What's New" in English and Turkish (drafted from the CHANGELOG by Claude), screenshots of the redesign, the privacy labels (v1.4 adds no data collection, to be confirmed), notes for App Review | Claude drafts; the owner sets them in App Store Connect |
| R3 | **Submit for App Store review,** choosing the release candidate's build | The owner |
| R4 | **On approval:** `master` fast-forwards to `rehaul/v2`; `v1.4.0` is tagged on the released commit and pushed; a GitHub Release with the CHANGELOG section as notes | **The owner's go-ahead**, then Claude |
| R5 | **The update prompt:** `latestVersion` in `update.json` on `gh-pages` set to 1.4.0, and the served file checked | **The owner's go-ahead**, then Claude |
| R6 | **Close up:** the ROADMAP milestone closed, the release date in the CHANGELOG, `rehaul/v2` deleted | Claude; the deletion on the owner's word |

### 3.5 R2's drafts: "What's New" for the App Store (for the owner to edit)

Drafted 2026-11-01 from what v1.4 ships, in the app's own names for each feature. It makes no performance claim and adds no feature beyond Stage D's records. App Store Connect takes up to 4,000 characters per language.

**English**

> Valentine Pomodoro 1.4 is a whole new diary.
> • Meet Pomo & Doro, the two little faces of your timer. On your first visit they show you around.
> • Pick a length in one tap: 25/5, 50/10, 90/20, or your own.
> • Two timer layouts: the Ring, or Facing pages.
> • Every focus you finish presses a sticker onto today's page, toward a daily goal.
> • Stats is now a stack of postcards, with your goal and your love streak.
> • Write and edit your own love notes.
> • The whole app in Turkish too, with a language choice in Settings.
> • Soft sounds when a focus or a break starts and when you finish. They respect the silent switch.
> • Fly over the map, as before. Everything you had in 1.3 comes with you.

**Türkçe**

> Valentine Pomodoro 1.4 yepyeni bir günlük.
> • Zamanlayıcının iki küçük yüzü Pomo ile Doro'yla tanış. İlk açılışta sana etrafı gösterirler.
> • Süreni tek dokunuşla seç: 25/5, 50/10, 90/20 ya da kendi süren.
> • İki zamanlayıcı düzeni: Halka ya da Karşılıklı sayfalar.
> • Bitirdiğin her odak bugünün sayfasına bir çıkartma yapıştırır ve günlük hedefine yaklaştırır.
> • İstatistikler artık bir kartpostal destesi; hedefin ve aşk serin de orada.
> • Kendi aşk notlarını yaz ve düzenle.
> • Uygulamanın tamamı artık Türkçe de; dili Ayarlar'dan seçebilirsin.
> • Odak ya da mola başlarken ve bitirdiğinde yumuşak sesler. Sessiz moda uyarlar.
> • Haritada uçuş eskisi gibi. 1.3'teki her şey seninle gelir.

### 3.6 M1: the merge (2026-11-02)

The owner: "do it". Built in a temporary worktree at `rehaul/v2` (`618fbf5`), so neither checkout switched branches, then fast-forwarded into `phase1/stage-d` for the guards and into `rehaul/v2` in the main checkout once they were green.

- **The merge commit:** `96ce9dd`, parents `618fbf5` (`rehaul/v2`, first) and `faa141d` (`phase1/stage-d`). `master` stays an ancestor of `rehaul/v2`, so the release can still fast-forward.
- **Four conflicts, none in code:**
  - `.gitattributes`: both blocks kept (the brand kit's `-text` paths, and `assets/fonts`).
  - ADR-0047's and the Stage C record's backlink blocks, and `TRACEABILITY.md`: all generated, regenerated by `check-docs --write`.
- **One interaction the guards caught:** `rehaul/v2` had changed the colour mark to the owner's choice C, strawberry pages in a cocoa cover (`4471c22`), source and exports. Stage D's generated `markColour.ts` still held the old drawing, so `build-icon-components --check` (`Icon.test.tsx`) failed. It was regenerated in `d3f62be`. It reaches one screen, the Modes sheet's header mark in the light theme.
- **The same brand change reaches the light splash.** `assets/images/splash-mark-light.png` is `rehaul/v2`'s choice-C mark (24,268 → 30,120 B). It is first seen on the release candidate (E2).
- **The guards on `d3f62be`, all green:**
  - `tsc`; lint, 0 errors and 29 warnings, as before;
  - the compiler report, 100 compiled and 5 skipped;
  - raw text, emoji, contrast (60 pairs);
  - the art, sound and icon checks, budgets (133 assets);
  - Jest, 65 suites and 494 tests;
  - `check-docs`.

### 3.7 Phase 1's exit criteria

From the plan §3, checked at E3 and E4:
- A1's guards green;
- Reassure's F1 drop (14 → ≤ 2);
- the React Compiler's lint rules at `error`;
- E1 and the iPhone checklists (A0, E2);
- `airports.json` out of the bytecode (B1b);
- Classic's audit ≥ 16/20;
- DECISIONS.md Q1 closed;
- DESIGN.md regenerated.

## 4. Mathematical / Statistical Details

Filled in at E3: the bytecode's size against NFR-PERF-002's ceiling, as (size − 3,856,208) / 3,856,208, and the Reassure counts against the baseline.

**E3, the bytecode, measured first (2026-11-01, at `eaf9e2a`; the code is build 58's):** `npx expo export --platform ios --platform android --dump-sourcemap`.

| | Hermes bytecode | Against the ceiling (3,856,208 B) | Against build 56 (4,139,364 B) |
|---|---|---|---|
| iOS | **4,287,144 B** | +430,936 B, **+11.18 %** | +147,780 B (+3.57 %) |
| Android | 4,286,828 B | | |

- **The growth since build 56 is D5:** the tour's code and its 44 art modules, vector paths held as JavaScript strings. They're evaluated only when a tour starts (`lazy()`), but Hermes still ships them in the one bundle.
- **The owner's decision at E3,** with the cold-start TTI in hand:
  - accept, amending NFR-PERF-002, as B6's overage was accepted on 2026-10-30;
  - or trim. The tour's art can leave the bytecode as a data asset read when the tour starts, as B1b moved `airports.json`.

**E3, Reassure (2026-11-02, on `d3f62be`, the merge):** `npx reassure`, three runs each, the counts identical across runs. The baseline is A2's (Phase 1 plan, A2 GATE; 2026-10-29). No baseline file is kept in `.reassure/`, so the comparison is with the recorded counts.

| Scenario, a 10 s running session | Baseline renders | Now | Change |
|---|---|---|---|
| settings-only consumer (finding F1) | 14 | **1** | −13; the exit criterion is ≤ 2 |
| Stats screen | 14 | 1 | −13 |
| Settings screen | 15 | 1 | −14 |
| Notes screen | 14 | 1 | −13 |
| Timer screen (Classic) | 14 | 13 | −1: the seconds repaint, through the `<TimerText>` leaf only (B4) |
| `TimerText`-sized leaf | 14 | 12 | −2: one render per displayed second |

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Close Stage D before the merge | Merge first, close after | The merge carries Stage D's shared-doc updates (§9); its records should be final when they land |
| One release candidate for E1, E2 and the store | Ship build 58 | The merge and the release paperwork change the commit; the binary in review must be the one checked, from the commit `master` fast-forwards to |
| `master` fast-forwards at approval | Merge `rehaul/v2` into `master` now | BRANCHING.md's transition: `master` stays the releasable trunk until the store approves |

## 6. Verification

- [ ] S1–S3: every Stage D record Done; the tour's verdict ship.
- [ ] M1–M2: the merge on `rehaul/v2`, guards green, §9 applied.
- [ ] E1–E4: as above, each recorded here.
- [ ] R1–R6: the release candidate checked, submitted, approved, released, tagged and announced through `update.json`.

## 7. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md) · [Stage D plan](2026-10-30-phase1-stage-d.md) · [D5 record](2026-11-01-phase1-d5-tutorial.md)
- [Release process](../process/RELEASE.md) · [Branching model](../process/BRANCHING.md) · [Test strategy](../testing/TEST-STRATEGY.md) §5
