---
version: 1
slug: "app-pair-tsx"
primary_target: "app/pair.tsx"
related_targets: ["src/screens/pair/PairScreen.tsx"]
---

# Pairing: your code and theirs (`/pair`)

Surface brief from `/impeccable shape`, Phase 2 A3, 2026-11-05. **Mode: Operate.** Build path: code-led. `seed:0039ebbffa7e05be`. D1 builds it, behind `PAIRING_ENABLED`.

**Brief and direction contract approved by the owner, 2026-11-05** ("Approve it").

**The owner's discovery answers, 2026-11-05:**
- **Where Pair lives:** "Timer strip when idle, and Settings".
- **The structure:** "Facing pages", chosen over One grouped list and The postcard.
- **The frames:** "Yes, they're right".

**The owner's decisions at D1's finish review, 2026-11-06,** which change the text below where it says so:
- **Where the morph plays:** "Inside the sheet". §4 had given it its own route, against the contract's "no cut".
- **Pomo & Doro at who-it-is:** "Lean toward the middle", where the morph starts them, so nothing moves when you press Pair. It departs from sketch frame 4, which centres them.
- **VoiceOver's order:** "Use the screen's order". React Native's reordering is off in this build, so §6's order can't be had.
- **Before a new code:** "Keep the alert", because a new code cancels one your partner may already hold.

**The owner's direction after build 63, 2026-11-07:** "2. A paper plane between you", from three sketched directions (https://claude.ai/artifact/6QvYtJ5kdriaDTikUNPkmm), after asking for "a design improvement with VectorCraft" because the empty stretch "makes it less alive". It changes §5's first state and the first viewport, as below.

## 1. Job and audience

- **Who arrives:** a student, usually in a long-distance couple, who wants to see their partner's day. They've used the app solo; they're signing in for the first time, only because they chose to pair.
- **Their state of mind:** a little excited, and possibly wary of an account in an app that never needed one.
- **What they need:** to know why an account is needed, to get their code to their partner or type their partner's, and to be sure it's the right person before anything happens.

## 2. Outcome and proof

- **Primary action:** Send my code, or typing theirs. Neither person has to decide which they are first.
- **Success:** two people paired in under a minute, with one of them typing six characters. Each knows who they paired with, and it can't happen by accident.
- **What only this app has:** the two pages of the diary, one for each person, closing into the Same Page mark.

## 3. Selected direction: Facing pages

The sheet is the open spread from the Timer's Facing Pages layout, in the Same Page mark's proportions: your page on the left, your partner's on the right. Your code sits on your page. The six empty cells for theirs sit on the facing page, so there's no "invite or join" question. Confirming closes the two pages into the mark.

**Kept from the declined structures:** one fixed cell per character, so a code never shifts as it's typed (split-flap); one job on each step (the feed); and the system's alert for what can't be undone, in the account surfaces (the grouped list).

## 4. Scope and boundaries

- **Target:** `app/pair.tsx`, a form sheet at the large detent, with its parts in `src/screens/pair/`. The first-pairing morph plays in this sheet.
- **Unchanged:** the session engine, the clock store, the tabs.
- **Not here:** links (Phase 6), a choice of sign-in, anything a solo user sees beyond the strip's line.
- **Anti-goals:** no form-like list, no "are you the inviter?" question, no stacked sheets, no alert for a mistyped code, no scolding, no emoji in the interface.

## 5. States and ranges

- **Before sign-in:** the spread at a shorter height (each page with one dashed cell), why, the plane scene, Apple's button, Not now. Pomo and Doro move off the pages into the scene, so nobody is drawn twice. Where there's no scene, at the largest text sizes and on a landscape iPhone, Pomo stays on your page.
- **The plane scene:** on the sign-in step and the code step only. It fills the space between the content and the buttons: Pomo at the lower left, Doro at the lower right, lifted, as stickers are, and a dotted route looping from one to the other, with a paper plane on it and two small hearts. The route, plane and hearts lie flat, in the theme's tokens. It's decoration, hidden from VoiceOver. It's left out at the largest text sizes, on a landscape iPhone, and whenever the space is under 120 pt, which can happen on small iPhones. It crossfades with the steps, and the sheet doesn't drag while a code is being typed. Who-it-is already draws the pair, the name step has the keyboard, and the morph has the mark.
- **Sign-in cancelled:** back to the same screen, with no message. **Sign-in failed or offline:** an inline line above the button, and it can be pressed again.
- **No name from Apple** (hidden, or a second sign-in): your page asks "What should your partner call you?" with one field, 1–60 characters, saying it's needed because that's what your partner sees.
- **Signed in:** your name on your page, the code in two rows of three, "Lasts 24 hours"; theirs empty. A code that's expired while the sheet was closed is replaced on opening.
- **Typing:** the right page lifts to flat and the keyboard rises. Letters are shown as typed, in capitals. Anything outside the alphabet is ignored, and I, L and O get a hint: "Codes never use I, L or O."
- **At six characters** it checks by itself, then shows who. **Errors, always inline on the right page, the cells kept:** no such code; expired ("Ask them for a new one"); already used; your own code; they're already paired; too many tries ("Try again in an hour"); offline ("You're offline. Your code is safe.").
- **Who it is:** both names on the two pages, with Pomo & Doro standing where the morph starts them, "Share your day and write notes to each other?", the Pair pill, "That's not them". Pair ignores presses for its first 500 ms, in case a finger on the falling keyboard lands there.
- **A session that has ended:** back to Apple's button, whatever the cache still holds. Signing in finds the couple on the server.
- **Make a new code:** a system alert first, since it cancels the code you have.
- **While the sheet is open, the inviter's phone checks every 10 s,** so when the partner confirms it moves on by itself. Otherwise it finds out at the next foreground. Once your code has really gone through the share sheet, a line under it says so: "This page moves on when they type it." (the owner's choice in the copy proof, 2026-11-06). A new code takes the line away.
- **Ranges:** names from 1 to 60 characters, Turkish and emoji included; they truncate on the spread at two lines, and never in the sentence that names them. The code is always six characters from 31 symbols.

## 6. Interaction and layout

- **One sheet, steps swap in place** with a 200 ms crossfade. Swipe down or the close button leaves at any step, and nothing is lost: the account and the code stay. The share sheet is the system's, over it.
- **The right page is one big button** until it's typing. One hidden text field carries the input (`ascii-capable`, all capitals, no autocorrect, paste accepted and cleaned), so VoiceOver and paste work as they do anywhere. The cells are drawn from its value and hidden from VoiceOver.
- **VoiceOver:** the sheet's title, the close button, your name and the code spelled out ("K, 7, M, P, 2, Q"), the field "Your partner's code", Send my code, Make a new code. That's the screen's order, and your page also offers Send my code as a VoiceOver action. Each step's change and each error is announced.
- **AX sizes (font scale 1.6):** the pages stack, you then your partner, with the same cells. Apple's button and Send my code are never below the fold.
- **Compact height (iPhone in landscape):** the spread takes the leading side and the actions the trailing side.
- **iPad:** the form sheet's own width.
- **The morph:** the two pages close into the mark, reusing the welcome's choreography and art, with one soft haptic and sparkles (at most 12). It plays once per person, at their first pairing, and is the third and last once-only exception to the one bounce. **Done** is live from the first frame. **Reduce Motion:** the settled mark fades in over 300 ms. Then one line: "You and Deniz are on the same page."

## 7. Constraints and open decisions

- **Apple's own button:** `AppleAuthenticationButton`, type Continue, black in Strawberry Milk and white in Midnight Plum, corner radius 28, height 56. It's the only control here not in the diary's stationery, and it must not be restyled.
- **Name only, if the server allows it:** ask Apple for the full name and not the email. C1 proves this against the real project. If Supabase refuses a sign-in with no email, the owner hears before it changes.
- **Type:** the code is in the system face, semibold, tabular. Baloo 2 stays where DESIGN.md puts it.
- **Copy:** every string in English and Turkish through the owner's copy proof (D6). The sketches' words are drafts.

## Direction contract

THESIS: Pairing happens on the diary's own open spread: your code on your page, theirs on the facing page, and confirming closes the two pages into the Same Page mark. It refuses the "invite or join" question, and a settings-style form for the moment the version exists for.

OWN-WORLD: The sheet is `page`. Two `paper` pages lean 1° toward the spine, outer corners 22, spine corners 8, with the crisp 1.5 pt `edge`, as Facing Pages draws them. One fixed cell per character, 40 × 48, radius 8, `page` fill with `edge`; empty ones have a dashed `edgeStrong` border, the same language as Today's dashed cells. Pomo and Doro stand in the plane scene with the sticker lift, and at the largest text sizes and on a landscape iPhone, Pomo stands on your page. One strawberry pill; quiet links in `primaryInk`; Apple's own button. System face throughout; no Baloo 2, shadows on chrome, gradients or emoji.

STORY: Why an account, in one sentence. Sign in with Apple. Your code is already there, and theirs is one tap away. Send or type. See exactly who it is. Pair. The pages close, and you're on the same page.

FIRST VIEWPORT: iPhone portrait, a form sheet at the large detent. The title "Pair with your partner", the close button at the trailing corner. Then the spread at full column width, about 230 pt tall: the left page's name, two rows of three cells, "Lasts 24 hours"; the right page's "Your partner", two rows of three dashed cells, "Tap to type their code". Then the plane scene, filling what's left. Under it, Send my code, the primary pill at thumb height, and the "Make a new code" link. Before sign-in, shorter pages hold one dashed cell each, then why, then the scene, then Apple's button at the same height. Signature interaction: confirming closes the two pages into the Same Page mark, from the spread on screen, with no cut.

FORM: Facing pages, the seventh on my ordered list of seven, dealt as the lead and locked by the owner. seed:0039ebbffa7e05be

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
