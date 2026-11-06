// covers: FR-PAR-002, FR-ACC-003, FR-ACC-004
// What the account's rows do (Phase 2 D4), and that nothing local changes until the server says yes.
import { Share } from 'react-native';

import { deleteAccount, downloadMyData, unpairPartner } from '../accountActions';
import { DELETION_PENDING_KEY, isDeletionPending, setDeletionPending, setHasAccount, setSessionEnded, useAccountStore } from '../../../server/account';
import { appStorage } from '../../../utils/appStorage';
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
    homeRestored: Promise.resolve(),
    homeClient: {
        cancelQueries: (...args: unknown[]) => mockCancel(...(args as [])),
        setQueryData: (...args: unknown[]) => mockSetQueryData(...args),
    },
    refreshHome: () => mockRefresh(),
    clearHome: () => mockClearHome(),
}));
jest.mock('../../../server/dayReports', () => ({ PENDING_KEY: 'day_reports_pending_v1' }));
jest.mock('../../../server/timeZone', () => ({ LAST_TZ_KEY: 'profile_tz_v1' }));

const { Offline, SessionEnded } = jest.requireMock<{ Offline: new () => Error; SessionEnded: new () => Error }>('../../../server/client');

const GLANCE = { coupleId: 'c', name: 'Deniz', today: null, updatedAt: null, fetchedAt: 0 };

beforeEach(async () => {
    await ensureMigrated();
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
    useAccountStore.setState({ present: true, sessionEnded: false, notice: null });
    appStorage.remove(DELETION_PENDING_KEY);
    usePartnerGlance.setState({ glance: GLANCE, gone: null, notes: [{ id: 'n', body: 'hi' }], shown: ['m'] });
});

describe('unpairPartner', () => {
    it('leaves on the server\'s word, with no "gone" line, since you did it yourself', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        await expect(unpairPartner()).resolves.toBe('ok');
        expect(mockRpc).toHaveBeenCalledWith('unpair');
        expect(usePartnerGlance.getState()).toEqual({ glance: null, gone: null, notes: [], shown: [] });
        expect(useAccountStore.getState().notice).toBe('unpaired');
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

    it('says it\'s on its way only once Apple has said yes', async () => {
        const onConfirmed = jest.fn();
        mockDeletionCode.mockResolvedValue(null);
        await deleteAccount(onConfirmed);
        expect(onConfirmed).not.toHaveBeenCalled();

        mockDeletionCode.mockResolvedValue('code');
        mockInvoke.mockResolvedValue({ status: 'ok' });
        await deleteAccount(onConfirmed);
        expect(onConfirmed).toHaveBeenCalledTimes(1);
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
        expect(useAccountStore.getState()).toMatchObject({ present: false, sessionEnded: false, notice: 'deleted' });
        expect(isDeletionPending()).toBe(false);
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
        expect(useAccountStore.getState().notice).toBeNull();
    });

    it('says it\'s Apple it couldn\'t reach, if that sheet can\'t run', async () => {
        mockDeletionCode.mockRejectedValue(new Error('apple'));
        await expect(deleteAccount()).resolves.toBe('apple_failed');
    });

    describe('when the answer is lost', () => {
        beforeEach(() => mockDeletionCode.mockResolvedValue('code'));

        it('keeps the marker through a lost answer, and changes nothing visible', async () => {
            mockInvoke.mockRejectedValue(new Offline());
            await expect(deleteAccount()).resolves.toBe('offline');
            expect(isDeletionPending()).toBe(true);
            expect(useAccountStore.getState()).toMatchObject({ present: true, notice: null });
        });

        it('clears it on any answer that says it didn\'t happen', async () => {
            mockInvoke.mockRejectedValue(new Error('502'));
            await expect(deleteAccount()).resolves.toBe('failed');
            expect(isDeletionPending()).toBe(false);
        });

        it('keeps an earlier lost answer open through a later failure', async () => {
            setDeletionPending(true);
            mockInvoke.mockRejectedValue(new Error('500'));
            await expect(deleteAccount()).resolves.toBe('failed');
            expect(isDeletionPending()).toBe(true);
        });

        it('puts the marker back if a snapshot cleared it while the call was on its way', async () => {
            mockInvoke.mockImplementation(async () => {
                setDeletionPending(false);
                throw new Offline();
            });
            await expect(deleteAccount()).resolves.toBe('offline');
            expect(isDeletionPending()).toBe(true);
        });

        it('takes a refused session on a retry to mean it did go through', async () => {
            setDeletionPending(true);
            mockInvoke.mockRejectedValue(new SessionEnded());
            await expect(deleteAccount()).resolves.toBe('ok');
            expect(useAccountStore.getState()).toMatchObject({ present: false, notice: 'deleted' });
        });

        it('doesn\'t on a first try, when a refused session is only that', async () => {
            mockInvoke.mockRejectedValue(new SessionEnded());
            await expect(deleteAccount()).resolves.toBe('session_ended');
            expect(useAccountStore.getState().present).toBe(true);
        });
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
