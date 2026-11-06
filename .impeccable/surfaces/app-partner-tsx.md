---
version: 1
slug: "app-partner-tsx"
primary_target: "app/partner.tsx"
related_targets: ["src/screens/partner/PartnerScreen.tsx","src/screens/TimerScreen.tsx"]
---

# Your partner's day, and notes to them (`/partner`)

Surface brief from `/impeccable shape`, Phase 2 A3, 2026-11-05. **Mode: Operate.** Build path: code-led. D2 and D3 build it, behind `PAIRING_ENABLED`. It extends Classic (the strip) and reuses Stats' parts, so there was no structure round.

**Brief and direction contract approved by the owner, 2026-11-05** ("Approve it").

**The owner's discovery answers, 2026-11-05:**
- **On the Timer:** "Name and stickers on the strip".
- **A note when Show love notes is off:** "It waits on their card".
- **The frames:** "Yes, they're right".

## 1. Job and audience

A paired student, on the Timer between sessions or coming back to the app, wants to know how their partner's day is going, and sometimes to send a word. Usually a few seconds' look, several times a day. It never blocks on the network.

## 2. Outcome and proof

- **Primary action:** reading the strip. The sheet is for more detail and for writing a note.
- **Success:** the partner's name and today's stickers and minutes read at a glance on the Timer, with no tap; the last known values always show; a note appears exactly once.
- **What only this app has:** your partner's day in the same stickers and postcard paper as your own, and a note from them arriving in the love-note sheet after your focus.

## 3. Selected direction: the strip becomes your partner

**The Timer.** The strip under the ring keeps its size and place, so nothing moves when you pair. Solo and idle, it adds one line, "Pair with your partner", and the whole strip is the button. That line leaves when a session starts. Paired, the strip is your partner: one sticker, their name, today's stickers (up to three, then "+n") and "75 min today". On Facing Pages, the right page carries the same, its label the partner's name.

**The sheet, opened from the strip.** A form sheet sized to its content, as the Modes sheet is. A postcard in the paper of Stats' today (the date, a row of whole cells with dashed cells for what's still owed to their goal, then one line: "3 sessions · 75 min · goal 100 min"). Then "Updated 12 minutes ago". Then an action group: "Write Deniz a note", with one quiet footer: "It appears after their next focus."

**A note arriving.** After your next focus, in place of a note from your own list, the existing love-note sheet shows it, once, titled with who wrote it. With Show love notes off, no sheet appears, and the card gains "A note from Deniz is waiting", a row above Write, which opens the same sheet. **The strip also says so, in one quiet line, and its press still opens their day** (the owner at D3, 2026-11-06: "Yes, add a quiet line on the strip", knowing the Ring moves about 22 pt when it comes and goes).

## 4. Scope and boundaries

- **Targets:** `app/partner.tsx` with `src/screens/partner/`; the partner slot in `src/screens/TimerScreen.tsx` and `src/screens/classic/SpreadPages.tsx`; `LoveNoteSheet`.
- **Unchanged:** the session engine (the note choice is made in the UI, when the sheet is due), the Ring's sizing rule, Stats.
- **Not here:** presence, live updates, cheers, local time (Phase 3); a history of notes; editing or deleting a sent note.
- **Anti-goals:** no comparing the two of you, no "behind" or "ahead", no streak talk, no red anywhere on this surface, no spinner blocking the card.

## 5. States and ranges

- **Fresh install of the pairing, no data yet:** the name, then "Nothing yet today".
- **No row for their today:** "Nothing yet today", never yesterday's.
- **Offline or stale:** the last known values and "Updated 2 hours ago". Nothing else changes.
- **Their goal off:** no dashed cells, and the line drops the goal.
- **Writing a note:** the sheet's content swaps in place for the editor, with no second sheet, using the Notes editor's 280 limit and counter. A swipe with text in it asks first. **Sent:** "Sent. It appears after Deniz's next focus." **Too many today:** says so. **Offline:** the text stays, "You're offline. Try again when you're connected."
- **Partner gone** (they unpaired or deleted their account): at your next refresh, the strip returns to solo, with one quiet line under it until you tap it: "You and Deniz aren't paired any more." Your stats are untouched. Never an alert (`alerts.md`, on launch).
- **A session that has ended** (added at D2, 2026-11-06, the state the brief didn't list): the account still exists, so the strip keeps the last known values and adds one quiet line, "Sign in again to see your partner's day." The strip opens Apple's button, and signing in finds the couple on the server.
- **One account on two phones** (the owner at D3, 2026-11-06: "Yes, once per phone"): a note shows once per phone, since nothing blocks on the network before showing it.
- **Ranges:** 0 to 20+ sessions; names of 1–60 characters, Turkish and emoji included; Turkish at AX5 on an iPhone SE.

## 6. Interaction and layout

- **The strip:** at least 72 pt, one button, the whole width; press-in at 0.97 as every pill. VoiceOver: "Deniz, 3 sessions, 75 minutes today, button, opens their day." A solo strip reads its line and "Pair with your partner", as one button.
- **Reduce Motion:** opacity only, as everywhere.
- **Motion:** none on this surface, by Stats' frequency gate. The strip's values just change when a refresh lands.
- **AX sizes:** the strip grows and the ring gives way, as it already does; the sheet scrolls.

## 7. Constraints and open decisions

- **Refresh:** after the first frame and on returning to the foreground, never during a running session's tick. It holds no connection (plan §5).
- **Copy:** through the owner's copy proof (D6).

## Direction contract

THESIS: Your partner's day, in the same paper as yours. The strip you already know becomes them, with no new tab and nothing moving, and a note arrives where notes already arrive. It refuses a social feed, a comparison, and anything that could make someone feel behind.

OWN-WORLD: The strip is the existing `paper` field, radius 22, 1.5 pt `edge`. Stickers are Pomo & Doro's, with the die-cut edge and lift. The sheet's postcard is today's postcard from Stats, without Baloo 2's title, since the sheet names the person. Secondary text in `inkSoft`, the action rows in `primaryInk`. No red, shadows on chrome, gradients or emoji.

STORY: A glance tells you how their day's going. A tap gives you the whole day and when it was last updated. One more lets you write something for after their next focus. Later, a note from them is waiting for you at the end of yours.

FIRST VIEWPORT: The Timer, idle, on an iPhone in portrait: nothing moves from 1.4. Under the ring, the strip holds one 44 pt sticker at the leading side, the name at 17 pt, and under it up to three 22 pt stickers and "75 min today" at 14 pt. The sheet, once opened: the title (their name), the close button, the postcard at full column width, "Updated 12 minutes ago", then the action group. Signature interaction: none of its own. The one delight remains the sticker placement, and a note from your partner arrives in its existing sheet.

FORM: A native form sheet and the existing strip: an extension inside Classic's established surface, so there was no round. seed: none (no roll)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
