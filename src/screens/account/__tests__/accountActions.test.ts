// covers: FR-PAR-002, FR-ACC-003, FR-ACC-004
// What the account's rows do (Phase 2 D4), and that nothing local changes until the server says yes.
import { Share } from 'react-native';

import { deleteAccount, downloadMyData, unpairPartner } from '../accountActions';
import { setHasAccount, setSessionEnded, useAccountStore } from '../../../server/account';
import { ensureMigrated } from '../../../utils/storageMigration';
import { usePartnerGlance } from '../../../server/partnerGlance';

const mockFile = { create: jest.fn(), write: jest.fn(), delete: jest.fn(), uri: 'file:///cache/data.json' };
jest.mock('expo-file-system', () => ({
    File: jest.fn(() => mockFile),
    Paths: { cache: 'cache' },
}));

const mockRpc = jest.fn();
const mockInvoke = jest.fn();
const mockClearSession = jest.fn(async () => {});
jest.mock('../../../server/client', () => {
    class Offline extends Error {}
    class SessionEnded extends Error {}
    return {
        Offline,
        SessionEnded,
        rpc: (...args: unknown[]) => mockRpc(...args),
        invoke: (...args: unknown[]) => mockInvoke(...args),
        clearSession: () => mockClearSession(),
    };
});
const mockDeletionCode = jest.fn();
jest.mock('../../../server/appleSignIn', () => ({ requestDeletionCode: () => mockDeletionCode() }));
const mockSetQueryData = jest.fn();
const mockCancel = jest.fn(async () => {});
const mockRefresh = jest.fn(async () => {});
const mockClearHome = jest.fn();
jest.mock('../../../server/home', () => ({
    HOME_KEY: ['home'],
    homeClient: {
        cancelQueries: (...args: unknown[]) => mockCancel(...(args as [])),
        setQueryData: (...args: unknown[]) => mockSetQueryData(...args),
    },
    refreshHome: () => mockRefresh(),
    clearHome: () => mockClearHome(),
}));
jest.mock('../../../server/dayReports', () => ({ PENDING_KEY: 'day_reports_pending_v1' }));

const { Offline, SessionEnded } = jest.requireMock<{ Offline: new () => Error; SessionEnded: new () => Error }>('../../../server/client');

const GLANCE = { coupleId: 'c', name: 'Deniz', today: null, updatedAt: null, fetchedAt: 0 };

beforeEach(() => {
    mockRpc.mockReset();
    mockInvoke.mockReset();
    mockDeletionCode.mockReset();
    mockClearSession.mockReset();
    mockSetQueryData.mockClear();
    mockCancel.mockClear();
    mockRefresh.mockReset();
    mockRefresh.mockResolvedValue(undefined);
    mockClearHome.mockReset();
    Object.values(mockFile).forEach((v) => typeof v === 'function' && (v as jest.Mock).mockClear());
    useAccountStore.setState({ present: true, sessionEnded: false, justDeleted: false });
    usePartnerGlance.setState({ glance: GLANCE, gone: null, notes: [{ id: 'n', body: 'hi' }], shown: ['m'] });
});

describe('unpairPartner', () => {
    it('leaves on the server\'s word, with no "gone" line, since you did it yourself', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        await expect(unpairPartner()).resolves.toBe('ok');
        expect(mockRpc).toHaveBeenCalledWith('unpair');
        expect(usePartnerGlance.getState()).toEqual({ glance: null, gone: null, notes: [], shown: [] });
    });

    it('counts already being unpaired as done', async () => {
        mockRpc.mockResolvedValue({ status: 'not_paired' });
        await expect(unpairPartner()).resolves.toBe('ok');
        expect(usePartnerGlance.getState().glance).toBeNull();
    });

    it('keeps your name in the snapshot, and loses your partner, even if the refresh fails', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        mockRefresh.mockRejectedValue(new Offline());
        await expect(unpairPartner()).resolves.toBe('ok');
        const update = mockSetQueryData.mock.calls[0][1] as (old: object) => object;
        expect(update({ me: { id: 'm' }, couple: { id: 'c' }, partner: { id: 'p' }, partner_today: {}, partner_updated_at: 'x', notes: [{}], invite: null })).toEqual({
            me: { id: 'm' },
            couple: null,
            partner: null,
            partner_today: null,
            partner_updated_at: null,
            notes: [],
            invite: null,
        });
    });

    it.each([
        ['offline', () => new Offline()],
        ['session_ended', () => new SessionEnded()],
        ['failed', () => new Error('500')],
    ])('changes nothing here when %s', async (result, error) => {
        mockRpc.mockRejectedValue(error());
        await expect(unpairPartner()).resolves.toBe(result);
        expect(usePartnerGlance.getState().glance).toEqual(GLANCE);
    });
});

describe('deleteAccount', () => {
    it('asks Apple, then the server at once, with Apple\'s code', async () => {
        mockDeletionCode.mockResolvedValue('code');
        mockInvoke.mockResolvedValue({ status: 'ok' });
        await expect(deleteAccount()).resolves.toBe('ok');
        expect(mockInvoke).toHaveBeenCalledWith('delete-account', { authorization_code: 'code' });
    });

    it('is nothing having happened if the person cancels at Apple\'s sheet', async () => {
        mockDeletionCode.mockResolvedValue(null);
        await expect(deleteAccount()).resolves.toBe('cancelled');
        expect(mockInvoke).not.toHaveBeenCalled();
        expect(useAccountStore.getState().present).toBe(true);
    });

    it('leaves this phone solo, saying so, with everything about the account gone', async () => {
        mockDeletionCode.mockResolvedValue('code');
        mockInvoke.mockResolvedValue({ status: 'ok' });
        await deleteAccount();
        expect(useAccountStore.getState()).toMatchObject({ present: false, sessionEnded: false, justDeleted: true });
        expect(usePartnerGlance.getState()).toEqual({ glance: null, gone: null, notes: [], shown: [] });
        expect(mockClearSession).toHaveBeenCalled();
        expect(mockClearHome).toHaveBeenCalled();
    });

    it('clears the account flag last, because it\'s what flips the screens', async () => {
        const seen: Record<string, boolean> = {};
        mockDeletionCode.mockResolvedValue('code');
        mockInvoke.mockResolvedValue({ status: 'ok' });
        mockClearSession.mockImplementation(async () => {
            seen.keychainWhilePresent = useAccountStore.getState().present;
        });
        mockClearHome.mockImplementation(() => {
            seen.homeWhilePresent = useAccountStore.getState().present;
        });
        await deleteAccount();
        expect(seen).toEqual({ keychainWhilePresent: true, homeWhilePresent: true });
    });

    it('still ends up solo when a step of forgetting fails: the account is already gone', async () => {
        mockDeletionCode.mockResolvedValue('code');
        mockInvoke.mockResolvedValue({ status: 'ok' });
        mockClearSession.mockRejectedValue(new Error('keychain'));
        mockClearHome.mockImplementation(() => {
            throw new Error('cache');
        });
        await expect(deleteAccount()).resolves.toBe('ok');
        expect(useAccountStore.getState().present).toBe(false);
    });

    it.each([
        ['offline', () => new Offline()],
        ['session_ended', () => new SessionEnded()],
        ['failed', () => new Error('502')],
    ])('changes nothing on this phone when the server says %s', async (result, error) => {
        mockDeletionCode.mockResolvedValue('code');
        mockInvoke.mockRejectedValue(error());
        await expect(deleteAccount()).resolves.toBe(result);
        expect(useAccountStore.getState().present).toBe(true);
        expect(usePartnerGlance.getState().glance).toEqual(GLANCE);
        expect(mockClearSession).not.toHaveBeenCalled();
    });

    it('fails plainly if Apple\'s sheet does', async () => {
        mockDeletionCode.mockRejectedValue(new Error('apple'));
        await expect(deleteAccount()).resolves.toBe('failed');
    });
});

describe('downloadMyData', () => {
    it('shares a JSON file, and removes the copy', async () => {
        const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
        mockRpc.mockResolvedValue({ profile: { display_name: 'Ece' } });
        await expect(downloadMyData()).resolves.toBe('ok');
        expect(mockRpc).toHaveBeenCalledWith('export_my_data');
        expect(JSON.parse(mockFile.write.mock.calls[0][0])).toEqual({ profile: { display_name: 'Ece' } });
        expect(share).toHaveBeenCalledWith({ url: mockFile.uri });
        expect(mockFile.delete).toHaveBeenCalled();
        share.mockRestore();
    });

    it('says so when offline, with no file made', async () => {
        mockRpc.mockRejectedValue(new Offline());
        await expect(downloadMyData()).resolves.toBe('offline');
        expect(mockFile.create).not.toHaveBeenCalled();
    });
});

describe('the account flags', () => {
    beforeEach(async () => {
        await ensureMigrated();
    });

    it('a session can\'t end for an account that isn\'t there', () => {
        setHasAccount(false);
        setSessionEnded(true);
        expect(useAccountStore.getState().sessionEnded).toBe(false);
    });

    it('it can for one that is', () => {
        setHasAccount(true);
        setSessionEnded(true);
        expect(useAccountStore.getState().sessionEnded).toBe(true);
    });

    it('losing the account clears it in the same write, for a call that failed as the Keychain emptied', () => {
        setHasAccount(true);
        setSessionEnded(true);
        const states: boolean[] = [];
        const stop = useAccountStore.subscribe((s) => states.push(s.present || s.sessionEnded));
        setHasAccount(false);
        stop();
        expect(states).toEqual([false]);
    });
});
