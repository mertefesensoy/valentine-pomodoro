/**
 * The v1 colour names, mapped onto the Sticker Diary tokens (Phase 1 D1, Stage D plan §3.2.2).
 *
 * Transitional: Stats, Settings, Notes, Gift and Fly's chrome still read these names until D2
 * rebuilds them, so the switch to the new palette shows everywhere at once without editing those
 * screens twice. Deleted at D2's end. Every pair those screens draw is checked in both themes by
 * `__tests__/legacyColors.test.ts`.
 *
 * Contract: a pure function of a theme's tokens; no side effects. Each gradient becomes three
 * copies of the page colour, so v1's aurora backgrounds draw flat ("The Paper Not Gradient Rule").
 */
import type { ThemeTokens } from './palette';

type Gradient = readonly [string, string, string];

export type LegacyColors = {
    bg: string;
    card: string;
    text: string;
    textMuted: string;
    /** Strawberry as a fill or as text. */
    accent: string;
    /** The label on an `accent` or `accentPurple` fill (v1 hard-coded white, which fails on dark). */
    onAccent: string;
    accentLight: string;
    accentPurple: string;
    border: string;
    inputBg: string;
    surfaceTint: string;
    gradientA: Gradient;
    gradientB: Gradient;
    gradientA2: Gradient;
    gradientB2: Gradient;
};

export function legacyColors(t: ThemeTokens): LegacyColors {
    const flat: Gradient = [t.page, t.page, t.page];
    return {
        bg: t.page,
        card: t.paper,
        text: t.ink,
        textMuted: t.inkSoft,
        accent: t.primaryInk,
        onAccent: t.onAccent,
        accentLight: t.primarySoft,
        accentPurple: t.primaryInk,
        border: t.edge,
        inputBg: t.field,
        surfaceTint: t.primarySoft,
        gradientA: flat,
        gradientB: flat,
        gradientA2: flat,
        gradientB2: flat,
    };
}
