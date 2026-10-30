/**
 * English and Turkish (Phase 1 D1 plumbing, D3 finishes it; FR-SET-005, NFR-I18N-001).
 *
 * A small translator of our own, in place of i18next (the owner, 2026-10-30, for the bytecode:
 * i18next was 35 % of D1's growth; D1 record §4.1). The resources and the keys are unchanged.
 *
 * Contract
 *   - The language follows the device: the first preferred locale whose language is Turkish
 *     gives 'tr'; anything else gives 'en'. iOS relaunches an app when its language changes
 *     (system or per-app setting), so the language is fixed for a process and `t` needs no
 *     subscription: calling it in render is pure.
 *   - `t(key, options)` looks the dotted key up in the app's language, then in English; a key
 *     missing from both returns itself (a visible bug, never a crash).
 *   - Plurals: with a numeric `options.count`, the key takes a suffix from the language's plural
 *     rules (`Intl.PluralRules`): `_one`, `_other`, and so on, with `_zero` first when count is 0
 *     and the key has one. English has one/other; Turkish uses one form after a number.
 *   - Interpolation: `{{name}}` takes `options.name`; a missing value leaves the placeholder.
 *   - Turkish upper case goes through `upper()` in `./casing`, never a bare `toUpperCase()` (İ/ı).
 */
import { getLocales } from 'expo-localization';

import en from './en.json';
import tr from './tr.json';

export type Language = 'en' | 'tr';
type Tree = { [key: string]: string | Tree };
type Options = Record<string, string | number | undefined>;

const RESOURCES: Record<Language, Tree> = { en, tr };
const LOCALE: Record<Language, string> = { en: 'en-US', tr: 'tr-TR' };

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

function lookup(tree: Tree, key: string): string | undefined {
    let node: string | Tree | undefined = tree;
    for (const part of key.split('.')) {
        if (node === undefined || typeof node === 'string') return undefined;
        node = node[part];
    }
    return typeof node === 'string' ? node : undefined;
}

const rules = new Map<Language, Intl.PluralRules | null>();
function pluralCategory(lng: Language, count: number): string {
    if (!rules.has(lng)) {
        try {
            rules.set(lng, new Intl.PluralRules(LOCALE[lng]));
        } catch {
            rules.set(lng, null); // no Intl: English's rule, which Turkish shares after a number
        }
    }
    const r = rules.get(lng);
    return r ? r.select(count) : count === 1 ? 'one' : 'other';
}

function resolve(lng: Language, key: string, count: number | undefined): string | undefined {
    const order: Language[] = lng === 'en' ? ['en'] : [lng, 'en'];
    for (const l of order) {
        const tree = RESOURCES[l];
        if (count !== undefined) {
            const text =
                (count === 0 ? lookup(tree, `${key}_zero`) : undefined) ??
                lookup(tree, `${key}_${pluralCategory(l, count)}`) ??
                lookup(tree, `${key}_other`);
            if (text !== undefined) return text;
        }
        const plain = lookup(tree, key);
        if (plain !== undefined) return plain;
    }
    return undefined;
}

function translate(lng: Language, key: string, options?: Options): string {
    const count = typeof options?.count === 'number' ? options.count : undefined;
    const text = resolve(lng, key, count) ?? key;
    if (!options) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (whole, name: string) => {
        const v = options[name];
        return v === undefined ? whole : String(v);
    });
}

export function t(key: string, options?: Options): string {
    return translate(language, key, options);
}

/** A translator fixed to one language, whatever the device's (tests, previews). */
export const fixedT =
    (lng: Language) =>
    (key: string, options?: Options): string =>
        translate(lng, key, options);
