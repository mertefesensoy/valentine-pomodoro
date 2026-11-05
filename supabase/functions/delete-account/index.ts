// The Deno entry point: wires the real dependencies to the flow in handler.ts. Excluded from the app's
// tsconfig and ESLint, since `Deno` isn't a global there. The secrets are the owner's, set with
// `supabase secrets set` or in the dashboard, and they never appear in the repo.
import { handle, signClientSecret } from './handler.ts';

// Supabase injects its keys as JSON dictionaries, by key name. The name is whatever the owner gave the
// key on the API Keys page, so this takes the first one rather than assuming "default".
const keyFrom = (name: string) => Object.values(JSON.parse(env(name)))[0] as string;

function env(name: string) {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`missing secret ${name}`);
    return value;
}

Deno.serve((request: Request) =>
    handle(request, {
        fetch: (url, init) => fetch(url, init),
        clientSecret: () =>
            signClientSecret({
                pem: env('APPLE_PRIVATE_KEY'),
                teamId: env('APPLE_TEAM_ID'),
                keyId: env('APPLE_KEY_ID'),
                clientId: env('APPLE_CLIENT_ID'),
                nowSeconds: Math.floor(Date.now() / 1000),
                subtle: crypto.subtle,
            }),
        supabaseUrl: env('SUPABASE_URL'),
        publishableKey: keyFrom('SUPABASE_PUBLISHABLE_KEYS'),
        secretKey: keyFrom('SUPABASE_SECRET_KEYS'),
        appleClientId: env('APPLE_CLIENT_ID'),
    }),
);
