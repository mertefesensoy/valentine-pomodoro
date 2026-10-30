// covers: FR-SET-005, NFR-I18N-001
import en from '../en.json';
import tr from '../tr.json';
import { fixedT, pickLanguage, t } from '../index';
import { upper } from '../casing';

type Tree = { [k: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): Map<string, string> {
    const out = new Map<string, string>();
    for (const [k, v] of Object.entries(tree)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string') out.set(key, v);
        else for (const [lk, lv] of leaves(v, key)) out.set(lk, lv);
    }
    return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

describe('the EN and TR resources', () => {
    const enLeaves = leaves(en as Tree);
    const trLeaves = leaves(tr as Tree);

    it('have the same keys', () => {
        expect([...trLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
    });

    it('use the same placeholders in every string', () => {
        for (const [key, text] of enLeaves) {
            expect({ key, placeholders: placeholders(trLeaves.get(key) ?? '') }).toEqual({ key, placeholders: placeholders(text) });
        }
    });

    it('have no empty string', () => {
        for (const [key, text] of [...enLeaves, ...trLeaves]) expect({ key, empty: text.trim() === '' }).toEqual({ key, empty: false });
    });
});

describe('the language', () => {
    it('follows the first preferred locale that is Turkish or English', () => {
        expect(pickLanguage(['tr'])).toBe('tr');
        expect(pickLanguage(['tr-TR'])).toBe('tr');
        expect(pickLanguage(['TR_tr'])).toBe('tr');
        expect(pickLanguage(['de', 'tr'])).toBe('tr');
        expect(pickLanguage(['en-GB', 'tr'])).toBe('en');
    });

    it('falls back to English for anything else, or nothing', () => {
        expect(pickLanguage(['de', 'fr'])).toBe('en');
        expect(pickLanguage([])).toBe('en');
        expect(pickLanguage([null, undefined])).toBe('en');
    });

    it('is available at the first render, with interpolation and plurals', () => {
        expect(t('timer.phaseLine', { phase: 'Focus', n: 2, total: 4 })).toBe('Focus · session 2 of 4');
        expect(t('today.a11y', { count: 0 })).toBe('No sessions yet today');
        expect(t('today.a11y', { count: 1 })).toBe('1 session today');
        expect(t('today.a11y', { count: 3 })).toBe('3 sessions today');
        const trT = fixedT('tr');
        expect(trT('timer.phaseLine', { phase: 'Odak', n: 2, total: 4 })).toBe('Odak · 4 oturumdan 2.');
        expect(trT('today.a11y', { count: 3 })).toBe('Bugün 3 oturum');
        expect(trT('timer.a11y.minutes', { count: 1 })).toBe('1 dakika');
    });
});

describe('Turkish casing', () => {
    it('keeps the dot: i → İ and ı → I in Turkish', () => {
        expect(upper('istatistik', 'tr')).toBe('İSTATİSTİK');
        expect(upper('kısa mola', 'tr')).toBe('KISA MOLA');
    });

    it('uses English casing for English', () => {
        expect(upper('istatistik', 'en')).toBe('ISTATISTIK');
    });
});
