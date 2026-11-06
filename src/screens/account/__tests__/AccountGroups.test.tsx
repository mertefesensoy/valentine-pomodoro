// covers: FR-PAR-002, FR-ACC-003, FR-ACC-004
// The Your partner and Account groups (Phase 2 D4), and where Settings puts them.
import { AccessibilityInfo, Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { AccountGroup, PartnerGroup } from '../AccountGroups';
import { useAccountStore } from '../../../server/account';
import { usePartnerGlance } from '../../../server/partnerGlance';

jest.setTimeout(30_000);

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

let mockHome: unknown = null;
jest.mock('../../../server/home', () => ({ useHome: () => ({ data: mockHome }) }));
const mockUnpair = jest.fn();
const mockDelete = jest.fn();
const mockDownload = jest.fn();
jest.mock('../accountActions', () => ({
    unpairPartner: () => mockUnpair(),
    deleteAccount: (onConfirmed?: () => void) => mockDelete(onConfirmed),
    downloadMyData: () => mockDownload(),
}));
const mockSaveName = jest.fn();
jest.mock('../../pair/pairing', () => ({ saveName: (name: string) => mockSaveName(name) }));

const HOME = {
    me: { id: 'm', display_name: 'Ece' },
    couple: { id: 'c', paired_at: '2026-11-05T10:00:00Z' },
    partner: { id: 'p', display_name: 'Deniz' },
};

let alert: jest.SpyInstance;
let announce: jest.SpyInstance;

/** Presses the alert's destructive button, as a person who has read it would. */
async function confirm() {
    const buttons = alert.mock.calls.at(-1)?.[2] as { style?: string; onPress?: () => void }[];
    await act(async () => buttons.find((b) => b.style === 'destructive')?.onPress?.());
}

beforeEach(async () => {
    mockHome = HOME;
    mockUnpair.mockReset();
    mockDelete.mockReset();
    mockDownload.mockReset();
    mockSaveName.mockReset();
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    await act(async () => {
        useAccountStore.setState({ present: true, sessionEnded: false, notice: null });
        usePartnerGlance.setState({ glance: { coupleId: 'c', name: 'Deniz', today: null, updatedAt: null, fetchedAt: 0 }, gone: null, notes: [], shown: [] });
    });
});

afterEach(() => {
    alert.mockRestore();
    announce.mockRestore();
});

describe('your partner', () => {
    it('names them and when you paired', async () => {
        await render(<PartnerGroup />);
        expect(screen.getByText('Deniz')).toBeOnTheScreen();
        expect(screen.getByText(/^Paired .*5/)).toBeOnTheScreen();
    });

    it('asks first, in an alert naming what happens, and only then unpairs', async () => {
        mockUnpair.mockResolvedValue('ok');
        await render(<PartnerGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Unpair' }));
        expect(mockUnpair).not.toHaveBeenCalled();
        expect(alert.mock.calls[0][0]).toBe('Unpair from Deniz?');
        expect(alert.mock.calls[0][1]).toMatch(/notes between you are deleted. Your own stats stay/);
        await confirm();
        expect(mockUnpair).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/You've unpaired/));
    });

    it('can\'t be pressed twice while it\'s on its way', async () => {
        mockUnpair.mockImplementation(() => new Promise(() => {}));
        await render(<PartnerGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Unpair' }));
        await confirm();
        expect(screen.getByRole('button', { name: 'Unpair' }).props.accessibilityState.disabled).toBe(true);
    });

    it('says what went wrong, aloud too', async () => {
        mockUnpair.mockResolvedValue('offline');
        await render(<PartnerGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Unpair' }));
        await confirm();
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/You're offline/));
    });

    it('doesn\'t offer to unpair once the session has ended, since it could only fail', async () => {
        await act(async () => useAccountStore.setState({ sessionEnded: true }));
        await render(<PartnerGroup />);
        expect(screen.queryByRole('button', { name: 'Unpair' })).toBeNull();
    });
});

describe('your account', () => {
    it('shows your name, how you sign in, your data, and deleting', async () => {
        await render(<AccountGroup />);
        expect(screen.getByText('Ece')).toBeOnTheScreen();
        expect(screen.getByText('Using Sign in with Apple')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Download my data' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Delete account' })).toBeOnTheScreen();
    });

    it('says what goes and what stays before deleting anything', async () => {
        mockDelete.mockResolvedValue('ok');
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
        expect(mockDelete).not.toHaveBeenCalled();
        expect(alert.mock.calls[0][1]).toMatch(/Your timer, stats and notes on this phone stay/);
        await confirm();
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/Your account is deleted/));
    });

    it('says what\'s happening once Apple has said yes, and nothing else can be pressed', async () => {
        mockDelete.mockImplementation((onConfirmed: () => void) => {
            onConfirmed();
            return new Promise(() => {});
        });
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
        await confirm();
        expect(screen.getByText('Deleting your account…')).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith('Deleting your account…');
        expect(screen.getByRole('button', { name: 'Download my data' }).props.accessibilityState.disabled).toBe(true);
        expect(screen.getByRole('button', { name: 'Delete account' }).props.accessibilityState.disabled).toBe(true);
    });

    it('tells someone with no partner only what applies to them', async () => {
        await act(async () => usePartnerGlance.setState({ glance: null }));
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
        expect(alert.mock.calls[0][1]).not.toMatch(/partner/);
    });

    it('says nothing if the person cancels at Apple\'s sheet', async () => {
        mockDelete.mockResolvedValue('cancelled');
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
        await confirm();
        expect(announce).not.toHaveBeenCalled();
        expect(screen.queryByText('Deleting your account…')).toBeNull();
    });

    it.each([
        ['offline', /You're offline/],
        ['failed', /Something went wrong/],
        ['session_ended', /signed out/],
        ['apple_failed', /Couldn't reach Apple/],
    ])('says so, aloud too, when deleting comes back %s', async (result, text) => {
        mockDelete.mockResolvedValue(result);
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
        await confirm();
        expect(screen.getByText(text)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(text));
    });

    it('downloads, and says so if it can\'t', async () => {
        mockDownload.mockResolvedValue('offline');
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Download my data' }));
        expect(mockDownload).toHaveBeenCalled();
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
    });

    it('edits your name with the system\'s prompt, trimmed and capped', async () => {
        const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => {});
        mockSaveName.mockResolvedValue('ok');
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Name' }));
        const buttons = prompt.mock.calls[0][2] as { onPress?: (value?: string) => void }[];
        await act(async () => buttons[1].onPress?.(`  ${'a'.repeat(70)}  `));
        expect(mockSaveName).toHaveBeenCalledWith('a'.repeat(60));
        prompt.mockRestore();
    });

    it('leaves your name alone if the prompt comes back empty', async () => {
        const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => {});
        await render(<AccountGroup />);
        await fireEvent.press(screen.getByRole('button', { name: 'Name' }));
        const buttons = prompt.mock.calls[0][2] as { onPress?: (value?: string) => void }[];
        await act(async () => buttons[1].onPress?.('   '));
        expect(mockSaveName).not.toHaveBeenCalled();
        prompt.mockRestore();
    });

    it('asks for a name when there is none yet', async () => {
        mockHome = { ...HOME, me: { id: 'm', display_name: null } };
        await render(<AccountGroup />);
        expect(screen.getByText('Add your name')).toBeOnTheScreen();
    });

    it('with an ended session, says deleting is on the other side of signing in, and both rows go there', async () => {
        (router.push as jest.Mock).mockClear();
        await act(async () => useAccountStore.setState({ sessionEnded: true }));
        await render(<AccountGroup />);
        expect(screen.queryByRole('button', { name: 'Download my data' })).toBeNull();
        expect(screen.getByText(/or to download or delete your data/)).toBeOnTheScreen();
        const coming = { pathname: '/pair', params: { returning: '1' } };
        await fireEvent.press(screen.getByRole('button', { name: 'Sign in again' }));
        expect(router.push).toHaveBeenLastCalledWith(coming);
        await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
        expect(router.push).toHaveBeenCalledTimes(2);
        expect(router.push).toHaveBeenLastCalledWith(coming);
    });
});
