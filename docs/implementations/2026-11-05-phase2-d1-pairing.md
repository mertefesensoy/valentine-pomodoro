---
id: IMPL-2026-11-05-phase2-d1-pairing
title: "Phase 2 D1: Sign in with Apple and pairing by code"
status: in-progress
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a3-design, IMPL-2026-11-05-phase2-c1-client, ADR-0049, DESIGN-WORKFLOW, SRS]
---

# 2026-11-05 — Phase 2 D1: Sign in with Apple and pairing by code

**Status:** Built and tested. The device checks wait for Stage F's first build, because `PAIRING_ENABLED` is still false.
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
| `src/screens/welcome/WelcomeScreen.tsx`, `src/screens/welcome/MorphStage.tsx` | The welcome's stage is pulled out, so that both can use it. The welcome doesn't change. |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/SpreadPages.tsx` | The idle strip's "Pair with your partner" line, the flag's first reader. |
| `src/server/account.ts` | A small store, so that the strip re-renders at sign-in. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The words, drafts for the copy proof (D6). |
| `eslint.config.js` | The rule also covers the lazy screens, so a route can't import them statically. |
| `src/screens/pair/__tests__/*`, `src/__tests__/soloRouter.test.tsx` | The flow's states, and a solo launch through the router with `/pair` among its routes. |
| `docs/implementations/2026-11-05-phase2-b3-functions.md`, `docs/implementations/2026-11-05-phase2-plan.md` | The secret-key check's result, and the owner's two finished items in §0.2. |

## 3. Implementation Approach

**One derived view.** `PairScreen` keeps a `step` (`signin`, `name`, `pages`, `confirm`), but what it shows is `view = couple ? 'morph' : step`. A couple in the snapshot means the morph whichever phone got there first, so there's no state to keep in step between the two phones. While the sheet shows your code, the query refetches every 10 s, which is how the inviter's phone moves on by itself.

**Each step is a `body` and its `actions`.** That split gives the three layouts one source:

- **Usual:** the actions follow the body in the scroll.
- **Largest text sizes (font scale 1.6 and up):** the pages stack, and the actions are pinned below the scroll, so Apple's button and Send my code are never below the fold.
- **Landscape iPhone (height under 500 pt):** the body takes the leading side and the actions the trailing side.

**No cut at the morph.** Who-it-is and the morph share one React key and one `MorphArt` element, so pressing Pair doesn't remount the drawing. The welcome's timeline sits at `MORPH_START_MS` (2100 ms), the frame where the pair have landed on the open spread, and holds still there during who-it-is. When a couple appears, the same shared value runs on to `DURATION` on the UI thread, with one soft haptic at the bump, once the timeline passes `MORPH_HAPTIC_MS`.

**Reduce Motion.** Who-it-is shows that same still frame, because nothing moves until Pair. At the morph, a second `MorphArt` with its own key mounts in its reduced form, so the settled mark fades in over 300 ms, as the contract says.

**The code field.** One real `TextInput`, nearly transparent, covers the right page, so the keyboard, paste and VoiceOver work as they do anywhere, and the whole page behaves as the button the contract asks for. The cells are drawn from its value and hidden from VoiceOver. `cleanCode` drops what isn't in the alphabet, and says when it dropped a look-alike. At six characters the sheet checks by itself. Errors appear on the right page in place of the hint, with the cells kept.

**The solo promise.** `app/pair.tsx` is the only way in and uses `React.lazy`. The lint rule now also covers `screens/pair` and `screens/partner`, and `soloRouter.test.tsx` launches through the real router with `/pair` present and proves that neither the screen, the client, the query library, the Keychain module nor Apple's module is evaluated.

**Shared art.** The welcome's stage moved to `src/screens/welcome/MorphStage.tsx`, and the welcome's own tests pass unchanged.

## 4. Mathematical / Statistical Details

**Cell scale.** The cells must fit on one page, and a zoomed small iPhone is only 320 pt wide:

```
pageRoom  = (W − 2·space.l − space.s) / 2 − 2·space.s − 2·edgeWidth
CODE_WIDTH = 3·40 + 2·(space.xs + 2)
cellScale = 1.2 when stacked, otherwise min(1, pageRoom / CODE_WIDTH)
```

where W is the window's width. Stacked pages have the whole width to themselves, which is why they can scale up.

**Bytecode.** `npx expo export --platform ios --dump-sourcemap` gives **4,516,404 B**, which is 59,084 B more than C3's 4,457,320 B and 123,596 B under NFR-PERF-002's 4,640,000 B. That's what D2 to D6 have left between them.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|-------------------------|--------------|
| **The morph plays in place, in the sheet** | Its own full-screen route, as the welcome is | The brief says both things: §4 gives it its own route, while the contract's first viewport says "from the spread on screen, with no cut". A second route means a cut: the sheet goes down and something else fades up. So this follows the contract's signature interaction, and costs a smaller stage than full screen. **The owner is asked to confirm this at D1's push.** |
| Actions pinned at the largest text sizes | Keeping them in the scroll | The brief requires Apple's button and Send my code to stay above the fold. Stacked pages can't promise that in a scroll on a small phone |
| A real text field over the page | Drawing cells and a hidden field off-screen | The system's keyboard, paste, and VoiceOver's field behaviour all come free, and it's the brief's wording |
| Who-it-is shows the still art under Reduce Motion | Showing the settled mark from the start | The settled mark would say it had already happened, before the person has agreed. Holding a still frame involves no motion at all |
| Offline on a typed code says "Your code is safe" | One offline line everywhere | The brief's wording for that moment: the person is worried about what they typed, not about signing in. Sign-in keeps its own line |
| The icon set's `close` | The `×` character | Impeccable's craft floor refuses Unicode standing in for icons, and the app has a drawn one |

**Left for D2:** while there's a couple, the strip should go to the partner's sheet rather than here. Until then the flag is off, so nobody can reach this state from the strip.

## 6. Verification

- [x] The flow's tests (`src/screens/pair/__tests__/`: sign-in, cancel, offline, name, code, share, new code, each error, who-it-is, Pair, Reduce Motion, pinned actions, the morph), the solo launch through the router, and the guards.
- [x] Bytecode: 4,516,404 B, under the 4,640,000 B ceiling.
- [ ] **Needs a device, at Stage F's first build:** the finish review, at the largest text size, with Reduce Motion and with VoiceOver.

## 7. Related Docs

- [A3's record](2026-11-05-phase2-a3-design.md), [C1's record](2026-11-05-phase2-c1-client.md), [Phase 2 plan](2026-11-05-phase2-plan.md), D1
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
