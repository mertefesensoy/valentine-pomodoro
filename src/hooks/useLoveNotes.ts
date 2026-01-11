import { useCallback, useEffect, useMemo, useState } from 'react';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import { DEFAULT_LOVE_NOTES, FALLBACK_LOVE_NOTE } from '../constants/defaults';

function normalizeNote(input: string) {
    // Keep user's casing, just trim and collapse whitespace
    return input.replace(/\s+/g, ' ').trim();
}

export function useLoveNotes() {
    const [notes, setNotes] = useState<string[]>(DEFAULT_LOVE_NOTES);
    const [isReady, setIsReady] = useState(false);

    // Load persisted notes on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loaded = await load<string[]>(STORAGE_KEYS.LOVE_NOTES, DEFAULT_LOVE_NOTES);
                if (cancelled) return;
                if (loaded && loaded.length > 0) setNotes(loaded);
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);



    const addNote = useCallback(async (text: string) => {
        const v = normalizeNote(text);
        if (!v) return;

        setNotes((prev) => {
            // Prevent exact duplicates
            const exists = prev.includes(v);
            const next = exists ? prev : [v, ...prev];
            void save(STORAGE_KEYS.LOVE_NOTES, next).catch((error) => {
                console.error('[useLoveNotes] Failed to save notes:', error);
            });
            return next;
        });
    }, []);

    const editNote = useCallback(async (index: number, text: string) => {
        const v = normalizeNote(text);
        if (!v) return;

        setNotes((prev) => {
            if (index < 0 || index >= prev.length) return prev;
            const next = [...prev];
            next[index] = v;
            void save(STORAGE_KEYS.LOVE_NOTES, next).catch((error) => {
                console.error('[useLoveNotes] Failed to save notes:', error);
            });
            return next;
        });
    }, []);

    const deleteNote = useCallback(async (index: number) => {
        setNotes((prev) => {
            if (index < 0 || index >= prev.length) return prev;
            const next = prev.filter((_, i) => i !== index);
            // Allow empty list
            void save(STORAGE_KEYS.LOVE_NOTES, next).catch((error) => {
                console.error('[useLoveNotes] Failed to save notes:', error);
            });
            return next;
        });
    }, []);

    const resetToDefaults = useCallback(async () => {
        setNotes(DEFAULT_LOVE_NOTES);
        void save(STORAGE_KEYS.LOVE_NOTES, DEFAULT_LOVE_NOTES).catch((error) => {
            console.error('[useLoveNotes] Failed to save notes:', error);
        });
    }, []);

    const pickRandomNote = useCallback(
        (last: string | null): string => {
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
        [notes]
    );



    return {
        notes,
        count: notes.length,
        isReady,
        addNote,
        editNote,
        deleteNote,
        resetToDefaults,
        pickRandomNote,
    };
}
