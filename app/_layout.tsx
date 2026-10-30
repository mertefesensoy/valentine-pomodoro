import { Stack } from 'expo-router';

import { App } from '../src/App';

// The love note and the mode sheet are native form sheets over the tabs (Phase 1 D1, Classic brief
// §6): the system's UISheetPresentationController, sized to their content, a swipe down to close.
// A long note at the largest text size reaches full height and scrolls (HIG review D1-M3). They
// aren't resizable, so there is no grabber (HIG sheets.md: a grabber is for a resizable sheet).
const SHEET = {
  presentation: 'formSheet',
  sheetAllowedDetents: 'fitToContents',
  sheetGrabberVisible: false,
  headerShown: false,
} as const;

// The root layout (Phase 1 B6). The app's root component stays in src/App.tsx;
// this renders it around a native stack holding the tabs, the two sheets and the 404 screen.
export default function RootLayout() {
  return (
    <App>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="love-note" options={SHEET} />
        <Stack.Screen name="modes" options={SHEET} />
        {/* The one-time v1.4 welcome: full screen, in and out by a fade, closed only by Start (welcome brief). */}
        <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: '404' }} />
      </Stack>
    </App>
  );
}
