import { useContext, useEffect } from 'react';
import { ActionSheetIOS, Text } from 'react-native';
// The router's testing library installs its own mocks when imported (expo-linking
// among them), so it comes before the modules it mocks.
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { NavigationContext } from 'expo-router/react-navigation';
import { AdManager } from '../ads/AdManager';
import { useHasBeenFocused, useScreenFocused } from '../hooks/useScreenFocus';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore } from '../stores/statsStore';
import { useNotesStore } from '../stores/notesStore';
import { useUiStore } from '../stores/uiStore';
import { StrawberryMilk } from '../theme/palette';
import { resetStorage } from '../__fixtures__/storage/resetStorage';
import { save, STORAGE_KEYS } from '../utils/storage';

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
    selectionAsync: jest.fn(async () => {}),
    notificationAsync: jest.fn(async () => {}),
    ImpactFeedbackStyle: { Light: 'light' },
    NotificationFeedbackType: { Success: 'success' },
}));
// jest.setup.ts renders the banner as nothing; here it leaves a marker, so a
// test can see whether Stats asked for one. AdManager and AdPolicy, the
// package's other users, are mocked below.
jest.mock('react-native-google-mobile-ads', () => {
    const { View } = jest.requireActual('react-native');
    return {
        BannerAd: () => <View testID="banner-ad" />,
        BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
        TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
    };
});
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
// The policy says yes to every completion: what's tested is when Timer asks.
jest.mock('../ads/AdPolicy', () => ({
    AdPolicy: {
        init: jest.fn(async () => {}),
        recordSessionCompletion: jest.fn(async () => {}),
        shouldShowAd: jest.fn(() => true),
    },
}));
// The tabs' pre-render at start-up idle (B6 fix). markFirstFrame never fires
// under Jest (no layout), and the scheduler's module state can't be reset
// between launches in one file, so a test fires the pre-render itself
// (startupIdle). deferredStartup.test.ts tests the real scheduler.
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

// What each tab shows, and nothing else does.
const TABS = [
    { path: '/', url: 'valentinepomodoro://', text: 'Start focus' },
    { path: '/stats', url: 'valentinepomodoro://stats', text: /^Last 7 days/ },
    { path: '/settings', url: 'valentinepomodoro://settings', text: 'Light or dark follows your iPhone.' },
    { path: '/notes', url: 'valentinepomodoro://notes', text: 'Preview a note' },
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

/** Start-up has gone idle after the interactive mark: the hidden tabs pre-render. */
async function startupIdle() {
    await act(async () => {
        for (const run of mockPrerenders.splice(0)) run();
    });
}

async function tick(ms: number) {
    await act(() => jest.advanceTimersByTime(ms));
    // AdPolicy.recordSessionCompletion() resolves on a microtask.
    await act(async () => {});
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
    // These tests are about tabs and links, not the one-time welcome: with v1's gift screen
    // retired (D2), a fresh install would otherwise get the welcome at start-up idle.
    // welcome.test.tsx covers the welcome's gate. The tour follows the welcome, so it is marked
    // seen too (D5; the tutorial's tests cover its gate).
    await save(STORAGE_KEYS.WELCOME, { seen: true });
    await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
    urlListener = null;
    mockNotificationTap = null;
    mockPrerenders.length = 0;
    jest.mocked(Haptics.impactAsync).mockClear();
    jest.mocked(AdManager.showIfReady).mockClear();
});

// covers: FR-NAV-001
describe('deep links', () => {
    it.each(TABS)('a cold start from $url opens $path, and only that tab renders', async ({ url, path, text }) => {
        const result = await launch(url);

        expect(result.getPathname()).toBe(path);
        expect(screen.getByText(text)).toBeOnTheScreen();
        // The other tabs render only once start-up has gone idle (LazyTab).
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
        expect(screen.getByText('Start focus')).toBeOnTheScreen();
    });
});

describe('the tab bar', () => {
    // covers: FR-SET-002
    // Phase 1 D1: the four filled icons of the C3 set as template images (HIG M-4), and only
    // the selected tab in primaryInk (H-1); the unselected items keep the system's monochrome,
    // which adapts on Liquid Glass (D1 HIG D1-M1).
    it('is Timer, Stats, Settings and Notes, with their template icons and the strawberry selection', async () => {
        await launch(null);
        expect(
            tabScreens().map((s) => [
                s.props.screenKey,
                s.props.title,
                s.props.iconType,
                s.props.iconImageRenderingMode,
                String(s.props.iconImageSource?.testUri).split('/').pop(),
            ]),
        ).toEqual([
            ['index', 'Timer', 'image', 'template', 'tab-timer.png'],
            ['stats', 'Stats', 'image', 'template', 'tab-stats.png'],
            ['settings', 'Settings', 'image', 'template', 'tab-settings.png'],
            ['notes', 'Notes', 'image', 'template', 'tab-notes.png'],
        ]);
        const primaryInk = StrawberryMilk.tokens.primaryInk;
        for (const s of tabScreens()) {
            expect(s.props.selectedIconColor).toBe(primaryInk);
            expect(s.props.selectedLabelStyle).toEqual({ color: primaryInk });
            expect(s.props.standardAppearance.stacked.normal).toEqual({});
        }
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

// Tabs render late, then are never hidden (B6 fix, record §9). On native tabs
// UIKit shows a tab before JavaScript can react, so anything that hides a
// tab's content shows as a blank frame on every switch (build 46).
// covers: NFR-PERF-003
describe('tabs render late, then never hide', () => {
    const bannerHosts = () => screen.queryAllByTestId('banner-ad');

    it('the other tabs render at start-up idle; Stats requests no banner until it is opened', async () => {
        await launch(null);
        expect(screen.queryByText(/^Last 7 days/)).toBeNull();
        expect(mockPrerenders).toHaveLength(3);

        await startupIdle();
        expect(screen.getByText(/^Last 7 days/)).toBeOnTheScreen();
        expect(screen.getByText('Light or dark follows your iPhone.')).toBeOnTheScreen();
        expect(screen.getByText('Preview a note')).toBeOnTheScreen();
        expect(bannerHosts()).toHaveLength(0);

        await act(() => router.navigate('/stats'));
        expect(bannerHosts()).toHaveLength(1);
        // Once requested, it stays: leaving Stats doesn't take it down.
        await act(() => router.navigate('/'));
        expect(bannerHosts()).toHaveLength(1);
    });

    it('a tab opened before start-up idle renders on its first focus', async () => {
        const result = await launch(null);
        await act(() => router.navigate('/notes'));
        expect(result.getPathname()).toBe('/notes');
        expect(screen.getByText('Preview a note')).toBeOnTheScreen();
    });

    it('a hidden tab stays visible to queries: nothing hides its content', async () => {
        // RNTL leaves out display: none content by default, as a freeze hides it.
        await launch(null);
        await startupIdle();
        await act(() => router.navigate('/stats'));
        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        await act(() => router.navigate('/'));
        expect(screen.getByText(/^Last 7 days/)).toBeOnTheScreen();
    });

    // covers: FR-ADS-001, FR-NTE-001
    it('a focus that ends while Stats shows holds its celebration, love note and ad until Timer is shown', async () => {
        const CELEBRATION = 'Goal reached';
        const LOVE_NOTE_CLOSE = 'Close';
        const result = await launch(null);
        await act(() => {
            useSettingsStore.getState().updateSettings({
                durations: { ...useSettingsStore.getState().settings.durations, focus: 1 },
                showLoveNotes: true,
            });
            useStatsStore.getState().setGoalMinutes(1);
        });
        await act(async () => fireEvent.press(screen.getByText('Start focus')));
        await act(() => router.navigate('/stats'));

        // It ends on Stats: credited at once, nothing shown, nothing timing out.
        await tick(61_000);
        expect(result.getPathname()).toBe('/stats');
        expect(useStatsStore.getState().goalHitPulse).not.toBeNull();
        expect(screen.queryByText(CELEBRATION)).toBeNull();
        expect(screen.queryByText(LOVE_NOTE_CLOSE)).toBeNull();
        expect(AdManager.showIfReady).not.toHaveBeenCalled();
        await tick(30_000);
        expect(useStatsStore.getState().goalHitPulse).not.toBeNull();
        expect(AdManager.showIfReady).not.toHaveBeenCalled();

        // Back on Timer: the celebration, then the love note, then the ad.
        await act(() => router.navigate('/'));
        expect(screen.getByText(CELEBRATION)).toBeOnTheScreen();
        expect(AdManager.showIfReady).not.toHaveBeenCalled();
        await tick(1_400);
        expect(screen.queryByText(CELEBRATION)).toBeNull();
        expect(screen.getByText(LOVE_NOTE_CLOSE)).toBeOnTheScreen();
        expect(AdManager.showIfReady).not.toHaveBeenCalled();
        await act(async () => fireEvent.press(screen.getByText(LOVE_NOTE_CLOSE)));
        expect(AdManager.showIfReady).toHaveBeenCalledTimes(1);
    });
});

// What useSlotProgress (B4), useScreenFocused and useHasBeenFocused read: the
// router's NavigationContext and its focus and blur events. The probe replaces
// the Timer route; the rest of the app/ tree is real.
const navigationEvents: string[] = [];

function FocusProbe() {
    const navigation = useContext(NavigationContext);
    const focused = useScreenFocused();
    const seen = useHasBeenFocused();
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
    return <Text>{`focused ${focused ? 'yes' : 'no'}, seen ${seen ? 'yes' : 'no'}`}</Text>;
}

const PROBE_APP = { appDir: './app', overrides: { '(tabs)/index': FocusProbe } };

describe('focus inside a native tab', () => {
    beforeEach(() => {
        navigationEvents.length = 0;
    });

    it("a screen gets the router's navigation, and hears blur and focus", async () => {
        await launch(null, PROBE_APP);
        await act(() => router.navigate('/stats'));
        await act(() => router.navigate('/'));
        // The first focus is the initial route's, emitted once it has mounted.
        expect(navigationEvents).toEqual(['navigation', 'focus', 'blur', 'focus']);
    });

    it('useScreenFocused follows the tab; useHasBeenFocused stays true', async () => {
        await launch(null, PROBE_APP);
        expect(screen.getByText('focused yes, seen yes')).toBeOnTheScreen();
        await act(() => router.navigate('/stats'));
        expect(screen.getByText('focused no, seen yes')).toBeOnTheScreen();
        await act(() => router.navigate('/'));
        expect(screen.getByText('focused yes, seen yes')).toBeOnTheScreen();
    });
});

describe('the root', () => {
    // covers: FR-NTF-003
    it('a notification tap opens the Timer tab', async () => {
        const result = await launch('valentinepomodoro://stats');
        expect(result.getPathname()).toBe('/stats');

        await act(async () => mockNotificationTap!({ notification: { request: { content: {} } } }));
        expect(result.getPathname()).toBe('/');
        expect(screen.getByText('Start focus')).toBeOnTheScreen();
    });

    // D2 retired v1's first-launch gift screen (the owner, 2026-10-31): the welcome is the only
    // first-run screen, and the app's origin is a line in Settings › About.
    it('opens a fresh install on the Timer, with no gift screen over it', async () => {
        await launch(null);
        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(screen.queryByText("Let's start")).toBeNull();
        expect(screen.queryByText('for Bengisu')).toBeNull();
    });
});

// covers: FR-NTE-001
// D2 review round (§3.12): the editor's guard runs on the real navigator here, since the Notes
// suite stands usePreventRemove in. A blocked removal comes back as an event after a render, and
// Save's own removal must go straight through rather than ask or loop.
describe('the note editor on the real navigator', () => {
    let sheet: jest.SpyInstance;
    beforeEach(() => {
        sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});
    });
    afterEach(() => sheet.mockRestore());

    async function openNewNote(text: string) {
        const result = await launch('valentinepomodoro://notes');
        await act(() => router.push('/note-editor'));
        expect(result.getPathname()).toBe('/note-editor');
        await act(async () => fireEvent.changeText(screen.getByLabelText('New note'), text));
        return result;
    }

    it('Save closes the sheet without asking', async () => {
        const result = await openNewNote('For after the exam');
        await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Save' })));
        expect(result.getPathname()).toBe('/notes');
        expect(useNotesStore.getState().notes[0]).toBe('For after the exam');
        expect(sheet).not.toHaveBeenCalled();
    });

    it('a blocked way out (what a swipe sends) asks first, and leaves on Discard', async () => {
        const result = await openNewNote('half a thought');
        await act(() => router.back());
        expect(result.getPathname()).toBe('/note-editor');
        expect(sheet).toHaveBeenCalledTimes(1);
        const [options, pick] = sheet.mock.calls[0] as [{ options: string[] }, (i: number) => void];
        await act(async () => pick(options.options.indexOf('Discard changes')));
        expect(result.getPathname()).toBe('/notes');
        expect(useNotesStore.getState().notes).not.toContain('half a thought');
    });
});
