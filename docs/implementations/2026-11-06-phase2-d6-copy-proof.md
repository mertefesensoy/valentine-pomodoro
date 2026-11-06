---
id: IMPL-2026-11-06-phase2-d6-copy-proof
title: "Phase 2 D6: 1.5's strings through the owner's copy proof"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-d5-tutorial, IMPL-2026-11-01-phase1-d5-tutorial, DESIGN-WORKFLOW, SRS]
---

# 2026-11-06 — Phase 2 D6: 1.5's strings through the owner's copy proof

**Status:** The owner's marks are applied. The new line's fit waits for Stage F's first build.
**Branch:** `feat/phase2-d6-copy-proof`, one pull request into `master`, opened once the owner's marks are applied.
**Plan task:** [Phase 2 plan §3, D6](2026-11-05-phase2-plan.md#stage-d-the-screens-behind-the-flag): "every string in both languages through the owner's copy proof". Done when the owner's marks are applied.

---

## 1. Problem / Motivation

D1 to D5 wrote their words as drafts. 114 strings are new since the proof's last version (`38b9f51`), and none of the older ones changed. The owner's review is the only check on whether the Turkish reads like a person wrote it, and the earlier reviews only let them change the Turkish, while the plan asks for both languages.

Three items were set aside for this step:

- `pair.why` lost "the timer works without it" (D1's finish review).
- Nothing says the pairing sheet moves on by itself after you send your code (D1's finish review).
- `en-US` writes "Paired Nov 5" where the brief writes "Paired 5 Nov" (D4's record).

## 2. What Changed

| File | Change |
|------|--------|
| `scripts/design/copy-proof/build.mjs` | Places the new namespaces, adds a line about each new section, Claude's notes on particular strings, and the new question. |
| `scripts/design/copy-proof/template.html` | A change can be in either language, **To review** includes unanswered questions and hides finished sections, and the page opens on it. |
| `art/review/copy-proof.html` | The built page, version 7. |
| `src/i18n/en.json`, `src/i18n/tr.json` | `pair.why` gets its sentence back, and the owner's marks: one Turkish change and the new `pair.sent`. |
| `src/screens/pair/PairScreen.tsx` | The line under your code once it has gone. |
| `src/screens/pair/__tests__/PairScreen.test.tsx` | When the line shows, and when it goes. |
| `.impeccable/surfaces/app-pair-tsx.md` | The owner's choice, in the brief. |

## 3. Implementation Approach

**The page stays where it is,** the private artifact with its `verdicts` database, keyed by i18n key. Moving a string between sections loses nothing, so the owner's marks stand: 307 on strings and notes, two answers, and one for a string since removed (`stats.streakStartBest`). Republishing with its `url` and no `capabilities` keeps both the database and the link.

**Both languages.** A string's edit form gains a second box for the English, filled in with the current text. A saved change has `text` (the Turkish, as before), and `textEn` only when the English differs. Saving with neither line changed and no reason is refused, since an unedited save used to store a "change" equal to the original.

**Reading the marks back.** Only documents whose `at` is later than `2026-11-01T18:27:14.808Z`, the last mark in the store on 2026-11-06. Each change is compared with the current text and keeps its `{{placeholders}}`. A change to a `tour.*` line that breaks the tour's 10-letter rule goes back to the owner, as "Odaklandığın" did.

**What I decide and what the owner does.** A content gap in a new draft is mine to fix first, so that the owner proofs a final draft: that's `pair.why`. Turkish voice is what the proof is for, so those get a note on the string, not a rewrite. Whether the sheet should say it moves on is a design choice, so it's a question on the page.

### What the owner marked

Read back on 2026-11-06, the 115 documents later than the watermark: 113 "Looks right", one change, one answer. Every new string has a mark.

- **`pair.tapToType`,** in Turkish, "Onun kodunu yazmak için dokun" became the owner's "Kodu yazmak için dokun", with the reason "Self explanatory this way".
- **`q-pair-wait`:** "Add a line under the code once it’s sent: “This page moves on when they type it.”"

### The line

`pair.sent` shows under "Lasts 24 hours" once `Share.share` resolves with `sharedAction`, and is announced to VoiceOver. Cancelling the share sheet shows nothing, since then the code hasn't gone anywhere. The state holds the code that was sent rather than a flag, so a new code takes the line away by itself: that isn't the code they have. A failed new code replaces both lines, as it already did for "Lasts 24 hours". It doesn't animate, since it appears while the share sheet is closing.

The question gave only the English. The Turkish, "Partnerin kodu yazınca bu sayfa ilerler.", follows the owner's own trim of `pair.tapToType`, and names the partner because "yazınca" alone could mean you.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| One slip per string, with both languages | Two slips per string, as the default notes have | One mark per string keeps it to 114 marks, not 228 |
| The page opens on **To review** | Opening on All, as before | 307 of the 421 items already have marks, and the 114 still open are exactly the new strings |
| Notes from Claude on particular strings | Listing them in the intro | They're read at the moment they matter |
| The line shows only after a real send | From the first press of Send | Pressing Send and cancelling hasn't sent anything, and the line would be untrue |
| `partner` and `account` get sections of their own | Leaving `partner` under Timer, as an earlier version had four strings there | 37 strings about another screen don't belong under Timer, and marks follow the key |

## 6. Verification

- [x] The page builds, and all 379 strings in `en.json` are on it, with none twice.
- [x] The page's own script against a fake store in jsdom, so the owner's marks weren't touched: it opens on **To review** at 307 of 421, an unedited save is refused, an English change stores `textEn` and leaves the Turkish, a Turkish change stores no `textEn`, a lost placeholder warns in either language, and answering the new question hides it.
- [x] The owner's old marks are still there after the republish, read back from the store.
- [x] The owner's marks are read back and applied, with the guards green.
- [x] Bytecode: 4,587,492 B, which is 908 B for D6 and leaves 52,508 B of NFR-PERF-002.
- [x] `npx jest --ci`: 88 suites and 896 tests. One full run lost a Stats test to its 5-second timeout (`stats.test.tsx`, landscape); the suite passed three times alone, and the next full run was clean, so that was load.
- [ ] **Needs a device, at Stage F's first build:** the line under the code on a narrow phone and at AX sizes, in both languages, and that the sheet doesn't jump when it appears.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), D6
- [D5's record](2026-11-06-phase2-d5-tutorial.md), [Phase 1 D5's record](2026-11-01-phase1-d5-tutorial.md)
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
