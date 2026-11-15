import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { App } from '../src/App';
import { MacBanner } from '../src/ads/MacBanner';
import { sheetOptions } from '../src/navigation/sheetOptions';
import { IS_MAC } from '../src/platform/isMac';
import { useTheme } from '../src/theme/useTheme';

// The love note and the mode sheet are native form sheets over the tabs (Phase 1 D1, Classic brief
// §6), sized to their content, with a swipe down to close; their options and why are in
// src/navigation/sheetOptions.ts. The theme colours their surfaces, so the options follow it.

// The root layout (Phase 1 B6). The app's root component stays in src/App.tsx;
// this renders it around a native stack holding the tabs, the two sheets and the 404 screen.
// On a Mac only (1.5.2, FR-ADS-003), the stack sits in a column above the always-on banner, so
// every tab is laid out above the ad, never under it. IS_MAC never changes while the app runs,
// and on an iPhone or iPad the tree is the one without the column.
export default function RootLayout() {
  const { tokens } = useTheme();
  const sheets = sheetOptions(tokens);
  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="love-note" options={sheets.loveNote} />
      <Stack.Screen name="modes" options={sheets.modes} />
      <Stack.Screen name="note-editor" options={sheets.noteEditor} />
      <Stack.Screen name="pair" options={sheets.pair} />
      <Stack.Screen name="partner" options={sheets.partner} />
      {/* The one-time v1.4 welcome: full screen, in and out by a fade, closed only by Start (welcome brief). */}
      <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: true, title: '404' }} />
    </Stack>
  );
  return (
    <App>
      {IS_MAC ? (
        <View style={styles.column}>
          <View style={styles.column}>{stack}</View>
          <MacBanner />
        </View>
      ) : (
        stack
      )}
    </App>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1 },
});
