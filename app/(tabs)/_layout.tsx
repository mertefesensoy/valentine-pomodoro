import { NativeTabs } from 'expo-router/native-tabs';

import { tabPressHaptic } from '../../src/components/tabPressHaptic';
import type { IconSymbolName } from '../../src/components/ui/IconSymbol';

// SF Symbols, typed against IconSymbol's mapping so an icon without an
// Android/web counterpart fails tsc. Android's `md` icons wait for AN4.
const ICONS = {
  index: 'heart.fill',
  stats: 'chart.bar.fill',
  settings: 'gearshape.fill',
  notes: 'heart.text.square.fill',
} as const satisfies Record<string, IconSymbolName>;

// The iOS native tab bar (Phase 1 B6, ADR-0043). UIKit switches tabs without
// an animation. Every tab handles its own safe areas, as before the native
// bar (disableAutomaticContentInsets), and freezes while hidden
// (FreezeOnBlur, in each route file).
export default function TabLayout() {
  return (
    <NativeTabs screenListeners={{ tabPress: tabPressHaptic }}>
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Timer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={ICONS.index} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={ICONS.stats} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={ICONS.settings} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Notes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={ICONS.notes} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
