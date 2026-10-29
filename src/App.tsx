import 'react-native-reanimated';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Surface worklet warnings before they become fatal crashes in release builds
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Navigation } from './navigation';
import { useUpdateCheck } from './hooks/useUpdateCheck';
import { useTheme } from './theme/useTheme';
import GiftModeModal from './components/GiftModeModal';
import { StoreGate } from './stores/StoreGate';
import { useUiStore } from './stores/uiStore';
import { AdManager } from './ads/AdManager';

// GitHub Pages URL for update.json
const UPDATE_JSON_URL = 'https://mertefesensoy.github.io/valentine-pomodoro/update.json';

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

// Inner component: everything below StoreGate, so the stores are hydrated
function ThemedApp() {
  const { isDark } = useTheme();
  const hasSeenGiftMode = useUiStore((s) => s.hasSeenGiftMode);
  const dismissGiftMode = useUiStore((s) => s.dismissGiftMode);
  const navigationRef = React.useRef<any>(null);

  // Check for app updates (once per cold launch; iTunes Lookup on iOS, self-hosted JSON on Android)
  useUpdateCheck(UPDATE_JSON_URL);

  // Phase 7: Notification tap routing - navigate to Timer screen
  React.useEffect(() => {
    // Initialize Ads
    AdManager.init();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) {
        console.log('[App] Notification tapped:', response.notification.request.content);
      }

      // Navigate to Timer screen when notification is tapped
      if (navigationRef.current) {
        navigationRef.current.navigate('HomeTabs', { screen: 'Timer' });
      }
    });

    return () => subscription.remove();
  }, []);

  // Navigation theme based on app theme
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <>
      <Navigation
        ref={navigationRef}
        theme={navTheme}
        linking={{
          enabled: 'auto',
          prefixes: [
            'valentinepomodoro://',
          ],
        }}
        onReady={() => {
          SplashScreen.hideAsync();
        }}
      />

      {/* Gift Mode - shows only on first launch */}
      {!hasSeenGiftMode && (
        <GiftModeModal visible={!hasSeenGiftMode} onDismiss={dismissGiftMode} />
      )}
    </>
  );
}

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreGate>
          <ThemedApp />
        </StoreGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
