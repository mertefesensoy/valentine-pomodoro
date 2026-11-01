/**
 * The navigator's theme from the Sticker Diary tokens (Phase 1 D1), so stack, sheet and
 * tab-scene backgrounds are the diary page rather than the system white or grey.
 *
 * Contract: one fixed object per theme, built once; `App.tsx` passes the one for the
 * resolved appearance to Expo Router's `ThemeProvider`.
 */
import { DarkTheme, DefaultTheme } from 'expo-router';
import { MidnightPlum, StrawberryMilk, type Theme } from './palette';

type NavigationTheme = typeof DefaultTheme;

function fromTheme(base: NavigationTheme, { tokens: t }: Theme): NavigationTheme {
    return {
        ...base,
        colors: {
            ...base.colors,
            primary: t.primaryInk,
            background: t.page,
            card: t.paper,
            text: t.ink,
            border: t.edge,
            notification: t.accent,
        },
    };
}

export const navigationThemes: Record<Theme['id'], NavigationTheme> = {
    strawberryMilk: fromTheme(DefaultTheme, StrawberryMilk),
    midnightPlum: fromTheme(DarkTheme, MidnightPlum),
};
