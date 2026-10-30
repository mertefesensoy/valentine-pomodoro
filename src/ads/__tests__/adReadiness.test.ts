/* eslint-disable @typescript-eslint/no-require-imports -- each launch loads its modules after jest.resetModules() */
// Phase 1 B7 moved AdManager.init() after the first frame. The interstitial
// must still be loaded and ready by the 2nd completed session (FR-ADS-001),
// whichever way the deferred work starts: the first-frame signal, the
// fallback when the signal is missing, or the eager (pre-B7) arm.
//
// The shared mock in jest.setup.ts returns no-op listeners, so an ad there can
// never report LOADED. This file's mock records each interstitial and its
// listeners, so a test can deliver the SDK's events. AdManager, AdPolicy and
// the scheduler keep per-launch state in their modules: each test is a fresh
// launch (jest.resetModules) over a migrated MMKV.

type Listener = (payload?: unknown) => void;
type MockInterstitial = {
    load: jest.Mock;
    show: jest.Mock;
    listeners: Map<string, Listener[]>;
    emit(event: string): void;
};

const mockSdk = {
    initialize: jest.fn(async () => []),
    interstitials: [] as MockInterstitial[],
};

jest.mock('react-native-google-mobile-ads', () => ({
    BannerAd: () => null,
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER', BANNER: 'BANNER' },
    TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
    AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error', OPENED: 'opened' },
    MobileAds: () => ({ initialize: mockSdk.initialize }),
    InterstitialAd: {
        createForAdRequest: () => {
            const ad: MockInterstitial = {
                load: jest.fn(),
                show: jest.fn(),
                listeners: new Map(),
                emit(event) {
                    for (const listener of [...(ad.listeners.get(event) ?? [])]) listener();
                },
            };
            Object.assign(ad, {
                addAdEventListener: (event: string, listener: Listener) => {
                    ad.listeners.set(event, [...(ad.listeners.get(event) ?? []), listener]);
                    return () => ad.listeners.set(event, (ad.listeners.get(event) ?? []).filter((l) => l !== listener));
                },
            });
            mockSdk.interstitials.push(ad);
            return ad;
        },
    },
}));

type Launch = {
    AdManager: typeof import('../AdManager').AdManager;
    AdPolicy: typeof import('../AdPolicy').AdPolicy;
    scheduler: typeof import('../../startup/deferredStartup');
};

function launch(mode?: 'eager'): Launch {
    jest.resetModules();
    const { appStorage } = require('../../utils/appStorage');
    const { MIGRATION_DONE, MIGRATION_FLAG_KEY } = require('../../utils/storageMigration');
    appStorage.clearAll();
    appStorage.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
    if (mode) appStorage.set('startup_variant_v1', JSON.stringify({ mode, last: null }));
    return {
        AdManager: require('../AdManager').AdManager,
        AdPolicy: require('../AdPolicy').AdPolicy,
        scheduler: require('../../startup/deferredStartup'),
    };
}

/** Two sessions complete, then the screen asks for an ad, as TimerScreen does. */
async function secondSessionAsksForAnAd({ AdManager, AdPolicy }: Launch) {
    await AdPolicy.recordSessionCompletion();
    expect(AdPolicy.shouldShowAd()).toBe(false); // one session: below the cap
    await AdPolicy.recordSessionCompletion();
    expect(AdPolicy.shouldShowAd()).toBe(true);
    const onClose = jest.fn();
    return { shown: AdManager.showIfReady(onClose), onClose };
}

beforeEach(() => {
    jest.useFakeTimers();
    mockSdk.initialize.mockClear();
    mockSdk.interstitials = [];
    // RN bridgeless has requestIdleCallback; Node doesn't. Stand in with the next timer tick.
    (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = (callback: (d: { didTimeout: boolean; timeRemaining: () => number }) => void) =>
        setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
});

afterEach(() => {
    delete (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback;
    jest.useRealTimers();
    jest.restoreAllMocks();
});

// covers: FR-ADS-001
describe('the interstitial after B7 deferred the ads start', () => {
    it('starts nothing before the first frame, and is ready by the 2nd completed session', async () => {
        const app = launch();
        const initDone = app.AdManager.init(); // the root's mount effect (App.tsx)

        expect(mockSdk.initialize).not.toHaveBeenCalled();
        expect(mockSdk.interstitials).toHaveLength(0);

        app.scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
        await initDone;

        expect(mockSdk.initialize).toHaveBeenCalledTimes(1);
        expect(mockSdk.interstitials).toHaveLength(1);
        expect(mockSdk.interstitials[0].load).toHaveBeenCalledTimes(1);

        mockSdk.interstitials[0].emit('loaded');
        const { shown, onClose } = await secondSessionAsksForAnAd(app);
        expect(shown).toBe(true);
        expect(mockSdk.interstitials[0].show).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled(); // called when the ad closes
    });

    it('is ready too when the first-frame signal never arrives (the fallback)', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const app = launch();
        const initDone = app.AdManager.init();

        jest.advanceTimersByTime(app.scheduler.FIRST_FRAME_FALLBACK_MS - 1);
        expect(mockSdk.initialize).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        await initDone;

        mockSdk.interstitials[0].emit('loaded');
        expect((await secondSessionAsksForAnAd(app)).shown).toBe(true);
    });

    it('eager arm: starts at the call, as before B7', async () => {
        const app = launch('eager');
        const initDone = app.AdManager.init();
        expect(mockSdk.initialize).toHaveBeenCalledTimes(1);
        await initDone;

        mockSdk.interstitials[0].emit('loaded');
        expect((await secondSessionAsksForAnAd(app)).shown).toBe(true);
    });

    it('a second init() starts the SDK once (Strict Mode runs mount effects twice)', async () => {
        const app = launch();
        const first = app.AdManager.init();
        const second = app.AdManager.init();
        expect(second).toBe(first);

        app.scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
        await first;
        expect(mockSdk.initialize).toHaveBeenCalledTimes(1);
        expect(mockSdk.interstitials).toHaveLength(1);
    });

    it('an ad asked for before the deferred start is skipped silently, as before B7', async () => {
        const app = launch();
        void app.AdManager.init();
        const onClose = jest.fn();

        expect(app.AdManager.showIfReady(onClose)).toBe(false);
        expect(onClose).toHaveBeenCalledTimes(1); // the caller proceeds
    });
});
