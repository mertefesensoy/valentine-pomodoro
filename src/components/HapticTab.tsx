import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

export function HapticTab(props: BottomTabBarButtonProps) {
  // DEF-007: the tab bar's haptic follows the Haptics setting, like every other haptic.
  const haptics = useSettingsStore((s) => s.settings.haptics);
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (haptics && process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
