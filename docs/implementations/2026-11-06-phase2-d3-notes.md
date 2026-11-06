---
id: IMPL-2026-11-06-phase2-d3-notes
title: "Phase 2 D3: notes to your partner"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a3-design, IMPL-2026-11-06-phase2-d2-partner, ADR-0049, DESIGN-WORKFLOW, SRS]
---

# 2026-11-06 — Phase 2 D3: notes to your partner

**Status:** Built and tested. Under review from code; the device checks wait for Stage F's first build.
**Branch:** `feat/phase2-d3-notes`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, D3](2026-11-05-phase2-plan.md#stage-d-the-screens-behind-the-flag). Its brief and direction contract: `.impeccable/surfaces/app-partner-tsx.md`, approved by the owner on 2026-11-05 ("Approve it"). The owner's answer on a note with Show love notes off: "It waits on their card".

---

## 1. Problem / Motivation

The couple's first reason to come back to each other inside the app: write a word, and it appears once, at the end of your partner's next focus, in the sheet where love notes already appear. It has to work with no push and no connection held open, it has to show exactly once, and the session engine mustn't know it exists.

Requirement: [FR-NTE-003](../srs/SRS.md#fr-nte-003). "Done when": a note shows once, on both phones' check, plus `/break-ui`.

## 2. What Changed

| File | Change |
|------|--------|
| `src/server/partnerGlance.ts` | The waiting notes join the summary, with the ids shown but not yet confirmed, so a note can't come back. |
| `src/server/noteDelivery.ts` | New: tells the server which notes have been shown, and retries. Reached by `import()` only. |
| `src/server/runtime.ts` | Sends what's queued at each refresh. |
| `src/stores/loveNoteSheetStore.ts`, `src/components/loveNote/LoveNoteSheet.tsx`, `src/components/LoveNoteCard.tsx` | The note carries who wrote it, for the title. Phase 1's own notes read as before. |
| `src/screens/TimerScreen.tsx`, `src/screens/FlyModeScreen.tsx` | When a note is due, a partner's goes first. The strip's line when Show love notes is off. |
| `src/screens/classic/PartnerStrip.tsx` | That line, on the strip. |
| `src/screens/partner/PartnerScreen.tsx`, `src/screens/partner/NoteComposer.tsx`, `src/screens/partner/notes.ts` | New: the action row and the editor, in place in the sheet. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The words, drafts for the copy proof (D6). |
| Tests | Below. |

**Unchanged, on purpose:** `useTimer`, the session engine, `notesStore`, and `lastLoveNote`, which stays the person's own.

## 3. Implementation Approach

**The choice is made in the UI, when the sheet is due,** as the brief says. `useTimer` still picks one of your own notes and reports it due, and `TimerScreen`'s effect that opens the sheet is where a partner's note takes its place. Wrapping the picker would persist your partner's words into `lastLoveNote`, so it isn't touched. Fly's landing note is the same moment in `FlyModeScreen`, and takes a partner's note the same way.

**How a note reaches the Timer.** `TimerScreen` can't import `home.ts` (ADR-0049's rule), so the summary carries the waiting notes. `syncGlance` stays its one writer.

**Exactly once.** Three things have to hold:

- `takePartnerNote()` moves the oldest note out of `notes` and its id into `shown`, synchronously, in one store write, before the sheet opens. A second focus can't find it.
- `syncGlance` filters a snapshot's notes by `shown`, so a refresh that lands before the server has heard can't bring it back. An id leaves `shown` once a snapshot no longer lists it, which means the server has it.
- `flushShown()` calls `mark_note_shown` for each id in `shown`. It's marked on opening, not on closing, so a person who kills the app with the note open doesn't see it twice. It runs at once, and again at each refresh, so offline just means later. The function is idempotent ("the first time counts").

**Show love notes off.** `useTimer` never reports a note due, so the sheet can't carry it. The strip gains a quiet line, "A note from Deniz is waiting", and pressing the strip opens the same sheet, marking it shown the same way. Press it again and it's their day, as usual. The line keeps its place during a session so the Ring doesn't move, but it opens only while idle, since nothing else competes during a session, and then the strip opens their day. An ended session's line goes first.

**Writing.** `PartnerScreen` holds a `writing` flag, and the content swaps in place with no second sheet (H-3). The sheet stays `fitToContents`, which follows content height as it changes (`RNSScreen.mm:518`). `NoteComposer` reuses the Notes editor's cap and countdown: `capText`, `NOTE_MAX_LENGTH`, the same marks for VoiceOver. A client id is made once per note with `Crypto.randomUUID()` and kept across retries, because `send_note` is idempotent on it, so a retry after a lost answer can't send twice. A swipe with text in it asks first, by `usePreventRemove`, as the Notes editor does. Reached by `React.lazy` only, as the sheet is.

| `send_note` says | The sheet does |
|------------------|----------------|
| `ok` | Back to their day, with "Sent. It appears after Deniz's next focus." |
| `rate_limited` | Keeps the text, and says there have been too many today |
| Offline | Keeps the text, and says so |
| `not_paired` | Refreshes, which is how the strip's "gone" path starts, and the sheet closes itself |
| Anything else | Keeps the text, and says to try again |

**Motion:** none, by the surface's gate. The swap is the system's own resize.

## 4. Mathematical / Statistical Details

None beyond the 280 limit: `capText` counts UTF-16 units and won't split a character, and the server counts code points, which are never more, so anything the field allows is accepted. The server's limit of 20 notes a day is B3's.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Replace the note at the sheet's moment, in the UI | Wrap `pickRandomNote` | The brief's own words, and it keeps a partner's words out of the persisted pomodoro state and the engine out of it |
| Mark shown on opening | On closing | A note someone has seen and then killed the app on would otherwise appear again. It's meant to be once |
| Keep the waiting notes in the summary | Have the Timer read the query lazily | The Timer must evaluate no server code on a solo launch, and the summary is already there, with one writer |
| "It waits on their card" is the strip's line, and the strip opens it | A row in the sheet, which would stack a sheet on a sheet | The strip is the partner's card on the Timer, and H-3 allows one sheet at a time |
| Show love notes off doesn't hide a partner's note altogether | Dropping it, or holding it silently | The owner's answer. The setting is about your own notes appearing by themselves; a note someone wrote you still reaches you, when you choose |

## 6. Verification

- [x] `takePartnerNote` and `syncGlance`: oldest first, once, not brought back by a refresh, gone with the partner.
- [x] `flushShown`: confirms, keeps what failed, retries at the next refresh.
- [x] The Timer: a partner's note takes the place of your own, titled with who wrote it, and a second focus doesn't repeat it; your own note when there's none; nothing changes with the flag off.
- [x] Fly's landing: the same, and a partner's note waits to be closed, where your own leaves after 8 s, since it only comes once.
- [x] The strip's line with Show love notes off, opening the note, and not during a session.
- [x] Composing: every row of §3's table, the client id kept across retries, the cap, a swipe with text asks first.
- [x] A solo launch still evaluates no server code, and the session engine's tests pass untouched.
- [x] Break-ui's worst case (`partnerWorstCase.test.tsx`): 280 characters of Turkish and emoji in the sheet and the editor, cut on a whole character, from a 60-character name, at AX5 on an iPhone SE. Whether it lays out well waits for the device.
- [x] The guards, and the bytecode: 4,558,728 B, which is 12,600 B for D3 and leaves 81,272 B of NFR-PERF-002 for D4 to D6.
- [ ] **Needs a device, at Stage F's first build:** a note showing once on both phones; the content-sized sheet with the keyboard up, by name, since it can't be read from code; the finish review on captures, at the largest text size, with Reduce Motion and with VoiceOver.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), D3
- [A3's record](2026-11-05-phase2-a3-design.md), [D2's record](2026-11-06-phase2-d2-partner.md), [B3's record](2026-11-05-phase2-b3-functions.md)
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
