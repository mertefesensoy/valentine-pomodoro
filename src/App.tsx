import 'react-native-reanimated';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as React from 'react';

import { Navigation } from './navigation';
import { useGiftMode } from './hooks/useGiftMode';
import { useUpdateCheck } from './hooks/useUpdateCheck';
import { useTheme } from './theme/useTheme';
import GiftModeModal from './components/GiftModeModal';
import { AppProvider } from './context/AppContext';
import { initConsent } from './ads/AdConsentManager';
import { InterstitialAdManager } from './ads/InterstitialAdManager';

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

// Inner component that uses theme from context
function ThemedApp() {
  const { isDark } = useTheme();
  const { hasSeenGiftMode, isReady: giftModeReady, dismiss } = useGiftMode();
  const navigationRef = React.useRef<any>(null);

  // Check for app updates (max once per 24h, offline-safe)
  useUpdateCheck(UPDATE_JSON_URL);

  // Init AdMob consent (UMP + ATT) and load frequency caps from storage
  React.useEffect(() => {
    initConsent().catch(() => { });
    InterstitialAdManager.init().catch(() => { });
  }, []);


  // Phase 7: Notification tap routing - navigate to Timer screen
  React.useEffect(() => {
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
    </>
  );
}

export function App() {
  const [loaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
}
