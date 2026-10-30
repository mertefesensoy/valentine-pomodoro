import 'react-native-reanimated';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Surface worklet warnings before they become fatal crashes in release builds
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { router, ThemeProvider } from 'expo-router';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useUpdateCheck } from './hooks/useUpdateCheck';
import { WindowInsetsProvider } from './hooks/useWindowInsets';
import { useTheme } from './theme/useTheme';
import { navigationThemes } from './theme/navigationTheme';
import GiftModeModal from './components/GiftModeModal';
import { StoreGate } from './stores/StoreGate';
import { useUiStore } from './stores/uiStore';
import { AdManager } from './ads/AdManager';
import { markFirstFrame } from './startup/deferredStartup';

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

// The splash stays up until ThemedApp hides it. Calling the public
// preventAutoHideAsync also stops Expo Router hiding it when its navigator
// first mounts (Phase 1 B6), which can be before the stores are hydrated.
SplashScreen.preventAutoHideAsync();

// Inner component: everything below StoreGate, so the stores are hydrated
function ThemedApp({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const hasSeenGiftMode = useUiStore((s) => s.hasSeenGiftMode);
  const dismissGiftMode = useUiStore((s) => s.dismissGiftMode);

  // Start-up work: each call waits for the first frame itself (Phase 1 B7)
  useUpdateCheck(UPDATE_JSON_URL);
  React.useEffect(() => {
    AdManager.init();
  }, []);

  // Phase 7: Notification tap routing - navigate to Timer screen
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) {
        console.log('[App] Notification tapped:', response.notification.request.content);
      }

      // The Timer tab is the index route (FR-NTF-003). Opened from a notification, the
      // user came for the timer: the v1.4 welcome waits for a later launch (welcome brief §4).
      useUiStore.getState().deferWelcome();
      router.navigate('/');
    });

    return () => subscription.remove();
  }, []);

  // The navigator in `children` has committed by now (a parent's effect runs
  // after its children's), and nothing renders before the stores are
  // hydrated, so this is the first frame worth showing.
  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    // The navigator draws its backgrounds from the Sticker Diary tokens (Phase 1 D1)
    <ThemeProvider value={navigationThemes[theme.id]}>
      {children}

      {/* Gift Mode - shows only on first launch */}
      {!hasSeenGiftMode && (
        <GiftModeModal visible={!hasSeenGiftMode} onDismiss={dismissGiftMode} />
      )}
    </ThemeProvider>
  );
}

/**
 * The app's root (Phase 1 B6: rendered by app/_layout.tsx around the router's
 * navigator, which comes in as `children`). It provides the gesture root, the
 * window's safe-area insets and the hydrated stores, then the navigation
 * theme, and shows Gift Mode on first launch.
 */
export function App({ children }: { children: React.ReactNode }) {
  return (
    // The root's first layout releases the deferred start-up work (Phase 1 B7)
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={markFirstFrame}>
      <SafeAreaProvider>
        <WindowInsetsProvider>
          <StoreGate>
            <ThemedApp>{children}</ThemedApp>
          </StoreGate>
        </WindowInsetsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
