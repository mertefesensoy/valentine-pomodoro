import { Profiler, useContext, useEffect } from 'react';
// The router's testing library installs its own mocks when imported (expo-linking
// among them), so it comes before the modules it mocks.
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { NavigationContext } from 'expo-router/react-navigation';
import { FreezeOnBlur } from '../components/FreezeOnBlur';
import TimerText from '../components/TimerText';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { resetStorage } from '../__fixtures__/storage/resetStorage';

// The real app/ routes (Phase 1 B6): the root layout with src/App.tsx, the
// native tabs, the four screens and the 404. Rendering them takes several
// seconds of real time per test; the clock under test is Jest's fake one.
jest.setTimeout(60_000);

// Starting a session asks for notification permission, raced against a 1 s
// timeout; denying settles it at once (as in timerScreenTicks.test.tsx). The
// tap listener is captured so a test can fire a tap. The foreground handler
// App.tsx sets at import isn't under test, and the real one fails on
// jest-expo's event-emitter mock, so it is stubbed.
let mockNotificationTap: ((response: unknown) => void) | null = null;
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn((listener: (response: unknown) => void) => {
        mockNotificationTap = listener;
        return { remove: () => {} };
    }),
}));
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(async () => {}),
    ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn(async () => true),
    hideAsync: jest.fn(async () => {}),
}));
// No network or ad SDK in tests: the update check (App and Settings) and the
// ad manager (App's start-up work, Timer's interstitial).
jest.mock('../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));
jest.mock('../ads/AdManager', () => ({
    AdManager: { init: jest.fn(async () => {}), preload: jest.fn(), showIfReady: jest.fn(() => false) },
}));

// What each tab shows, and nothing else does.
const TABS = [
    { path: '/', url: 'valentinepomodoro://', text: 'Start' },
    { path: '/stats', url: 'valentinepomodoro://stats', text: 'Today Sessions' },
    { path: '/settings', url: 'valentinepomodoro://settings', text: 'Settings ⚙️' },
    { path: '/notes', url: 'valentinepomodoro://notes', text: /^Love Notes/ },
];

// How iOS hands URLs to the router: expo-linking's synchronous getLinkingURL()
// at launch, `url` events after. The router reads expo-linking through a copy
// of the module it makes on first use, so both are installed on the module
// (the testing library's mock) once, here, and read the test's values.
type UrlListener = (event: { url: string }) => void;
let launchUrl: string | null = null;
let urlListener: UrlListener | null = null;
const linking = jest.requireMock<Record<string, unknown>>('expo-linking');
linking.getLinkingURL = () => launchUrl;
linking.addEventListener = (_type: string, listener: UrlListener) => {
    urlListener = listener;
    return { remove: () => {} };
};

// The router reads the launch URL only where `window` exists (its guard for
// server rendering). A phone has one; Jest's environment doesn't.
const global = globalThis as { window?: unknown };
beforeAll(() => {
    global.window = globalThis;
});
afterAll(() => {
    delete global.window;
});

/**
 * Launches the app from `url`. `initialUrl: null` keeps renderRouter from
 * passing a server location, which would bypass the URL parsing.
 */
async function launch(url: string | null, context: Parameters<typeof renderRouter>[0] = './app') {
    launchUrl = url;
    const result = await renderRouter(context, { initialUrl: null });
    // A fresh install: StoreGate runs the one-time migration, then renders.
    await act(async () => {});
    return result;
}

async function openUrl(url: string) {
    await act(async () => urlListener!({ url }));
}

function findHost(type: string) {
    const stack = [screen.root];
    while (stack.length) {
        const node = stack.pop()!;
        if (node.type === type) return node;
        for (const child of node.children) if (typeof child !== 'string') stack.push(child);
    }
    throw new Error(`no ${type} host element`);
}

function tabScreens() {
    const host = findHost('RNSTabsHostIOS');
    return host.children.filter((c) => typeof c !== 'string' && c.type === 'RNSTabsScreenIOS') as typeof host[];
}

beforeEach(async () => {
    await resetStorage();
    urlListener = null;
    mockNotificationTap = null;
    jest.mocked(Haptics.impactAsync).mockClear();
});

// covers: FR-NAV-001
describe('deep links', () => {
    it.each(TABS)('a cold start from $url opens $path, and only that tab renders', async ({ url, path, text }) => {
        const result = await launch(url);

        expect(result.getPathname()).toBe(path);
        expect(screen.getByText(text)).toBeOnTheScreen();
        // The other tabs are frozen from launch, so they haven't rendered.
        for (const other of TABS.filter((t) => t.path !== path)) {
            expect(screen.queryByText(other.text)).toBeNull();
        }
    });

    it('a link while the app is open switches tabs', async () => {
        const result = await launch(null);
        expect(result.getPathname()).toBe('/');

        for (const { url, path, text } of [...TABS.slice(1), TABS[0]]) {
            await openUrl(url);
            expect(result.getPathname()).toBe(path);
            expect(screen.getByText(text)).toBeOnTheScreen();
        }
    });

    it('an unknown path opens the 404, which links home', async () => {
        const result = await launch('valentinepomodoro://no-such-screen');
        expect(result.getPathname()).toBe('/no-such-screen');
        expect(screen.getByText('404')).toBeOnTheScreen();

        await act(async () => fireEvent.press(screen.getByText('Go to Home')));
        expect(result.getPathname()).toBe('/');
        expect(screen.getByText('Start')).toBeOnTheScreen();
    });
});

describe('the tab bar', () => {
    it('is Timer, Stats, Settings and Notes, with their SF Symbols', async () => {
        await launch(null);
        expect(tabScreens().map((s) => [s.props.screenKey, s.props.title, s.props.iconResourceName])).toEqual([
            ['index', 'Timer', 'heart.fill'],
            ['stats', 'Stats', 'chart.bar.fill'],
            ['settings', 'Settings', 'gearshape.fill'],
            ['notes', 'Notes', 'heart.text.square.fill'],
        ]);
    });

    // covers: FR-SET-001
    it.each([true, false])('a tab press with Haptics %s', async (haptics) => {
        const result = await launch(null);
        await act(async () => useSettingsStore.getState().updateSettings({ haptics }));
        jest.mocked(Haptics.impactAsync).mockClear();
        const originalOS = process.env.EXPO_OS;
        process.env.EXPO_OS = 'ios';
        try {
            // What UIKit reports when the user taps the Stats tab.
            await act(async () =>
                fireEvent(findHost('RNSTabsHostIOS'), 'tabSelected', {
                    nativeEvent: { selectedScreenKey: 'stats', provenance: 1, actionOrigin: 'user' },
                }),
            );
        } finally {
            process.env.EXPO_OS = originalOS;
        }
        expect(result.getPathname()).toBe('/stats');
        expect(Haptics.impactAsync).toHaveBeenCalledTimes(haptics ? 1 : 0);
    });
});

// The Timer route's FreezeOnBlur, with a counted <TimerText> in place of the
// whole screen, and a probe of what useSlotProgress (B4) relies on: the
// router's NavigationContext, and its blur and focus events reaching a frozen
// screen. The rest of the app/ tree is real.
let leafCommits = 0;
const navigationEvents: string[] = [];

function NavigationProbe() {
    const navigation = useContext(NavigationContext);
    useEffect(() => {
        navigationEvents.push(navigation ? 'navigation' : 'no navigation');
        if (!navigation) return;
        const offBlur = navigation.addListener('blur', () => navigationEvents.push('blur'));
        const offFocus = navigation.addListener('focus', () => navigationEvents.push('focus'));
        return () => {
            offBlur();
            offFocus();
        };
    }, [navigation]);
    return null;
}

function ProbeTimerRoute() {
    return (
        <FreezeOnBlur>
            <Profiler id="leaf" onRender={() => leafCommits++}>
                <TimerText kind="pomodoro" idleMs={25 * 60_000} />
            </Profiler>
            <NavigationProbe />
        </FreezeOnBlur>
    );
}

const PROBE_APP = { appDir: './app', overrides: { '(tabs)/index': ProbeTimerRoute } };

// covers: NFR-PERF-003
describe('hidden tabs are frozen', () => {
    beforeEach(() => {
        leafCommits = 0;
        navigationEvents.length = 0;
    });

    it('a hidden tab commits nothing during a session, and catches up when shown', async () => {
        const result = await launch(null, PROBE_APP);
        await act(() => useSessionStore.getState().start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        await act(() => jest.advanceTimersByTime(3_000));
        expect(screen.getByText('24:57')).toBeOnTheScreen();

        await act(() => router.navigate('/stats'));
        expect(result.getPathname()).toBe('/stats');
        const hidden = leafCommits;
        await act(() => jest.advanceTimersByTime(10_000));
        expect(leafCommits).toBe(hidden);

        await act(() => router.navigate('/'));
        expect(leafCommits).toBe(hidden + 1);
        expect(screen.getByText('24:47')).toBeOnTheScreen();
    });

    it("a screen in a tab gets the router's navigation, and hears blur and focus while frozen", async () => {
        await launch(null, PROBE_APP);
        await act(() => router.navigate('/stats'));
        await act(() => router.navigate('/'));
        // The first focus is the initial route's, emitted once it has mounted.
        expect(navigationEvents).toEqual(['navigation', 'focus', 'blur', 'focus']);
    });
});

describe('the root', () => {
    // covers: FR-NTF-003
    it('a notification tap opens the Timer tab', async () => {
        const result = await launch('valentinepomodoro://stats');
        expect(result.getPathname()).toBe('/stats');

        await act(async () => mockNotificationTap!({ notification: { request: { content: {} } } }));
        expect(result.getPathname()).toBe('/');
        expect(screen.getByText('Start')).toBeOnTheScreen();
    });

    it('shows Gift Mode on the first launch only', async () => {
        await launch(null);
        expect(screen.getByText("Let's start")).toBeOnTheScreen();
        await act(async () => useUiStore.getState().dismissGiftMode());
        expect(screen.queryByText("Let's start")).toBeNull();
    });
});
