# Valentine Pomodoro 💗

A beautifully crafted Pomodoro timer built with love for Bengisu. Features focus sessions, break reminders, love notes, stats tracking, and a Valentine-themed UI.

## Features

- ⏱️ **Focus Timer**: 25/5/15 minute intervals (customizable)
- 💌 **Love Notes**: Encouraging messages on focus completion
- 📊 **Stats Tracking**: Daily and all-time focus statistics
- 🔔 **Smart Notifications**: Background completion detection
- 🎨 **Valentine Theme**: Cherry red, lavender,  and cream color palette
- ✨ **Smooth Animations**: Progress ring, haptic feedback, button micro-interactions

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- iOS device with Expo Go app (iOS simulator doesn't support notifications)
- OR Android device/emulator

### Run Locally

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Scan QR code with Expo Go (iOS) or run on Android
```

### Testing on iPhone

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from App Store
2. Run `npm start` on your computer
3. Scan the QR code with your iPhone camera
4. App will open in Expo Go

**Note**: iOS Simulator does NOT support notifications. Use a real device for full testing.

## Project Structure

```
valentine-pomodoro/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── CircularProgress.tsx
│   │   ├── GiftModeModal.tsx
│   │   └── LoveNoteCard.tsx
│   ├── constants/       # App constants and defaults
│   │   └── defaults.ts  # Settings, love notes
│   ├── hooks/          # Business logic hooks
│   │   ├── useTimer.ts       # Timer state & logic
│   │   ├── useSettings.ts    # Settings persistence
│   │   ├── useStats.ts       # Stats tracking
│   │   ├── useLoveNotes.ts   # Notes CRUD
│   │   ├── useNotifications.ts
│   │   └── useGiftMode.ts
│   ├── navigation/     # React Navigation setup
│   ├── screens/        # Main app screens
│   │   ├── TimerScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── LoveNotesScreen.tsx
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helper functions
│   └── App.tsx        # App entry point
├── DECISIONS.md       # Architecture decisions
├── PHASE4_TEST.md    # Notification testing guide
└── package.json
```

## Building for Production

### iOS (Cloud Build - works on Windows)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project (first time)
eas build:configure

# Build for iOS
eas build --platform ios

# Build artifact (.ipa) will be available in EAS dashboard
# For TestFlight submission:
eas submit --platform ios
```

### Android

```bash
# Configure project (first time)
eas build:configure

# Build APK for testing
eas build --platform android

# APK will be available in EAS dashboard for download
```

## Customization

### Change Valentine Strings

Edit `src/constants/defaults.ts`:
```typescript
export const DEFAULT_LOVE_NOTES = [
  "Your custom note here 💗",
  "Another sweet message",
  // ...
];
```

### Change Colors

Main colors used:
- Cherry Red: `#E63946`
- Lavender: `#D4A5D9`
- Cream Background: `#FFF8F0`
- Light Pink: `#FFE8EC`

Search for these hex codes in `src/screens/` and `src/components/` to customize.

### Change Timer Defaults

Edit `src/constants/defaults.ts`:
```typescript
export const DEFAULT_SETTINGS = {
  durations: {
    focus: 25,        // minutes
    shortBreak: 5,
    longBreak: 15,
  },
  longBreakEvery: 4,  // long break after N focus sessions
  // ...
};
```

## Development

### Reset Gift Mode (for demo)

To show the Gift Mode modal again:

1. **Option A**: Delete and reinstall app
2. **Option B**: Clear AsyncStorage key manually:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   AsyncStorage.removeItem('gift_mode');
   ```

### Test Notifications

See `PHASE4_TEST.md` for comprehensive notification testing scenarios (foreground, background, cold-start).

### Debug Mode

Set short durations for testing:
```typescript
// src/constants/defaults.ts
durations: {
  focus: 0.1,        // 6 seconds
  shortBreak: 0.1,   
  longBreak: 0.1,
}
```

## Architecture Highlights

- **Timestamp-based timer**: Drift-free, handles backgrounding correctly
- **Idempotency**: `lastHandledEndAt` prevents double-completion
- **Event-driven state**: Love notes triggered by focus completion, not rendering
- **Storage migration**: All hooks merge with defaults to handle app updates
- **Single sound/haptics trigger**: Only in completion handler, never in notification callbacks

## Known Limitations

- Sound playback not implemented (stubbed for future - requires sound asset)
- iOS notifications only work on real devices (not simulator)
- First-launch gift mode can't be reset without clearing storage

## Tech Stack

- React Native (Expo SDK 54)
- TypeScript
- React Navigation 7
- AsyncStorage (persistence)
- expo-notifications (local notifications)
- expo-haptics (tactile feedback)
- expo-audio (optional, future sound feature)
- react-native-svg (progress ring)

## License

Built with ❤️ for Bengisu

---

For questions or issues, see `DECISIONS.md` for architecture rationale.
