// covers: FR-SET-005, NFR-I18N-001
import en from '../en.json';
import tr from '../tr.json';
import { fixedT, pickLanguage, resolveLanguage, t } from '../index';
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

    // D3 (D3 record §3.4): Settings › Language stores a choice that wins over the device's.
    it('takes a stored choice over the device, and follows the device on System', () => {
        expect(resolveLanguage('tr', ['en-US'])).toBe('tr');
        expect(resolveLanguage('en', ['tr-TR'])).toBe('en');
        expect(resolveLanguage('system', ['tr-TR'])).toBe('tr');
        expect(resolveLanguage('system', ['de'])).toBe('en');
    });

    it('reads the stored choice once, when it loads: the next launch', () => {
        jest.isolateModules(() => {
            // One module registry: the store written here is the one the translator reads.
            const { saveLanguageChoice } = jest.requireActual<typeof import('../languageChoice')>('../languageChoice');
            saveLanguageChoice('tr');
            const fresh = jest.requireActual<typeof import('../index')>('../index');
            expect(fresh.language).toBe('tr');
            expect(fresh.t('modes.title')).toBe('Modlar');
            saveLanguageChoice('system');
        });
        // This process's translator loaded before the choice: it keeps its language.
        expect(t('modes.title')).toBe('Modes');
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

describe('the in-house translator (i18next replaced, D1 record §4.1)', () => {
    it('returns a missing key as itself, never throws', () => {
        expect(t('no.such.key')).toBe('no.such.key');
        expect(t('timer')).toBe('timer'); // a branch, not a string
    });

    it('leaves a placeholder with no value as it is', () => {
        expect(t('timer.session', { n: 2 })).toBe('session 2 of {{total}}');
    });

    it("falls back to English's rule when Intl.PluralRules is missing", () => {
        jest.isolateModules(() => {
            // Simulating a runtime without Intl.PluralRules (read-only in the types, writable at runtime).
            const intl = Intl as unknown as { PluralRules: unknown };
            const real = intl.PluralRules;
            intl.PluralRules = undefined;
            try {
                const { fixedT: fresh } = jest.requireActual<typeof import('../index')>('../index');
                expect(fresh('en')('today.a11y', { count: 1 })).toBe('1 session today');
                expect(fresh('en')('today.a11y', { count: 5 })).toBe('5 sessions today');
                expect(fresh('tr')('today.a11y', { count: 5 })).toBe('Bugün 5 oturum');
            } finally {
                intl.PluralRules = real;
            }
        });
    });
});
