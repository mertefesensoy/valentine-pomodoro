import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

/**
 * The height a tab's page lays out in, from the window's top (the Android closed-test plan, build 1).
 *
 * On iOS that's the window's height: the native tab bar is inside the safe area, so `height - insets.bottom` is the
 * bar's top, as the screens have always computed it. On Android the Material bar isn't in the safe area: expo-router
 * pads a tab clear of it, and LazyTab's own SafeAreaProvider reports `insets.bottom` 0 inside, so the page's height is
 * that provider's frame, which ends at the bar's top. With the window's height there, the Timer's landscape face ran
 * under the bar and hid Start.
 *
 * Contract: on Android, the nearest SafeAreaProvider's frame height (the window's until that provider has measured);
 * elsewhere, `useWindowDimensions().height`. Either way `height - insets.top - insets.bottom` is the page's free
 * height. Both hooks are called on every platform, so the hook order never changes.
 */
export function useTabPageHeight(): number {
    const window = useWindowDimensions();
    const frame = useSafeAreaFrame();
    return Platform.OS === 'android' ? frame.height : window.height;
}
