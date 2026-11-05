// covers: FR-PAR-001, FR-ACC-002
// What the pairing sheet does on the server's functions (Phase 2 D1).
import { cleanCode, ensureCode, newCode, previewCode, redeemCode, saveName, signIn, wasCelebrated, markCelebrated } from '../pairing';

const mockRpc = jest.fn();
const mockSignInWithIdToken = jest.fn(async () => ({ userId: 'u' }));
jest.mock('../../../server/client', () => {
    class Offline extends Error {}
    class SessionEnded extends Error {}
    return {
        Offline,
        SessionEnded,
        rpc: (...a: unknown[]) => mockRpc(...a),
        signInWithIdToken: (...a: unknown[]) => (mockSignInWithIdToken as (...x: unknown[]) => unknown)(...a),
    };
});
const mockRequestSignIn = jest.fn();
jest.mock('../../../server/appleSignIn', () => ({ requestSignIn: () => mockRequestSignIn() }));
const mockSnapshot = { current: null as unknown };
jest.mock('../../../server/home', () => ({
    HOME_KEY: ['home'],
    fetchHome: jest.fn(),
    homeRestored: Promise.resolve(),
    refreshHome: jest.fn(async () => {}),
    homeClient: {
        fetchQuery: jest.fn(async () => mockSnapshot.current),
        getQueryData: jest.fn(() => mockSnapshot.current),
        setQueryData: jest.fn((_key: unknown, update: (old: unknown) => unknown) => {
            mockSnapshot.current = update(mockSnapshot.current);
        }),
    },
}));
jest.mock('../../../server/runtime', () => ({ startPairedRuntime: jest.fn() }));
jest.mock('../../../server/dayReports', () => ({ reportToday: jest.fn(async () => {}) }));

const { Offline, SessionEnded } = jest.requireMock<typeof import('../../../server/client')>('../../../server/client');
const { homeClient, refreshHome } = jest.requireMock<{
    homeClient: { fetchQuery: jest.Mock };
    refreshHome: jest.Mock;
}>('../../../server/home');
const later = () => new Date(Date.now() + 60_000).toISOString();
const earlier = () => new Date(Date.now() - 60_000).toISOString();
const ME = { id: 'm', display_name: 'Ece' };

beforeEach(() => {
    mockRpc.mockReset();
    mockRequestSignIn.mockReset();
    mockSignInWithIdToken.mockClear();
    mockSnapshot.current = null;
});

describe('cleanCode', () => {
    it('makes capitals, whatever the phone\'s language', () => {
        expect(cleanCode('k7mp2q').code).toBe('K7MP2Q');
    });

    it('accepts what people paste: spaces, dashes and a sentence around it', () => {
        expect(cleanCode(' K7M-P2Q ').code).toBe('K7MP2Q');
    });

    it('stops at six', () => {
        expect(cleanCode('K7MP2QXYZ').code).toBe('K7MP2Q');
    });

    it('drops look-alikes, and says so', () => {
        expect(cleanCode('I')).toEqual({ code: '', lookAlike: true });
        expect(cleanCode('L')).toEqual({ code: '', lookAlike: true });
        expect(cleanCode('O')).toEqual({ code: '', lookAlike: true });
        expect(cleanCode('ı').lookAlike).toBe(true);
        expect(cleanCode('İ').lookAlike).toBe(true);
    });

    it('drops 0 and 1, which the alphabet never has', () => {
        expect(cleanCode('A0B1C').code).toBe('ABC');
    });

    it('holds only symbols the database accepts', () => {
        expect(cleanCode('abcdefghjkmnpqrstuvwxyz23456789').code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    });
});

describe('signIn', () => {
    const apple = { identityToken: 't', rawNonce: 'n', firstName: 'Ece' };

    it('saves the first name at once, because Apple sends it only once', async () => {
        mockRequestSignIn.mockResolvedValue(apple);
        mockRpc.mockResolvedValue({ status: 'ok' });
        mockSnapshot.current = { me: { display_name: 'Ece' } };

        await expect(signIn()).resolves.toEqual({ needsName: false });

        expect(mockSignInWithIdToken).toHaveBeenCalledWith({ identityToken: 't', rawNonce: 'n' });
        expect(mockRpc).toHaveBeenCalledWith('set_profile', expect.objectContaining({ p_display_name: 'Ece' }));
    });

    it('asks for a name when Apple sent none and the account has none', async () => {
        mockRequestSignIn.mockResolvedValue({ ...apple, firstName: null });
        mockRpc.mockResolvedValue({ status: 'ok' });
        mockSnapshot.current = { me: { display_name: null } };
        await expect(signIn()).resolves.toEqual({ needsName: true });
    });

    it('needs no name on a later sign-in, when the account already has one', async () => {
        mockRequestSignIn.mockResolvedValue({ ...apple, firstName: null });
        mockRpc.mockResolvedValue({ status: 'ok' });
        mockSnapshot.current = { me: { display_name: 'Ece' } };
        await expect(signIn()).resolves.toEqual({ needsName: false });
    });

    it('counts as signed in once the token is saved: a failure after that isn\'t a failed sign-in', async () => {
        mockRequestSignIn.mockResolvedValue({ identityToken: 't', rawNonce: 'n', firstName: 'Ece' });
        mockRpc.mockRejectedValue(new Offline());
        await expect(signIn()).resolves.toEqual({ needsName: false });
    });

    it('treats a cancel as nothing having happened', async () => {
        mockRequestSignIn.mockResolvedValue(null);
        await expect(signIn()).resolves.toBe('cancelled');
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('says offline when it is', async () => {
        mockRequestSignIn.mockResolvedValue(apple);
        mockSignInWithIdToken.mockRejectedValueOnce(new Offline() as never);
        await expect(signIn()).resolves.toBe('offline');
    });

    it('says failed otherwise, and never throws', async () => {
        mockRequestSignIn.mockRejectedValue(new Error('apple'));
        await expect(signIn()).resolves.toBe('failed');
    });
});

describe('saveName', () => {
    it('reports a refused name', async () => {
        mockRpc.mockResolvedValue({ status: 'invalid' });
        await expect(saveName('x')).resolves.toBe('invalid');
    });
});

describe('ensureCode', () => {
    it('asks the server first, and keeps your open code', async () => {
        mockSnapshot.current = { me: ME, couple: null, invite: { code: 'K7MP2Q', expires_at: later() } };
        await expect(ensureCode()).resolves.toEqual({ code: 'K7MP2Q' });
        expect(homeClient.fetchQuery).toHaveBeenCalled();
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('makes a new one when yours has expired', async () => {
        mockSnapshot.current = { me: ME, couple: null, invite: { code: 'K7MP2Q', expires_at: earlier() } };
        mockRpc.mockResolvedValue({ status: 'ok', code: 'H4TW9B' });
        await expect(ensureCode()).resolves.toEqual({ code: 'H4TW9B' });
    });

    it('makes one when you have none', async () => {
        mockSnapshot.current = { me: ME, couple: null, invite: null };
        mockRpc.mockResolvedValue({ status: 'ok', code: 'H4TW9B' });
        await expect(ensureCode()).resolves.toEqual({ code: 'H4TW9B' });
    });

    it('never makes one when it can\'t tell, since that would cancel a code your partner may hold', async () => {
        homeClient.fetchQuery.mockRejectedValueOnce(new Offline());
        await expect(ensureCode()).resolves.toEqual({ problem: 'offline' });
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('shows the last known code when offline', async () => {
        mockSnapshot.current = { me: ME, couple: null, invite: { code: 'K7MP2Q', expires_at: later() } };
        homeClient.fetchQuery.mockRejectedValueOnce(new Offline());
        await expect(ensureCode()).resolves.toEqual({ code: 'K7MP2Q' });
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('doesn\'t show a last known code that has expired', async () => {
        mockSnapshot.current = { me: ME, couple: null, invite: { code: 'K7MP2Q', expires_at: earlier() } };
        homeClient.fetchQuery.mockRejectedValueOnce(new Offline());
        await expect(ensureCode()).resolves.toEqual({ problem: 'offline' });
    });

    it('makes none for someone with no name, whom a partner couldn\'t recognise', async () => {
        mockSnapshot.current = { me: { id: 'm', display_name: null }, couple: null, invite: null };
        await expect(ensureCode()).resolves.toEqual({ problem: 'no_name' });
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('makes none once there\'s a couple', async () => {
        mockSnapshot.current = { me: ME, couple: { id: 'c' }, invite: null };
        await expect(ensureCode()).resolves.toEqual({ problem: 'already_paired' });
        expect(mockRpc).not.toHaveBeenCalled();
    });
});

describe('saveName, in the cache', () => {
    it('sends the time zone and language again, in case the sign-in that should have sent them didn\'t get through', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        await saveName('Ece');
        expect(mockRpc).toHaveBeenCalledWith('set_profile', expect.objectContaining({
            p_display_name: 'Ece',
            p_tz: expect.any(String),
            p_locale: expect.any(String),
        }));
    });

    it('writes the name at once, so a failed refresh can\'t leave the sheet asking for it', async () => {
        mockSnapshot.current = { me: { id: 'm', display_name: null }, couple: null, invite: null };
        mockRpc.mockResolvedValue({ status: 'ok' });
        refreshHome.mockRejectedValueOnce(new Offline());
        await expect(saveName('Ece')).resolves.toBe('ok');
        expect(mockSnapshot.current).toMatchObject({ me: { display_name: 'Ece' } });
    });
});

describe('newCode', () => {
    it('writes the new code into the cache, so a failed refresh can\'t leave the cancelled one on show', async () => {
        mockSnapshot.current = { me: ME, couple: null, invite: { code: 'K7MP2Q', expires_at: later() } };
        const expires = later();
        mockRpc.mockResolvedValue({ status: 'ok', code: 'H4TW9B', expires_at: expires });
        refreshHome.mockRejectedValueOnce(new Offline());
        await expect(newCode()).resolves.toEqual({ code: 'H4TW9B' });
        expect(mockSnapshot.current).toMatchObject({ invite: { code: 'H4TW9B', expires_at: expires } });
    });
});

describe('previewCode', () => {
    it('says whose code it is', async () => {
        mockRpc.mockResolvedValue({ status: 'ok', inviter_name: 'Deniz' });
        await expect(previewCode('K7MP2Q')).resolves.toEqual({ inviterName: 'Deniz' });
    });

    it.each(['invalid', 'expired', 'used', 'own_code', 'partner_paired', 'rate_limited'])('passes on %s', async (status) => {
        mockRpc.mockResolvedValue({ status });
        await expect(previewCode('K7MP2Q')).resolves.toEqual({ problem: status });
    });

    it('says when the session has ended', async () => {
        mockRpc.mockRejectedValue(new SessionEnded());
        await expect(previewCode('K7MP2Q')).resolves.toEqual({ problem: 'session_ended' });
    });
});

describe('redeemCode', () => {
    it('pairs', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        mockSnapshot.current = { couple: { id: 'c' } };
        await expect(redeemCode('K7MP2Q')).resolves.toBe('ok');
    });

    it('treats already_paired as "see what\'s true": two people can redeem each other\'s codes at once', async () => {
        mockRpc.mockResolvedValue({ status: 'already_paired' });
        mockSnapshot.current = { couple: { id: 'c' } };
        await expect(redeemCode('K7MP2Q')).resolves.toBe('ok');
    });

    it('says when already_paired turns out not to be true', async () => {
        mockRpc.mockResolvedValue({ status: 'already_paired' });
        mockSnapshot.current = { couple: null };
        await expect(redeemCode('K7MP2Q')).resolves.toEqual({ problem: 'failed' });
    });

    it('passes on a problem', async () => {
        mockRpc.mockResolvedValue({ status: 'expired' });
        await expect(redeemCode('K7MP2Q')).resolves.toEqual({ problem: 'expired' });
    });

    it('never throws when offline', async () => {
        mockRpc.mockRejectedValue(new Offline());
        await expect(redeemCode('K7MP2Q')).resolves.toEqual({ problem: 'offline' });
    });
});

describe('the morph plays once per person', () => {
    it('stays played, even for a new couple', () => {
        expect(wasCelebrated()).toBe(false);
        markCelebrated('c1');
        expect(wasCelebrated()).toBe(true);
    });
});
