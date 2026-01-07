import 'react-native-reanimated';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from './constants/Colors';
import { Navigation } from './navigation';
import { useGiftMode } from './hooks/useGiftMode';
import GiftModeModal from './components/GiftModeModal';
import { AppProvider } from './context/AppContext';

// Set up notification handler (shows notifications even when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // We handle sound separately
    shouldSetBadge: false,
    shouldShowBanner: true,  // SDK 54 requires this
    shouldShowList: true,     // SDK 54 requires this
  }),
});

SplashScreen.preventAutoHideAsync();

export function App() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { hasSeenGiftMode, isReady: giftModeReady, dismiss } = useGiftMode();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const theme =
    colorScheme === 'dark'
      ? {
        ...DarkTheme,
        colors: { ...DarkTheme.colors, primary: Colors[colorScheme ?? 'light'].tint },
      }
      : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, primary: Colors[colorScheme ?? 'light'].tint },
      };

  return (
    <AppProvider>
      <Navigation
        theme={theme}
        linking={{
          enabled: 'auto',
          prefixes: [
            // Change the scheme to match your app's scheme defined in app.json
            'helloworld://',
          ],
        }}
        onReady={() => {
          SplashScreen.hideAsync();
        }}
      />

      {/* Gift Mode - shows only on first launch */}
      {giftModeReady && !hasSeenGiftMode && (
        <GiftModeModal visible={!hasSeenGiftMode} onDismiss={dismiss} />
      )}
    </AppProvider>
  );
}
