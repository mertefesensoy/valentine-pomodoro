---
id: IMPL-2026-11-07-phase2-pair-sheet-blank
title: "Phase 2: the pairing sheet drew only its buttons"
status: in-progress
date: 2026-11-07
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-d1-pairing, IMPL-2026-11-06-phase2-f2-testflight, IMPL-2026-11-05-phase2-plan]
---

# 2026-11-07 — Phase 2: the pairing sheet drew only its buttons

**Status:** Fixed in the code, and passing tests. Only a device can show that it's right: build 64.
**Branch:** `fix/phase2-pair-sheet-blank`, one pull request into `master`.
**Found by:** the owner, on build 63 on two iPhones: "there is a problem here", with screenshots.

---

## 1. Problem / Motivation

On a real iPhone, the pairing sheet showed nothing above its pinned buttons: no title, no close button, no pages and no code. It blocks all of pairing. Jest couldn't see it, because Jest does no native layout.

The owner's answers narrowed it down:

| Question | Answer | What it rules out |
|----------|--------|-------------------|
| Was the sign-in step blank too? | "It had the apple's button but it was under the giant empty place just like here" | Anything about one step |
| Tapping where the right-hand page should be | "No, nothing happens" | The pages being there but invisible, such as a fade stuck at zero |
| Closing and opening it again | "Still blank" | Anything left over from signing in or from the keyboard |

The buttons sit at the very bottom of the sheet, so the layout does give the scroll view the space. The title isn't animated, so a stuck fade couldn't hide it. What's left is the scroll view itself being moved.

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/pair/PairScreen.tsx` | An empty first child, so that `react-native-screens` doesn't find the scroll view. |
| `src/screens/pair/__tests__/PairScreen.test.tsx` | The scroll view isn't the root's first child. |
| `src/navigation/sheetOptions.ts` | The rule, where the sheets are defined. |

## 3. Implementation Approach

**The cause, read from `react-native-screens` 4.30's source.** After each layout of a form sheet, `RNSScreenView` calls `applyFrameCorrectionForDescendantScrollView`:

1. `tryFindDescendantScrollView` looks at the content wrapper's direct children, and then walks down the chain of first children.
2. `coerceChildScrollViewComponentSizeToSize` handles a scroll view that's a direct child, and changes only its size. That's every other sheet here, whose root is the scroll view.
3. Otherwise it falls back to `[scrollViewComponent setFrame:self.frame]`: the screen's own frame, origin included.

This sheet's root is a `View` holding the scroll view and the pinned buttons, so its scroll view is found by step 1's walk and hits step 3. The frame it's given isn't what Yoga laid out, and Fabric doesn't correct it, since its own layout hasn't changed. **I read this from the source and can't watch it happen here,** so how far the frame moves is an inference. Build 64 is the test.

**The fix.** An empty, non-collapsible first child, positioned absolutely with no size. The walk ends there, the search finds nothing, the library leaves the scroll view alone, and Yoga's layout stands. Expo Router's synchronous-updates flag already gives a sheet with numeric detents a full-height wrapper, so the scroll view knows its real size.

**The rule, for any later sheet:** a sheet's scroll view is either its root, or not on the chain of first children.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| An empty first child | The scroll view as a direct child, beside the buttons (the library's case 1) | Case 1 sizes it to the whole sheet, under the buttons. The scroll view would then need padding as tall as the measured buttons, and more of the layout would rest on the library |
| Nothing else changes | Reordering so the buttons come first | VoiceOver reads in view order, so it would read the buttons before the title |
| If build 64 is still blank, the library's own footer (`unstable_sheetFooter`) with the scroll view as root | Doing that now | It's a refactor, since the footer renders outside the screen's state. It waits until the simple fix has been tried |

**What this costs:** the same search feeds `RNSScrollEdgeEffectApplicator`, so this sheet doesn't get iOS 26's scroll-edge effect. Its content rarely scrolls, so that's small.

**What else the owner's answers showed:** "No, it skipped that". Apple sends a name at an Apple ID's first sign-in, so the name step didn't appear. It'll first show on a device when someone signs in again after deleting their account, since Apple sends a name only once. E2's policy says "Your name: what you type", which needs firming up along with its sentence about email.

## 6. Verification

- [x] The other sheets (`ModeSheet`, `LoveNoteSheet`, `NoteEditor`, `PartnerScreen`) have the scroll view as their root, so the fallback can't reach them. The only nested one was this.
- [x] `PairScreen.test.tsx` holds the structure, and the guards are green. A test can't show the sheet itself.
- [x] `npx jest --ci`: 90 suites and 931 tests. Bytecode: 4,588,712 B, leaving 51,288 B of NFR-PERF-002.
- [x] **On a device, build 64:** marked as working on the owner's two phones (`p-sheet`, `p-signin`, `p-code`), and the server counted a real pairing, so the sheet's steps worked ([F2's record](2026-11-06-phase2-f2-testflight.md)). The check was: the sign-in step, your code and theirs show properly, the title and close button are there, and tapping the right-hand page brings up the keyboard.

## 7. Related Docs

- [D1's record](2026-11-05-phase2-d1-pairing.md)
- [F2's record](2026-11-06-phase2-f2-testflight.md)
