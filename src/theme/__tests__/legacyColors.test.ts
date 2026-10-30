// covers: FR-SET-002, NFR-A11Y-001
// The transitional v1-name adapter (Phase 1 D1, Stage D plan §3.2.2): every pair the screens
// D2 hasn't rebuilt draw, in both themes, at its floor.
import { checkPairs, type ContrastPair } from '../contrast';
import { legacyColors } from '../legacyColors';
import { MidnightPlum, StrawberryMilk } from '../palette';

// What Stats, Settings, Notes and Gift paint with the v1 names (text ≥ 4.5; the
// accent as a text colour on the page and on paper is body-size text, so 4.5 too).
const LEGACY_PAIRS: ContrastPair[] = [
    { fg: 'text', bg: 'bg', min: 4.5, use: 'body text on the page' },
    { fg: 'text', bg: 'card', min: 4.5, use: 'body text on a card' },
    { fg: 'text', bg: 'inputBg', min: 4.5, use: 'typed text in an input' },
    { fg: 'text', bg: 'surfaceTint', min: 4.5, use: 'text on a tinted chip' },
    { fg: 'text', bg: 'accentLight', min: 4.5, use: 'text on a light-accent fill' },
    { fg: 'textMuted', bg: 'bg', min: 4.5, use: 'secondary text on the page' },
    { fg: 'textMuted', bg: 'card', min: 4.5, use: 'secondary text on a card' },
    { fg: 'textMuted', bg: 'inputBg', min: 4.5, use: 'placeholder text' },
    { fg: 'accent', bg: 'bg', min: 4.5, use: 'accent text on the page' },
    { fg: 'accent', bg: 'card', min: 4.5, use: 'accent text on a card' },
    { fg: 'accentPurple', bg: 'bg', min: 4.5, use: 'v1 purple text on the page' },
    { fg: 'accentPurple', bg: 'card', min: 4.5, use: 'v1 purple text on a card' },
    { fg: 'onAccent', bg: 'accent', min: 4.5, use: 'a label on an accent button' },
    { fg: 'onAccent', bg: 'accentPurple', min: 4.5, use: 'a label on a v1 purple button' },
];

describe.each([StrawberryMilk, MidnightPlum])('legacy colours in $name', (theme) => {
    const colors = legacyColors(theme.tokens);
    const flat = Object.fromEntries(
        Object.entries(colors).filter((e): e is [string, string] => typeof e[1] === 'string'),
    );

    it.each(checkPairs(flat, LEGACY_PAIRS))('$use: $fg on $bg reaches its floor ($ratio)', (r) => {
        expect(r.ratio).toBeGreaterThanOrEqual(r.min);
    });

    it('draws every v1 gradient flat, in the page colour', () => {
        for (const g of [colors.gradientA, colors.gradientB, colors.gradientA2, colors.gradientB2]) {
            expect(g).toEqual([theme.tokens.page, theme.tokens.page, theme.tokens.page]);
        }
    });
});
