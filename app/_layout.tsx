import { Stack } from 'expo-router';

import { App } from '../src/App';

// The root layout (Phase 1 B6). The app's root component stays in src/App.tsx;
// this renders it around a native stack holding the tabs and the 404 screen.
export default function RootLayout() {
  return (
    <App>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: '404' }} />
      </Stack>
    </App>
  );
}
