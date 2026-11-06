---
id: IMPL-2026-11-05-phase2-d1-pairing
title: "Phase 2 D1: Sign in with Apple and pairing by code"
status: in-progress
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a3-design, IMPL-2026-11-05-phase2-c1-client, ADR-0049, DESIGN-WORKFLOW, SRS]
---

# 2026-11-05 — Phase 2 D1: Sign in with Apple and pairing by code

**Status:** Built, tested and reviewed from code. The device checks and the review of captures wait for Stage F's first build, because `PAIRING_ENABLED` is still false.
**Branch:** `feat/phase2-d1-pairing`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, D1](2026-11-05-phase2-plan.md#stage-d-the-screens-behind-the-flag). Its brief and direction contract: `.impeccable/surfaces/app-pair-tsx.md`, approved by the owner on 2026-11-05 ("Approve it").

---

## 1. Problem / Motivation

This is the moment 1.5.0 exists for. Two people who have only ever used the app alone sign in, exchange a code and become a couple, without either of them having to work out who invites whom. It has to be hard to pair with the wrong person, and it must never touch a solo user.

Requirements: [FR-ACC-002](../srs/SRS.md#fr-acc-002), [FR-PAR-001](../srs/SRS.md#fr-par-001), [FR-PAR-002](../srs/SRS.md#fr-par-002).

## 2. What Changed

| File | Change |
|------|--------|
| `app/pair.tsx` | New route. It loads its screen with `React.lazy`, so a solo launch doesn't evaluate it. |
| `app/_layout.tsx` | Registers it as a form sheet. |
| `src/navigation/sheetOptions.ts` | The pairing sheet's options. |
| `src/screens/pair/PairScreen.tsx` | New: the sheet and its steps, including the first pairing's morph, in place. |
| `src/screens/pair/Spread.tsx`, `src/screens/pair/CodeCells.tsx` | New: the two pages, one page alone, and the fixed cells. |
| `src/screens/pair/pairing.ts` | New: what the screen does, on the server's functions, with its statuses. |
| `src/screens/welcome/WelcomeScreen.tsx`, `src/screens/welcome/MorphStage.tsx` | The welcome's stage is pulled out, so that both can use it. One change reaches the welcome: under Reduce Motion its settled mark now really fades in (§5). |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/SpreadPages.tsx` | The idle strip's "Pair with your partner" line, the flag's first reader. |
| `src/server/account.ts`, `src/server/client.ts` | A small store, so that the strip re-renders at sign-in, and `sessionEnded`, so that a refused session offers signing in again. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The words, drafts for the copy proof (D6). |
| `.impeccable/surfaces/app-pair-tsx.md`, `DESIGN.md` | The owner's four decisions, and the sheet and its morph in the design system. |
| `eslint.config.js` | The rule also covers the lazy screens, so a route can't import them statically. |
| `src/screens/pair/__tests__/*`, `src/__tests__/soloRouter.test.tsx` | The flow's states, and a solo launch through the router with `/pair` among its routes. |
| `docs/implementations/2026-11-05-phase2-b3-functions.md`, `docs/implementations/2026-11-05-phase2-plan.md` | The secret-key check's result, and the owner's two finished items in §0.2. |

## 3. Implementation Approach

**One derived view.** `PairScreen` keeps a `step` (`signin`, `name`, `pages`, `confirm`), but what it shows is `view = couple ? 'morph' : step`. A couple in the snapshot means the morph whichever phone got there first, so there's no state to keep in step between the two phones. While the sheet shows your code, the query refetches every 10 s, which is how the inviter's phone moves on by itself.

**What it shows is derived, in this order:** no session or one that has ended, Apple's button (also while `signIn()` is still running, because the account flag is set before the name is saved); a couple, the morph; a person with no name, asking for one; otherwise `step`. Deriving the name step is what makes it impossible to skip: Apple sends a name only once, and closing the sheet there would otherwise leave a partner seeing nothing to recognise.

**Each step is a `body` and its `actions`.** That split gives the layouts one source:

- **Portrait:** the actions are pinned at thumb height, with the window's bottom inset, and their room stays reserved so Done lands where Pair was.
- **The name step:** in the scroll, because its keyboard would cover pinned actions. The keyboard's Done key also continues.
- **Landscape iPhone (height under 500 pt):** the body takes the leading side and the actions the trailing side, in the scroll.
- **Largest text sizes (font scale 1.6 and up):** the pages stack.

**The morph's join.** At who-it-is the pages are the paper `Spread`, and `MorphCharacters` draws Pomo & Doro from the welcome's timeline, held still at `MORPH_START_MS` (2100 ms), the frame where they've landed on the open spread. Pressing Pair crossfades the pages to the drawn diary at the same place over 200 ms; the characters are the same at both ends, so they don't move. The shared value then runs on to `DURATION` on the UI thread, after a 200 ms `withDelay`, with one soft haptic at the bump. On stacked pages there's no spine to lean toward, so the stickers simply stand on their pages.

**Once per person.** `wasCelebrated()` is true once any couple has been celebrated. A sheet that opens or arrives on a celebrated couple sets the timeline straight to its end, and the `armed` shared value keeps that jump from firing the haptic.

**Reduce Motion.** Who-it-is is already still. At the morph, `MorphArt` mounts in its reduced form and the settled mark fades in over 300 ms. Every fade here passes `ReduceMotion.Never`, because Reanimated's default jumps an entering animation to its end under the setting, and the app's rule is that opacity stays.

**Right person, by construction.** A request counter lets only the latest check answer, and Pair redeems the code that was shown, held in a ref, not whatever is in the field. A key that changes nothing doesn't check again, because a wrong code counts as a failed try; a check that never got an answer can be repeated. Pair ignores presses for its first 500 ms, in case a finger on the falling keyboard lands there.

**Your code can't be cancelled by accident.** `create_invite` deletes your earlier code, so `ensureCode` waits for the cache, then asks the server, and never makes a code when it can't tell: with no answer it shows the last known code, or says so. A new code goes straight into the cache, so a failed refresh can't leave a cancelled one on show. The last known code appears at once while this happens, because the story says "your code is already there". Make a new code asks first.

**After the token, nothing is a failed sign-in.** If `set_profile` or the first snapshot fails, the person is signed in, and the sheet carries on. `saveName` sends the time zone and language again in case they were lost, and writes the name into the cache so a failed refresh can't keep asking.

**An ended session** keeps `account_v1`, as C1's record decided, since the account still exists. `client.ts` sets `sessionEnded` beside it and sign-in clears it, and the sheet returns to Apple's button.

**The code field.** One real `TextInput`, nearly transparent, covers the whole right page through `Spread`'s `rightOverlay`, so the keyboard, paste and VoiceOver work as they do anywhere, and the whole page behaves as the button the contract asks for. The cells are drawn from its value and hidden from VoiceOver. `cleanCode` drops what isn't in the alphabet, and says when it dropped a look-alike. At six characters the sheet checks by itself, saying so in the page's line. Errors appear on the right page in place of the hint, with the cells kept.

**VoiceOver.** Each step's change and each error is announced, your page reads your name, the code spelled out and how long it lasts, and it also offers Send my code as an action.

**The solo promise.** `app/pair.tsx` is the only way in and uses `React.lazy`. The lint rule now also covers `screens/pair` and `screens/partner`, and `soloRouter.test.tsx` launches through the real router with `/pair` present and proves that neither the screen, the client, the query library, the Keychain module nor Apple's module is evaluated.

**Shared art.** The welcome's stage moved to `src/screens/welcome/MorphStage.tsx`, and the welcome's own tests pass unchanged.

## 4. Mathematical / Statistical Details

**Cell scale.** The cells must fit on one page, and a zoomed small iPhone is only 320 pt wide:

```
spread    = W − gutters, or (W − gutters − space.l) · 6/11 on a landscape iPhone
pageRoom  = (spread − space.s) / 2 − 2·space.s − 2·edgeWidth
CODE_WIDTH = 3·40 + 2·(space.xs + 2)
cellScale = 1.2 when stacked, otherwise min(1, pageRoom / CODE_WIDTH)
```

where W is the window's width. Stacked pages have the whole width to themselves, which is why they can scale up.

**Bytecode.** `npx expo export --platform ios --dump-sourcemap` gives **4,526,660 B**, which is 69,340 B more than C3's 4,457,320 B and 113,340 B under NFR-PERF-002's 4,640,000 B. That's what D2 to D6 have left between them.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|-------------------------|--------------|
| **The morph plays in place, in the sheet.** The owner, 2026-11-06: "Inside the sheet" | Its own full-screen route, as the welcome is | The brief said both: its §4 gave it a route, while the contract's first viewport says "from the spread on screen, with no cut". A second route means a cut: the sheet goes down and something else fades up. It costs a smaller stage than full screen |
| **Pomo & Doro stand where the morph starts them.** The owner: "Lean toward the middle" | Centred on their pages, as sketch frame 4 draws them | Centred, each would jump about 70 pt during the crossfade, as a double image, at the moment that matters most |
| **VoiceOver reads the screen's order,** with Send my code as an action on your page. The owner: "Use the screen's order" | `experimental_accessibilityOrder`; moving Send above the pages | That prop does nothing here: its feature flag is off in Stable's release level (`RCTViewComponentView.mm`), and turning it on looks unsafe for keyed swaps, since the list isn't recomputed when children change. Moving Send would lose thumb height for everyone |
| **An alert before a new code.** The owner: "Keep the alert" | One tap, as the design drew it | A new code silently cancels one your partner may be about to type. A3's H-6 kept alerts for Unpair and Delete, so this is a deliberate third |
| Actions pinned at thumb height | Following the body, mid-sheet | The contract says so, and the HIG's sign-in page warns against scrolling to the button. The sketches draw them mid-sheet, but on the large detent that left about 365 pt empty below them |
| `sessionEnded` beside the account flag | Clearing `account_v1`, as the review first suggested | C1's record keeps the flag on purpose: the account still exists, and the UI should offer signing in rather than pretend to be solo |
| A real text field over the page | Drawing cells and a hidden field off-screen | The system's keyboard, paste, and VoiceOver's field behaviour all come free, and it's the brief's wording |
| The first pairing's morph keeps its haptic under Reduce Motion | Dropping it, as the welcome does | It's the one physical sign of something the person just caused, and a haptic isn't motion. The welcome has none there only because nothing is crossed |
| Offline on a typed code says "Your code is safe" | One offline line everywhere | The brief's wording for that moment: the person is worried about what they typed, not about signing in. Sign-in keeps its own line |
| The icon set's `close` | The `×` character | Impeccable's craft floor refuses Unicode standing in for icons, and the app has a drawn one |

**Left for D2:** while there's a couple, the strip should go to the partner's sheet rather than here. Until then the flag is off, so nobody can reach this state from the strip.

## 6. Verification

- [x] The flow's tests (`src/screens/pair/__tests__/`: sign-in, cancel, offline, name, code, share, new code, each error, who-it-is, Pair, Reduce Motion, pinned actions, the morph), the solo launch through the router, and the guards.
- [x] Bytecode: 4,526,660 B, under the 4,640,000 B ceiling.
- [x] **Finish review from code,** by `impeccable-finish-reviewer`, in two passes, with its findings below.
- [ ] **Needs a device, at Stage F's first build:** the finish review on captures, at the largest text size, with Reduce Motion and with VoiceOver: first viewport and the gap above the pinned actions, the close button's look, the window's bottom inset inside the sheet, both themes, iPad's width, the keyboard falling during the crossfade, paste and the `oneTimeCode` bar, swipe to dismiss, the actual VoiceOver order and focus after each swap, the morph's feel and haptic, how the paper-to-drawing crossfade reads and how close the pair sit at the spine, whether Pair's 500 ms guard ever eats a real press, Sign in with Apple against the real project with a hidden name and a second sign-in, and the inviter's phone moving on by itself.

### The finish review, 2026-11-06

**From code only,** so nothing visual is marked passed.

| Pass | At | Critique | Native audit | Disposition |
|------|----|----------|--------------|-------------|
| First | `71b011b` | 28/40 (14/20), two HIG Criticals | Not run | Fix |
| Verdict | `f3cb25b` | 32/40 (16/20), no Critical from code | **16/20,** which meets NFR-UX-003 with no margin, and is provisional until VoiceOver is checked on a device | Fix, motion blocked on four rows |
| Third, on those items only | `a8cb0e3` | Not rescored | Not rescored | Fix: the four items below |

The verdict pass's items went into `a8cb0e3`: Pomo & Doro's registration, Pair's jump, the false sign-in line, the last known code, the fades' ease-out, one haptic at Pair, no double entrance on opening, no polling during the morph, the landscape gutters, the stuck `typing` state, and "That's not them" during Pair. The third pass accepted all but one of these, and found three more and one line outside its list, all fixed after it: the reserved room was on the padded wrapper, so Done still sat 42 pt below Pair; the held stickers had no lift and the idle pose under them; a sheet opened on a couple since gone drew no characters at who-it-is; and a failed Make a new code showed nothing while a code was on the page. **The reviewer's last disposition is therefore "fix", and it hasn't seen these four,** whose checks are the tests here plus the device list. The scores above predate all of this.

**HIG findings, from the first pass, and what became of them:** the close button's target, resolved by moving its corner onto a wrapper, since `PressableScale` styles its inner view; unannounced steps and errors, resolved; VoiceOver's order, accepted by the owner; the Facing Pages way in, resolved at about 45 pt with `hitSlop={12}`.

**Left open on purpose:** "Nothing says the sheet moves on by itself after you send" (critique's help heuristic) and `pair.why` having lost "the timer works without it" both go to D6's copy proof. Settings' Pair row is D4's.

## 7. Related Docs

- [A3's record](2026-11-05-phase2-a3-design.md), [C1's record](2026-11-05-phase2-c1-client.md), [Phase 2 plan](2026-11-05-phase2-plan.md), D1
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
