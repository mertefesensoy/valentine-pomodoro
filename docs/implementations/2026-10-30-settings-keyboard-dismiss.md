---
id: IMPL-2026-10-30-settings-keyboard-dismiss
title: "Settings: the number pad can be dismissed (DEF-008)"
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [SRS, IMPL-2026-10-30-phase1-b6-expo-router]
---

# 2026-10-30 — Settings: the number pad can be dismissed (DEF-008)

**Status:** Done in code and tested in Jest; **the device check passed on TestFlight build 47** (`v1.4.0-tf.47`, 2026-10-30), together with the B6 tab fix.
**Branch:** `rehaul/v2`
**Found:** by you on TestFlight build 46: "i can't escape the keyboard when i decided to change the time in the settings".

---

## 1. Problem / Motivation

Settings has five number fields: Focus, Short Break, Long Break, "Long break every N sessions", and the custom daily goal. Each uses `keyboardType="number-pad"`. **On iPhone the number pad has no return key**, and nothing else in Settings dismissed the keyboard:
- the ScrollView had no `keyboardDismissMode`;
- there was no accessory bar;
- no code called `Keyboard.dismiss()`.

`keyboardShouldPersistTaps="handled"` dismisses only on a tap that no child handles, and most of the screen is controls, so in practice the keyboard couldn't be closed once a field was edited.

**This predates the rehaul.** The App Store 1.3.1 `SettingsScreen` has the same five fields with the same props (checked with `git show v1.3.1:src/screens/SettingsScreen.tsx`). It isn't a B6 or B7 regression; build 46 was simply the first build where it was reported. It is recorded as **DEF-008** against FR-SET-001.

The risk was more than annoyance. Each field saves on blur (`handleFocusBlur` and the others): it parses the draft, then applies it or reverts it. A field that can't be blurred never applies its value until the user taps another control.

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/SettingsScreen.tsx` | One iOS `InputAccessoryView` with a "Done" button above the number pad, attached to all five number fields through `inputAccessoryViewID`; `keyboardDismissMode="on-drag"` on the ScrollView. |
| `src/screens/__tests__/settingsKeyboard.test.tsx` | New: every duration field carries the Done bar, Done calls `Keyboard.dismiss()`, and the ScrollView dismisses on drag (DEF-008). |
| `docs/srs/SRS.md` | DEF-008 in §3.4; FR-SET-001's known deviations and Verify line name it and the test. |
| `CHANGELOG.md` | A Fixed bullet. |
| `docs/README.md` | This record in the implementation records table. |

## 3. Implementation Approach

**The pattern:** an *input accessory view*, the iOS convention for keyboards without a return key. UIKit attaches the bar to the top of the keyboard and moves it with the keyboard. React Native exposes it as `InputAccessoryView`, a native view matched to text inputs by ID.

- **`NUMBER_DONE_ID`** (`'settings-number-done'`, exported for the test) is the one ID every number field names in `inputAccessoryViewID`. One bar serves all five fields; UIKit shows it for whichever is focused.
- **The bar** renders only when `Platform.OS === 'ios'`. Android's number keyboard has its own done or tick key, and `InputAccessoryView` is iOS-only. It is one row, right-aligned, on `colors.card` with a hairline top border in `colors.border`, so it follows the light and dark themes.
- **The Done button:** a `Pressable` with `accessibilityRole="button"` and label "Done", at least 44 × 64 pt (NFR-A11Y-002), with 17 pt semibold text in `colors.accent`. Pressing it calls `Keyboard.dismiss()`.
  - **Contract:** no inputs. The side effect is that the focused field resigns first responder, so its `onBlur` runs and applies or reverts the draft, exactly as before. Nothing is written directly.
- **Dismiss on scroll:** `keyboardDismissMode="on-drag"` on the Settings ScrollView, so starting to scroll also closes the keyboard (and blurs, and so saves). `keyboardShouldPersistTaps="handled"` stays, so a tap on a button while the keyboard is up still reaches the button.

## 4. Mathematical / Statistical Details

None; a purely structural UI change.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| An accessory "Done" bar | `keyboardType="numbers-and-punctuation"`, which has a return key | That keyboard allows letters and symbols, which the fields would then have to reject. The number pad plus a Done bar is the iOS convention for numeric entry. |
| One shared bar, by ID | One bar per field | UIKit shows one accessory per keyboard. A shared ID means one view, and a sixth field only needs the ID. |
| `on-drag` | `interactive` (drag the keyboard down with the finger) | `interactive` fights `KeyboardAvoidingView`'s padding mode during the drag. `on-drag` is predictable, and it is the common choice for settings lists. |
| Fix now, before D2 | Wait for D2, which restyles Settings | It blocks editing a core setting on the current TestFlight build. The change is small and D2 can restyle the bar with the screen. |
| No tap-outside handler | Wrapping the screen in a `TouchableWithoutFeedback` that dismisses | A wrapper around a ScrollView of controls steals or delays taps. The Done bar and scroll-to-dismiss cover it without that cost. |

## 6. Verification

**Local (Windows, this checkout):**
- [x] `npx jest src/screens/__tests__/settingsKeyboard.test.tsx`: 4/4.
- [x] **Mutation check,** each run against the test and then restored byte for byte:
  - without one field's `inputAccessoryViewID`: 1 failed;
  - with Done's `onPress` emptied: 1 failed;
  - without `keyboardDismissMode`: 1 failed.
- [x] Gates with the change: typecheck clean; lint 0 errors, 38 warnings (unchanged); Jest 201/201 in 34 suites; Reassure settings-only 1, Timer 13, Stats 1, Settings 2, Notes 1, leaf 12 (unchanged: the bar subscribes to nothing).

**Device (iPhone, TestFlight build 47): passed** (2026-10-30, reported by you: "record all pass", with B6's list, not item by item):
- [x] Settings → Focus: tap the field, type a number. A "Done" bar sits above the number pad, in the app's light or dark colours. Tap Done: the keyboard closes and the new duration is kept (start a session to see it).
- [x] Repeat for Short Break, Long Break, "Long break every N sessions" and Custom Goal.
- [x] With the keyboard up, scroll the list: the keyboard closes and the value is kept.
- [x] An invalid value (0, or above the field's limit) reverts on Done, as it does on blur.
- [x] VoiceOver reads the bar's button as "Done, button".

## 7. Related Docs

- [SRS](../srs/SRS.md): FR-SET-001, DEF-008, NFR-A11Y-002
- [B6 record](2026-10-30-phase1-b6-expo-router.md) §6.6: the build-46 device check where this was reported
- [Design workflow](../process/DESIGN-WORKFLOW.md): D2 restyles Settings, this bar included

## Backlinks
<!-- backlinks:start -->
- [Documentation map](../README.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
