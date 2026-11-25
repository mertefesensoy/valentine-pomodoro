import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';

import { tabPressHaptic } from '../../src/components/tabPressHaptic';
import { t } from '../../src/i18n';
import { useTheme } from '../../src/theme/useTheme';

// The four filled tab icons of the C3 set (HIG review M-4), shipped by the art
// pipeline as 25 pt template images (@1x/@2x/@3x, art/jobs/icons.json): the bar
// draws their alpha only, tinted by the system.
const ICONS = {
  index: require('../../assets/images/tabs/tab-timer.png'),
  stats: require('../../assets/images/tabs/tab-stats.png'),
  settings: require('../../assets/images/tabs/tab-settings.png'),
  notes: require('../../assets/images/tabs/tab-notes.png'),
};

// The iOS native tab bar (Phase 1 B6, ADR-0043). UIKit switches tabs without
// an animation. Every tab handles its own safe areas, as before the native
// bar (disableAutomaticContentInsets). Each route file renders its screen in
// a LazyTab: rendered on first focus or at start-up idle, then never hidden
// (B6 fix, record §9).
//
// Only the selected tab carries the brand colour, primaryInk (HIG H-1: 5.75:1
// light, 8.91:1 dark). The unselected items keep the system's monochrome, which
// adapts to what is under the Liquid Glass bar (D1 HIG D1-M1). NativeTabs'
// tintColor is Android-only in expo-router 58, so iOS takes the colour through
// iconColor and the selected label style.
//
// Android (the closed-test plan, Stage 1) differs in two ways:
// - Its bar isn't counted in the screen's safe area, so a tab's bottom inset was
//   only the gesture strip and the bar covered the last ~80 dp: the Timer's
//   Start button and Settings' Reset. There, the tab keeps expo-router's own
//   wrapper, which pads the content clear of the bar, and LazyTab measures the
//   insets again inside it.
// - Unstyled, the bar takes Material You's surface and a grey-blue indicator.
//   There it takes the paper, a soft pink indicator and the cocoa ink. iOS keeps
//   the system's Liquid Glass bar, which these props would replace.
const ANDROID = Platform.OS === 'android';

export default function TabLayout() {
  const { tokens } = useTheme();
  const android = ANDROID
    ? {
        backgroundColor: tokens.paper,
        indicatorColor: tokens.primarySoft,
        rippleColor: tokens.primarySoft,
        iconColor: { default: tokens.inkSoft, selected: tokens.primaryInk },
        labelStyle: { default: { color: tokens.inkSoft }, selected: { color: tokens.primaryInk } },
      }
    : {};
  return (
    <NativeTabs
      screenListeners={{ tabPress: tabPressHaptic }}
      iconColor={{ selected: tokens.primaryInk }}
      labelStyle={{ selected: { color: tokens.primaryInk } }}
      {...android}
    >
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets={!ANDROID}>
        <NativeTabs.Trigger.Label>{t('tabs.timer')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.index} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats" disableAutomaticContentInsets={!ANDROID}>
        <NativeTabs.Trigger.Label>{t('tabs.stats')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.stats} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" disableAutomaticContentInsets={!ANDROID}>
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.settings} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes" disableAutomaticContentInsets={!ANDROID}>
        <NativeTabs.Trigger.Label>{t('tabs.notes')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.notes} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
