// covers: NFR-A11Y-001, FR-SET-002
import palette from '../palette.json';
import { checkPairs, composite, contrastRatio, parseHex, relativeLuminance, toHex } from '../contrast';
import { MidnightPlum, StrawberryMilk, contrastPairs } from '../palette';

describe('contrast math (Phase 1 plan §4.1)', () => {
    it('gives the WCAG anchors', () => {
        expect(contrastRatio('#000000', '#FFFFFF')).toBe(21);
        expect(contrastRatio('#FFFFFF', '#000000')).toBe(21);
        expect(contrastRatio('#7F3A50', '#7F3A50')).toBe(1);
        // #767676 is the lightest grey that passes 4.5:1 on white; #777777 is not.
        expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
        expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.5);
    });

    it('linearises below and above the 0.04045 knee', () => {
        expect(relativeLuminance(parseHex('#0A0A0A'))).toBeCloseTo(10 / 255 / 12.92, 10);
        expect(relativeLuminance(parseHex('#FFFFFF'))).toBeCloseTo(1, 10);
    });

    it('composites a translucent foreground over its background, rounded to 8 bits', () => {
        // 50 % black over white: 0.5 × 0 + 0.5 × 255 = 127.5, drawn as 128.
        expect(toHex(composite(parseHex('#00000080'), parseHex('#FFFFFF')))).toBe('#7F7F7F');
        expect(toHex(composite(parseHex('#000000FF'), parseHex('#FFFFFF')))).toBe('#000000');
        expect(toHex(composite(parseHex('#00000000'), parseHex('#FFFFFF')))).toBe('#FFFFFF');
    });

    it('rejects malformed colours and translucent backgrounds', () => {
        expect(() => parseHex('#FFF')).toThrow();
        expect(() => parseHex('pink')).toThrow();
        expect(() => contrastRatio('#000000', '#FFFFFF80')).toThrow();
    });

    it('compares the raw ratio, so a pair just under the floor fails', () => {
        const [r] = checkPairs({ a: '#777777', b: '#FFFFFF' }, [{ fg: 'a', bg: 'b', min: 4.5, use: 't' }]);
        expect(r.ratio.toFixed(2)).toBe('4.48');
        expect(r.pass).toBe(false);
    });
});

describe('the Sticker Diary themes (C1)', () => {
    const roles = Object.keys(palette.roles).sort();

    it.each([StrawberryMilk, MidnightPlum])('$name gives every role a value, and nothing else', (theme) => {
        expect(Object.keys(theme.tokens).sort()).toEqual(roles);
    });

    it.each([StrawberryMilk, MidnightPlum])('$name meets the floor on every declared pair', (theme) => {
        const misses = checkPairs(theme.tokens, [...contrastPairs])
            .filter((r) => !r.pass)
            .map((r) => `${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${r.min}`);
        expect(misses).toEqual([]);
    });

    it('holds every text token to 4.5:1 and every mark to at least 3:1', () => {
        for (const p of contrastPairs) expect([3, 4.5]).toContain(p.min);
    });
});
