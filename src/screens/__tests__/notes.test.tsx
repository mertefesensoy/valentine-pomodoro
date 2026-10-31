import type { ReactNode } from 'react';
import { AccessibilityInfo, ActionSheetIOS, Alert, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { DEFAULT_LOVE_NOTES, DEFAULT_LOVE_NOTES_TR } from '../../constants/defaults';
import { useLoveNoteSheet } from '../../stores/loveNoteSheetStore';
import { NOTE_MAX_LENGTH, useNotesStore } from '../../stores/notesStore';
import { radius } from '../../theme/layout';
import { StrawberryMilk } from '../../theme/palette';
import LoveNotesScreen from '../LoveNotesScreen';
import { NoteEditor } from '../notes/NoteEditor';

// The native context menu (`Link.Menu`) renders only on iOS inside a navigator; here a link is its
// trigger, and the menu's actions are covered by the VoiceOver custom actions they mirror.
// Every link's props, so a test can see how the rows use it (the real link's native preview view
// renders nothing under Jest). The stand-in renders the trigger as Expo Router does on the
// device: `asChild` hands it through the real Slot (`BaseExpoRouterLink`), and `Link.Trigger`
// renders its child through the Slot again (`elements.js`). The Slot merges styles as
// `{ ...slot, ...child }` and, outside production, throws on an array style, so a row that would
// lose its style in a release build fails here (D2 record §3.12, P0).
const mockLinkProps = jest.fn();
// The editor's prevent-remove hook needs a navigator; its arguments are kept for the tests.
const mockPreventRemove = jest.fn();
jest.mock('expo-router', () => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    const { Slot } = jest.requireActual<{ Slot: React.ComponentType<Record<string, unknown>> }>('expo-router/build/ui/Slot');
    const Link = function MockLink(props: { asChild?: boolean; children: ReactNode }) {
        mockLinkProps(props);
        const trigger = React.Children.toArray(props.children).find(
            (child) => React.isValidElement(child) && child.type === Link.Trigger,
        );
        if (!props.asChild) return React.createElement(Text, null, props.children);
        return React.createElement(Slot, { onPress: () => {} }, trigger ?? props.children);
    };
    Link.Trigger = function MockLinkTrigger(props: { children: ReactNode }) {
        return React.createElement(Slot, props);
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
        usePreventRemove: (...args: unknown[]) => mockPreventRemove(...args),
    };
});

// The swipe renders as its row (jest.setup); here it also renders its actions, hidden from
// VoiceOver as on the device until the row is swiped, so their look can be checked.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { View } = jest.requireActual<typeof import('react-native')>('react-native');
    const MockSwipeable = React.forwardRef(function MockSwipeable(
        props: { children?: ReactNode; renderRightActions?: () => ReactNode },
        ref: import('react').Ref<unknown>,
    ) {
        React.useImperativeHandle(ref, () => ({ close: jest.fn(), openLeft: jest.fn(), openRight: jest.fn(), reset: jest.fn() }));
        return React.createElement(
            React.Fragment,
            null,
            props.children,
            React.createElement(View, { testID: 'swipe-actions', accessibilityElementsHidden: true }, props.renderRightActions?.()),
        );
    });
    return { __esModule: true, default: MockSwipeable };
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

/** The editor's latest prevent-remove call: whether it blocks, and what it does when it does. */
function preventRemove() {
    const [blocking, callback] = mockPreventRemove.mock.calls.at(-1) as [boolean, (e: { repeat: () => void }) => void];
    return { blocking, callback };
}

let alert: jest.SpyInstance;
let sheet: jest.SpyInstance;
beforeEach(async () => {
    await resetStorage();
    // The store is module state: start each test from the defaults the empty storage gives.
    useNotesStore.getState().hydrate();
    jest.mocked(router.push).mockClear();
    jest.mocked(router.back).mockClear();
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});
    mockPreventRemove.mockClear();
});
afterEach(() => {
    alert.mockRestore();
    sheet.mockRestore();
});

/** The last action sheet: its title and options, and a way to pick one. */
function lastSheet() {
    const [options, pick] = sheet.mock.calls.at(-1) as [{ title: string; options: string[] }, (i: number) => void];
    return { ...options, choose: (label: string) => act(async () => pick(options.options.indexOf(label))) };
}

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

    // Review round (D2 record §3.12): Settings' rows tint while pressed, and so do these, from
    // press-in and press-out, since the Slot drops a function style as it drops an array.
    it('tints a row while it is pressed', async () => {
        await show(<LoveNotesScreen />);
        const row = () => screen.getByLabelText(DEFAULT_LOVE_NOTES[0]);
        await act(async () => fireEvent(row(), 'pressIn'));
        expect(row()).toHaveStyle({ backgroundColor: StrawberryMilk.tokens.field });
        await act(async () => fireEvent(row(), 'pressOut'));
        expect(row()).toHaveStyle({ backgroundColor: StrawberryMilk.tokens.paper });
    });

    // Review round: the swipe's Delete took the row's border widths with no colour, which iOS draws
    // black, on the first and last rows. It takes the corners only.
    it("gives the swipe's Delete the row's corners, in danger red, with no border", async () => {
        await show(<LoveNotesScreen />);
        const hidden = { includeHiddenElements: true };
        const actions = screen.getAllByTestId('swipe-actions', hidden);
        const deleteOf = (i: number) => within(actions[i]).getByText('Delete', hidden).parent!;
        const first = StyleSheet.flatten(deleteOf(0).props.style);
        expect(first).toMatchObject({ backgroundColor: StrawberryMilk.tokens.danger, borderTopLeftRadius: radius.m });
        expect(first.borderTopWidth).toBeUndefined();
        expect(StyleSheet.flatten(deleteOf(actions.length - 1).props.style).borderBottomWidth).toBeUndefined();
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
        const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
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
        // iOS has no live regions: the result is announced.
        expect(announce).toHaveBeenCalledWith('Added 2 notes.');
        await press(screen.getByRole('button', { name: 'Restore default notes' }));
        await answer(alert, 'Restore');
        expect(screen.getByText('All the default notes are already here.')).toBeOnTheScreen();
        announce.mockRestore();
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

    it('asks before throwing away unsaved changes, in an action sheet, from Cancel', async () => {
        await show(<NoteEditor />);
        await press(screen.getByRole('button', { name: 'Cancel' }));
        expect(router.back).toHaveBeenCalledTimes(1);
        expect(sheet).not.toHaveBeenCalled();
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), 'half a thought'));
        await press(screen.getByRole('button', { name: 'Cancel' }));
        expect(lastSheet()).toMatchObject({ title: 'Discard your changes?', options: ['Discard changes', 'Keep editing'] });
        expect(router.back).toHaveBeenCalledTimes(1);
        await lastSheet().choose('Keep editing');
        expect(router.back).toHaveBeenCalledTimes(1);
        await press(screen.getByRole('button', { name: 'Cancel' }));
        await lastSheet().choose('Discard changes');
        expect(router.back).toHaveBeenCalledTimes(2);
    });

    // Review round (D2 record §3.12): `gestureEnabled: false` only held the sheet, saying nothing.
    // The prevent-remove hook holds it natively and hands the blocked swipe back to ask.
    it('asks the same question when the edited sheet is swiped down, and only then', async () => {
        await show(<NoteEditor />);
        expect(preventRemove().blocking).toBe(false);
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), 'half a thought'));
        expect(preventRemove().blocking).toBe(true);
        const repeat = jest.fn();
        await act(async () => preventRemove().callback({ repeat }));
        expect(lastSheet().title).toBe('Discard your changes?');
        expect(repeat).not.toHaveBeenCalled();
        await lastSheet().choose('Discard changes');
        expect(repeat).toHaveBeenCalledTimes(1);
    });

    it('lets Save leave without asking, though the sheet still blocks removal until it re-renders', async () => {
        await show(<NoteEditor />);
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), 'For after the exam'));
        const { callback } = preventRemove();
        await press(screen.getByRole('button', { name: 'Save' }));
        const repeat = jest.fn();
        await act(async () => callback({ repeat }));
        expect(repeat).toHaveBeenCalledTimes(1);
        expect(sheet).not.toHaveBeenCalled();
    });

    it('dims a disabled Save in the same ink, and outlines the field as a control', async () => {
        await show(<NoteEditor />);
        const save = within(screen.getByRole('button', { name: 'Save' })).getByText('Save');
        expect(save).toHaveStyle({ color: StrawberryMilk.tokens.primaryInk, opacity: 0.4 });
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), 'For after the exam'));
        expect(within(screen.getByRole('button', { name: 'Save' })).getByText('Save')).not.toHaveStyle({ opacity: 0.4 });
        expect(screen.getByLabelText('New note').parent).toHaveStyle({ borderColor: StrawberryMilk.tokens.edgeStrong });
    });
});
