---
target: D2 Notes
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 0
target_identity: "file:C:\\vp\\stage-d\\app\\(tabs)\\notes.tsx"
target_fingerprint: "sha256:af5ca95d8d8755566becebd27acd763f0d636123a0ede32a78d5bfa5685e2ba1"
target_path: "C:\\vp\\stage-d\\app\\(tabs)\\notes.tsx"
timestamp: 2026-10-31T17-42-32Z
slug: app-tabs-notes-tsx
---
Method: design review only (detector not applicable, native platform)

## Critique: Notes (`app/(tabs)/notes.tsx` → `src/screens/LoveNotesScreen.tsx`; editor `app/note-editor.tsx` → `src/screens/notes/NoteEditor.tsx`), D2 first pass, 2026-10-31

Read from source against the D2 Notes contract (`.impeccable/surfaces/app-tabs-notes-tsx.md`), and from the libraries' own source (Expo Router 58's `Link`, `@radix-ui/react-slot`, react-native-screens' `RNSScreen.mm`). No Simulator on this machine.

### Gate status

**Blocked by a P0 as built.** The scores below are what the screen earns with the P0 fixed; as built, a release build draws every note row unstyled (heuristic 8 would score 1).

### Design Health Score (with the P0 fixed)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | The count and the countdown; but rows give no highlight on a tap, and "Restored 3 notes" isn't announced on iOS |
| 2 | Match System / Real World | 4 | Slips of paper, "Love notes", the notes' own words |
| 3 | User Control and Freedom | 3 | Delete confirms; no undo; a swipe on an edited sheet is blocked without a word |
| 4 | Consistency and Standards | 3 | The contract says dismissing an edited sheet asks; it bounces back silently instead |
| 5 | Error Prevention | 4 | The 280 cap with a countdown, the discard guard, confirmations |
| 6 | Recognition Rather Than Recall | 4 | Add, Preview and Restore are visible; Delete is also a button in the editor |
| 7 | Flexibility and Efficiency | 4 | Tap, swipe, long-press menu, VoiceOver actions and the editor's button |
| 8 | Aesthetic and Minimalist Design | 4 | One clean list; Pomo & Doro only on the empty state |
| 9 | Error Recovery | 3 | A deleted note can't come back (Restore brings back defaults only) |
| 10 | Help and Documentation | 3 | The empty state invites the first note; the placeholder guides |
| **Total** | | **35/40** | **Good (88 %), once the P0 is fixed** |

### Design Specificity Verdict

A native list on purpose, in the diary's paper. The specificity is in the copy, the empty state and the slip metaphor, which is right for an Operate surface. Deterministic scan: not applicable (native platform).

### Overall Impression

The design is sound and the paths are generous. The build isn't: the fix that build 51's device check needed would itself break in build 52.

### What's Working

- Every action has a button as well as a gesture (NFR-A11Y-004): swipe, menu, VoiceOver actions and the editor's "Delete note".
- The editor's cap, max(280, the note's own length), keeps old long notes intact.
- The countdown is announced at 30, 10 and 0 only, never per keystroke.

### Priority Issues

- **[P0] The note rows lose all their style in a release build.** With `asChild`, Expo Router hands the row to `Link.Trigger`, which renders it through a Radix `Slot` (`expo-router/build/link/elements.js:173`). The Slot merges styles as `{ ...slotStyle, ...childStyle }` (`@radix-ui/react-slot/dist/index.js:133`). The row's style is an array (`LoveNotesScreen.tsx:41-46`), so it spreads into `{"0": …, "1": …}`: no paper, padding, border or radius. That is build 51's broken row again. In a dev build, Expo Router throws instead ("You are passing an array of styles to a child of <Slot>", `expo-router/build/ui/Slot.js:99`). The unit test passed because its stand-in skips the Slot. Fix: pass the row a flat style (`StyleSheet.flatten`), and render the test's stand-in through the real Slot. Command: `/impeccable harden`.
- **[P2] A swipe on an edited sheet is blocked without a word.** `gestureEnabled: !dirty` (`NoteEditor.tsx:92`) only makes the sheet resist; react-native-screens then fires a gesture-cancel and nothing asks (`RNSScreen.mm:684-692`). The contract says dismissing asks "Discard changes or Keep editing". Fix: Expo Router's `usePreventRemove(dirty, …)`, which sets the native prevent-dismiss, routes the blocked swipe back as a removal and lets the same Discard/Keep question answer it. Command: `/impeccable harden`.
- **[P2] Rows give no feedback on a tap.** The row's Pressable has a static style; Settings' rows highlight in `field`. With the Slot, a function style is dropped too, so the pressed state has to come from `onPressIn`/`onPressOut`. Command: `/impeccable polish`.
- **[P2] "Restored 3 notes" isn't announced on iOS.** `accessibilityLiveRegion` (`LoveNotesScreen.tsx:169`) is Android-only. Fix: `AccessibilityInfo.announceForAccessibility`. Command: `/impeccable harden`.

### Persona Red Flags

- **Sam (accessibility):** custom actions and hints are there; the restore result is silent (P2).
- **Casey (on the move):** a half-written note swiped down just bounces; with no question shown it reads as a stuck sheet (P2).

### Minor Observations

- A swipe's Delete then asks again in an alert; iOS lists usually delete at once with undo. Kept: there is no undo store.
- iOS asks about unsaved changes in an action sheet; this uses an alert, as Classic's Skip does.

### Questions to Consider

- Is a one-step undo (a "Note deleted · Undo" line) worth more than the confirmation alert?
