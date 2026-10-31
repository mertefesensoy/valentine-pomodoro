import { create } from 'zustand';
import type { LoveNotes } from '../types';
import { defaultLoveNotes, fallbackLoveNote } from '../constants/defaults';
import { language } from '../i18n';
import { loadSync, saveSync, STORAGE_KEYS } from '../utils/storage';

/** A note's most characters (the owner, D2): longer notes already kept are never cut. */
export const NOTE_MAX_LENGTH = 280;

// The love notes store (Phase 1 B3), key `love_notes`, a bare JSON array of
// strings. Replaces the useLoveNotes hook that AppProvider hosted.

/**
 * A note as it's kept: the writer's casing and line breaks, with runs of spaces and tabs folded
 * into one, no spaces around a line break, at most one blank line, and nothing around the whole.
 * It used to fold line breaks into spaces too, so a note written on three lines in the editor
 * saved as one (D2 record §3.13, break-ui #3; the owner kept line breaks).
 */
export function normalizeNote(input: string) {
    return input
        .replace(/\r\n?/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
        .replace(/ ?\n ?/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** A note's letters and digits, lower-cased: what Restore compares, so punctuation and emoji don't count. */
function noteKey(note: string) {
    return note.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

/** A stored value is used only if it is a non-empty array of strings. */
function isUsableNotes(value: unknown): value is LoveNotes {
    return Array.isArray(value) && value.length > 0 && value.every((n) => typeof n === 'string');
}

export interface NotesStore {
    notes: LoveNotes;
    /** True once hydrate() has run. Everything below StoreGate sees true. */
    isReady: boolean;

    /**
     * Reads `love_notes` from MMKV synchronously. A missing key, an empty list
     * or anything but an array of strings gives the defaults. Never throws.
     */
    hydrate(): void;
    /** Adds a note at the top, unless the same text is already there. Blank text is ignored. */
    addNote(text: string): void;
    editNote(index: number, text: string): void;
    deleteNote(index: number): void;
    /**
     * Adds back, at the end, the default notes the list no longer has, and removes nothing, so the
     * notes someone wrote are never lost (D2; HIG review: v1's reset replaced the whole list).
     * Returns how many it added.
     */
    restoreDefaults(): number;
    /**
     * A random note, never `last` twice in a row while there are two or more
     * (FR-NTE-001); the fallback note when the list is empty. Reads the
     * current list, so its identity never changes.
     */
    pickRandomNote(last: string | null): string;
}

export const useNotesStore = create<NotesStore>()((set, get) => {
    const commit = (notes: LoveNotes) => {
        set({ notes });
        saveSync(STORAGE_KEYS.LOVE_NOTES, notes);
    };

    // A fresh install's defaults are in the app's language (FR-NTE-002); an existing install has
    // its own `love_notes`, written by the storage migration if it never edited them.
    const defaults = defaultLoveNotes(language);

    return {
        notes: defaults,
        isReady: false,

        hydrate() {
            try {
                const stored = loadSync<unknown>(STORAGE_KEYS.LOVE_NOTES, null);
                set({ notes: isUsableNotes(stored) ? stored : defaults, isReady: true });
            } catch (error) {
                console.error('[notesStore] hydrate failed; using defaults:', error);
                set({ notes: defaults, isReady: true });
            }
        },

        addNote(text) {
            const v = normalizeNote(text);
            if (!v) return;
            const prev = get().notes;
            // Prevent exact duplicates
            if (prev.includes(v)) return;
            commit([v, ...prev]);
        },

        editNote(index, text) {
            const v = normalizeNote(text);
            if (!v) return;
            const prev = get().notes;
            if (index < 0 || index >= prev.length) return;
            const next = [...prev];
            next[index] = v;
            commit(next);
        },

        deleteNote(index) {
            const prev = get().notes;
            if (index < 0 || index >= prev.length) return;
            commit(prev.filter((_, i) => i !== index));
        },

        restoreDefaults() {
            const prev = get().notes;
            // A default counts as present when a note matches it in letters and digits alone, so
            // a v1 note that differs only in punctuation, case or emoji ("Your effort is the cutest
            // thing" beside "…thing.") isn't added again (build 52 device check, D2 record §3.17).
            const present = new Set(prev.map(noteKey));
            const missing = defaults.filter((note) => !present.has(noteKey(note)));
            if (missing.length > 0) commit([...prev, ...missing]);
            return missing.length;
        },

        pickRandomNote(last) {
            const { notes } = get();
            if (notes.length === 0) return fallbackLoveNote(language);
            if (notes.length === 1) return notes[0];

            const idx = Math.floor(Math.random() * notes.length);
            let next = notes[idx];

            // Anti-repeat: deterministic "next" to avoid reroll loops
            if (next === last) {
                next = notes[(idx + 1) % notes.length];
            }
            return next;
        },
    };
});
