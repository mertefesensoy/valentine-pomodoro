import { create } from 'zustand';
import type { LoveNotes } from '../types';
import { DEFAULT_LOVE_NOTES, FALLBACK_LOVE_NOTE } from '../constants/defaults';
import { loadSync, saveSync, STORAGE_KEYS } from '../utils/storage';

// The love notes store (Phase 1 B3), key `love_notes`, a bare JSON array of
// strings. Replaces the useLoveNotes hook that AppProvider hosted.

function normalizeNote(input: string) {
    // Keep user's casing, just trim and collapse whitespace
    return input.replace(/\s+/g, ' ').trim();
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
    resetToDefaults(): void;
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

    return {
        notes: DEFAULT_LOVE_NOTES,
        isReady: false,

        hydrate() {
            try {
                const stored = loadSync<unknown>(STORAGE_KEYS.LOVE_NOTES, null);
                set({ notes: isUsableNotes(stored) ? stored : DEFAULT_LOVE_NOTES, isReady: true });
            } catch (error) {
                console.error('[notesStore] hydrate failed; using defaults:', error);
                set({ notes: DEFAULT_LOVE_NOTES, isReady: true });
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

        resetToDefaults() {
            commit(DEFAULT_LOVE_NOTES);
        },

        pickRandomNote(last) {
            const { notes } = get();
            if (notes.length === 0) return FALLBACK_LOVE_NOTE;
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
