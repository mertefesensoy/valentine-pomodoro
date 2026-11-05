/**
 * Deleting an account (Phase 2 B3, FR-ACC-003, Guideline 5.1.1(v)). The flow, with everything it talks
 * to passed in, so it can be tested with no Deno and no Apple. Runs on the server only.
 *
 * In order, stopping at the first failure:
 *  1. Ask Supabase who the bearer token belongs to.
 *  2. Exchange the fresh authorization code at Apple's /auth/token. The app gets that code by asking
 *     the person to confirm with Apple, so no long-lived Apple token ever sits in the database.
 *  3. Revoke the resulting refresh token at Apple's /auth/revoke.
 *  4. Delete the user. The database's triggers remove everything else (B1).
 *
 * If Apple refuses, nothing is deleted and the person can try again. Deletion is last and is one call,
 * so an account is never left half-gone.
 */

export type Deps = {
    fetch: (url: string, init: RequestInit) => Promise<Response>;
    /** A client secret for Apple: an ES256 JWT signed with the .p8 key. */
    clientSecret: () => Promise<string>;
    supabaseUrl: string;
    /** The publishable key, for asking who a token belongs to. */
    publishableKey: string;
    /** The secret key, for deleting a user. Server-only. */
    secretKey: string;
    appleClientId: string;
};

const APPLE = 'https://appleid.apple.com';

const reply = (status: number, body: Record<string, string>) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString();

export async function handle(request: Request, deps: Deps): Promise<Response> {
    if (request.method !== 'POST') return reply(405, { status: 'method_not_allowed' });

    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!bearer) return reply(401, { status: 'not_signed_in' });

    const who = await deps.fetch(`${deps.supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: { apikey: deps.publishableKey, authorization: `Bearer ${bearer}` },
    });
    if (!who.ok) return reply(401, { status: 'not_signed_in' });
    const userId = ((await who.json()) as { id?: string }).id;
    if (!userId) return reply(401, { status: 'not_signed_in' });

    let code: unknown;
    try {
        code = ((await request.json()) as { authorization_code?: unknown }).authorization_code;
    } catch {
        code = undefined;
    }
    if (typeof code !== 'string' || !code) return reply(400, { status: 'no_authorization_code' });

    const clientSecret = await deps.clientSecret();
    const formHeaders = { 'content-type': 'application/x-www-form-urlencoded' };

    const tokenResponse = await deps.fetch(`${APPLE}/auth/token`, {
        method: 'POST',
        headers: formHeaders,
        body: form({
            client_id: deps.appleClientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
        }),
    });
    if (!tokenResponse.ok) return reply(502, { status: 'apple_failed' });
    const refreshToken = ((await tokenResponse.json()) as { refresh_token?: string }).refresh_token;
    if (!refreshToken) return reply(502, { status: 'apple_failed' });

    const revoked = await deps.fetch(`${APPLE}/auth/revoke`, {
        method: 'POST',
        headers: formHeaders,
        body: form({
            client_id: deps.appleClientId,
            client_secret: clientSecret,
            token: refreshToken,
            token_type_hint: 'refresh_token',
        }),
    });
    if (!revoked.ok) return reply(502, { status: 'apple_failed' });

    const deleted = await deps.fetch(`${deps.supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        // Supabase's secret keys go on the apikey header, and aren't JWTs.
        headers: { apikey: deps.secretKey },
    });
    if (!deleted.ok) return reply(500, { status: 'delete_failed' });

    return reply(200, { status: 'ok' });
}

/**
 * Apple's client secret: an ES256 JWT, valid for five minutes, signed with the .p8 key.
 * `pem` is the .p8 file's text; real or escaped line breaks both work, so it survives being pasted
 * into a secrets form.
 */
export async function signClientSecret(input: {
    pem: string;
    teamId: string;
    keyId: string;
    clientId: string;
    nowSeconds: number;
    subtle: SubtleCrypto;
}): Promise<string> {
    const body = input.pem
        .replace(/\\n/g, '\n')
        .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, '')
        .replace(/\s+/g, '');
    const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
    const key = await input.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

    const encode = (bytes: Uint8Array) =>
        btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const text = (value: object) => encode(new TextEncoder().encode(JSON.stringify(value)));

    const unsigned = `${text({ alg: 'ES256', kid: input.keyId })}.${text({
        iss: input.teamId,
        iat: input.nowSeconds,
        exp: input.nowSeconds + 300,
        aud: APPLE,
        sub: input.clientId,
    })}`;
    const signature = await input.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned));
    return `${unsigned}.${encode(new Uint8Array(signature))}`;
}
