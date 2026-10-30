/**
 * Theme Resolver Hook
 * Returns the Sticker Diary theme (Phase 1 D1: Strawberry Milk or Midnight Plum from
 * `palette.ts`) for the user's preference and the system appearance.
 *
 * - `tokens`: the palette roles, for screens built in the new design.
 * - `colors`: the v1 names mapped onto those roles (`legacyColors.ts`), for the screens D2
 *   hasn't rebuilt yet. Deleted at D2's end.
 */

import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { legacyColors, type LegacyColors } from './legacyColors';
import { MidnightPlum, StrawberryMilk, type Theme, type ThemeTokens } from './palette';

// Built once, so each theme hands out the same objects on every render.
const LEGACY: Record<Theme['id'], LegacyColors> = {
    strawberryMilk: legacyColors(StrawberryMilk.tokens),
    midnightPlum: legacyColors(MidnightPlum.tokens),
};

export function useTheme(): { theme: Theme; tokens: ThemeTokens; colors: LegacyColors; isDark: boolean } {
    const systemScheme = useColorScheme();
    const themeMode = useSettingsStore((s) => s.settings.themeMode);

    let isDark = false;

    if (themeMode === 'dark') {
        isDark = true;
    } else if (themeMode === 'light') {
        isDark = false;
    } else {
        // 'system' - follow device preference
        isDark = systemScheme === 'dark';
    }

    const theme = isDark ? MidnightPlum : StrawberryMilk;
    return { theme, tokens: theme.tokens, colors: LEGACY[theme.id], isDark };
}
