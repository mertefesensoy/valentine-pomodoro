---
target: D2 Stats
total_score: 27
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 1
target_identity: "file:C:\\vp\\stage-d\\app\\(tabs)\\stats.tsx"
target_fingerprint: "sha256:00a7ef9a8364836c9833d3bc1e040cb25153ecd57396946859c73949363ed8b5"
target_path: "C:\\vp\\stage-d\\app\\(tabs)\\stats.tsx"
timestamp: 2026-10-31T17-42-32Z
slug: app-tabs-stats-tsx
---
Method: design review only (detector not applicable, native platform)

## Critique: Stats (`app/(tabs)/stats.tsx` → `src/screens/StatsScreen.tsx`, `src/screens/stats/WeekStack.tsx`), D2 first pass, 2026-10-31

Read from source against the D2 Stats contract (`.impeccable/surfaces/app-tabs-stats-tsx.md`). No Simulator on this machine; the look is judged on the owner's iPhone at the device check.

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Summary line first, today's dashed cells say what is left, goal and streak values in words |
| 2 | Match System / Real World | 4 | Postcards, stickers, "Today", weekday names; nothing reads as a miss |
| 3 | User Control and Freedom | 3 | Read-only; the goal-off and empty-week buttons lead somewhere useful; no earlier weeks (Plus, later) |
| 4 | Consistency and Standards | 3 | The minutes fill turns `ringBreak` when full, a colour that means "break" on Classic; the contract's 150 ms crossfade on the switch isn't built |
| 5 | Error Prevention | n/a | No input on this screen |
| 6 | Recognition Rather Than Recall | 3 | In the Minutes view an edge's number has no unit; the flag's meaning is learned from the strip |
| 7 | Flexibility and Efficiency | 3 | Sessions/Minutes switch, list at AX sizes, compact-height row |
| 8 | Aesthetic and Minimalist Design | 4 | The stack is the screen's idea; all-time quiet; one strip for goal and streak |
| 9 | Error Recovery | n/a | No error states |
| 10 | Help and Documentation | 3 | The goal-off footer explains what a goal does; the empty week offers "Start a session" |
| **Total** | | **27/32** | **Good (84 %)** |

### Design Specificity Verdict

Authored for this product. The week as a stack of day postcards, each counting in Pomo & Doro stickers, couldn't be lifted into another app unchanged; it refuses the category's number tiles over a bar chart. The tilt of ±0.6° and the dashed cells keep it in the diary's world. Deterministic scan: not applicable (native platform).

### Overall Impression

The strongest of D2's three screens: one glance gives today at full size and six readable edges. The biggest gap is at larger text sizes, where the day names don't get room.

### What's Working

- Today first, with dashed cells for the sessions still owed to the goal: progress that only grows (PRODUCT principle 2).
- Each day is one VoiceOver element with a full sentence, and the summary line carries the summary trait, so it's read first.
- The banner keeps its slot and its 12 pt gap without crowding the week.

### Priority Issues

- **[P1] Day names truncate from the xxLarge text size up.** `edgeDay` is a fixed 56 pt wide with `numberOfLines={1}` (`WeekStack.tsx:186`, `:105`). At xxLarge (font scale 1.235) "Wed 29" needs about 58 pt; at AX sizes, in the list built for them, it shrinks to "W…". Fix: scale the column with the font scale in the stack, and give the name its own line in the AX list. Command: `/impeccable adapt`.
- **[P3] The Minutes view's full fill uses `ringBreak`.** On Classic that colour means a break. The flag already says "goal reached". Fix: keep the fill `ringFocus` when full, or use `successInk`'s fill token. Command: `/impeccable polish`.
- **[P3] The contract's crossfade isn't built.** The Sessions/Minutes switch swaps the stack at once. Either build the 150 ms crossfade (instant under Reduce Motion) or amend the contract. Command: `/impeccable animate`.

### Persona Red Flags

- **Sam (accessibility):** at AX sizes the list mode works and the labels are full sentences, but the visible day names truncate (P1).
- **Jordan (first-timer):** the flag on an edge isn't labelled on the edge; the strip's "Goal 50 min" next to the same flag acts as the legend. Acceptable.

### Minor Observations

- Text on the tilted edges is rendered rotated by 0.6°; check on device that it stays crisp.
- An edge in the Minutes view with the goal off shows only its number; the summary line names the unit.

### Questions to Consider

- Should a day edge open that day (a detail), or is the stack a pure glance? Today it's a glance, which suits the contract.
