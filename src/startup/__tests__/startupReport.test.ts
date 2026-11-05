/* eslint-disable @typescript-eslint/no-require-imports -- each launch loads its modules after jest.resetModules */
// covers: NFR-PERF-008
// The anonymous start-up report (Phase 2 C4, ADR-0051): the one request a solo phone ever makes. These
// pin exactly what leaves the phone and when, and the install's group. Each "cold launch" loads fresh
// copies of the modules, as deferredStartup.test.ts does.
import type { ProbeRow } from '../startupProbe';

const mockLaunchStorage = jest.requireActual('react-native-mmkv').createMMKV();
jest.mock('../../utils/appStorage', () => ({ appStorage: mockLaunchStorage }));
jest.mock('expo-device', () => ({ modelId: 'iPhone13,2' }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.5.0', nativeBuildVersion: '62' }));
jest.mock('expo-constants', () => ({
    __esModule: true,
    default: { expoConfig: { extra: { supabaseUrl: 'https://project.supabase.co', supabasePublishableKey: 'sb_publishable_test' } } },
}));

let mockFlag = true;
jest.mock('../../constants/features', () => ({
    ...jest.requireActual('../../constants/features'),
    get STARTUP_REPORTS_ENABLED() {
        return mockFlag;
    },
}));

const row = (over: Partial<ProbeRow> = {}): ProbeRow => ({
    v: 1,
    id: 1,
    arm: 'deferred',
    trigger: 'idle',
    version: '1.5.0',
    build: '62',
    migrated: true,
    appState: 'active',
    clockOk: true,
    marks: { probeInit: 40, interactive: 812.4 },
    ...over,
});

/** A cold launch: fresh modules over the current storage. */
function launch(opts: { clear?: boolean; migrated?: boolean; panel?: string } = {}) {
    jest.resetModules();
    const { appStorage } = require('../../utils/appStorage');
    const { MIGRATION_DONE, MIGRATION_FLAG_KEY } = require('../../utils/storageMigration');
    if (opts.clear ?? true) appStorage.clearAll();
    if (opts.migrated ?? true) appStorage.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
    if (opts.panel) appStorage.set('startup_variant_v1', JSON.stringify({ mode: opts.panel, last: null }));
    const modules = {
        report: require('../startupReport') as typeof import('../startupReport'),
        scheduler: require('../deferredStartup') as typeof import('../deferredStartup'),
        variant: require('../startupVariant') as typeof import('../startupVariant'),
        settings: require('../../stores/settingsStore') as typeof import('../../stores/settingsStore'),
        appStorage,
    };
    // Loading Expo's modules reinstalls the global fetch, so the stand-in goes in after them.
    (globalThis as { fetch?: unknown }).fetch = fetchMock;
    return modules;
}

let fetchMock: jest.Mock;

beforeEach(() => {
    mockFlag = true;
    fetchMock = jest.fn(async () => ({ ok: true }));
});

afterEach(() => {
    delete (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback;
    jest.restoreAllMocks();
});

describe('what a report holds', () => {
    const build = () => launch().report.buildStartupReport;

    it('holds the group, the time, the model, the iOS version and the build, and nothing else', () => {
        expect(build()(row(), '62', 'iPhone13,2', '26.1')).toEqual({
            p_arm: 'deferred',
            p_tti_ms: 812,
            p_model: 'iPhone13,2',
            p_os: '26.1',
            p_build: '62',
        });
    });

    it('says unknown when there is no model', () => {
        expect(build()(row(), '62', null, '26.1')?.p_model).toBe('unknown');
    });

    it.each([
        ['the one-time storage copy ran', { migrated: false }],
        ['the app went to the background', { appState: 'background' }],
        ['the first-frame signal never came', { trigger: 'fallback' as const }],
        ['it has no interactive mark', { marks: { probeInit: 40 } }],
        ['the clock check failed, so the time means nothing', { clockOk: false }],
        ['it has no group', { arm: null }],
    ])('sends nothing when %s', (_name, over) => {
        expect(build()(row(over), '62', 'iPhone13,2', '26.1')).toBeNull();
    });

    it('sends nothing with no build number', () => {
        expect(build()(row(), null, 'iPhone13,2', '26.1')).toBeNull();
    });
});

describe('the request', () => {
    /** Runs a launch up to its interactive mark and everything idle after it. */
    async function runToIdle(l: ReturnType<typeof launch>) {
        const probe = require('../startupProbe') as typeof import('../startupProbe');
        jest.spyOn(probe, 'currentProbeRow').mockReturnValue(row());
        await l.report.sendStartupReport();
    }

    it('is one POST to report_startup, with the publishable key on apikey and no Authorization', async () => {
        const l = launch();
        l.settings.useSettingsStore.getState().hydrate();
        await runToIdle(l);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://project.supabase.co/rest/v1/rpc/report_startup');
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({ apikey: 'sb_publishable_test', 'content-type': 'application/json' });
        const body = JSON.parse(init.body);
        expect(Object.keys(body).sort()).toEqual(['p_arm', 'p_build', 'p_model', 'p_os', 'p_tti_ms']);
        expect(body.p_model).toBe('iPhone13,2');
    });

    it('sends nothing when the person has turned it off', async () => {
        const l = launch();
        l.settings.useSettingsStore.getState().hydrate();
        l.settings.useSettingsStore.getState().updateSettings({ shareStartupTimings: false });
        await runToIdle(l);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('is on by default, for an install with nothing stored', () => {
        const l = launch();
        l.settings.useSettingsStore.getState().hydrate();
        expect(l.settings.useSettingsStore.getState().settings.shareStartupTimings).toBe(true);
    });

    it('never throws when the network is away', async () => {
        const l = launch();
        l.settings.useSettingsStore.getState().hydrate();
        fetchMock.mockRejectedValueOnce(new Error('offline'));
        await expect(runToIdle(l)).resolves.toBeUndefined();
    });

    it('does nothing at all while the flag is off', () => {
        mockFlag = false;
        const l = launch();
        const spy = jest.spyOn(l.scheduler, 'runAfterInteractive');
        l.report.scheduleStartupReport();
        expect(spy).not.toHaveBeenCalled();
    });

    it("waits for the interactive mark, so it can't move the time it reports", async () => {
        jest.useFakeTimers();
        try {
            (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = (callback: (d: { didTimeout: boolean }) => void) => {
                setTimeout(() => callback({ didTimeout: false }), 0);
            };
            const l = launch();
            l.settings.useSettingsStore.getState().hydrate();
            const probe = require('../startupProbe') as typeof import('../startupProbe');
            jest.spyOn(probe, 'currentProbeRow').mockReturnValue(row());

            l.report.scheduleStartupReport();
            await jest.advanceTimersByTimeAsync(5000);
            expect(fetchMock).not.toHaveBeenCalled();

            l.scheduler.markFirstFrame();
            await jest.advanceTimersByTimeAsync(100);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        } finally {
            jest.useRealTimers();
        }
    });
});

describe("the install's group", () => {
    it('is drawn once, and kept across launches', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.9);
        const first = launch();
        expect(first.variant.resolveLaunchArm()).toBe('eager');
        expect(first.appStorage.getString('startup_group_v1')).toBe('"eager"');

        jest.spyOn(Math, 'random').mockReturnValue(0.1);
        const second = launch({ clear: false });
        expect(second.variant.resolveLaunchArm()).toBe('eager');
    });

    it('splits half and half', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.49);
        expect(launch().variant.resolveLaunchArm()).toBe('deferred');
        jest.spyOn(Math, 'random').mockReturnValue(0.5);
        expect(launch().variant.resolveLaunchArm()).toBe('eager');
    });

    it("doesn't turn on the probe's storage, which stays the hidden panel's", () => {
        const l = launch();
        l.variant.resolveLaunchArm();
        expect(l.variant.hasStartupSetting()).toBe(false);
        expect(l.appStorage.getString('startup_variant_v1')).toBeUndefined();
    });

    it('gives way to the hidden panel', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.9);
        expect(launch({ panel: 'deferred' }).variant.resolveLaunchArm()).toBe('deferred');
    });

    it('writes nothing before the one-time storage copy has finished', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.9);
        const l = launch({ migrated: false });
        expect(l.variant.resolveLaunchArm()).toBe('deferred');
        expect(l.appStorage.getString('startup_group_v1')).toBeUndefined();
    });

    it("stays on today's order while the flag is off", () => {
        mockFlag = false;
        jest.spyOn(Math, 'random').mockReturnValue(0.9);
        const l = launch();
        expect(l.variant.resolveLaunchArm()).toBe('deferred');
        expect(l.appStorage.getString('startup_group_v1')).toBeUndefined();
    });
});
