---
target: Classic (app/(tabs)/index.tsx)
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\vp\\stage-d\\app\\(tabs)\\index.tsx"
target_fingerprint: "sha256:f26ac1bea3202888a8e5879b19649356f933be0a7f5f8e4073692c72b4882cae"
target_path: "C:\\vp\\stage-d\\app\\(tabs)\\index.tsx"
timestamp: 2026-10-30T18-52-45Z
slug: app-tabs-index-tsx
---
Method: design review only (detector not applicable, native platform). Evidence: source; no Simulator screenshots on this machine.

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Timer, ring, phase line, "Break at", Paused stamp, cycle dots and today's stickers all show state |
| 2 | Match System / Real World | 4 | Diary and stickers; plain words |
| 3 | User Control and Freedom | 3 | Skip has no undo |
| 4 | Consistency and Standards | 3 | Native tabs/sheets/alert; built segmented control and custom icons are consistent but non-system |
| 5 | Error Prevention | 3 | Skip on a running focus is unguarded, right under the primary pill |
| 6 | Recognition Rather Than Recall | 3 | "25/5" doesn't say which is focus and which is break |
| 7 | Flexibility and Efficiency | 3 | One-tap presets, two layouts, mode sheet |
| 8 | Aesthetic and Minimalist Design | 3 | Phase line and cycle dots repeat the session; idle shows an empty sticker row |
| 9 | Error Recovery | 3 | A mis-tapped Skip is unrecoverable |
| 10 | Help and Documentation | 2 | Nothing says what a sticker is until the first lands |
| **Total** | | **31/40** | **Good** |

Design specificity: authored, not interchangeable (ring + Baloo tabular timer on milk paper, Pomo & Doro in the partner slot, die-cut stickers, the one bounce on completion).

Priority issues:
1. [P1] Skip ends a running focus with no undo or guard. Fix: confirm in a native alert while a focus runs past its first minute; breaks skip at once. (/impeccable harden)
2. [P2] Idle sticker row is a blank band. Fix: one faint dashed sticker slot when there are none. (/impeccable polish)
3. [P2] "25/5" leans on recall. Fix: a quiet "focus / break" key with the presets while idle. (/impeccable clarify)
4. [P3] The partner line is the same in every state. Fix: ready / studying / on a break. (/impeccable clarify)
5. [P3] Session count shown twice (phase line + dots). Keep dots visual, phase line spoken.

Persona red flags: Jordan (first-timer): empty band, unexplained "25/5". Sam (accessibility): at AX5 the controls fall below the first screen; check Start stays within one scroll. Long-distance student: fat-fingers Skip, loses 40 minutes.

Minor: "+n" cell doesn't grow at AX5; Facing Pages' pages are sparse in v1.4 by design.

Questions: a one-time caption on the first sticker? Is Skip during focus needed at all?
