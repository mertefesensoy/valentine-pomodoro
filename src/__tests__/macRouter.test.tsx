import { act, renderRouter, screen, within } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { resetStorage } from '../__fixtures__/storage/resetStorage';

// 1.5.2 on a Mac (FR-ADS-003): the real app/ routes, run as the iPad app on a
// Mac. The root layout puts one always-on banner under the navigator, and
// Stats shows no banner of its own, so every tab has exactly one. Jest can't
// show a Mac: this proves the branch, and the Mac check proves the rest
// (record: docs/implementations/2026-11-15-v152-mac.md).

jest.setTimeout(60_000);

jest.mock('../platform/isMac', () => ({ IS_MAC: true, detectMac: () => true }));
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: () => {} })),
}));
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(async () => {}),
    selectionAsync: jest.fn(async () => {}),
    notificationAsync: jest.fn(async () => {}),
    ImpactFeedbackStyle: { Light: 'light' },
    NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-google-mobile-ads', () => {
    const { View: MockView } = jest.requireActual('react-native');
    return {
        BannerAd: (props: { width?: number }) => <MockView testID="banner-ad" accessibilityHint={String(props.width)} />,
        BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
        TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
    };
});
jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn(async () => true),
    hideAsync: jest.fn(async () => {}),
}));
jest.mock('../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));
jest.mock('../ads/AdManager', () => ({
    AdManager: { init: jest.fn(async () => {}), preload: jest.fn(), showIfReady: jest.fn(() => false) },
}));
jest.mock('../server/noteDelivery', () => ({ flushShown: jest.fn(async () => {}) }));
// The tabs' pre-render at start-up idle (B6 fix), fired by the test itself, as in router.test.tsx.
const mockPrerenders: (() => unknown)[] = [];
jest.mock('../startup/deferredStartup', () => ({
    ...jest.requireActual('../startup/deferredStartup'),
    runAfterInteractive: (_name: string, run: () => unknown) => {
        mockPrerenders.push(run);
        return () => {
            const i = mockPrerenders.indexOf(run);
            if (i >= 0) mockPrerenders.splice(i, 1);
        };
    },
}));

// The launch URL, as router.test.tsx installs it.
const linking = jest.requireMock<Record<string, unknown>>('expo-linking');
linking.getLinkingURL = () => null;
linking.addEventListener = () => ({ remove: () => {} });
const global = globalThis as { window?: unknown };
beforeAll(() => {
    global.window = globalThis;
});
afterAll(() => {
    delete global.window;
});

beforeEach(async () => {
    await resetStorage();
    mockPrerenders.length = 0;
});

async function launch() {
    const result = await renderRouter('./app', { initialUrl: null });
    await act(async () => {});
    // AdManager.init() has settled (mocked), so the Mac banner asks.
    await act(async () => {});
    return result;
}

async function startupIdle() {
    await act(async () => {
        for (const run of mockPrerenders.splice(0)) run();
    });
}

const banners = () => screen.queryAllByTestId('banner-ad');

// covers: FR-ADS-003
describe('the always-on banner on a Mac', () => {
    it('shows one banner, the root one, on the Timer', async () => {
        const result = await launch();
        expect(result.getPathname()).toBe('/');
        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(banners()).toHaveLength(1);
        expect(within(screen.getByTestId('mac-banner')).getByTestId('banner-ad')).toBeOnTheScreen();
    });

    it('keeps exactly one on every tab: Stats shows no banner of its own', async () => {
        const result = await launch();
        await startupIdle();
        for (const path of ['/stats', '/settings', '/notes', '/'] as const) {
            await act(() => router.navigate(path));
            expect(result.getPathname()).toBe(path);
            expect(banners()).toHaveLength(1);
            expect(within(screen.getByTestId('mac-banner')).getByTestId('banner-ad')).toBeOnTheScreen();
        }
        expect(screen.getByText(/^Last 7 days/)).toBeOnTheScreen();
    });
});
