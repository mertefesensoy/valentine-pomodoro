import { QueryClient, useQuery } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { appStorage } from '../utils/appStorage';
import { rpc, SessionEnded } from './client';
import { syncGlance } from './partnerGlance';
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

/** The one way a snapshot arrives, so the strip's summary (partnerGlance.ts) follows every caller's. */
export const fetchHome = async (): Promise<HomeSnapshot> => {
    const snapshot = await rpc<HomeSnapshot>('home_snapshot');
    syncGlance(snapshot);
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
