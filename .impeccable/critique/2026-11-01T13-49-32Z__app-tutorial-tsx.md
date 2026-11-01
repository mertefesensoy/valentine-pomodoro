---
target: the D5 first-run tour (app/tutorial.tsx, src/screens/tutorial)
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\vp\\stage-d\\app\\tutorial.tsx"
timestamp: 2026-11-01T13-49-32Z
slug: app-tutorial-tsx
---
Method: design review only (detector not applicable, native platform). Read from source against the approved direction contract (`.impeccable/surfaces/app-tutorial-tsx.md`); no Simulator on this machine.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No sense of how long the tour runs (the contract refused "1 of 6" dots); the write-on and babble show it's live |
| 2 | Match System / Real World | 4 | The diary's own ribbon marks your place; the pair are the timer's colon |
| 3 | User Control and Freedom | 3 | Skip, Not now, mute, tap to finish a line, live tabs; but no way back to a line Next skipped |
| 4 | Consistency and Standards | 3 | Native tab bar, the app's pills; Skip tour alone drops the press haptic |
| 5 | Error Prevention | 3 | A preset press moves on 600 ms after the first press, so comparing presets gets cut short |
| 6 | Recognition Rather Than Recall | 4 | Lines name each control by its own label while it stays lit |
| 7 | Flexibility and Efficiency | 3 | Skip tour, a tap finishes a line, the mute; nothing to slow down or repeat |
| 8 | Aesthetic and Minimalist Design | 3 | One bubble, one opening, one ribbon; Next's filled strawberry pill outweighs the lit control |
| 9 | Error Recovery | 3 | A wrong tab leaves the tour waiting with no hint on that screen |
| 10 | Help and Documentation | 3 | The tour is the help; the replay sits under About |
| **Total** | | **32/40** | **Good (80 %)** |

## Design Specificity Verdict

**LLM assessment.** Authored for this product, not the category. The pointer is the welcome diary's strawberry ribbon, the guides are the timer's own colon as stickers with the die-cut lift, they talk in their own synthesised babble, and the tab bar stays the real one. No carousel, no grey coach marks, no dots. The one place it falls back on habit is the bubble's chrome: a filled primary Next pill and identical strawberry names for both speakers.

**Deterministic scan.** Not applicable (native platform).

## Overall Impression

A coach mark that belongs to the diary: real controls, a ribbon instead of an arrow, and two characters who take turns. The biggest risk is Midnight Plum: there the dim hardly separates the opening from the page, so the spotlight may not read at all.

## What's Working

- **Teaching on the real controls.** The opening is live, the tab press is the real one, and Next is only a backup, so the hands learn the app.
- **The ribbon as the one pointer.** It drapes from control to control on the sheet curve, continuous with the welcome, with no separate arrow.
- **Quiet chrome for loud characters.** One paper bubble, the system face at body size, Skip tour and the mute always there, and the delight spent once (the entrance plays once a run).

## Priority Issues

- **[P1] In Midnight Plum the opening hardly reads.** The 45 % deep-plum dim moves the empty page 1.08:1 and paper or field controls about 1.2:1, so a dark control's opening looks almost like its dimmed surroundings. Why: the spotlit control is the step's first read (brief §6). Fix: trace the opening's edge with a 2 pt `ringFocus` line (both themes, or Midnight Plum only), or raise Midnight Plum's dim. A change to the approved look: the owner's call. Command: /impeccable colorize.
- **[P2] Next outranks the lit control.** Next is a filled strawberry pill, the same weight as Start focus, so at steps 1–5 the backup reads before the real control. Fix: a quieter Next (`primarySoft` fill with `primaryInk` label), keeping the lit control first. Command: /impeccable polish.
- **[P2] VoiceOver can't explore a lit region.** At today's row and the week, the modal layer hides the region and no opening element stands in for it, so the bubble describes something a VoiceOver user can't reach. Fix: an opening element with the region's own label (today's row's summary; Stats' summary line). Command: /impeccable harden.
- **[P2] A preset press cuts the choice short.** Step 1 moves on 600 ms after the first press, even mid-comparison. Fix: restart the wait on each press, at 900 ms. Command: /impeccable polish.
- **[P3] The speakers look alike.** Both names are strawberry; Doro's could be matcha (`successInk`), so the turn reads before the line does. Command: /impeccable colorize.

## Persona Red Flags

**Jordan (first-timer):** at a lead, "Tap the tab to see it", the ribbon's tip sits at an estimated x over iOS 26's floating bar. A tap on the wrong tab shows that screen with no bubble, and nothing says the tour is waiting.

**Casey (distracted, one hand):** interruptions are covered: backgrounded, the tour resumes at its step; killed, it resumes once. Next sits at the bubble's right, mid-screen, within reach. No flags beyond Jordan's.

**Sam (VoiceOver, large text):** the order is right (the line, Next, Skip tour, the mute), the presets, Modes, Add and Start act from their openings, and the AX panel never caps the text. Today's row and the week are unreachable at their steps (P2 above).

## Minor Observations

- Skip tour is the one state-changing press with no haptic.
- The Modes sheet's bubble shows the line whole with no babble, unlike the page's bubbles; deliberate (§3.8), and calmer in a sheet.
- The dim covers the status bar band too, so the clock sits on the dimmed colour.

## Questions to Consider

- Should the opening carry its own light, rather than relying on the dim to set the rest back?
- Would Doro's name in matcha make turn-taking readable before a word is read?
- Is a way back to the last line worth a fourth action in the bubble?
