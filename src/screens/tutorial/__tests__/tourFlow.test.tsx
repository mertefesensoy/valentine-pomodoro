// covers: NFR-A11Y-003, NFR-A11Y-004, FR-SET-004, NFR-PERF-001
import { AccessibilityInfo, Dimensions } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { createAudioPlayer } from 'expo-audio';

import { ModeSheet } from '../../../components/modes/ModeSheet';
import { resetStorage } from '../../../__fixtures__/storage/resetStorage';
import { StoreGate } from '../../../stores/StoreGate';
import { useSessionStore } from '../../../stores/sessionStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { loadSync, save, STORAGE_KEYS } from '../../../utils/storage';
import LoveNotesScreen from '../../LoveNotesScreen';
import SettingsScreen from '../../SettingsScreen';
import StatsScreen from '../../StatsScreen';
import TimerScreen from '../../TimerScreen';
import { currentStep, useTourStore } from '../tourStore';
import { Opening } from '../TourLayer';

// The tour through the real screens (Phase 1 D5; the contract, D5 record §3.7).
jest.useFakeTimers();
jest.setTimeout(30_000);

jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));
// Notes' rows use Link's native preview, which needs a navigator: here a Link is its child.
jest.mock('expo-router', () => {
    const Link = Object.assign(({ children }: { children: React.ReactNode }) => children, {
        Trigger: ({ children }: { children: React.ReactNode }) => children,
        Menu: () => null,
        MenuAction: () => null,
    });
    return {
        ...jest.requireActual('expo-router'),
        Link,
        router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
    };
});
// The gate waits for B7's interactive mark, which Jest never fires; here a queued task runs at once.
jest.mock('../../../startup/deferredStartup', () => ({
    ...jest.requireActual('../../../startup/deferredStartup'),
    runAfterInteractive: (_name: string, run: () => unknown) => {
        run();
        return () => {};
    },
}));

const navigate = jest.mocked(router.navigate);
// The pair are decoration, hidden from VoiceOver; the modal layer hides the page's own controls from it.
const hidden = { includeHiddenElements: true } as const;
const PHONE = { width: 393, height: 852, scale: 3, fontScale: 1 };
const jestWindow = Dimensions.get('window');

async function show(node: React.ReactElement) {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{node}</StoreGate>
        </GestureHandlerRootView>,
    );
    await settle();
}

/** Lets the gate's wait, the lazy layer and its first measurements land. */
async function settle(ms = 800) {
    await act(async () => {
        jest.advanceTimersByTime(ms);
    });
    await act(async () => {});
    await act(async () => {
        jest.advanceTimersByTime(ms);
    });
}

async function press(target: Parameters<typeof fireEvent.press>[0]) {
    await act(async () => {
        await fireEvent.press(target);
    });
}

/** Moves the run to a step's beat, as Next would have. */
function goTo(id: string, beat: 'lead' | 'here') {
    const run = useTourStore.getState().run!;
    const at = run.steps.findIndex((i) => ['presets', 'today', 'modes', 'stats', 'notes', 'invite'][i] === id);
    useTourStore.setState({ run: { ...run, at, beat } });
}

const stored = () => loadSync<Record<string, unknown> | null>(STORAGE_KEYS.TUTORIAL, null);

beforeEach(async () => {
    await resetStorage();
    await save(STORAGE_KEYS.WELCOME, { seen: true });
    useTourStore.setState({ run: null, muted: false });
    navigate.mockClear();
    jest.mocked(createAudioPlayer).mockClear();
    await act(async () => Dimensions.set({ window: PHONE, screen: PHONE }));
});

afterEach(async () => {
    jest.restoreAllMocks();
    await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
});

describe('the tour on the Timer', () => {
    it('follows the welcome on a calm Timer: the ribbon, the pair, and Pomo greeting a new install over the lit presets', async () => {
        await show(<TimerScreen />);
        expect(currentStep(useTourStore.getState().run!)!.id).toBe('presets');
        expect(screen.getByTestId('tour-layer')).toBeOnTheScreen();
        expect(screen.getByLabelText("Pomo: Hi, we're Pomo and Doro! First, pick how long you'd like to focus.")).toBeOnTheScreen();
        expect(screen.getByTestId('tour-pomo', hidden)).toBeOnTheScreen();
        expect(screen.getByTestId('tour-doro', hidden)).toBeOnTheScreen();
        expect(screen.getByText('Skip tour')).toBeOnTheScreen();
        expect(screen.getByText('Next')).toBeOnTheScreen();
        // The voices load with the layer, not before.
        expect(createAudioPlayer).toHaveBeenCalledTimes(12);
    });

    it('plays its entrance once a run, and holds the page still while it is on it', async () => {
        await show(<TimerScreen />);
        // The ribbon's drop and the pair's landing played here; a layer on the next tab, or after the
        // Modes sheet closes, fades in instead (the run remembers).
        expect(useTourStore.getState().run!.introduced).toBe(true);
        // A drag would leave the opening behind; the tour's own scroll still moves the page.
        expect(screen.getByTestId('classic-page', hidden).props.scrollEnabled).toBe(false);
        await press(screen.getByText('Skip tour'));
        await settle();
        expect(screen.getByTestId('classic-page').props.scrollEnabled).toBe(true);
        useTourStore.getState().start({ replay: true });
        expect(useTourStore.getState().run!.introduced).toBe(false);
    });

    it('waits for the welcome: nothing before it has been seen', async () => {
        await resetStorage();
        await show(<TimerScreen />);
        expect(useTourStore.getState().run).toBeNull();
        expect(screen.queryByTestId('tour-layer')).toBeNull();
    });

    it('moves on by itself a beat after a preset is pressed, and by Next', async () => {
        await show(<TimerScreen />);
        await press(screen.getByLabelText('50 minutes focus, 10 minutes break', hidden));
        expect(currentStep(useTourStore.getState().run!)!.id).toBe('presets');
        await settle(400);
        expect(currentStep(useTourStore.getState().run!)!.id).toBe('today');
        expect(screen.getByLabelText("Doro: Every focus you finish puts a sticker here and fills today's goal.")).toBeOnTheScreen();
        await press(screen.getByText('Next'));
        expect(currentStep(useTourStore.getState().run!)!.id).toBe('modes');
    });

    it('ends on Skip tour, at any step, and remembers it', async () => {
        await show(<TimerScreen />);
        await press(screen.getByText('Skip tour'));
        await settle();
        expect(useTourStore.getState().run).toBeNull();
        expect(stored()).toEqual({ seen: '1.4' });
        expect(screen.queryByTestId('tour-layer')).toBeNull();
    });

    it("sends a lead's Next to the tab it names", async () => {
        await show(<TimerScreen />);
        goTo('stats', 'lead');
        await settle();
        expect(screen.getByLabelText('Doro: Your week lives in Stats. Tap the tab to see it.')).toBeOnTheScreen();
        await press(screen.getByText('Next'));
        expect(navigate).toHaveBeenCalledWith('/stats');
    });

    it('invites the first focus with no Next and Not now; Start focus closes the layer before the session starts (T-3)', async () => {
        await show(<TimerScreen />);
        goTo('invite', 'here');
        await settle();
        expect(screen.getByLabelText('Doro: Ready for your first focus? Press Start focus when you are.')).toBeOnTheScreen();
        expect(screen.queryByTestId('tour-next')).toBeNull();
        expect(screen.getByText('Not now')).toBeOnTheScreen();
        await press(screen.getByText('Start focus', hidden));
        expect(useTourStore.getState().run).toBeNull();
        expect(stored()).toEqual({ seen: '1.4' });
        expect(useSessionStore.getState().clock.pomodoro?.isRunning).toBe(true);
    });

    it('babbles with the line, and stays quiet with Sound off or the tour muted (T-8)', async () => {
        await show(<TimerScreen />);
        const players = jest.mocked(createAudioPlayer).mock.results.map((r) => r.value as { play: jest.Mock; setPlaybackRate: jest.Mock });
        const plays = () => players.reduce((n, p) => n + p.play.mock.calls.length, 0);
        await settle(4000);
        expect(plays()).toBeGreaterThan(5);
        expect(players.some((p) => p.setPlaybackRate.mock.calls.length > 0)).toBe(true);

        await press(screen.getByLabelText('Mute the voices'));
        expect(screen.getByLabelText('Turn the voices on')).toBeOnTheScreen();
        const before = plays();
        await press(screen.getByText('Next'));
        await settle(4000);
        expect(plays()).toBe(before);

        await press(screen.getByLabelText('Turn the voices on'));
        await act(async () => useSettingsStore.getState().updateSettings({ sound: false }));
        await press(screen.getByText('Next'));
        await settle(4000);
        expect(plays()).toBe(before);
    });

    it('with VoiceOver on: the whole line at once, no babble, and focus on the bubble (T-1)', async () => {
        jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
        jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
        await show(<TimerScreen />);
        const players = jest.mocked(createAudioPlayer).mock.results.map((r) => r.value as { play: jest.Mock });
        await settle(4000);
        expect(players.every((p) => p.play.mock.calls.length === 0)).toBe(true);
        // The whole line, and focus on the bubble.
        expect(screen.getByLabelText("Pomo: Hi, we're Pomo and Doro! First, pick how long you'd like to focus.")).toBeOnTheScreen();
        expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenCalledWith(expect.anything(), 'focus');
    });

    // Jest's native views never report a frame, so the opening is checked on its own here.
    it('makes an opening the control itself for VoiceOver: an adjustable preset row, an acting button', async () => {
        const onIncrement = jest.fn();
        const onDecrement = jest.fn();
        const rect = { x: 10, y: 500, w: 370, h: 70 };
        await render(<Opening rect={rect} a11y={{ label: 'Focus length', role: 'adjustable', value: '25 minutes focus, 5 minutes break', onIncrement, onDecrement }} />);
        const row = screen.getByTestId('tour-opening');
        expect(row.props.accessibilityRole).toBe('adjustable');
        expect(row.props.accessibilityLabel).toBe('Focus length');
        expect(row.props.accessibilityValue).toEqual({ text: '25 minutes focus, 5 minutes break' });
        await act(async () => fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } }));
        await act(async () => fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } }));
        expect([onIncrement.mock.calls.length, onDecrement.mock.calls.length]).toEqual([1, 1]);

        const onActivate = jest.fn();
        await render(<Opening rect={rect} a11y={{ label: 'Start focus', role: 'button', onActivate }} />);
        const button = screen.getByTestId('tour-opening');
        expect(button.props.accessibilityRole).toBe('button');
        await act(async () => fireEvent(button, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } }));
        expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('at AX sizes, gives the bubble the bottom panel and the pair a badge (T-2)', async () => {
        const ax = { ...PHONE, fontScale: 2 };
        await act(async () => Dimensions.set({ window: ax, screen: ax }));
        await show(<TimerScreen />);
        expect(screen.getByLabelText("Pomo: Hi, we're Pomo and Doro! First, pick how long you'd like to focus.")).toBeOnTheScreen();
        expect(screen.queryByTestId('tour-pomo', hidden)).toBeNull();
        expect(screen.queryByTestId('tour-doro', hidden)).toBeNull();
        expect(screen.getByTestId('tour-layer')).toBeOnTheScreen();
    });
});

describe('the tour on the other screens', () => {
    async function runAt(id: string, beat: 'lead' | 'here') {
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        goTo(id, beat);
    }

    it('Stats: Doro on the week as postcards, an empty week said as such (T-6)', async () => {
        await show(<StatsScreen />);
        await act(async () => runAt('stats', 'here'));
        await settle();
        expect(screen.getByLabelText("Doro: Each day you focus becomes a postcard here, with today's in front.")).toBeOnTheScreen();
        await press(screen.getByText('Next'));
        expect(useTourStore.getState().run!.beat).toBe('lead');
        expect(screen.getByLabelText('Pomo: Love notes live in Notes. Tap the tab to see them.')).toBeOnTheScreen();
    });

    it('Notes: Pomo on love notes, with Add lit', async () => {
        await show(<LoveNotesScreen />);
        await act(async () => runAt('notes', 'here'));
        await settle();
        expect(screen.getByLabelText('Pomo: A love note pops up after each focus. Add your own here, too.')).toBeOnTheScreen();
    });

    it('the Modes sheet says its own line at the Modes step, and closing it moves on to Stats (T-4)', async () => {
        await show(<TimerScreen />);
        goTo('modes', 'here');
        await settle();
        const sheet = await render(<ModeSheet />);
        expect(screen.getByTestId('tour-modes-bubble').props.accessibilityLabel).toBe("Pomo: Pick Ring or Facing pages here, or Fly. Close it and we'll go on.");
        await act(async () => sheet.unmount());
        const run = useTourStore.getState().run!;
        expect(currentStep(run)!.id).toBe('stats');
        expect(run.beat).toBe('lead');
    });

    it('Settings replays it from the Timer, leaving what was stored alone', async () => {
        await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
        await show(<SettingsScreen />);
        await press(screen.getByText('Watch the tutorial again'));
        expect(useTourStore.getState().run?.replay).toBe(true);
        expect(navigate).toHaveBeenCalledWith('/');
        expect(stored()).toEqual({ seen: '1.4' });
    });
});
