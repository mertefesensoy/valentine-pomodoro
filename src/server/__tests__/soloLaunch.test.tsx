/* eslint-disable @typescript-eslint/no-require-imports -- required inside each test, so that a static import added later fails here */
// covers: FR-ACC-001, FR-ACC-002, NFR-PERF-008
// The solo promise (ADR-0049, ADR-0051), proved over a real launch of the Timer with pairing switched on:
// a person with no account has no account, evaluates none of the server code, never reads the Keychain,
// and makes exactly one request, the anonymous start-up report, or none with its switch off.
//
// The factories below record if they ever run. Each is required inside a test, not imported at the top,
// so that a static import added anywhere in the app's graph later fails here.
import { act, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

jest.setTimeout(60_000);

jest.mock('../../constants/features', () => ({
    ...jest.requireActual('../../constants/features'),
    PAIRING_ENABLED: true,
    STARTUP_REPORTS_ENABLED: true,
}));

const mockEvaluated: string[] = [];
jest.mock('../client', () => {
    mockEvaluated.push('client');
    return {};
});
jest.mock('../home', () => {
    mockEvaluated.push('home');
    return {};
});
jest.mock('../runtime', () => {
    mockEvaluated.push('runtime');
    return { startPairedRuntime: () => {} };
});
jest.mock('@tanstack/react-query', () => {
    mockEvaluated.push('query');
    return {};
});
jest.mock('expo-secure-store', () => {
    mockEvaluated.push('keychain');
    return {};
});
jest.mock('expo-apple-authentication', () => {
    mockEvaluated.push('apple');
    return {};
});
jest.mock('expo-device', () => ({ modelId: 'iPhone13,2' }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.5.0', nativeBuildVersion: '62' }));
jest.mock('expo-constants', () => ({
    __esModule: true,
    default: { expoConfig: { extra: { supabaseUrl: 'https://project.supabase.co', supabasePublishableKey: 'sb_publishable_test' } } },
}));

async function launchTimer() {
    const TimerScreen = require('../../screens/TimerScreen').default;
    const { StoreGate } = require('../../stores/StoreGate');
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>
                <TimerScreen />
            </StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

describe('a solo launch, with pairing switched on', () => {
    it('evaluates no server code, and reads no Keychain', async () => {
        await launchTimer();
        const { schedulePairedRuntime } = require('../startPaired');
        schedulePairedRuntime();
        await act(async () => {});

        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(mockEvaluated).toEqual([]);
    });

    it('asks for no paired work when there is no account', () => {
        const scheduler = require('../../startup/deferredStartup');
        const spy = jest.spyOn(scheduler, 'runAfterInteractive');
        const { schedulePairedRuntime } = require('../startPaired');

        schedulePairedRuntime();

        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it('has exactly one request: the report, with its fixed fields and no user token', async () => {
        const probe = require('../../startup/startupProbe');
        jest.spyOn(probe, 'currentProbeRow').mockReturnValue({
            v: 1, id: 1, arm: 'deferred', trigger: 'idle', version: '1.5.0', build: '62',
            migrated: true, appState: 'active', clockOk: true, marks: { probeInit: 40, interactive: 812 },
        });
        const { useSettingsStore } = require('../../stores/settingsStore');
        useSettingsStore.getState().updateSettings({ shareStartupTimings: true });
        const fetchMock = jest.fn(async () => ({ ok: true }));
        (globalThis as { fetch?: unknown }).fetch = fetchMock;

        const { sendStartupReport } = require('../../startup/startupReport');
        await sendStartupReport();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string>; body: string }];
        expect(url).toBe('https://project.supabase.co/rest/v1/rpc/report_startup');
        expect(init.headers.authorization).toBeUndefined();
        expect(Object.keys(JSON.parse(init.body)).sort()).toEqual(['p_arm', 'p_build', 'p_model', 'p_os', 'p_tti_ms']);
    });

    it('has none at all with the switch off', async () => {
        const { useSettingsStore } = require('../../stores/settingsStore');
        useSettingsStore.getState().updateSettings({ shareStartupTimings: false });
        const fetchMock = jest.fn(async () => ({ ok: true }));
        (globalThis as { fetch?: unknown }).fetch = fetchMock;

        const { sendStartupReport } = require('../../startup/startupReport');
        await sendStartupReport();

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
