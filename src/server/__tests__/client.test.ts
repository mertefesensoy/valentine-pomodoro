/* eslint-disable @typescript-eslint/no-require-imports -- each launch loads the client fresh, as a cold start does */
// covers: FR-ACC-002
// The small Supabase client (Phase 2 C1, ADR-0050). The refresh rules are what supabase-js would have
// carried, so they're pinned here: one refresh at a time, tokens saved before anyone gets them, a bad
// connection never ends a session, and a real refusal always does.

type Client = typeof import('../client');

const mockKeychain = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock-this-device',
    getItemAsync: jest.fn(async (key: string) => mockKeychain.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void mockKeychain.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void mockKeychain.delete(key)),
}));
jest.mock('expo-constants', () => ({
    __esModule: true,
    default: { expoConfig: { extra: { supabaseUrl: 'https://project.supabase.co', supabasePublishableKey: 'sb_publishable_test' } } },
}));

const mockLaunchStorage = jest.requireActual('react-native-mmkv').createMMKV();
jest.mock('../../utils/appStorage', () => ({ appStorage: mockLaunchStorage }));

const NOW = 1_800_000_000;

type Reply = { status: number; body?: unknown };
let replies: Map<string, Reply[]>;
let calls: { url: string; init: RequestInit }[];

const reply = ({ status, body }: Reply) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body ?? {},
        text: async () => (body === undefined ? '' : JSON.stringify(body)),
    }) as Response;

function when(path: string, ...next: Reply[]) {
    replies.set(path, [...(replies.get(path) ?? []), ...next]);
}

const tokens = (n: number, expiresIn = 3600) => ({
    access_token: `access-${n}`,
    refresh_token: `refresh-${n}`,
    expires_at: NOW + expiresIn,
    user: { id: 'user-1' },
});

/** A cold launch: a fresh client over the same Keychain and storage. */
function launch(): Client {
    jest.resetModules();
    const { appStorage } = require('../../utils/appStorage');
    const { MIGRATION_DONE, MIGRATION_FLAG_KEY } = require('../../utils/storageMigration');
    appStorage.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
    const client = require('../client') as Client;
    // Loading Expo's modules reinstalls the global fetch, so the stand-in goes in after them.
    (globalThis as { fetch?: unknown }).fetch = jest.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        const path = url.replace('https://project.supabase.co', '');
        const queue = replies.get(path);
        const next = queue?.shift();
        if (!next) throw new TypeError('Network request failed');
        return reply(next);
    });
    return client;
}

async function signedIn(expiresIn = 3600): Promise<Client> {
    const client = launch();
    when('/auth/v1/token?grant_type=id_token', { status: 200, body: tokens(1, expiresIn) });
    await client.signInWithIdToken({ identityToken: 'apple-token', rawNonce: 'raw-nonce' });
    calls.length = 0;
    return client;
}

const countOf = (path: string) => calls.filter((c) => c.url.endsWith(path)).length;
const REFRESH = '/auth/v1/token?grant_type=refresh_token';
const HOME = '/rest/v1/rpc/home_snapshot';

beforeEach(() => {
    replies = new Map();
    calls = [];
    mockKeychain.clear();
    mockLaunchStorage.clearAll();
    jest.spyOn(Date, 'now').mockReturnValue(NOW * 1000);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('signing in', () => {
    it('sends Apple\'s token and the raw nonce, keeps the session in the Keychain, and sets the flag', async () => {
        const client = launch();
        when('/auth/v1/token?grant_type=id_token', { status: 200, body: tokens(1) });

        await expect(client.signInWithIdToken({ identityToken: 'apple-token', rawNonce: 'raw-nonce' })).resolves.toEqual({ userId: 'user-1' });

        expect(JSON.parse(calls[0].init.body as string)).toEqual({ provider: 'apple', id_token: 'apple-token', nonce: 'raw-nonce' });
        expect(mockKeychain.get('vp.auth.refresh')).toBe('refresh-1');
        expect(require('../account').hasAccount()).toBe(true);
    });

    it('keeps no token in plain storage', async () => {
        await signedIn();
        for (const key of mockLaunchStorage.getAllKeys()) {
            expect(mockLaunchStorage.getString(key) ?? '').not.toContain('access-1');
            expect(mockLaunchStorage.getString(key) ?? '').not.toContain('refresh-1');
        }
    });

    it('asks the Keychain for this device only, so a restored backup doesn\'t bring a session', async () => {
        await signedIn();
        const { setItemAsync } = require('expo-secure-store');
        for (const call of setItemAsync.mock.calls) {
            expect(call[2]).toEqual({ keychainAccessible: 'after-first-unlock-this-device' });
        }
    });

    it('reports a refused sign-in, and stays solo', async () => {
        const client = launch();
        when('/auth/v1/token?grant_type=id_token', { status: 400, body: { error_code: 'bad_jwt' } });
        await expect(client.signInWithIdToken({ identityToken: 'x', rawNonce: 'y' })).rejects.toMatchObject({ name: 'ServerError', status: 400, code: 'bad_jwt' });
        expect(require('../account').hasAccount()).toBe(false);
    });
});

describe('calling a function', () => {
    it('sends the publishable key on apikey, and the person\'s token on Authorization', async () => {
        const client = await signedIn();
        when(HOME, { status: 200, body: { me: { id: 'user-1' } } });

        await expect(client.rpc('home_snapshot')).resolves.toEqual({ me: { id: 'user-1' } });

        expect(calls[0].init.headers).toMatchObject({ apikey: 'sb_publishable_test', authorization: 'Bearer access-1' });
    });

    it('resolves to null for a function that returns nothing', async () => {
        const client = await signedIn();
        when('/rest/v1/rpc/x', { status: 204 });
        await expect(client.rpc('x')).resolves.toBeNull();
    });

    it('calls an Edge Function at its own path', async () => {
        const client = await signedIn();
        when('/functions/v1/delete-account', { status: 200, body: { status: 'ok' } });
        await expect(client.invoke('delete-account', { authorization_code: 'c' })).resolves.toEqual({ status: 'ok' });
    });

    it('restores the session from the Keychain after a cold start', async () => {
        await signedIn();
        const fresh = launch();
        when(HOME, { status: 200, body: {} });
        await fresh.rpc('home_snapshot');
        expect(calls[0].init.headers).toMatchObject({ authorization: 'Bearer access-1' });
    });

    it('ends in SessionEnded with no session at all', async () => {
        const client = launch();
        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'SessionEnded' });
        expect(calls).toHaveLength(0);
    });
});

describe('refreshing', () => {
    it('refreshes first when under a minute is left', async () => {
        const client = await signedIn(59);
        when(REFRESH, { status: 200, body: tokens(2) });
        when(HOME, { status: 200, body: {} });

        await client.rpc('home_snapshot');

        expect(JSON.parse(calls[0].init.body as string)).toEqual({ refresh_token: 'refresh-1' });
        expect(calls[1].init.headers).toMatchObject({ authorization: 'Bearer access-2' });
    });

    it('doesn\'t refresh a token with time left', async () => {
        const client = await signedIn(61);
        when(HOME, { status: 200, body: {} });
        await client.rpc('home_snapshot');
        expect(countOf(REFRESH)).toBe(0);
    });

    it('runs one refresh for several calls at once', async () => {
        const client = await signedIn(1);
        when(REFRESH, { status: 200, body: tokens(2) });
        when(HOME, { status: 200, body: {} }, { status: 200, body: {} }, { status: 200, body: {} });

        await Promise.all([client.rpc('home_snapshot'), client.rpc('home_snapshot'), client.rpc('home_snapshot')]);

        expect(countOf(REFRESH)).toBe(1);
        expect(countOf(HOME)).toBe(3);
    });

    it('saves the new tokens before any call uses them', async () => {
        const client = await signedIn(1);
        when(REFRESH, { status: 200, body: tokens(2) });
        let refreshInKeychainAtCall: string | undefined;
        replies.set(HOME, []);
        const fetchMock = globalThis.fetch as jest.Mock;
        const original = fetchMock.getMockImplementation()!;
        fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
            if (url.endsWith(HOME)) {
                refreshInKeychainAtCall = mockKeychain.get('vp.auth.refresh');
                return reply({ status: 200, body: {} });
            }
            return original(url, init);
        });

        await client.rpc('home_snapshot');

        expect(refreshInKeychainAtCall).toBe('refresh-2');
    });

    it('on a 401, refreshes once and retries once', async () => {
        const client = await signedIn();
        when(HOME, { status: 401 }, { status: 200, body: { ok: true } });
        when(REFRESH, { status: 200, body: tokens(2) });

        await expect(client.rpc('home_snapshot')).resolves.toEqual({ ok: true });

        expect(countOf(REFRESH)).toBe(1);
        expect(calls.at(-1)!.init.headers).toMatchObject({ authorization: 'Bearer access-2' });
    });

    it('two calls that both get a 401 share one refresh', async () => {
        const client = await signedIn();
        when(HOME, { status: 401 }, { status: 401 }, { status: 200, body: {} }, { status: 200, body: {} });
        when(REFRESH, { status: 200, body: tokens(2) });

        await Promise.all([client.rpc('home_snapshot'), client.rpc('home_snapshot')]);

        expect(countOf(REFRESH)).toBe(1);
    });

    it('a second 401 ends the session rather than looping', async () => {
        const client = await signedIn();
        when(HOME, { status: 401 }, { status: 401 });
        when(REFRESH, { status: 200, body: tokens(2) });

        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'SessionEnded' });

        expect(countOf(HOME)).toBe(2);
        expect(mockKeychain.size).toBe(0);
    });

    it.each([400, 401, 403])('a refresh refused with %i ends the session and clears the Keychain', async (status) => {
        const client = await signedIn(1);
        when(REFRESH, { status, body: { error_code: 'refresh_token_not_found' } });

        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'SessionEnded' });

        expect(mockKeychain.size).toBe(0);
    });

    it('a refused session keeps the account flag, so the app can offer signing in again', async () => {
        const client = await signedIn(1);
        when(REFRESH, { status: 400 });
        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'SessionEnded' });
        expect(require('../account').hasAccount()).toBe(true);
    });
});

describe('a bad connection never ends a session', () => {
    it('a call that can\'t reach the server is Offline, and the session stays', async () => {
        const client = await signedIn();
        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'Offline' });
        expect(mockKeychain.get('vp.auth.refresh')).toBe('refresh-1');
    });

    it('a refresh that can\'t reach the server is Offline, and the session stays', async () => {
        const client = await signedIn(1);
        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'Offline' });
        expect(mockKeychain.get('vp.auth.refresh')).toBe('refresh-1');
    });

    it.each([429, 500, 503])('a refresh answered with %i is a ServerError, and the session stays', async (status) => {
        const client = await signedIn(1);
        when(REFRESH, { status });
        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'ServerError', status });
        expect(mockKeychain.get('vp.auth.refresh')).toBe('refresh-1');
    });

    it('it recovers on the next call, once the failed refresh has finished', async () => {
        const client = await signedIn(1);
        await expect(client.rpc('home_snapshot')).rejects.toMatchObject({ name: 'Offline' });
        when(REFRESH, { status: 200, body: tokens(2) });
        when(HOME, { status: 200, body: {} });
        await expect(client.rpc('home_snapshot')).resolves.toEqual({});
    });
});

describe('clearing the session', () => {
    it('forgets it on this phone', async () => {
        const client = await signedIn();
        await client.clearSession();
        expect(mockKeychain.size).toBe(0);
        await expect(client.currentUserId()).resolves.toBeNull();
    });
});
