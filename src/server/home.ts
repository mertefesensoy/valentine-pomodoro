import { QueryClient, useQuery } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { appStorage } from '../utils/appStorage';
import { isDeletionPending, setDeletionPending } from './account';
import { rpc, SessionEnded } from './client';
import { glanceGeneration, syncGlance } from './partnerGlance';
import type { HomeSnapshot } from './types';

/**
 * The one server query (Phase 2 C2, ADR-0029): `home_snapshot`, for paired people only. Only paired
 * components and runtime.ts import this, by `React.lazy` and `import()`, so a solo launch never
 * evaluates it. There's no provider: `useQuery` gets this file's client directly, which leaves the solo
 * tree as it is.
 */
export const HOME_KEY = ['home'] as const;
export const HOME_CACHE_KEY = 'home_cache_v1';

const DAY_MS = 24 * 60 * 60 * 1000;

export const homeClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            // Infinity, not 30 days: a timer that long overflows setTimeout's 32 bits and fires at once,
            // which would drop the query before the persister could save it.
            gcTime: Infinity,
            // It runs and fails normally when offline, and the cached data stays on screen.
            networkMode: 'offlineFirst',
            // React Native has no window focus: runtime.ts refreshes on AppState instead.
            refetchOnWindowFocus: false,
            // Retrying can't help a refused session.
            retry: (failures, error) => !(error instanceof SessionEnded) && failures < 1,
        },
    },
});

// Last known values on a cold start with no network, and an undelivered note that still shows offline.
const [, restored] = persistQueryClient({
    queryClient: homeClient,
    maxAge: 30 * DAY_MS,
    persister: createSyncStoragePersister({
        key: HOME_CACHE_KEY,
        storage: {
            getItem: (key) => appStorage.getString(key) ?? null,
            setItem: (key, value) => appStorage.set(key, value),
            removeItem: (key) => {
                appStorage.remove(key);
            },
        },
    }),
});

export const homeRestored = restored;

/** Reached this way because `forgetAccount` needs this module. Never throws. */
const forgetLater = () => void import('./forgetAccount').then(({ forgetAccount }) => forgetAccount()).catch(() => {});

/**
 * The one way a snapshot arrives, so the strip's summary (partnerGlance.ts) follows every caller's.
 *
 * It's also where a deletion whose answer was lost gets found out, on the server's word and not before. Every account
 * has a profile from the moment it exists, and a profile goes only with its account, so a valid session with no `me`
 * means the account is gone. Past the token's life that same account refuses the session instead, and the pending
 * marker tells that from a real refusal. Either way, this phone goes solo rather than asking someone to sign in to an
 * account they deleted. It's checked before the summary, so they don't hear that their partner has gone.
 *
 * Cancelling a query doesn't stop this function, so one that was on its way when you left a couple must not write them
 * back: its answer is from before, and it's dropped.
 */
export const fetchHome = async (): Promise<HomeSnapshot> => {
    const started = glanceGeneration();
    let snapshot: HomeSnapshot;
    try {
        snapshot = await rpc<HomeSnapshot>('home_snapshot');
    } catch (error) {
        if (error instanceof SessionEnded && isDeletionPending()) forgetLater();
        throw error;
    }
    if (!snapshot.me) {
        // A real forget moves the generation on, so this drops only a stale answer: one from a deleted account, landing
        // after a new sign-in, must not forget the new one.
        if (started === glanceGeneration()) forgetLater();
        return snapshot;
    }
    if (isDeletionPending()) setDeletionPending(false);
    if (started === glanceGeneration()) syncGlance(snapshot);
    return snapshot;
};

export function useHome() {
    return useQuery({ queryKey: HOME_KEY, queryFn: fetchHome }, homeClient);
}

/**
 * Fetches now, even with nothing on screen: invalidateQueries would only mark an unobserved query as
 * stale, and a note waiting for the next focus has to arrive with the screen closed too. A fetch already
 * in flight is shared. Rejects if it fails, and the cached data stays.
 */
export async function refreshHome(): Promise<void> {
    await homeClient.fetchQuery({ queryKey: HOME_KEY, queryFn: fetchHome, staleTime: 0 });
}

/** Forgets the cached snapshot, at unpairing and deletion. */
export function clearHome(): void {
    homeClient.removeQueries({ queryKey: HOME_KEY });
    appStorage.remove(HOME_CACHE_KEY);
}
