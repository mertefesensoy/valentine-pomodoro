/**
 * The in-app language choice: Settings › Language (D3; the owner, 2026-11-01: "At the next launch
 * is fine"; FR-SET-005).
 *
 * Contract
 *   - `readLanguageChoice()` returns the stored choice: 'system' (the default, which follows the
 *     device), 'en' or 'tr'. Nothing stored, or anything else, reads as 'system'.
 *   - `saveLanguageChoice(choice)` stores it, and 'system' removes the key. It applies at the next
 *     launch, when `./index` reads it once to fix the process's language (ADR-0048: one language a
 *     process), so nothing on screen changes until the app is closed and opened again.
 *   - The choice has a key of its own, read and written straight through MMKV rather than through
 *     `utils/storage.ts`: the translator loads before the one-time AsyncStorage migration has
 *     finished, and that helper refuses to read before it. That's safe because the key is new in
 *     v1.4: the migrator copies only v1.3.1's keys, so it never writes this one, and only Settings
 *     does, long after the migration. The value is the bare code ('en', 'tr'), not JSON.
 */
import { appStorage } from '../utils/appStorage';
import type { Language } from './index';

export type LanguageChoice = 'system' | Language;

export const LANGUAGE_CHOICE_KEY = 'language_choice';

export function readLanguageChoice(): LanguageChoice {
    const stored = appStorage.getString(LANGUAGE_CHOICE_KEY);
    return stored === 'en' || stored === 'tr' ? stored : 'system';
}

export function saveLanguageChoice(choice: LanguageChoice): void {
    if (choice === 'system') appStorage.remove(LANGUAGE_CHOICE_KEY);
    else appStorage.set(LANGUAGE_CHOICE_KEY, choice);
}
