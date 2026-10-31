/**
 * Theme Resolver Hook
 * Returns the Sticker Diary theme (Phase 1 D1: Strawberry Milk or Midnight Plum from
 * `palette.ts`) for the system appearance.
 *
 * - `tokens`: the palette roles, for screens built in the new design.
 * - `colors`: the v1 names mapped onto those roles (`legacyColors.ts`), for the screens D2
 *   hasn't rebuilt yet. Deleted at D2's end.
 *
 * The app follows the phone's light or dark mode (the owner, D2, 2026-10-31; HIG
 * `dark-mode.md`, DESIGN.md › Themes). v1's System / Light / Dark switch is retired:
 * `settings.themeMode` stays in storage, as every key is kept, but nothing reads it.
 */

import { useColorScheme } from 'react-native';
import { legacyColors, type LegacyColors } from './legacyColors';
import { MidnightPlum, StrawberryMilk, type Theme, type ThemeTokens } from './palette';

// Built once, so each theme hands out the same objects on every render.
const LEGACY: Record<Theme['id'], LegacyColors> = {
    strawberryMilk: legacyColors(StrawberryMilk.tokens),
    midnightPlum: legacyColors(MidnightPlum.tokens),
};

export function useTheme(): { theme: Theme; tokens: ThemeTokens; colors: LegacyColors; isDark: boolean } {
    const isDark = useColorScheme() === 'dark';
    const theme = isDark ? MidnightPlum : StrawberryMilk;
    return { theme, tokens: theme.tokens, colors: LEGACY[theme.id], isDark };
}
