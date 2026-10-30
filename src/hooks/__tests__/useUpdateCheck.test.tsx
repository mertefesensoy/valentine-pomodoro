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

const URL = 'https://example.invalid/update.json';

// jest-expo reports the installed version as 'mock', which no store version
// compares as newer than; the app's real version makes the prompt appear.
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.4.0', nativeBuildVersion: '46' }));

type Launch = {
    useUpdateCheck: typeof import('../useUpdateCheck').useUpdateCheck;
    scheduler: typeof import('../../startup/deferredStartup');
    alert: jest.SpyInstance;
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
    // The Alert the fresh hook calls is the fresh react-native's.
    const { Alert: FreshAlert } = require('react-native');
    const fresh: Launch = {
        useUpdateCheck: require('../useUpdateCheck').useUpdateCheck,
        scheduler: require('../../startup/deferredStartup'),
        alert: jest.spyOn(FreshAlert as typeof Alert, 'alert').mockImplementation(() => {}),
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

beforeEach(() => {
    jest.useFakeTimers();
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
        expect(alert.mock.calls[0][0]).toBe('✨ Update available');
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
        expect(alert.mock.calls[0][0]).toBe('✨ Update available');

        await act(async () => {
            scheduler.markFirstFrame();
            jest.advanceTimersByTime(0);
        });
        await settle();
        expect(fetchMock).toHaveBeenCalledTimes(1); // no second check, no second prompt
        expect(alert).toHaveBeenCalledTimes(1);
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
