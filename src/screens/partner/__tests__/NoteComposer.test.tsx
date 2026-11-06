// covers: FR-NTE-003
// Writing a note to your partner, in place in their sheet (Phase 2 D3).
import { AccessibilityInfo, ActionSheetIOS } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { router } from 'expo-router';

import { useAccountStore } from '../../../server/account';
import { usePartnerGlance, type PartnerGlance } from '../../../server/partnerGlance';
import { useLoveNoteSheet } from '../../../stores/loveNoteSheetStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import PartnerScreen from '../PartnerScreen';

jest.setTimeout(30_000);

const mockPreventRemove = jest.fn();
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
    usePreventRemove: (...args: unknown[]) => mockPreventRemove(...args),
}));
let mockIds = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `client-${(mockIds += 1)}` }));
const mockRpc = jest.fn();
const mockRefresh = jest.fn(async () => {});
jest.mock('../../../server/client', () => {
    class Offline extends Error {}
    class SessionEnded extends Error {}
    return { Offline, SessionEnded, rpc: (...args: unknown[]) => mockRpc(...args) };
});
jest.mock('../../../server/home', () => ({ refreshHome: () => mockRefresh() }));
const FIELD = 'Your note to Deniz';
const glance: PartnerGlance = {
    coupleId: 'c',
    name: 'Deniz',
    today: null,
    updatedAt: null,
    fetchedAt: Date.now(),
};

const flush = () => act(async () => {
    await Promise.resolve();
});

async function open() {
    await act(async () => usePartnerGlance.setState({ glance, gone: null, notes: [], shown: [] }));
    await render(<PartnerScreen />);
    await flush();
}

async function startWriting(text?: string) {
    await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Write Deniz a note' }));
    if (text) await fireEvent.changeText(screen.getByLabelText(FIELD), text);
}

let announce: jest.SpyInstance;

beforeEach(() => {
    mockIds = 0;
    mockRpc.mockReset();
    mockRefresh.mockClear();
    mockPreventRemove.mockClear();
    announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
    announce.mockRestore();
});

describe('in their sheet', () => {
    it('offers it under their day, saying when it\'ll appear', async () => {
        await open();
        expect(screen.getByRole('button', { name: 'Write Deniz a note' })).toBeOnTheScreen();
        expect(screen.getByText('It appears after their next focus.')).toBeOnTheScreen();
    });

    it('swaps to the editor in place, under their name, and back', async () => {
        await startWriting();
        expect(screen.getByRole('header', { name: 'Deniz' })).toBeOnTheScreen();
        expect(screen.getByLabelText(FIELD)).toBeOnTheScreen();
        expect(screen.queryByText('Nothing yet today')).toBeNull();

        await fireEvent.press(screen.getByText('Cancel'));
        await flush();
        expect(screen.getByText('Nothing yet today')).toBeOnTheScreen();
    });
});

describe('a note waiting, with Show love notes off', () => {
    const replace = router.replace as jest.Mock;
    beforeEach(() => replace.mockClear());
    afterEach(async () => {
        await act(async () => {
            useSettingsStore.getState().updateSettings({ showLoveNotes: true });
            useLoveNoteSheet.getState().close();
        });
    });

    async function openWithANote(showLoveNotes: boolean) {
        await act(async () => useSettingsStore.getState().updateSettings({ showLoveNotes }));
        await act(async () => usePartnerGlance.setState({ glance, gone: null, notes: [{ id: 'n', body: 'Good luck' }], shown: [] }));
        await render(<PartnerScreen />);
        await flush();
    }

    it('is a row above Write, as the frame draws it', async () => {
        await openWithANote(false);
        const buttons = screen.getAllByRole('button');
        const waiting = buttons.indexOf(screen.getByRole('button', { name: 'A note from Deniz is waiting' }));
        const write = buttons.indexOf(screen.getByRole('button', { name: 'Write Deniz a note' }));
        expect(waiting).toBeGreaterThan(-1);
        expect(write).toBe(waiting + 1);
    });

    it('closes this sheet for the note\'s, once, so there\'s one sheet at a time', async () => {
        await openWithANote(false);
        await fireEvent.press(screen.getByRole('button', { name: 'A note from Deniz is waiting' }));
        expect(replace).toHaveBeenCalledWith('/love-note');
        expect(useLoveNoteSheet.getState()).toMatchObject({ note: 'Good luck', from: 'Deniz' });
        expect(usePartnerGlance.getState().notes).toEqual([]);
        expect(screen.queryByRole('button', { name: 'A note from Deniz is waiting' })).toBeNull();
    });

    it('can\'t lose one to a double tap, with two waiting', async () => {
        await act(async () => useSettingsStore.getState().updateSettings({ showLoveNotes: false }));
        await act(async () => usePartnerGlance.setState({
            glance,
            gone: null,
            notes: [{ id: 'a', body: 'First' }, { id: 'b', body: 'Second' }],
            shown: [],
        }));
        await render(<PartnerScreen />);
        await flush();
        const row = screen.getByRole('button', { name: 'A note from Deniz is waiting' });
        await fireEvent.press(row);
        await fireEvent.press(row);
        expect(useLoveNoteSheet.getState().note).toBe('First');
        expect(usePartnerGlance.getState().notes).toEqual([{ id: 'b', body: 'Second' }]);
        expect(replace).toHaveBeenCalledTimes(1);
    });

    it('isn\'t offered with notes on: it\'s for after a focus', async () => {
        await openWithANote(true);
        expect(screen.queryByRole('button', { name: 'A note from Deniz is waiting' })).toBeNull();
    });
});

describe('with a session that has ended', () => {
    afterEach(async () => {
        await act(async () => useAccountStore.setState({ sessionEnded: false }));
    });

    it('doesn\'t offer to write, since it could only fail', async () => {
        await act(async () => useAccountStore.setState({ sessionEnded: true }));
        await open();
        expect(screen.queryByRole('button', { name: 'Write Deniz a note' })).toBeNull();
        expect(screen.queryByText('It appears after their next focus.')).toBeNull();
    });

    it('draws no empty group, with nothing to offer', async () => {
        await act(async () => useAccountStore.setState({ sessionEnded: true }));
        await open();
        expect(screen.queryAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Close']);
    });

    it('says to sign in if it ends while writing, keeping the text', async () => {
        const { SessionEnded } = jest.requireMock<{ SessionEnded: new () => Error }>('../../../server/client');
        mockRpc.mockRejectedValue(new SessionEnded());
        await startWriting('Good luck');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(screen.getByText(/Sign in again from the Timer/)).toBeOnTheScreen();
        expect(screen.getByLabelText(FIELD).props.value).toBe('Good luck');
    });
});

describe('sending', () => {
    it('sends what was written, trimmed, and says aloud when it\'ll appear', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        await startWriting('  Good luck today  ');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(mockRpc).toHaveBeenCalledWith('send_note', { p_client_id: 'client-1', p_body: 'Good luck today' });
        expect(screen.getByText("Sent. It appears after Deniz's next focus.")).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith("Sent. It appears after Deniz's next focus.");
        expect(screen.queryByLabelText(FIELD)).toBeNull();
    });

    it('gets a new id when the words change after a failed try: a known id would keep the old words', async () => {
        const { Offline } = jest.requireMock<{ Offline: new () => Error }>('../../../server/client');
        mockRpc.mockRejectedValueOnce(new Offline());
        mockRpc.mockResolvedValueOnce({ status: 'ok' });
        await startWriting('Good lcuk');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        await fireEvent.changeText(screen.getByLabelText(FIELD), 'Good luck');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(mockRpc.mock.calls[0][1].p_client_id).not.toBe(mockRpc.mock.calls[1][1].p_client_id);
        expect(mockRpc.mock.calls[1][1].p_body).toBe('Good luck');
    });

    it('can\'t be discarded on its way, since that couldn\'t be honoured', async () => {
        const sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});
        mockRpc.mockImplementation(() => new Promise(() => {}));
        await startWriting('Good luck');
        const send = screen.getByRole('button', { name: 'Send' });
        // fireEvent would wait for the handler, which this test holds open.
        await act(async () => {
            void fireEvent.press(send);
        });
        await fireEvent.press(screen.getByText('Cancel'));
        expect(sheet).not.toHaveBeenCalled();
        mockPreventRemove.mock.calls.at(-1)?.[1]({ repeat: jest.fn() });
        expect(sheet).not.toHaveBeenCalled();
        sheet.mockRestore();
    });

    it('doesn\'t send nothing', async () => {
        await startWriting('   ');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('keeps the text when offline, says so, and a retry can\'t send twice', async () => {
        const { Offline } = jest.requireMock<{ Offline: new () => Error }>('../../../server/client');
        mockRpc.mockRejectedValueOnce(new Offline());
        mockRpc.mockResolvedValueOnce({ status: 'ok' });
        await startWriting('Good luck');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/You're offline/));
        expect(screen.getByLabelText(FIELD).props.value).toBe('Good luck');

        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(mockRpc.mock.calls[0][1]).toEqual(mockRpc.mock.calls[1][1]);
        expect(screen.getByText(/Sent\./)).toBeOnTheScreen();
    });

    it('says so when there have been too many today, keeping the text', async () => {
        mockRpc.mockResolvedValue({ status: 'rate_limited' });
        await startWriting('One more');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(screen.getByText(/a lot of notes for today/)).toBeOnTheScreen();
        expect(screen.getByLabelText(FIELD).props.value).toBe('One more');
    });

    it('asks to try again after anything else, keeping the text', async () => {
        mockRpc.mockRejectedValue(new Error('500'));
        await startWriting('One more');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(screen.getByText('Something went wrong. Try again.')).toBeOnTheScreen();
        expect(screen.getByLabelText(FIELD).props.value).toBe('One more');
    });

    it('refreshes when the server says you\'re no longer paired, which is how the strip finds out', async () => {
        mockRpc.mockResolvedValue({ status: 'not_paired' });
        await startWriting('Hello?');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(mockRefresh).toHaveBeenCalled();
    });

    it('a new note gets a new id', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        await startWriting('First');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        await fireEvent.press(screen.getByRole('button', { name: 'Write Deniz a note' }));
        await fireEvent.changeText(screen.getByLabelText(FIELD), 'Second');
        await fireEvent.press(screen.getByText('Send'));
        await flush();
        expect(mockRpc.mock.calls[0][1].p_client_id).not.toBe(mockRpc.mock.calls[1][1].p_client_id);
    });
});

describe('the limit', () => {
    it('stops at 280, and counts down from 30, aloud at its marks only', async () => {
        await startWriting('a'.repeat(249));
        expect(screen.queryByText(/left/)).toBeNull();

        await fireEvent.changeText(screen.getByLabelText(FIELD), 'a'.repeat(250));
        expect(screen.getByText(/30/)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledTimes(1);

        await fireEvent.changeText(screen.getByLabelText(FIELD), 'a'.repeat(300));
        expect(screen.getByLabelText(FIELD).props.value).toHaveLength(280);
    });
});

describe('a swipe with text in it', () => {
    const blocking = () => mockPreventRemove.mock.calls.at(-1)?.[0];

    it('leaves freely with nothing written', async () => {
        await startWriting();
        expect(blocking()).toBe(false);
    });

    it('asks first once something is written', async () => {
        const sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});
        await startWriting('Half a thought');
        expect(blocking()).toBe(true);

        mockPreventRemove.mock.calls.at(-1)?.[1]({ repeat: jest.fn() });
        expect(sheet).toHaveBeenCalled();
        sheet.mockRestore();
    });

    it('asks too on Cancel, and goes back only on a yes', async () => {
        const sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});
        await startWriting('Half a thought');
        await fireEvent.press(screen.getByText('Cancel'));
        expect(screen.getByLabelText(FIELD)).toBeOnTheScreen();

        const choose = sheet.mock.calls[0][1] as (index: number) => void;
        await act(async () => choose(0));
        expect(screen.queryByLabelText(FIELD)).toBeNull();
        sheet.mockRestore();
    });
});
