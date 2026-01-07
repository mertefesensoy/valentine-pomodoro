# Valentine Pomodoro - Design Decisions Log

**Project**: Valentine-themed Pomodoro timer for Bengisu  
**Started**: 2026-01-07  
**Platform**: Expo SDK 54 (managed workflow)

---

## Architecture Decisions

### 1. Template Choice: `with-react-navigation` Example
**Date**: 2026-01-07  
**Decision**: Use `npx create-expo-app --example with-react-navigation` instead of blank template.

**Rationale**:
- Comes pre-configured with React Navigation bottom tabs
- Avoids manual wiring of navigation dependencies
- Follows Expo's recommended pattern for navigation-first apps
- Saves ~1 hour of boilerplate setup

**Alternative Considered**: `--template blank-typescript` (would require manual React Navigation setup)

---

### 2. Sound Module: expo-audio (not expo-av)
**Date**: 2026-01-07  
**Decision**: Use `expo-audio` for completion sound effects.

**Rationale**:
- `expo-av` is deprecated and will be removed in SDK 55+
- `expo-audio` is the modern replacement with better performance
- Future-proof for long-term maintenance

**Reference**: [Expo AV Deprecation Notice](https://docs.expo.dev/versions/latest/sdk/av/)

---

### 3. Timer Implementation: Timestamp-Based
**Date**: 2026-01-07  
**Decision**: Calculate `remainingMs = endAt - Date.now()` instead of decrementing a counter.

**Rationale**:
- Survives app backgrounding without drift
- Immune to missed interval ticks
- Single source of truth (`endAt` timestamp)
- Recomputes correctly when app returns to foreground

**Why Not Counter-Based**:
- `setInterval` pauses when app backgrounds on mobile
- Drift accumulates over time
- No reliable way to "catch up" missed ticks

---

### 4. Notification ID Tracking
**Date**: 2026-01-07  
**Decision**: Store `scheduledNotificationId` in `TimerState` and cancel only that specific notification.

**Rationale**:
- Prevents canceling *all* app notifications (breaks future features like reminders, motivational nudges)
- More precise and maintainable
- Allows multiple notification types to coexist

**Why Not "Cancel All"**:
- Would interfere with future features (daily stats summary, streak reminders, etc.)
- Less predictable in a growing codebase

---

### 5. Session Duration Capture
**Date**: 2026-01-07  
**Decision**: Store `sessionPlannedMinutes` when starting a session, use for stats (not current settings value).

**Rationale**:
- If user changes focus duration mid-day, stats remain accurate
- Captures *actual* duration used, not settings at time of completion
- Prevents retroactive stats inaccuracy

**Example Bug Without This**:
- User completes 3 sessions at 25 min each (75 min total)
- User changes setting to 30 min
- If we use current settings, stats would show 90 min (incorrect)

---

### 6. Auto-Start Next Phase: OFF by Default
**Date**: 2026-01-07  
**Decision**: User must manually press "Start" to begin next phase (focus → break, break → focus).

**Rationale**:
- Gives user control over when to start next session
- Prevents annoying interruptions if user needs more time
- Can be added as a toggle later if requested

**Alternative**: Auto-start with a 5-second countdown (could be jarring)

---

### 7. Default Pomodoro Durations
**Date**: 2026-01-07  
**Decision**:
- Focus: 25 minutes
- Short break: 5 minutes
- Long break: 15 minutes
- Long break every: 4 focus sessions

**Rationale**:
- Industry-standard Pomodoro Technique values (Francesco Cirillo method)
- Proven effective for deep work
- User-configurable via Settings

---

### 8. Love Notes: 20 Default Seeds
**Date**: 2026-01-07  
**Decision**: Pre-populate with 20 cute, supportive notes; user can add/edit/delete.

**Rationale**:
- Avoids blank slate on first launch
- Sets the tone ("cute, supportive, not cringe")
- User can customize without feeling overwhelmed

**Name Usage**: "Bengisu" appears in only 2/20 notes (not overused)

---

### 9. Progress Ring: SVG Stroke Animation
**Date**: 2026-01-07  
**Decision**: Use `react-native-svg` with stroke-dashoffset animation (not Canvas, not external library).

**Rationale**:
- Lightweight (no heavy charting library needed)
- Smooth animations via React Native's built-in Animated API
- Full control over styling (Valentine theme colors)
- Works on iOS, Android, and web

**Alternative Considered**: `react-native-circular-progress` (adds unnecessary dependency)

**Note**: v1 uses built-in Animated API. If performance issues arise, we can upgrade to Reanimated later.

---

### 10. Stats: Per-Day Storage (YYYY-MM-DD Keys)
**Date**: 2026-01-07  
**Decision**: Store stats as `{ "2026-01-07": { focusSessions: 3, focusMinutes: 75 }, ... }`.

**Rationale**:
- Simple key-value lookup for daily stats
- Easy to aggregate for "Total" stats (sum all days)
- Efficient for 7-day chart (grab last 7 keys)
- AsyncStorage-friendly (JSON serializable)

**Why Not Array of Objects**:
- Slower lookups (must iterate to find today)
- More complex updates

---

### 11. Testing Strategy: Real Device Required
**Date**: 2026-01-07  
**Decision**: Test notifications and timer backgrounding on a physical iPhone (via Expo Go).

**Rationale**:
- iOS Simulator doesn't support local notifications
- Background behavior differs significantly on real devices
- Timer pause/resume logic must be verified in real conditions

**Note**: Android emulator supports notifications, but physical device still recommended.

---

### 12. Typography: System Fonts
**Date**: 2026-01-07  
**Decision**: Use system default fonts (San Francisco on iOS, Roboto on Android).

**Rationale**:
- No custom font loading (faster startup)
- Native look and feel
- Excellent readability on all devices
- Reduces bundle size

**Alternative**: Google Fonts (adds loading time, increases bundle size)

---

### 13. Color Palette: Valentine Theme
**Date**: 2026-01-07  
**Decision**: Cherry red (#E63946), blush pink (#F4A6B0), warm cream (#FFF8F0), lavender (#D4A5D9).

**Rationale**:
- Soft, romantic, non-aggressive colors
- High contrast for readability (cream background, dark text)
- Cherry red for primary actions (attention-grabbing but not harsh)
- Lavender for secondary actions (calm, supportive)

**Accessibility**: Will target WCAG AA contrast ratios; verify during polish phase.

---

### 14. Gift Mode: First Launch Only
**Date**: 2026-01-07  
**Decision**: Show "made with love" screen once, then never again (unless reset in dev settings).

**Rationale**:
- Preserves the "gift reveal" moment
- Doesn't become annoying on repeated launches
- Can be reset for demo purposes (hidden dev option)

**Implementation**: `hasSeenGiftMode` flag in AsyncStorage.

---

### 15. Chart Style: Simple Bars (No Library)
**Date**: 2026-01-07  
**Decision**: Build custom 7-day bar chart with React Native `View` components (no Victory, Recharts, etc.).

**Rationale**:
- Minimal scope (7 bars, simple layout)
- No need for complex charting library
- Full control over Valentine theme styling
- Reduces bundle size significantly

**Alternative**: Victory Native (adds ~200KB, overkill for this use case)

---

## Open Questions

### Q1: Sound File
**Status**: Pending user input  
**Question**: Should we use a default bell sound, or would you like to provide a custom sound file?

**Options**:
- A: Use royalty-free bell sound (e.g., from Freesound.org)
- B: User provides custom `.mp3` file

---

### Q2: Gift Mode Animation
**Status**: Pending user input  
**Question**: Simple hearts animation (React Native Animated) or complex particle system?

**Options**:
- A: Simple floating hearts (2-3 hearts, fade + translate)
- B: Particle system (dozens of hearts, more complex)

**Recommendation**: Option A (simpler, performs better, still cute)

---

### Q3: Chart Granularity
**Status**: Pending user input  
**Question**: Should the 7-day chart show session count or focus minutes on Y-axis?

**Options**:
- A: Session count (e.g., 3 sessions, 5 sessions)
- B: Focus minutes (e.g., 75 min, 125 min)

**Recommendation**: Option A (easier to read, more motivating to see session count)

---

## Future Enhancements (Not in v1)

1. **Streak tracking**: "5-day focus streak 🔥"
2. **Daily goal**: "Complete 4 focus sessions today"
3. **Motivational nudges**: Time-based notifications ("Ready for another session?")
4. **Theme variants**: Dark mode, different color palettes
5. **Export stats**: CSV download of all-time stats
6. **Custom session lengths**: Save presets (e.g., "Deep work: 45 min focus")
7. **Pause during session**: Allow pausing mid-session (currently only start/skip/reset)

---

## Changelog

### 2026-01-07: Project Initialized
- Created Expo app with `with-react-navigation` example
- Installed dependencies: async-storage, notifications, haptics, svg, audio
- SDK 54.0.1 (React Native 0.81.4, React 19.1.0)
- Logged initial architecture decisions
