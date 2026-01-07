import { useState, useEffect, useCallback } from 'react';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import { DEFAULT_LOVE_NOTES, FALLBACK_LOVE_NOTE } from '../constants/defaults';

export function useLoveNotes() {
    const [notes, setNotes] = useState<string[]>(DEFAULT_LOVE_NOTES);

    // Load persisted notes on mount
    useEffect(() => {
        load<string[]>(STORAGE_KEYS.LOVE_NOTES, DEFAULT_LOVE_NOTES).then((loaded) => {
            setNotes(loaded);
        });
    }, []);

    // Persist notes whenever they change
    const persistNotes = useCallback((newNotes: string[]) => {
        setNotes(newNotes);
        save(STORAGE_KEYS.LOVE_NOTES, newNotes);
    }, []);

    // Add a new note
    const addNote = useCallback((note: string) => {
        const trimmed = note.trim();
        if (trimmed.length === 0) return;
        persistNotes([...notes, trimmed]);
    }, [notes, persistNotes]);

    // Edit an existing note
    const editNote = useCallback((index: number, newNote: string) => {
        const trimmed = newNote.trim();
        if (trimmed.length === 0 || index < 0 || index >= notes.length) return;
        const updated = [...notes];
        updated[index] = trimmed;
        persistNotes(updated);
    }, [notes, persistNotes]);

    // Delete a note
    const deleteNote = useCallback((index: number) => {
        if (index < 0 || index >= notes.length) return;
        const updated = notes.filter((_, i) => i !== index);
        persistNotes(updated);
    }, [notes, persistNotes]);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        persistNotes(DEFAULT_LOVE_NOTES);
    }, [persistNotes]);

    // Pick a random note with anti-repeat logic
    const pickRandomNote = useCallback((lastNote: string | null): string => {
        if (notes.length === 0) return FALLBACK_LOVE_NOTE;
        if (notes.length === 1) return notes[0];

        let next = notes[Math.floor(Math.random() * notes.length)];

        // Anti-repeat: if same as last, pick next in sequence
        if (next === lastNote) {
            const lastIndex = notes.indexOf(lastNote);
            next = notes[(lastIndex + 1) % notes.length];
        }

        return next;
    }, [notes]);

    return {
        notes,
        addNote,
        editNote,
        deleteNote,
        resetToDefaults,
        pickRandomNote,
    };
}
