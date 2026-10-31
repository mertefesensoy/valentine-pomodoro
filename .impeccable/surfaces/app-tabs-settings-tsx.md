---
version: 1
slug: "app-tabs-settings-tsx"
primary_target: "app/(tabs)/settings.tsx"
related_targets: ["src/screens/SettingsScreen.tsx"]
---

# Settings (Settings tab, `/settings`)

Surface brief from `/impeccable shape`, Phase 1 D2, 2026-10-31. Mode: **Operate**. Build path: code-led. Stage D plan §3.3: native grouped lists and native controls.

## 1. Job and audience

Visited rarely, with a purpose: set the durations, the daily goal, the reminder and quiet hours, and the appearance; turn sound, haptics, notifications and love notes on or off. The visitor wants the row, changes it and leaves. Scanning speed and native trust outrank expression.

## 2. Outcome and proof

- **Success:**
  - every setting is found in one scroll, grouped by intent;
  - every control is native: switches, the built segmented control, pickers;
  - no bounded number needs typing;
  - nothing clips in Turkish at AX5.
- **Product truth to keep:** the Timer group's durations are Custom's (D1, F4: "Custom on the Timer uses these durations").

## 3. Selected direction

- **An inset grouped list**, as in iOS Settings, on the `page` ground:
  - groups are `paper` fields, radius 14, with an `edge` border;
  - rows are at least 44 pt, with hairline separators inset from the leading edge;
  - section headers are small, in sentence case and the system face; footers explain;
  - a large title, "Settings", with no emoji.
- **The groups, in order:**
  1. **Timer:** Focus, Short break, Long break, Long break every. The footer says Custom on the Timer uses these.
  2. **Daily goal:** on or off; 25, 50, 75 or 100 minutes, or custom.
  3. **Reminders:** a daily reminder (on or off, and its time); quiet hours (on or off, start, end).
  4. **Sound and feel:** Notifications, Sound, Haptics.
  5. **Love notes:** Show love notes after a focus.
  6. **Appearance:** System, Light or Dark; Timer layout, Ring or Facing pages.
  7. **Fly:** Ambient sounds.
  8. **About:** the origin line (the gift brief), Watch the welcome again, Check for updates, the developer's website, and Reset to defaults, which is last and destructive.
- **Numbers aren't typed.** Each number row shows its value ("25 min"). Tapping it opens a wheel in place, as iOS Calendar and Clock do, one at a time. This retires the keypad, its Done bars and the deprecated `InputAccessoryView` (D1 record: F1, and its "Fragile, for D2" note). The validated ranges stay as they are: focus 1–180, the long-break interval 2–10, and the goal 0–1,440.
- **Times use the native compact time picker,** the system's time chip, in place of today's spinner and Done.
- **Removed:**
  - "Background Animations": it drives nothing since D1, and its storage key stays;
  - the emoji in "Settings" and "Fly Mode".

## 4. Scope and boundaries

- **Target:** `app/(tabs)/settings.tsx` → `src/screens/SettingsScreen.tsx`.
- **Unchanged:**
  - the settings store, its keys and its defaults (changes are additive only);
  - the scheduling of notifications and reminders;
  - the update check and the reset.
- **Not here:** the Language row is D3 (Stage D plan §3.4).
- **Anti-goals:**
  - no bespoke card stacks;
  - no coloured section headers;
  - no shadows, no gradients, no emoji.

## 5. States and ranges

- **The ranges** are those above. Quiet hours may cross midnight.
- **Notifications denied in iOS:** the reminder rows say so and link to the app's page in iOS Settings, rather than toggling silently.
- **AX5 in Turkish:** a row's label and value stack, and nothing truncates.
- **Reset to defaults** confirms in a native alert with a destructive button. The welcome's replay stays one tap.

## 6. Interaction and layout

- **A number or time row:** tapping it opens its picker under the row, with the value in `primaryInk` while open. One is open at a time.
- **Switches** use the system's own feel. Settings › Haptics governs only the app's own haptics.
- **VoiceOver:** each row is one element with its label and its value; pickers are adjustable.
- **Motion:** a row opens with the platform's layout animation, in about 200 ms. With Reduce Motion it opens in place, with no movement.
- **Responsive:** on iPad and in wide windows the list is centred at a readable width.

## 7. Constraints and open decisions

- **The number control:** a wheel needs a picker library. `@react-native-community/datetimepicker` covers only dates and times; `@react-native-picker/picker` would be a new dependency, pinned to a release at least two weeks old. The alternative is a stepper. Recommended: the wheel. The contract decides.
- **Whether Notifications and the daily reminder share a group.** Proposed: Notifications stays a master switch in "Sound and feel", and the reminder group dims when it's off.
- **Copy:** every string is an i18n key in English and Turkish, sentence case.
