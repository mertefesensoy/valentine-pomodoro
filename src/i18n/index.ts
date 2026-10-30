/**
 * English and Turkish (Phase 1 D1 plumbing, D3 finishes it; FR-SET-005, NFR-I18N-001).
 *
 * Contract
 *   - The language follows the device: the first preferred locale whose language is
 *     Turkish gives 'tr'; anything else gives 'en'. iOS relaunches an app when its
 *     language changes (system or per-app setting), so the language is fixed for a
 *     process and `t` needs no subscription: calling it in render is pure.
 *   - `t(key, options)` is i18next's, initialised synchronously with both resources
 *     bundled, so the first render already has its strings.
 *   - Turkish upper case goes through `upper()` in `./casing`, never a bare
 *     `toUpperCase()` (İ/ı).
 */
import { createInstance } from 'i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';
import tr from './tr.json';

export type Language = 'en' | 'tr';

/** The app's language for a list of preferred language codes, most preferred first. */
export function pickLanguage(codes: readonly (string | null | undefined)[]): Language {
    for (const code of codes) {
        if (!code) continue;
        const lang = code.toLowerCase().split(/[-_]/)[0];
        if (lang === 'tr') return 'tr';
        if (lang === 'en') return 'en';
    }
    return 'en';
}

function deviceLanguage(): Language {
    try {
        return pickLanguage(getLocales().map((l) => l.languageCode));
    } catch {
        return 'en';
    }
}

export const language: Language = deviceLanguage();

// A dedicated instance, so nothing else that imports i18next can change the app's language.
const i18n = createInstance();
i18n.init({
    lng: language,
    fallbackLng: 'en',
    resources: { en: { translation: en }, tr: { translation: tr } },
    interpolation: { escapeValue: false }, // React escapes; these are UI strings, not HTML
    returnNull: false,
    initAsync: false,
});

export const t = i18n.t.bind(i18n);

/** A translator fixed to one language, whatever the device's (tests, previews). */
export const fixedT = (lng: Language) => i18n.getFixedT(lng);
