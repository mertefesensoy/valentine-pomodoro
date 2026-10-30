/**
 * WCAG 2.x contrast math for the theme tokens (Phase 1 plan §4.1; Stage C record §4.1).
 *
 * One implementation, three callers: `npm run check:contrast` (Node, through type
 * stripping), the Jest test, and later the app's runtime guard for a wallpaper theme.
 * So this file has no imports and uses only erasable TypeScript syntax.
 *
 * Colours are `#RRGGBB` or `#RRGGBBAA`. A colour with alpha is composited over its
 * background in sRGB, per channel, and rounded to 8 bits, as the platforms draw it.
 */

export type Rgba = { r: number; g: number; b: number; a: number };

export type ContrastPair = {
    fg: string;
    bg: string;
    /** 4.5 for text, 3 for large text, icons and non-text UI. */
    min: number;
    use: string;
};

export type PairResult = ContrastPair & {
    fgHex: string;
    bgHex: string;
    ratio: number;
    pass: boolean;
};

const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;

/** Parses `#RRGGBB` or `#RRGGBBAA`; throws on anything else, so a typo in the token file fails loudly. */
export function parseHex(hex: string): Rgba {
    const m = HEX.exec(hex);
    if (!m) throw new Error(`Not a #RRGGBB or #RRGGBBAA colour: ${hex}`);
    const n = parseInt(m[1], 16);
    return {
        r: (n >> 16) & 0xff,
        g: (n >> 8) & 0xff,
        b: n & 0xff,
        a: m[2] === undefined ? 1 : parseInt(m[2], 16) / 255,
    };
}

export function toHex({ r, g, b }: Rgba): string {
    return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** fg over an opaque bg: c = α·fg + (1 − α)·bg per channel, rounded to 8 bits. */
export function composite(fg: Rgba, bg: Rgba): Rgba {
    const mix = (f: number, b: number) => Math.round(fg.a * f + (1 - fg.a) * b);
    return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

function linearise(c8: number): number {
    const c = c8 / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative luminance L in [0, 1] of an opaque colour. */
export function relativeLuminance({ r, g, b }: Rgba): number {
    return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * Contrast ratio in [1, 21] of fg drawn on bg. The background must be opaque;
 * a translucent foreground is composited over it first. Not rounded: callers
 * compare the raw value, so 4.499 fails a 4.5 floor even though it prints as 4.50.
 */
export function contrastRatio(fgHex: string, bgHex: string): number {
    const bg = parseHex(bgHex);
    if (bg.a !== 1) throw new Error(`A background must be opaque: ${bgHex}`);
    const fg = composite(parseHex(fgHex), bg);
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Resolves each pair's token names in `tokens` and checks it against its floor. */
export function checkPairs(tokens: Record<string, string>, pairs: ContrastPair[]): PairResult[] {
    return pairs.map((p) => {
        const fgHex = tokens[p.fg];
        const bgHex = tokens[p.bg];
        if (fgHex === undefined) throw new Error(`Unknown token in a pair: ${p.fg}`);
        if (bgHex === undefined) throw new Error(`Unknown token in a pair: ${p.bg}`);
        const ratio = contrastRatio(fgHex, bgHex);
        return { ...p, fgHex, bgHex, ratio, pass: ratio >= p.min };
    });
}
