import * as SecureStore from 'expo-secure-store';
import { setHasAccount } from './account';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

/**
 * The small Supabase client (Phase 2 C1, ADR-0050), in place of supabase-js: sign-in, one token refresh
 * at a time, and calls to database functions and Edge Functions. Reached only through import(), so a
 * solo launch never evaluates this module or reads the Keychain (account.ts).
 *
 * The rules for a token are in the C1 record, §3. The two that matter most: only one refresh is ever in
 * flight, because Supabase rotates refresh tokens and treats a reused one as theft; and a bad connection
 * never ends a session, only a real refusal does.
 */

/** The network failed. The session is untouched. */
export class Offline extends Error {
    constructor() {
        super('offline');
        this.name = 'Offline';
    }
}

/** The server refused the session. The person signs in again; their data is safe on the server. */
export class SessionEnded extends Error {
    constructor() {
        super('session ended');
        this.name = 'SessionEnded';
    }
}

/** Any other failed response. The session is untouched. */
export class ServerError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string | null,
    ) {
        super(`server error ${status}${code ? ` (${code})` : ''}`);
        this.name = 'ServerError';
    }
}

type Session = { accessToken: string; refreshToken: string; expiresAt: number; userId: string };

/** A token within this many seconds of expiry is refreshed first: it covers the call's own time and clock drift. */
const EXPIRY_MARGIN_S = 60;

const KEYS = {
    access: 'vp.auth.access',
    refresh: 'vp.auth.refresh',
    expires: 'vp.auth.expires',
    user: 'vp.auth.user',
} as const;

// Separate items, because expo-secure-store warns over 2,048 bytes and an access token alone can come
// close. Device-only, so a restored backup on a new phone doesn't bring a session with it.
const KEYCHAIN = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

let session: Session | null = null;
let sessionRead = false;
let refreshing: Promise<Session> | null = null;

async function readSession(): Promise<Session | null> {
    if (sessionRead) return session;
    const [accessToken, refreshToken, expires, userId] = await Promise.all([
        SecureStore.getItemAsync(KEYS.access, KEYCHAIN),
        SecureStore.getItemAsync(KEYS.refresh, KEYCHAIN),
        SecureStore.getItemAsync(KEYS.expires, KEYCHAIN),
        SecureStore.getItemAsync(KEYS.user, KEYCHAIN),
    ]);
    // A partial write reads as no session: signing in again is always safe.
    session = accessToken && refreshToken && expires && userId
        ? { accessToken, refreshToken, expiresAt: Number(expires), userId }
        : null;
    sessionRead = true;
    return session;
}

async function saveSession(next: Session): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(KEYS.access, next.accessToken, KEYCHAIN),
        SecureStore.setItemAsync(KEYS.refresh, next.refreshToken, KEYCHAIN),
        SecureStore.setItemAsync(KEYS.expires, String(next.expiresAt), KEYCHAIN),
        SecureStore.setItemAsync(KEYS.user, next.userId, KEYCHAIN),
    ]);
    session = next;
    sessionRead = true;
}

/** Forgets the session on this phone. After a deletion, or when the server has refused it. */
export async function clearSession(): Promise<void> {
    session = null;
    sessionRead = true;
    await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key, KEYCHAIN)));
}

async function send(path: string, init: { method?: string; headers?: Record<string, string>; body?: unknown }): Promise<Response> {
    try {
        return await fetch(`${SUPABASE_URL}${path}`, {
            method: init.method ?? 'POST',
            headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json', ...init.headers },
            body: init.body === undefined ? undefined : JSON.stringify(init.body),
        });
    } catch {
        throw new Offline();
    }
}

/** A failed response's error code, whichever of Auth's and PostgREST's shapes it has. */
async function errorCode(response: Response): Promise<string | null> {
    try {
        const body = (await response.json()) as { error_code?: string; code?: string };
        return body.error_code ?? body.code ?? null;
    } catch {
        return null;
    }
}

async function parseSession(response: Response): Promise<Session> {
    const body = (await response.json()) as {
        access_token: string;
        refresh_token: string;
        expires_at?: number;
        expires_in?: number;
        user: { id: string };
    };
    return {
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        expiresAt: body.expires_at ?? Math.floor(Date.now() / 1000) + (body.expires_in ?? 3600),
        userId: body.user.id,
    };
}

/**
 * Signs in with Apple's identity token, and saves the session. The raw nonce goes here; Apple got its
 * SHA-256 (appleSignIn.ts). Throws ServerError if refused, or Offline.
 */
export async function signInWithIdToken(input: { identityToken: string; rawNonce: string }): Promise<{ userId: string }> {
    const response = await send('/auth/v1/token?grant_type=id_token', {
        body: { provider: 'apple', id_token: input.identityToken, nonce: input.rawNonce },
    });
    if (!response.ok) throw new ServerError(response.status, await errorCode(response));
    const next = await parseSession(response);
    await saveSession(next);
    setHasAccount(true);
    return { userId: next.userId };
}

async function runRefresh(current: Session): Promise<Session> {
    const response = await send('/auth/v1/token?grant_type=refresh_token', {
        body: { refresh_token: current.refreshToken },
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
        await clearSession();
        throw new SessionEnded();
    }
    if (!response.ok) throw new ServerError(response.status, await errorCode(response));
    const next = await parseSession(response);
    // Saved before anyone receives it, so nothing can use a token the Keychain doesn't hold.
    await saveSession(next);
    return next;
}

/** One refresh at a time: every caller waits on the same one. */
function refresh(current: Session): Promise<Session> {
    if (!refreshing) {
        refreshing = runRefresh(current).finally(() => {
            refreshing = null;
        });
    }
    return refreshing;
}

async function validSession(): Promise<Session> {
    const current = await readSession();
    if (!current) throw new SessionEnded();
    if (refreshing) return refreshing;
    if (Date.now() / 1000 >= current.expiresAt - EXPIRY_MARGIN_S) return refresh(current);
    return current;
}

async function authorized(path: string, body: unknown, retried = false): Promise<unknown> {
    const current = await validSession();
    const response = await send(path, { body, headers: { authorization: `Bearer ${current.accessToken}` } });
    if (response.status === 401 && !retried) {
        // If another call has already replaced this token, use the new one instead of refreshing again.
        if (session && session.accessToken === current.accessToken) await refresh(session);
        return authorized(path, body, true);
    }
    if (response.status === 401) {
        await clearSession();
        throw new SessionEnded();
    }
    if (!response.ok) throw new ServerError(response.status, await errorCode(response));
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

/** Calls a database function. Throws Offline, SessionEnded or ServerError. */
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    return (await authorized(`/rest/v1/rpc/${name}`, args)) as T;
}

/** Calls an Edge Function. Throws Offline, SessionEnded or ServerError. */
export async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
    return (await authorized(`/functions/v1/${name}`, body)) as T;
}

/** The signed-in person's id, or null. */
export async function currentUserId(): Promise<string | null> {
    return (await readSession())?.userId ?? null;
}
