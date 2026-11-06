/* eslint-disable @typescript-eslint/no-require-imports -- each launch loads the module fresh, as a cold start does */
// covers: FR-PAR-003
// The one server query (Phase 2 C2): the persisted cache is what shows last known values on a cold start
// with no network, and a refused session isn't retried.
import type { HomeSnapshot } from '../types';

const mockLaunchStorage = jest.requireActual('react-native-mmkv').createMMKV();
jest.mock('../../utils/appStorage', () => ({ appStorage: mockLaunchStorage }));

const mockRpc = jest.fn();
jest.mock('../client', () => {
    class SessionEnded extends Error {}
    return { rpc: (...args: unknown[]) => mockRpc(...args), SessionEnded };
});

const snapshot = (sessions: number): HomeSnapshot => ({
    me: { id: 'me', display_name: 'Ece' },
    couple: { id: 'c', paired_at: '2026-11-05T10:00:00Z' },
    partner: { id: 'p', display_name: 'Deniz' },
    partner_today: { day_key: '2026-11-05', focus_ms: 1500000, sessions, goal_hit: false, goal_minutes: 100 },
    partner_updated_at: '2026-11-05T10:00:00Z',
    notes: [],
    invite: null,
});

function launch() {
    jest.resetModules();
    return require('../home') as typeof import('../home');
}

const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 1200));
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 20));

beforeEach(() => {
    mockRpc.mockReset();
    mockLaunchStorage.clearAll();
});

describe('finding out that an account has gone, with the answer lost', () => {
    const mockForget = jest.fn(async () => {});
    beforeEach(() => {
        mockForget.mockClear();
        mockLaunchStorage.set('migration.asyncstorage_v1', 'done');
        mockLaunchStorage.set('account_v1', 'true');
        jest.doMock('../forgetAccount', () => ({ forgetAccount: () => mockForget() }));
    });
    afterEach(() => jest.dontMock('../forgetAccount'));

    it('takes a valid session with no profile as the server\'s word, and no partner is announced gone', async () => {
        const home = launch();
        const { syncGlance, usePartnerGlance } = require('../partnerGlance') as typeof import('../partnerGlance');
        syncGlance(snapshot(1));
        mockRpc.mockResolvedValue({ ...snapshot(1), me: null, couple: null, partner: null });
        await home.fetchHome();
        await flushMicrotasks();
        expect(mockForget).toHaveBeenCalledTimes(1);
        expect(usePartnerGlance.getState().gone).toBeNull();
    });

    it('drops a stale answer: one from a deleted account, landing after a new sign-in, can\'t forget the new one', async () => {
        const home = launch();
        const { clearPartner } = require('../partnerGlance') as typeof import('../partnerGlance');
        let answer: (value: HomeSnapshot) => void = () => {};
        mockRpc.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
        const pending = home.fetchHome();
        clearPartner();
        answer({ ...snapshot(1), me: null, couple: null, partner: null });
        await pending;
        await flushMicrotasks();
        expect(mockForget).not.toHaveBeenCalled();
    });

    it('takes a refused session with the marker up the same way, and still says it was refused', async () => {
        const home = launch();
        const { SessionEnded } = require('../client') as typeof import('../client');
        mockLaunchStorage.set('account_deletion_pending_v1', 'true');
        mockRpc.mockRejectedValue(new SessionEnded());
        await expect(home.fetchHome()).rejects.toBeInstanceOf(SessionEnded);
        await flushMicrotasks();
        expect(mockForget).toHaveBeenCalledTimes(1);
    });

    it('leaves a refused session alone with no marker', async () => {
        const home = launch();
        const { SessionEnded } = require('../client') as typeof import('../client');
        mockRpc.mockRejectedValue(new SessionEnded());
        await expect(home.fetchHome()).rejects.toBeInstanceOf(SessionEnded);
        await flushMicrotasks();
        expect(mockForget).not.toHaveBeenCalled();
    });

    it('clears the marker when a snapshot shows the account is still there, and changes nothing else', async () => {
        const home = launch();
        const account = require('../account') as typeof import('../account');
        mockLaunchStorage.set('account_deletion_pending_v1', 'true');
        mockRpc.mockResolvedValue(snapshot(1));
        await home.fetchHome();
        await flushMicrotasks();
        expect(account.isDeletionPending()).toBe(false);
        expect(mockForget).not.toHaveBeenCalled();
    });
});

describe('a snapshot already on its way when you leave', () => {
    it('can\'t bring your partner back: its answer is from before', async () => {
        const home = launch();
        const { clearPartner, usePartnerGlance } = require('../partnerGlance') as typeof import('../partnerGlance');
        let answer: (value: HomeSnapshot) => void = () => {};
        mockRpc.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
        const pending = home.fetchHome();
        clearPartner();
        answer(snapshot(3));
        await pending;
        expect(usePartnerGlance.getState().glance).toBeNull();
    });

    it('still takes in one that started after', async () => {
        const home = launch();
        const { clearPartner, usePartnerGlance } = require('../partnerGlance') as typeof import('../partnerGlance');
        clearPartner();
        mockRpc.mockResolvedValue(snapshot(3));
        await home.fetchHome();
        expect(usePartnerGlance.getState().glance?.name).toBe('Deniz');
    });
});

describe('the runtime', () => {
    // Someone with an account, on a phone past its storage migration.
    const withAccount = () => {
        mockLaunchStorage.set('migration.asyncstorage_v1', 'done');
        mockLaunchStorage.set('account_v1', 'true');
    };

    it('makes no calls once there\'s no account, which it can\'t stop for by itself', async () => {
        launch();
        const { AppState } = require('react-native');
        const listeners: ((state: string) => void)[] = [];
        jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, fn: (state: string) => void) => {
            listeners.push(fn);
            return { remove: () => {} };
        }) as never);
        const { startPairedRuntime } = require('../runtime') as typeof import('../runtime');
        startPairedRuntime();
        await flushMicrotasks();
        listeners[0]('active');
        await flushMicrotasks();
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('fetches at start and on returning to the foreground, with nothing on screen', async () => {
        withAccount();
        // After the reset: launch() gives react-native a fresh copy, and the runtime uses that one.
        launch();
        const { AppState } = require('react-native');
        const listeners: ((state: string) => void)[] = [];
        jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, fn: (state: string) => void) => {
            listeners.push(fn);
            return { remove: () => {} };
        }) as never);
        mockRpc.mockResolvedValue(snapshot(1));
        const { startPairedRuntime } = require('../runtime') as typeof import('../runtime');

        const homeCalls = () => mockRpc.mock.calls.filter(([name]) => name === 'home_snapshot').length;

        startPairedRuntime();
        await flushMicrotasks();
        expect(homeCalls()).toBe(1);

        listeners[0]('background');
        await flushMicrotasks();
        expect(homeCalls()).toBe(1);

        listeners[0]('active');
        await flushMicrotasks();
        expect(homeCalls()).toBe(2);
    });

    it('starts once per launch', async () => {
        withAccount();
        launch();
        const { AppState } = require('react-native');
        const add = jest.spyOn(AppState, 'addEventListener').mockImplementation((() => ({ remove: () => {} })) as never);
        mockRpc.mockResolvedValue(snapshot(1));
        const { startPairedRuntime } = require('../runtime') as typeof import('../runtime');
        startPairedRuntime();
        startPairedRuntime();
        await flushMicrotasks();
        expect(add).toHaveBeenCalledTimes(1);
    });
});

describe('the home query', () => {
    it('calls home_snapshot once', async () => {
        const home = launch();
        mockRpc.mockResolvedValue(snapshot(1));
        await home.homeRestored;

        await expect(home.homeClient.fetchQuery({ queryKey: home.HOME_KEY, queryFn: home.fetchHome })).resolves.toEqual(snapshot(1));

        expect(mockRpc).toHaveBeenCalledTimes(1);
        expect(mockRpc).toHaveBeenCalledWith('home_snapshot');
    });

    it('shows the last known values on the next cold start, with no network', async () => {
        const first = launch();
        mockRpc.mockResolvedValue(snapshot(3));
        await first.homeRestored;
        await first.homeClient.fetchQuery({ queryKey: first.HOME_KEY, queryFn: first.fetchHome });
        await flushPersist();

        const second = launch();
        mockRpc.mockRejectedValue(new Error('offline'));
        await second.homeRestored;

        expect((second.homeClient.getQueryData(second.HOME_KEY) as HomeSnapshot).partner_today?.sessions).toBe(3);
    });

    it('keeps the cached data when a refresh fails', async () => {
        const home = launch();
        mockRpc.mockResolvedValueOnce(snapshot(3));
        await home.homeRestored;
        await home.homeClient.fetchQuery({ queryKey: home.HOME_KEY, queryFn: home.fetchHome });

        mockRpc.mockRejectedValue(new Error('offline'));
        await home.refreshHome().catch(() => {});

        expect((home.homeClient.getQueryData(home.HOME_KEY) as HomeSnapshot).partner_today?.sessions).toBe(3);
    });

    it('doesn\'t retry a refused session', () => {
        const home = launch();
        const { SessionEnded } = require('../client');
        const retry = home.homeClient.getDefaultOptions().queries?.retry as (n: number, e: Error) => boolean;
        expect(retry(0, new SessionEnded())).toBe(false);
        expect(retry(0, new Error('offline'))).toBe(true);
        expect(retry(1, new Error('offline'))).toBe(false);
    });

    it('forgets it all at unpairing and deletion', async () => {
        const home = launch();
        mockRpc.mockResolvedValue(snapshot(3));
        await home.homeRestored;
        await home.homeClient.fetchQuery({ queryKey: home.HOME_KEY, queryFn: home.fetchHome });
        await flushPersist();
        expect(mockLaunchStorage.getString(home.HOME_CACHE_KEY)).toBeDefined();

        home.clearHome();

        expect(mockLaunchStorage.getString(home.HOME_CACHE_KEY)).toBeUndefined();
        expect(home.homeClient.getQueryData(home.HOME_KEY)).toBeUndefined();
    });
});
