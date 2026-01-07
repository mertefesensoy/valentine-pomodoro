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

    const persist = useCallback(async (next: string[]) => {
        setNotes(next);
        await save(STORAGE_KEYS.LOVE_NOTES, next);
    }, []);

    const addNote = useCallback(
        async (text: string) => {
            const v = normalizeNote(text);
            if (!v) return;
            // Prevent exact duplicates
            const exists = notes.some((n) => n === v);
            const next = exists ? notes : [v, ...notes];
            await persist(next);
        },
        [notes, persist]
    );

    const editNote = useCallback(
        async (index: number, text: string) => {
            const v = normalizeNote(text);
            if (!v) return;
            if (index < 0 || index >= notes.length) return;
            const next = [...notes];
            next[index] = v;
            await persist(next);
        },
        [notes, persist]
    );

    const deleteNote = useCallback(
        async (index: number) => {
            if (index < 0 || index >= notes.length) return;
            const next = notes.filter((_, i) => i !== index);
            await persist(next.length > 0 ? next : []); // Allow empty
        },
        [notes, persist]
    );

    const resetToDefaults = useCallback(async () => {
        await persist(DEFAULT_LOVE_NOTES);
    }, [persist]);

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

    const count = useMemo(() => notes.length, [notes.length]);

    return {
        notes,
        count,
        isReady,
        addNote,
        editNote,
        deleteNote,
        resetToDefaults,
        pickRandomNote,
    };
}
