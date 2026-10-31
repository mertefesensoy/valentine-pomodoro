---
target: D2 Settings, after fixes
total_score: 36
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\vp\\stage-d\\app\\(tabs)\\settings.tsx"
target_fingerprint: "sha256:60781777583a3be6558c8cfd15ff03447fede861c56fb2d0468810e047cb0f61"
target_path: "C:\\vp\\stage-d\\app\\(tabs)\\settings.tsx"
timestamp: 2026-10-31T18-04-31Z
slug: app-tabs-settings-tsx
---
Method: design review only (detector not applicable, native platform)

## Critique: Settings, D2 after the review fixes, 2026-10-31

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of System Status | 4 |
| 2 | Match System / Real World | 4 |
| 3 | User Control and Freedom | 4 |
| 4 | Consistency and Standards | 4 |
| 5 | Error Prevention | 4 |
| 6 | Recognition Rather Than Recall | 3 |
| 7 | Flexibility and Efficiency | 3 |
| 8 | Aesthetic and Minimalist Design | 3 |
| 9 | Error Recovery | 4 |
| 10 | Help and Documentation | 3 |
| **Total** | | **36/40** (90 %) |

Fixed: the denied footer is announced and plain (inkSoft); a switch row is one VoiceOver stop; the wheel fades with ease-out while the rows below move, Reduce Motion keeps the fade only, every way a wheel closes animates alike; the wheel list is rebuilt only when its range changes. Still open: P3 the Timer group shows Custom durations while a preset runs (build 48 F4, kept).
