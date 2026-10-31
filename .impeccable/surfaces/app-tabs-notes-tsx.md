---
version: 1
slug: "app-tabs-notes-tsx"
primary_target: "app/(tabs)/notes.tsx"
related_targets: ["src/screens/LoveNotesScreen.tsx"]
---

# Love notes (Notes tab, `/notes`)

Surface brief from `/impeccable shape`, Phase 1 D2, 2026-10-31. Mode: **Operate**. Build path: code-led.

## 1. Job and audience

The visitor writes, edits and curates the notes that appear after a focus session, in the love-note sheet D1 built. In v1.4 a solo user writes notes for themself. Phase 2 adds notes from a partner, and this page will hold both.

## 2. Outcome and proof

- **Add a note in two taps.** Edit, delete, preview a random one, and restore the defaults.
- **Success:**
  - the list reads as the diary's slips of paper;
  - every row behaves like a native list row: tap to edit, swipe for actions, a context menu;
  - the count is visible.
- **New default notes (FR-NTE-002):** name-free, in English and Turkish, for fresh installs only. Claude drafts them; the owner reviews the copy. Bengisu's install keeps hers: B2's tests pin v1.3.1's set through `legacyLoveNotes.ts` and the `v131` fixtures, and they must stay green.
- **A 280-character cap** (the owner, 2026-10-31). The editor counts down in its last 30 characters. A note already longer than 280 is kept and shown in full, and it can be saved as long as it doesn't grow, so nobody is forced to cut what they wrote.

## 3. Selected direction

- **The title** is "Love notes" with the count, with no emoji. **Add** is the header's one action.
- **The notes are one inset grouped list** of `paper` rows (radius 14, `edge`):
  - each row carries the note's full text, wrapping;
  - a tap opens the editor;
  - a swipe shows Edit and Delete, and a long press opens the same two in a context menu;
  - they replace today's small inline Edit and Delete links, which sit under 44 pt.
- **The editor is a native sheet** with a multi-line field, the countdown, and Cancel and Save in its header. It replaces today's `Modal`.
- **"Preview a note"** replaces "Randomize preview". It opens the love-note sheet with a random note, the same sheet Classic shows.
- **"Restore default notes"** sits at the list's foot as a quiet button and confirms in a native alert.

## 4. Scope and boundaries

- **Target:** `app/(tabs)/notes.tsx` → `src/screens/LoveNotesScreen.tsx`.
- **Unchanged:**
  - the notes store and `pickRandomNote`;
  - D1's love-note sheet;
  - `legacyLoveNotes.ts` and the `v131` fixtures.
- **Not in v1.4:** Phase 2's partner notes. The list needs no re-layout to gain a "From your partner" group later.
- **Anti-goals:**
  - no emoji as icons, though the emoji people type stay in their notes;
  - no card inside a card;
  - no self-closing toasts.

## 5. States and ranges

- **From 0 to 200 or more notes.** A note runs from 1 to 280 characters, longer for legacy notes. Notes may hold emoji and long, unbroken URLs, which wrap.
- **Empty, after every note is deleted:** Pomo & Doro, one line ("Add a note for after your next focus"), and Add.
- **Delete** asks first, as today. **Restore defaults** is destructive and confirms.
- **Turkish** and **AX5** must hold. At AX5 a row's text wraps fully, and the swipe actions keep their labels.

## 6. Interaction and layout

- **Hierarchy:** the title and Add, then the list, then the preview and restore actions at its foot.
- **VoiceOver:**
  - each row is one element reading the note;
  - Edit and Delete are custom actions, so no swipe is needed;
  - the counter is announced near the cap.
- **Motion:**
  - the editor sheet uses the system's sheet motion;
  - a deleted row leaves through the list's own layout animation;
  - with Reduce Motion, it fades.
- **Responsive:** on iPad and in wide windows the list is centred at a readable width.

## 7. Constraints and open decisions

- **Copy:** every string is an i18n key in English and Turkish, sentence case. The new default notes go to the owner's copy review in both languages.
- **The editor's route:** a formSheet route like `/love-note` (`app/note-editor.tsx`), so it inherits D1's sheet options (`sheetOptions.ts`).
- **Open:**
  - how many defaults ship (v1 has 20);
  - whether "Preview a note" stays on this page or moves to Settings › Love notes.

## Direction contract

**Resolved since the brief** (from the HIG review, D2 record §3.2):
- Delete has a button in the editor.
- "Restore default notes" adds back the missing defaults and removes nothing.
- Unsaved edits ask before they're discarded.
- The editor gets its own sheet entry, at the large detent with a header.
- "Preview a note" stays on this tab, above the list.
- The trailing swipe is Delete alone.
- **20 new defaults ship,** as many as v1, drafted name-free in English and Turkish for the owner's review.

THESIS: The diary's slips of paper, as a native list. It refuses inline link rows and modal pop-ups. A tap edits, a swipe deletes, a long press opens the menu, and every one of those actions also has a button.

OWN-WORLD:
- The `page` ground.
- The notes are one inset grouped list of `paper` rows (radius 14, `edge`), each with the note's full text in the system face.
- Actions are text buttons in `primaryInk`; destructive ones in `danger`.
- The editor is a native sheet in `page`, with a `paper` field.
- Pomo & Doro appear only on the empty state.
- No emoji in the chrome. People's own emoji stay in their notes.

STORY: Write the notes you'll see after a focus. Add one in two taps, edit by tapping, and delete from a swipe, the menu or the editor. Preview one, and restore the defaults without losing your own.

FIRST VIEWPORT: iPhone portrait.
- **The title:** "Love notes" with the count (20), and Add as the header's action.
- **"Preview a note"** sits above the list. It opens the love-note sheet with a random note.
- **The list:**
  - one row per note, its full text wrapping;
  - a trailing swipe gives Delete;
  - a long press gives Edit, then Delete, last and destructive, through `Link.Menu`, with no icons;
  - the same actions are VoiceOver custom actions.
- **At the foot,** "Restore default notes": it adds back the missing defaults, removes nothing, and confirms first.
- **The editor** (`app/note-editor.tsx`):
  - a formSheet at the large detent, with a header holding Cancel and Save;
  - a multi-line field that follows the keyboard;
  - a countdown in its last 30 characters (a legacy note over 280 gets a neutral line instead), announced at thresholds;
  - "Delete note" at its foot;
  - with unsaved changes, dismissing it asks: Discard changes or Keep editing.
- **Empty:** Pomo & Doro, "Add a note for after your next focus", and Add.
- **AX5:** a row's text wraps fully.
- **Regular width:** centred at a readable width.
- **Signature interaction:** the slip opens into the editor. Tap a row and the sheet rises with that note ready to edit. The cap is enforced in `onChangeText` as max(280, the note's original length).

FORM: A native inset grouped list with a sheet editor, the brief's form. There was no composition round: on an Operate surface, the native list is settled. seed: none (no roll)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
