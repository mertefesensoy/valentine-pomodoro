import { Stack } from 'expo-router';

import { App } from '../src/App';
import { sheetOptions } from '../src/navigation/sheetOptions';
import { useTheme } from '../src/theme/useTheme';

// The love note and the mode sheet are native form sheets over the tabs (Phase 1 D1, Classic brief
// §6), sized to their content, with a swipe down to close; their options and why are in
// src/navigation/sheetOptions.ts. The theme colours their surfaces, so the options follow it.

// The root layout (Phase 1 B6). The app's root component stays in src/App.tsx;
// this renders it around a native stack holding the tabs, the two sheets and the 404 screen.
export default function RootLayout() {
  const { tokens } = useTheme();
  const sheets = sheetOptions(tokens);
  return (
    <App>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="love-note" options={sheets.loveNote} />
        <Stack.Screen name="modes" options={sheets.modes} />
        <Stack.Screen name="note-editor" options={sheets.noteEditor} />
        {/* The one-time v1.4 welcome: full screen, in and out by a fade, closed only by Start (welcome brief). */}
        <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: '404' }} />
      </Stack>
    </App>
  );
}
