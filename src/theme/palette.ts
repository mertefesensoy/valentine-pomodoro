/**
 * Typed access to the Sticker Diary themes (Phase 1 C1). `palette.json` is the source;
 * `npm run check:contrast` proves its declared pairs. Nothing in the app imports this
 * until D1, which switches `useTheme` over from the v1 `tokens.ts`.
 */
import palette from './palette.json';
import type { ContrastPair } from './contrast';

export type ThemeId = keyof typeof palette.themes;
export type TokenName = keyof typeof palette.roles;
export type ThemeTokens = Record<TokenName, string>;

export type Theme = {
    id: ThemeId;
    name: string;
    scheme: 'light' | 'dark';
    tokens: ThemeTokens;
};

function theme(id: ThemeId): Theme {
    const t = palette.themes[id];
    return { id, name: t.name, scheme: t.scheme as Theme['scheme'], tokens: t.tokens };
}

export const StrawberryMilk = theme('strawberryMilk');
export const MidnightPlum = theme('midnightPlum');

/** Every foreground/background pair the UI draws, with its floor; checked in both themes. */
export const contrastPairs: readonly ContrastPair[] = palette.pairs;

/** The dims (D5): a translucent token over a lit colour, and how far it must set it back. Not WCAG floors. */
export const dimPairs: readonly ContrastPair[] = palette.dims;
