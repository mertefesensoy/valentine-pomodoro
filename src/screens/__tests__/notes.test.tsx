import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { DEFAULT_LOVE_NOTES, DEFAULT_LOVE_NOTES_TR } from '../../constants/defaults';
import { useLoveNoteSheet } from '../../stores/loveNoteSheetStore';
import { NOTE_MAX_LENGTH, useNotesStore } from '../../stores/notesStore';
import { StrawberryMilk } from '../../theme/palette';
import LoveNotesScreen from '../LoveNotesScreen';
import { NoteEditor } from '../notes/NoteEditor';

// The native context menu (`Link.Menu`) renders only on iOS inside a navigator; here a link is its
// trigger, and the menu's actions are covered by the VoiceOver custom actions they mirror.
// Every link's props, so a test can see how the rows use it (the real link's native preview view
// renders nothing under Jest).
const mockLinkProps = jest.fn();
jest.mock('expo-router', () => {
    const Link = function MockLink(props: { children: ReactNode }) {
        mockLinkProps(props);
        return props.children;
    };
    Link.Trigger = function MockLinkTrigger({ children }: { children: ReactNode }) {
        return children;
    };
    Link.Menu = function MockLinkMenu() {
        return null;
    };
    Link.MenuAction = function MockLinkMenuAction() {
        return null;
    };
    return {
        ...jest.requireActual('expo-router'),
        Link,
        Stack: { Screen: () => null },
        router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
        useLocalSearchParams: jest.fn(() => ({})),
    };
});

function Providers({ children }: { children: ReactNode }) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{children}</StoreGate>
        </GestureHandlerRootView>
    );
}

async function show(node: React.ReactElement) {
    await render(node, { wrapper: Providers });
    await act(async () => {});
}

async function press(target: Parameters<typeof fireEvent.press>[0]) {
    await act(async () => {
        await fireEvent.press(target);
    });
}

/** The last Alert's buttons; presses the one named. */
async function answer(alert: jest.SpyInstance, text: string) {
    const buttons = alert.mock.calls.at(-1)![2] as { text: string; onPress?: () => void }[];
    await act(async () => buttons.find((b) => b.text === text)!.onPress?.());
}

let alert: jest.SpyInstance;
beforeEach(async () => {
    await resetStorage();
    // The store is module state: start each test from the defaults the empty storage gives.
    useNotesStore.getState().hydrate();
    jest.mocked(router.push).mockClear();
    jest.mocked(router.back).mockClear();
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => alert.mockRestore());

// covers: FR-NTE-002
describe('the default notes (FR-NTE-002)', () => {
    it('are 20 in each language, name-free, and within the cap', () => {
        for (const set of [DEFAULT_LOVE_NOTES, DEFAULT_LOVE_NOTES_TR]) {
            expect(set).toHaveLength(20);
            expect(new Set(set).size).toBe(20);
            for (const note of set) {
                expect(note).not.toMatch(/Bengisu/i);
                expect(note.length).toBeLessThanOrEqual(NOTE_MAX_LENGTH);
            }
        }
    });
});

// covers: FR-NTE-001, NFR-A11Y-004
describe('Love notes (D2 Notes contract)', () => {
    it('shows the title with the count, Preview above the list, and every note in full', async () => {
        await show(<LoveNotesScreen />);
        expect(screen.getByRole('header', { name: 'Love notes' })).toBeOnTheScreen();
        expect(screen.getByText('20 notes')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Preview a note' })).toBeOnTheScreen();
        expect(screen.getByLabelText(DEFAULT_LOVE_NOTES[0])).toBeOnTheScreen();
    });

    // Build 51 device check: the rows rendered as inline text, their paper and padding gone and the
    // swipe's Delete showing through. Expo Router's Link wraps its child in a Text unless it's
    // asChild; with asChild it hands its press to the child, which must be a pressable row.
    it('gives every note link asChild, so each row is a pressable paper block', async () => {
        mockLinkProps.mockClear();
        await show(<LoveNotesScreen />);
        const noteLinks = mockLinkProps.mock.calls.map(([props]) => props).filter((p) => p.href?.pathname === '/note-editor');
        expect(noteLinks.length).toBeGreaterThan(0);
        for (const props of noteLinks) expect(props.asChild).toBe(true);
        const row = screen.getByLabelText(DEFAULT_LOVE_NOTES[0]);
        expect(row).toHaveStyle({ backgroundColor: StrawberryMilk.tokens.paper });
        expect(row.props.onClick ?? row.props.onPress ?? row.props.onResponderRelease).toBeDefined();
    });

    it('previews a random note in the love-note sheet Classic shows', async () => {
        await show(<LoveNotesScreen />);
        await press(screen.getByRole('button', { name: 'Preview a note' }));
        expect(DEFAULT_LOVE_NOTES).toContain(useLoveNoteSheet.getState().note);
        expect(router.push).toHaveBeenCalledWith('/love-note');
    });

    it('opens the editor from Add, and from a note to edit it', async () => {
        await show(<LoveNotesScreen />);
        await press(screen.getByLabelText('Add a note'));
        expect(router.push).toHaveBeenCalledWith('/note-editor');
        const row = screen.getByLabelText(DEFAULT_LOVE_NOTES[2]);
        await act(async () => fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'edit' } }));
        expect(router.push).toHaveBeenCalledWith({ pathname: '/note-editor', params: { index: '2' } });
    });

    it('deletes a note only after asking, from its actions', async () => {
        await show(<LoveNotesScreen />);
        const row = screen.getByLabelText(DEFAULT_LOVE_NOTES[1]);
        await act(async () => fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'delete' } }));
        expect(alert.mock.calls.at(-1)![0]).toBe('Delete this note?');
        expect(useNotesStore.getState().notes).toHaveLength(20);
        await answer(alert, 'Delete');
        expect(useNotesStore.getState().notes).toHaveLength(19);
        expect(useNotesStore.getState().notes).not.toContain(DEFAULT_LOVE_NOTES[1]);
    });

    it('restores missing defaults without removing what someone wrote', async () => {
        await show(<LoveNotesScreen />);
        await act(async () => {
            useNotesStore.getState().addNote('Our own note');
            useNotesStore.getState().deleteNote(1); // the first default, now second
            useNotesStore.getState().deleteNote(1);
        });
        await press(screen.getByRole('button', { name: 'Restore default notes' }));
        expect(alert.mock.calls.at(-1)![1]).toMatch(/Your own notes stay/);
        await answer(alert, 'Restore');
        const { notes } = useNotesStore.getState();
        expect(notes[0]).toBe('Our own note');
        expect(notes).toHaveLength(21);
        expect(screen.getByText('Added 2 notes.')).toBeOnTheScreen();
        await press(screen.getByRole('button', { name: 'Restore default notes' }));
        await answer(alert, 'Restore');
        expect(screen.getByText('All the default notes are already here.')).toBeOnTheScreen();
    });

    it('invites a first note when the list is empty', async () => {
        // An empty stored list hydrates as the defaults (B3), so the list empties in the session.
        await show(<LoveNotesScreen />);
        await act(async () => useNotesStore.setState({ notes: [] }));
        expect(screen.getByText('Add a note for after your next focus')).toBeOnTheScreen();
        expect(screen.getByLabelText('Add a note')).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Preview a note' })).toBeNull();
    });
});

// covers: FR-NTE-001, NFR-A11Y-004
describe('the note editor', () => {
    it('adds a new note on Save and closes', async () => {
        await show(<NoteEditor />);
        expect(screen.getByRole('header', { name: 'New note' })).toBeOnTheScreen();
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), 'For after the exam'));
        await press(screen.getByRole('button', { name: 'Save' }));
        expect(useNotesStore.getState().notes[0]).toBe('For after the exam');
        expect(router.back).toHaveBeenCalled();
    });

    it('edits a note, and deletes it from its own button after asking', async () => {
        jest.mocked(useLocalSearchParams).mockReturnValue({ index: '0' });
        await show(<NoteEditor />);
        expect(screen.getByDisplayValue(DEFAULT_LOVE_NOTES[0])).toBeOnTheScreen();
        await press(screen.getByRole('button', { name: 'Delete note' }));
        await answer(alert, 'Delete');
        expect(useNotesStore.getState().notes).not.toContain(DEFAULT_LOVE_NOTES[0]);
        expect(router.back).toHaveBeenCalled();
    });

    it('stops at 280 characters, and counts down near the cap', async () => {
        await show(<NoteEditor />);
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), 'a'.repeat(300)));
        expect(screen.getByLabelText('New note').props.value).toHaveLength(NOTE_MAX_LENGTH);
        expect(screen.getByText('0 characters left')).toBeOnTheScreen();
    });

    it('keeps a longer legacy note as it is, but never lets it grow', async () => {
        const long = 'b'.repeat(320);
        // The store is hydrated (beforeEach), so the editor renders without the gate, whose
        // hydration would bring back the stored defaults.
        useNotesStore.setState({ notes: [long] });
        jest.mocked(useLocalSearchParams).mockReturnValue({ index: '0' });
        await render(<NoteEditor />);
        expect(screen.getByLabelText('Edit note').props.value).toHaveLength(320);
        expect(screen.getByText(/longer than 280 characters/)).toBeOnTheScreen();
        await act(async () => fireEvent.changeText(screen.getByLabelText('Edit note'), long + 'more'));
        expect(screen.getByLabelText('Edit note').props.value).toHaveLength(320);
    });

    it('asks before throwing away unsaved changes', async () => {
        await show(<NoteEditor />);
        await press(screen.getByRole('button', { name: 'Cancel' }));
        expect(router.back).toHaveBeenCalledTimes(1);
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), 'half a thought'));
        await press(screen.getByRole('button', { name: 'Cancel' }));
        expect(alert.mock.calls.at(-1)![0]).toBe('Discard your changes?');
        expect(router.back).toHaveBeenCalledTimes(1);
        await answer(alert, 'Discard changes');
        expect(router.back).toHaveBeenCalledTimes(2);
    });
});
