/**
 * Locale-aware upper case (NFR-I18N-001). In Turkish, i upper-cases to İ and ı to I;
 * a bare `toUpperCase()` gives I for both and loses the difference.
 *
 * Contract: pure; `lang` defaults to the app's language.
 */
import { language, type Language } from './index';

const LOCALE: Record<Language, string> = { en: 'en-US', tr: 'tr-TR' };

export function upper(text: string, lang: Language = language): string {
    return text.toLocaleUpperCase(LOCALE[lang]);
}
