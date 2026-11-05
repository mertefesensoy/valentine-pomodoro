// covers: FR-ACC-003
// The delete-account Edge Function's flow (Phase 2 B3): the order Apple and Supabase are called in, and
// that a failure at Apple deletes nothing. It runs here with its dependencies passed in; the real check
// against Apple needs a real account, at Stage D.
import { handle, signClientSecret, type Deps } from '../../supabase/functions/delete-account/handler';

type Call = { url: string; init: RequestInit };

const SUPABASE = 'https://project.supabase.co';

function setup(overrides: Partial<Record<'who' | 'token' | 'revoke' | 'delete', { status: number; body?: unknown }>> = {}) {
    const calls: Call[] = [];
    const respond = (status: number, body: unknown = {}) =>
        ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
    const deps: Deps = {
        supabaseUrl: SUPABASE,
        publishableKey: 'publishable',
        secretKey: 'secret',
        appleClientId: 'com.bengisu.valentinepomodoro',
        clientSecret: jest.fn(async () => 'signed-secret'),
        fetch: jest.fn(async (url: string, init: RequestInit) => {
            calls.push({ url, init });
            if (url.endsWith('/auth/v1/user')) {
                const o = overrides.who ?? { status: 200, body: { id: 'user-1' } };
                return respond(o.status, o.body);
            }
            if (url.endsWith('/auth/token')) {
                const o = overrides.token ?? { status: 200, body: { refresh_token: 'refresh-1' } };
                return respond(o.status, o.body);
            }
            if (url.endsWith('/auth/revoke')) return respond(overrides.revoke?.status ?? 200);
            if (url.includes('/auth/v1/admin/users/')) return respond(overrides.delete?.status ?? 200);
            throw new Error(`unexpected call: ${url}`);
        }),
    };
    return { deps, calls };
}

// A minimal Request: the handler reads only its method, one header and its JSON body.
function request({ token = 'user-token', body = { authorization_code: 'code-1' } as unknown, method = 'POST' } = {}) {
    return {
        method,
        headers: { get: (name: string) => (name === 'authorization' && token ? `Bearer ${token}` : null) },
        json: async () => body,
    } as unknown as Request;
}

const bodyOf = async (response: Response) => JSON.parse(await response.text());

// jest-expo's Response stand-in may differ, so the handler's replies are read through this helper.
beforeAll(() => {
    (globalThis as { Response?: unknown }).Response = class {
        status: number;
        private bodyText: string;
        constructor(bodyText: string, init: { status: number }) {
            this.bodyText = bodyText;
            this.status = init.status;
        }
        async text() {
            return this.bodyText;
        }
    };
});

describe('delete-account', () => {
    it('checks who it is, exchanges the code, revokes the token, then deletes, in that order', async () => {
        const { deps, calls } = setup();
        const response = await handle(request(), deps);

        expect(response.status).toBe(200);
        expect(await bodyOf(response)).toEqual({ status: 'ok' });
        expect(calls.map((c) => c.url)).toEqual([
            `${SUPABASE}/auth/v1/user`,
            'https://appleid.apple.com/auth/token',
            'https://appleid.apple.com/auth/revoke',
            `${SUPABASE}/auth/v1/admin/users/user-1`,
        ]);
        expect(calls[2].init.body).toContain('token=refresh-1');
        expect(calls[2].init.body).toContain('token_type_hint=refresh_token');
        expect(calls[3].init.method).toBe('DELETE');
        // Supabase's secret keys go on apikey, and aren't JWTs.
        expect(calls[3].init.headers).toEqual({ apikey: 'secret' });
    });

    it('deletes the person the token belongs to, whatever the body says', async () => {
        const { deps, calls } = setup({ who: { status: 200, body: { id: 'token-owner' } } });
        await handle(request({ body: { authorization_code: 'code-1', user_id: 'someone-else' } }), deps);
        expect(calls[3].url).toBe(`${SUPABASE}/auth/v1/admin/users/token-owner`);
    });

    it.each([
        ['Apple refuses the code', { token: { status: 400 } }],
        ['Apple gives no refresh token', { token: { status: 200, body: {} } }],
        ['Apple refuses the revoke', { revoke: { status: 500 } }],
    ])('deletes nothing when %s, and says so', async (_name, overrides) => {
        const { deps, calls } = setup(overrides);
        const response = await handle(request(), deps);

        expect(response.status).toBe(502);
        expect(await bodyOf(response)).toEqual({ status: 'apple_failed' });
        expect(calls.some((c) => c.url.includes('/admin/users/'))).toBe(false);
    });

    it('refuses a missing or unknown token before talking to Apple', async () => {
        const unknown = setup({ who: { status: 401 } });
        expect((await handle(request(), unknown.deps)).status).toBe(401);
        expect(unknown.calls.some((c) => c.url.includes('apple'))).toBe(false);

        const missing = setup();
        expect((await handle(request({ token: '' }), missing.deps)).status).toBe(401);
        expect(missing.calls).toHaveLength(0);
    });

    it('needs the fresh code from Apple', async () => {
        const { deps, calls } = setup();
        const response = await handle(request({ body: {} }), deps);
        expect(response.status).toBe(400);
        expect(calls.some((c) => c.url.includes('apple'))).toBe(false);
    });

    it('reports a failed delete, after the revoke', async () => {
        const { deps } = setup({ delete: { status: 500 } });
        expect((await handle(request(), deps)).status).toBe(500);
    });

    it('accepts only POST', async () => {
        const { deps } = setup();
        expect((await handle(request({ method: 'GET' }), deps)).status).toBe(405);
    });
});

describe("Apple's client secret", () => {
    const { webcrypto } = jest.requireActual<{ webcrypto: Crypto }>('crypto');

    it('is an ES256 JWT with the fields Apple asks for, signed so that it verifies', async () => {
        const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
        const der = new Uint8Array(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey));
        const base64 = btoa(String.fromCharCode(...der));
        // As it reaches the function when pasted into a secrets form: with escaped line breaks.
        const pem = `-----BEGIN PRIVATE KEY-----\\n${base64.match(/.{1,64}/g)!.join('\\n')}\\n-----END PRIVATE KEY-----`;

        const jwt = await signClientSecret({
            pem,
            teamId: 'TEAM123',
            keyId: 'KEY456',
            clientId: 'com.bengisu.valentinepomodoro',
            nowSeconds: 1_000_000,
            subtle: webcrypto.subtle,
        });

        const [head, claims, signature] = jwt.split('.');
        const decode = (part: string) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
        expect(decode(head)).toEqual({ alg: 'ES256', kid: 'KEY456' });
        expect(decode(claims)).toEqual({
            iss: 'TEAM123',
            iat: 1_000_000,
            exp: 1_000_300,
            aud: 'https://appleid.apple.com',
            sub: 'com.bengisu.valentinepomodoro',
        });
        const raw = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(signature.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
        const verified = await webcrypto.subtle.verify(
            { name: 'ECDSA', hash: 'SHA-256' },
            pair.publicKey,
            raw,
            new TextEncoder().encode(`${head}.${claims}`),
        );
        expect(verified).toBe(true);
    });
});
