---
id: IMPL-2026-11-01-phase1-stage-e
title: "Phase 1 Stage E: verify and ship v1.4.0"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-stage-d, IMPL-2026-11-01-phase1-d5-tutorial, RELEASE, BRANCHING, SRS]
---

# 2026-11-01 — Phase 1 Stage E: verify and ship v1.4.0

**Status:** In progress. **S1 done** (2026-11-01): build 58's device check passed, visual and sound ("All visual tests are passed", "Yes, sounds passed"). The plan below was written before any of its steps. The owner, 2026-11-01: "wonderful everything is looking just like how i want it. All visual tests are passed. I think it is time to prepare the app for shipping."
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
**Phase 1's exit criteria** (the plan §3), checked at E3 and E4:
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
