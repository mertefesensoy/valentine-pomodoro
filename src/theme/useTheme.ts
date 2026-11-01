/**
 * Theme Resolver Hook
 * Returns the Sticker Diary theme (Phase 1 D1: Strawberry Milk or Midnight Plum from
 * `palette.ts`) for the system appearance: the theme, its `tokens` (the palette roles every screen
 * paints with) and `isDark`.
 *
 * The app follows the phone's light or dark mode (the owner, D2, 2026-10-31; HIG
 * `dark-mode.md`, DESIGN.md › Themes). v1's System / Light / Dark switch is retired:
 * `settings.themeMode` stays in storage, as every key is kept, but nothing reads it.
 *
 * D2 rebuilt the last v1 screens and re-tokened Fly's chrome, so the transitional `colors` adapter
 * (`legacyColors.ts`, the v1 names mapped onto these tokens) is gone.
 */

import { useColorScheme } from 'react-native';
import { MidnightPlum, StrawberryMilk, type Theme, type ThemeTokens } from './palette';

export function useTheme(): { theme: Theme; tokens: ThemeTokens; isDark: boolean } {
    const isDark = useColorScheme() === 'dark';
    const theme = isDark ? MidnightPlum : StrawberryMilk;
    return { theme, tokens: theme.tokens, isDark };
}
