---
target: the D5 first-run tour, second run (app/tutorial.tsx, src/screens/tutorial)
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\vp\\stage-d\\app\\tutorial.tsx"
timestamp: 2026-11-01T14-25-35Z
slug: app-tutorial-tsx
---
Method: design review only (detector not applicable, native platform). Second run, on a2e1553 and the scroll fix after it, read from source against the direction contract.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Still no sense of the tour's length (the contract's choice, no dots) |
| 2 | Match System / Real World | 4 | The diary's ribbon; the pair as the timer's colon |
| 3 | User Control and Freedom | 3 | No way back to a line Next skipped |
| 4 | Consistency and Standards | 4 | Every press has its haptic; "Tap" and "tour" throughout |
| 5 | Error Prevention | 4 | The preset waits 900 ms after the last tap; VoiceOver's adjusting never moves on; Skip and the mute apart |
| 6 | Recognition Rather Than Recall | 4 | Controls named by their own labels, lit and outlined |
| 7 | Flexibility and Efficiency | 3 | Skip, tap to finish, mute; nothing to repeat a line |
| 8 | Aesthetic and Minimalist Design | 4 | The lit control reads first: outlined, with a quiet Next |
| 9 | Error Recovery | 3 | A wrong tab still leaves the tour waiting unseen (kept by decision) |
| 10 | Help and Documentation | 3 | The replay sits under About |
| **Total** | | **35/40** | **Good (88 %)** |

## Design Specificity Verdict

**LLM assessment.** Authored for this product. The two habits of the first run are gone: Next is a soft strawberry tint, and each speaker's name wears their own colour (`pomoInk`, `doroInk`). The opening's `ringFocus` outline is the diary's own ring colour, not a generic highlight.

**Deterministic scan.** Not applicable (native platform).

## Overall Impression

The spotlight now reads in both themes, and the lit control leads each beat as the brief orders. What's left is the contract's own trade-offs (no progress dots, no way back) and what only a device can judge.

## What's Working

- The outline makes the opening read in Midnight Plum (8.06:1 against the dim) without louder chrome.
- Turn-taking reads at a glance: strawberry for Pomo, matcha for Doro.
- Every assistive client can act on the lit control.

## Priority Issues

- **[P2] No way back to a skipped line.** A quick Next loses a line; the replay is the only way to hear it again. Kept: a fourth action in the bubble would cost more than it gives. Command: /impeccable onboard.
- **[P3] The wrong tab is silent.** Kept by decision (§3.7): the tour waits and the bar's own tab is the way back.

## Persona Red Flags

**Jordan (first-timer):** a wrong tab at a lead still shows a bare screen (kept).

**Casey (one hand, interrupted):** none.

**Sam (VoiceOver, large text):** none from code; the order and the acting openings are owed to the device check.

## Minor Observations

- The dim still covers the status bar band (kept).

## Questions to Consider

- Would a "say it again" tap on a finished line earn its place over a fourth button?
