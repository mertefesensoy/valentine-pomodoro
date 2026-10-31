---
target: D2 Settings
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\vp\\stage-d\\app\\(tabs)\\settings.tsx"
target_fingerprint: "sha256:60781777583a3be6558c8cfd15ff03447fede861c56fb2d0468810e047cb0f61"
target_path: "C:\\vp\\stage-d\\app\\(tabs)\\settings.tsx"
timestamp: 2026-10-31T17-42-32Z
slug: app-tabs-settings-tsx
---
Method: design review only (detector not applicable, native platform)

## Critique: Settings (`app/(tabs)/settings.tsx` → `src/screens/SettingsScreen.tsx`, `src/components/settings/SettingsList.tsx`), D2 first pass, 2026-10-31

Read from source against the D2 Settings contract (`.impeccable/surfaces/app-tabs-settings-tsx.md`). No Simulator on this machine.

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Values in every row and the open row's value in `primaryInk`; but when iOS denies notifications the new footer isn't announced on iOS |
| 2 | Match System / Real World | 4 | Plain sentence-case copy; minutes and sessions in words |
| 3 | User Control and Freedom | 4 | Wheels are reversible, a second tap closes a row, Reset confirms |
| 4 | Consistency and Standards | 4 | Native switch, system wheel, compact time picker, one open row at a time |
| 5 | Error Prevention | 4 | Bounded wheels instead of typing; Reset names what it keeps |
| 6 | Recognition Rather Than Recall | 3 | The Timer group shows Custom's durations even while a preset runs; only the footer says so |
| 7 | Flexibility and Efficiency | 3 | Adequate for a settings list |
| 8 | Aesthetic and Minimalist Design | 3 | Nine groups; Love notes and Fly hold one switch each |
| 9 | Error Recovery | 3 | Denied notifications get a footer and "Open iOS Settings" (not announced, as in 1) |
| 10 | Help and Documentation | 3 | Footers explain Custom, the goal and the theme |
| **Total** | | **34/40** | **Good (85 %)** |

### Design Specificity Verdict

Deliberately a native settings list, in the diary's stationery (paper groups, crisp edge, Baloo title only). That is the right call for an Operate surface; the specificity lives in the copy and the tokens, not the structure. Deterministic scan: not applicable (native platform).

### Overall Impression

Trustworthy and quiet: every row is a control an iPhone user already knows, and nothing needs the keyboard. The gaps are announcements and one recall problem.

### What's Working

- A value row opens the system wheel under it, reports `expanded`, and only one is open at a time.
- The goal's plain numbers under "Minutes a day" fixed build 51's wrap and still say "75 minutes a day" to VoiceOver.
- Reset is a native alert that says notes, stats, goal and reminders stay.

### Priority Issues

- **[P2] The denied-notifications footer is silent on iOS.** It relies on `accessibilityLiveRegion` (`SettingsScreen.tsx:232`), which React Native implements on Android only. A VoiceOver user turns on the reminder, the switch flips back, and nothing is said. Fix: `AccessibilityInfo.announceForAccessibility` with the footer's sentence when `enableDailyReminder` returns false. Command: `/impeccable harden`.
- **[P3] The Timer group shows Custom's durations while a preset runs.** With 50/10 selected on the Timer, Settings still says "Focus 25 min". The footer explains; a row value can't. Kept as designed in build 48 (F4); worth a clarify pass on the footer's wording. Command: `/impeccable clarify`.
- **[P3] The goal wheel rebuilds 1,440 items on every change.** `NumberWheel`'s list depends on `value` (`SettingsList.tsx:154-162`), so each spin sends the whole list to the native picker again. Fix: depend on `value` only when it falls outside the range. Command: `/impeccable optimize`.

### Persona Red Flags

- **Sam (accessibility):** the denied reminder is silent (P2). The wheel's items are a fixed 20 pt and don't follow Dynamic Type (the system picker's own limit).
- **Alex (power user):** nothing to flag; every value is two taps away.

### Minor Observations

- "Developer website" leaves the app without a visual hint; acceptable in a settings list.
- The page title is a Baloo title in the scroll, not a collapsing large title, as on every tab (systemic, kept from D1).

### Questions to Consider

- Should Love notes and Fly fold into one "Extras" group, or does one switch per group read clearer in Turkish?
