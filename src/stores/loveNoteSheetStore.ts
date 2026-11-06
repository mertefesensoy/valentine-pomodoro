import { create } from 'zustand';

/**
 * The love note on its way to the sheet (Phase 1 D1; Classic brief §6). Not persisted.
 *
 * The note is the session engine's (`useTimer` picks it and owns whether it is due); this only
 * carries it to the `/love-note` form-sheet route and reports back when the sheet is gone.
 * - `open(note, from)`: the Timer screen hands the note over, then presents the route. `from` names who wrote it,
 *   for a partner's note (Phase 2 D3), and is absent for your own.
 * - `close()`: the route calls it as it unmounts, whatever closed it (a swipe down or the
 *   Close button), and the Timer screen then marks the note seen (`dismissLoveNote`).
 */
export interface LoveNoteSheetStore {
    note: string | null;
    from: string | null;
    open(note: string, from?: string): void;
    close(): void;
}

export const useLoveNoteSheet = create<LoveNoteSheetStore>()((set) => ({
    note: null,
    from: null,
    open: (note, from) => set({ note, from: from ?? null }),
    close: () => set({ note: null, from: null }),
}));
