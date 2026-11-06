/* eslint-disable @typescript-eslint/no-require-imports -- each launch loads its modules after jest.resetModules() */
import * as React from 'react';
import type { Alert } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

// Phase 1 B7 moved the launch's update check after the first frame. It must
// still run once per cold launch, and Settings' "Check for updates" must work
// at once, even before the deferred check has run (FR-UPD-001).
//
// The hook's session guard and the scheduler are module state, so each test
// is a fresh launch (jest.resetModules). RNTL can only be loaded once per file
// (it registers its own afterEach), so the fresh hook is given this file's
// React, the one RNTL renders with. fetch is replaced for the test: a store
// version far above the app's.

// Every launch() reloads the modules, which is slow on a cold cache or a busy machine.
jest.setTimeout(30_000);

const URL = 'https://example.invalid/update.json';
const HOUR_MS = 60 * 60 * 1000;
const SIX_HOURS = 6 * HOUR_MS;
// The top of an hour, so a test's small steps stay inside one hour's URL.
const AN_HOUR = 500_000 * HOUR_MS;

// jest-expo reports the installed version as 'mock', which no store version
// compares as newer than; the app's real version makes the prompt appear.
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.4.0', nativeBuildVersion: '46' }));

type Launch = {
    useUpdateCheck: typeof import('../useUpdateCheck').useUpdateCheck;
    scheduler: typeof import('../../startup/deferredStartup');
    sessionStore: typeof import('../../stores/sessionStore').useSessionStore;
    alert: jest.SpyInstance;
    /** Sends an AppState change to every listener added so far. */
    appState: (state: string) => void;
};

let fetchMock: jest.Mock;
const originalFetch = globalThis.fetch;

function launch(): Launch {
    jest.resetModules();
    jest.doMock('react', () => React);
    const { appStorage } = require('../../utils/appStorage');
    const { MIGRATION_DONE, MIGRATION_FLAG_KEY } = require('../../utils/storageMigration');
    appStorage.clearAll();
    appStorage.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
    // The Alert the fresh hook calls is the fresh react-native's, and so is its AppState.
    const { Alert: FreshAlert, AppState: FreshAppState } = require('react-native');
    const listeners = new Set<(state: string) => void>();
    jest.spyOn(FreshAppState, 'addEventListener').mockImplementation((...args: unknown[]) => {
        const listener = args[1] as (state: string) => void;
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) } as never;
    });
    const fresh: Launch = {
        useUpdateCheck: require('../useUpdateCheck').useUpdateCheck,
        scheduler: require('../../startup/deferredStartup'),
        sessionStore: require('../../stores/sessionStore').useSessionStore,
        alert: jest.spyOn(FreshAlert as typeof Alert, 'alert').mockImplementation(() => {}),
        appState: (state) => listeners.forEach((listener) => listener(state)),
    };
    // Loading Expo's modules installs its own global fetch, so the stand-in
    // goes in after them.
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    return fresh;
}

/** Lets the fetch → json → compare chain settle. */
async function settle() {
    await act(async () => {
        for (let i = 0; i < 5; i++) await Promise.resolve();
    });
}

/** Releases the launch check and lets it finish. */
async function firstFrame(scheduler: Launch['scheduler']) {
    await act(async () => {
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
    });
    await settle();
}

/** The app comes back to the foreground, `ms` after the system clock's current time. */
async function returnAfter(appState: Launch['appState'], ms: number) {
    jest.setSystemTime(Date.now() + ms);
    await act(async () => {
        appState('active');
    });
    await settle();
}

function fetchedUrls(): string[] {
    return fetchMock.mock.calls.map((call) => call[0] as string);
}

beforeEach(() => {
    jest.useFakeTimers({ now: AN_HOUR });
    // Both platforms' response shapes: iTunes Lookup (iOS) and update.json.
    fetchMock = jest.fn(async () => ({
        ok: true,
        json: async () => ({
            resultCount: 1,
            results: [{ version: '99.0.0', trackViewUrl: 'https://apps.apple.com/app/id1' }],
            latestVersion: '99.0.0',
            androidUrl: 'https://play.google.com/store/apps/details?id=x',
        }),
    }));
    (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = (callback: (d: { didTimeout: boolean; timeRemaining: () => number }) => void) =>
        setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
});

afterEach(() => {
    globalThis.fetch = originalFetch;
    delete (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback;
    jest.useRealTimers();
    jest.restoreAllMocks();
});

// covers: FR-UPD-001
describe('the update check after B7', () => {
    it('waits for the first frame, then runs once for both mounts (the root and Settings)', async () => {
        const { useUpdateCheck, scheduler, alert } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await renderHook(() => useUpdateCheck(URL));
        expect(fetchMock).not.toHaveBeenCalled();

        await act(async () => {
            scheduler.markFirstFrame();
            jest.advanceTimersByTime(0);
        });
        await settle();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert.mock.calls[0][0]).toBe('Update available');
    });

    it('"Check for updates" works at once, before the deferred check, which then does nothing', async () => {
        const { useUpdateCheck, scheduler, alert } = launch();
        const { result } = await renderHook(() => useUpdateCheck(URL));
        expect(fetchMock).not.toHaveBeenCalled();

        await act(async () => {
            void result.current.checkForUpdates({ force: true });
        });
        await settle();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert.mock.calls[0][0]).toBe('Update available');

        await act(async () => {
            scheduler.markFirstFrame();
            jest.advanceTimersByTime(0);
        });
        await settle();
        expect(fetchMock).toHaveBeenCalledTimes(1); // no second check, no second prompt
        expect(alert).toHaveBeenCalledTimes(1);
    });

    // Step 6 (D2 record §3.14): offline, "Check for updates" did nothing at all.
    it('"Check for updates" says when it could not check; the launch check stays silent', async () => {
        fetchMock = jest.fn(async () => {
            throw new Error('offline');
        });
        const { useUpdateCheck, scheduler, alert } = launch();
        const { result } = await renderHook(() => useUpdateCheck(URL));
        await act(async () => {
            scheduler.markFirstFrame();
            jest.advanceTimersByTime(0);
        });
        await settle();
        expect(alert).not.toHaveBeenCalled();

        await act(async () => {
            void result.current.checkForUpdates({ force: true });
        });
        await settle();
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert.mock.calls[0].slice(0, 2)).toEqual(["Couldn't check for updates", 'Check your connection and try again.']);
    });

    it('still runs when the first-frame signal never arrives (the fallback)', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { useUpdateCheck, scheduler } = launch();
        await renderHook(() => useUpdateCheck(URL));

        await act(async () => {
            jest.advanceTimersByTime(scheduler.FIRST_FRAME_FALLBACK_MS);
        });
        await settle();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('a component that unmounts before the first frame leaves the check to the one still mounted', async () => {
        const { useUpdateCheck, scheduler } = launch();
        const first = await renderHook(() => useUpdateCheck(URL));
        await renderHook(() => useUpdateCheck(URL));
        await first.unmount();

        await act(async () => {
            scheduler.markFirstFrame();
            jest.advanceTimersByTime(0);
        });
        await settle();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

// Apple's CDN and the phone's URL cache keep an exact lookup URL for up to 24 h, which hid
// 1.4.1 for hours after its release (docs/implementations/2026-11-06-update-check-audit.md).
// covers: FR-UPD-001
describe('the lookup URL', () => {
    /** A stale cache: the bare URL still says 1.4.0, and anything else reaches 1.4.1. */
    function behindACache() {
        fetchMock = jest.fn(async (url: string) => ({
            ok: true,
            json: async () => ({
                resultCount: 1,
                results: [{ version: /[?&]cb=/.test(url) ? '1.4.1' : '1.4.0', trackViewUrl: 'https://apps.apple.com/app/id1' }],
            }),
        }));
    }

    it('gets past a stale cache, so the button offers the new version', async () => {
        behindACache();
        const { useUpdateCheck, alert } = launch();
        const { result } = await renderHook(() => useUpdateCheck(URL));
        await act(async () => {
            void result.current.checkForUpdates({ force: true });
        });
        await settle();
        expect(alert.mock.calls.map((call) => call[0])).toEqual(['Update available']);
    });

    it('gets past a stale cache on the launch check too', async () => {
        behindACache();
        const { useUpdateCheck, scheduler, alert } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        expect(alert.mock.calls.map((call) => call[0])).toEqual(['Update available']);
    });

    it('is the iTunes lookup for this app, whose answer the check can read', async () => {
        const { useUpdateCheck, scheduler } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        expect(fetchedUrls()[0]).toMatch(/^https:\/\/itunes\.apple\.com\/lookup\?bundleId=com\.bengisu\.valentinepomodoro&cb=\d+$/);
    });

    it('is new for every press of the button', async () => {
        const { useUpdateCheck } = launch();
        const { result } = await renderHook(() => useUpdateCheck(URL));
        await act(async () => {
            void result.current.checkForUpdates({ force: true });
        });
        await settle();
        jest.setSystemTime(Date.now() + 1000);
        await act(async () => {
            void result.current.checkForUpdates({ force: true });
        });
        await settle();
        const [first, second] = fetchedUrls();
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        expect(second).not.toBe(first);
    });

    it('stays the same within an hour for the launch check and changes with the next hour', async () => {
        const lookupAt = async (time: number) => {
            jest.setSystemTime(time);
            fetchMock.mockClear();
            const { useUpdateCheck, scheduler } = launch();
            await renderHook(() => useUpdateCheck(URL));
            await firstFrame(scheduler);
            return fetchedUrls()[0];
        };
        const start = await lookupAt(AN_HOUR);
        expect(await lookupAt(AN_HOUR + HOUR_MS - 1)).toBe(start);
        expect(await lookupAt(AN_HOUR + HOUR_MS)).not.toBe(start);
    });
});

// A launch-only check can miss a release for days: iOS may keep the app suspended.
// covers: FR-UPD-001
describe('returning to the app', () => {
    it('checks again after 6 hours, so someone who tapped Not now is asked again', async () => {
        const { useUpdateCheck, scheduler, alert, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await returnAfter(appState, SIX_HOURS);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(alert).toHaveBeenCalledTimes(2);
        expect(alert.mock.calls[1][0]).toBe('Update available');
    });

    it('does not check again sooner than that', async () => {
        const { useUpdateCheck, scheduler, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);

        await returnAfter(appState, SIX_HOURS - 1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('stays quiet when the app is up to date', async () => {
        fetchMock = jest.fn(async () => ({
            ok: true,
            json: async () => ({ resultCount: 1, results: [{ version: '1.4.0' }] }),
        }));
        const { useUpdateCheck, scheduler, alert, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);

        await returnAfter(appState, SIX_HOURS);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(alert).not.toHaveBeenCalled();
    });

    it('ignores every state but active', async () => {
        const { useUpdateCheck, scheduler, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        jest.setSystemTime(Date.now() + SIX_HOURS);

        await act(async () => {
            appState('background');
            appState('inactive');
        });
        await settle();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('is one check for both mounts', async () => {
        const { useUpdateCheck, scheduler, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await returnAfter(appState, SIX_HOURS);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('tries again on the next return after a failed check, silently', async () => {
        fetchMock = jest.fn(async () => {
            throw new Error('offline');
        });
        const { useUpdateCheck, scheduler, alert, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await returnAfter(appState, 1000);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(alert).not.toHaveBeenCalled();
    });

    it('never runs ahead of the first frame', async () => {
        const { useUpdateCheck, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));

        await returnAfter(appState, SIX_HOURS);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('stops listening when the component unmounts', async () => {
        const { useUpdateCheck, scheduler, appState } = launch();
        const { unmount } = await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        await unmount();

        await returnAfter(appState, SIX_HOURS);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

// The owner, 2026-11-06, on a prompt during a running timer: "No, wait until it's idle".
// covers: FR-UPD-001
describe('a running timer', () => {
    const TWENTY_FIVE_MINUTES = 25 * 60 * 1000;

    it.each(['pomodoro', 'fly'] as const)('holds the prompt on returning during a %s session, and a later return catches up', async (kind) => {
        const { useUpdateCheck, scheduler, sessionStore, alert, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);
        alert.mockClear();

        sessionStore.getState().start({ kind, durationMs: TWENTY_FIVE_MINUTES });
        await returnAfter(appState, SIX_HOURS);
        expect(alert).not.toHaveBeenCalled();

        sessionStore.getState().stop();
        await returnAfter(appState, 1000);
        expect(alert.mock.calls.map((call) => call[0])).toEqual(['Update available']);
    });

    it('holds the launch check\'s prompt too, and a later return catches up', async () => {
        const { useUpdateCheck, scheduler, sessionStore, alert, appState } = launch();
        await renderHook(() => useUpdateCheck(URL));
        sessionStore.getState().start({ kind: 'pomodoro', durationMs: TWENTY_FIVE_MINUTES });
        await firstFrame(scheduler);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(alert).not.toHaveBeenCalled();

        sessionStore.getState().stop();
        await returnAfter(appState, 1000);
        expect(alert.mock.calls.map((call) => call[0])).toEqual(['Update available']);
    });

    it('holds the prompt when the timer starts while the answer is on its way', async () => {
        let answer = () => {};
        fetchMock = jest.fn(() => new Promise((resolve) => {
            answer = () => resolve({
                ok: true,
                json: async () => ({ resultCount: 1, results: [{ version: '99.0.0' }] }),
            });
        }));
        const { useUpdateCheck, scheduler, sessionStore, alert } = launch();
        await renderHook(() => useUpdateCheck(URL));
        await firstFrame(scheduler);

        sessionStore.getState().start({ kind: 'pomodoro', durationMs: TWENTY_FIVE_MINUTES });
        answer();
        await settle();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(alert).not.toHaveBeenCalled();
    });

    it('does not hold it for a paused timer', async () => {
        const { useUpdateCheck, scheduler, sessionStore, alert } = launch();
        await renderHook(() => useUpdateCheck(URL));
        sessionStore.getState().start({ kind: 'pomodoro', durationMs: TWENTY_FIVE_MINUTES });
        sessionStore.getState().pause();
        await firstFrame(scheduler);
        expect(alert.mock.calls.map((call) => call[0])).toEqual(['Update available']);
    });

    it('still answers the button, because someone asked', async () => {
        const { useUpdateCheck, sessionStore, alert } = launch();
        const { result } = await renderHook(() => useUpdateCheck(URL));
        sessionStore.getState().start({ kind: 'pomodoro', durationMs: TWENTY_FIVE_MINUTES });
        await act(async () => {
            void result.current.checkForUpdates({ force: true });
        });
        await settle();
        expect(alert.mock.calls.map((call) => call[0])).toEqual(['Update available']);
    });

    it('leaves the timer as it found it', async () => {
        const { useUpdateCheck, scheduler, sessionStore } = launch();
        await renderHook(() => useUpdateCheck(URL));
        sessionStore.getState().start({ kind: 'pomodoro', durationMs: TWENTY_FIVE_MINUTES });
        const before = sessionStore.getState().clock;
        await firstFrame(scheduler);
        expect(sessionStore.getState().clock).toBe(before);
    });
});
