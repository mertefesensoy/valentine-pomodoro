// covers: FR-NTE-002, NFR-I18N-001
// The build 56 device check (D3 record §3.8; the owner: "the default notes did not turn into
// turkish"): a default note shows in the app's language, whatever language it was kept in, and
// only the showing changes, never what's stored.
import { DEFAULT_LOVE_NOTES, DEFAULT_LOVE_NOTES_TR, FALLBACK_LOVE_NOTE } from '../../constants/defaults';
import { V131_DEFAULT_LOVE_NOTES } from '../../constants/legacyLoveNotes';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { noteInLanguage, useNotesStore } from '../notesStore';

beforeEach(async () => {
    await resetStorage();
});

describe('a note in the app’s language', () => {
    it('shows an English default in Turkish and a Turkish one in English, every one of them', () => {
        DEFAULT_LOVE_NOTES.forEach((en, i) => {
            expect(noteInLanguage(en, 'tr')).toBe(DEFAULT_LOVE_NOTES_TR[i]);
            expect(noteInLanguage(DEFAULT_LOVE_NOTES_TR[i], 'en')).toBe(en);
            expect(noteInLanguage(en, 'en')).toBe(en);
        });
        expect(noteInLanguage(FALLBACK_LOVE_NOTE, 'tr')).toBe('Minik odak, kocaman sevgi 💗');
    });

    it("counts v1.3.1's notes that are the same sentence, keeping their own punctuation and emoji in English", () => {
        const gentle = 'Gentle focus, strong heart 💗';
        expect(V131_DEFAULT_LOVE_NOTES).toContain(gentle);
        expect(noteInLanguage(gentle, 'en')).toBe(gentle);
        expect(noteInLanguage(gentle, 'tr')).toBe('Sakin odak, güçlü kalp.');
    });

    it("leaves the person's own notes, edited defaults and v1.3.1's notes with no Turkish as they are", () => {
        for (const note of [
            'Bengisu, tiny focus — big love 💗',
            'Small steps, big heart 💘',
            'Sınav haftası, sen yaparsın!',
            `${DEFAULT_LOVE_NOTES[5]} Really.`,
        ]) {
            expect(noteInLanguage(note, 'tr')).toBe(note);
            expect(noteInLanguage(note, 'en')).toBe(note);
        }
    });
});

describe('the notes store, across languages', () => {
    it('picks a note in the app’s language (English here) and stores nothing new', () => {
        useNotesStore.setState({ notes: [DEFAULT_LOVE_NOTES_TR[3]] });
        expect(useNotesStore.getState().pickRandomNote(null)).toBe(DEFAULT_LOVE_NOTES[3]);
        expect(useNotesStore.getState().notes).toEqual([DEFAULT_LOVE_NOTES_TR[3]]);
    });

    it('restores no default the list already keeps in the other language', () => {
        useNotesStore.setState({ notes: [...DEFAULT_LOVE_NOTES_TR] });
        expect(useNotesStore.getState().restoreDefaults()).toBe(0);
        useNotesStore.setState({ notes: DEFAULT_LOVE_NOTES_TR.slice(2) });
        expect(useNotesStore.getState().restoreDefaults()).toBe(2);
        expect(useNotesStore.getState().notes.slice(-2)).toEqual(DEFAULT_LOVE_NOTES.slice(0, 2));
    });
});
