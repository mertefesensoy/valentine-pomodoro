import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * The tab bar's press haptic: a light impact on iOS, only while the Haptics
 * setting is on (DEF-007). The native tab bar takes no custom button, so this
 * is the tab navigator's `tabPress` listener (Phase 1 B6; it replaces
 * HapticTab's onPressIn). It reads the setting at the moment of the press, so
 * it subscribes to nothing and never re-renders the tab bar.
 */
export function tabPressHaptic(): void {
    if (process.env.EXPO_OS !== 'ios') return;
    if (!useSettingsStore.getState().settings.haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
