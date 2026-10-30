// covers: NFR-A11Y-004, NFR-PERF-001, FR-MIG-001
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';

import { StoreGate } from '../../../stores/StoreGate';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUiStore } from '../../../stores/uiStore';
import { resetStorage } from '../../../__fixtures__/storage/resetStorage';
import { load, save, STORAGE_KEYS } from '../../../utils/storage';
import TimerScreen from '../../TimerScreen';
import { WelcomeScreen } from '../WelcomeScreen';

// The one-time v1.4 welcome (Phase 1 D1; welcome brief §4–5): shown on a calm entry only.
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
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

// The gate waits for B7's interactive mark (runAfterInteractive), which needs a root layout Jest
// never fires; here a queued task runs at once, so what's tested is the gate's own conditions.
jest.mock('../../../startup/deferredStartup', () => ({
    ...jest.requireActual('../../../startup/deferredStartup'),
    runAfterInteractive: (_name: string, run: () => unknown) => {
        run();
        return () => {};
    },
}));

const push = jest.mocked(router.push);

async function show(node: React.ReactElement) {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{node}</StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

const welcomePushes = () => push.mock.calls.filter(([href]) => href === '/welcome').length;

beforeEach(async () => {
    await resetStorage();
    push.mockClear();
});

describe('the welcome gate', () => {
    it('waits on a fresh install while the first-launch gift screen is up', async () => {
        await show(<TimerScreen />);
        expect(welcomePushes()).toBe(0);
    });

    it('greets an existing install once, on an idle Timer', async () => {
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await show(<TimerScreen />);
        expect(welcomePushes()).toBe(1);
        await act(() => jest.advanceTimersByTime(5_000));
        expect(welcomePushes()).toBe(1);
    });

    it('never shows again once seen', async () => {
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await save(STORAGE_KEYS.WELCOME, { seen: true });
        await show(<TimerScreen />);
        expect(welcomePushes()).toBe(0);
    });

    it('never covers a session that survived the update; it waits until the Timer is idle', async () => {
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await show(<TimerScreen />);
        push.mockClear();
        // A fresh render with a running session, as after an update mid-session.
        await resetStorage();
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await act(() => useSessionStore.getState().start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        await show(<TimerScreen />);
        expect(welcomePushes()).toBe(0);
        await act(() => useSessionStore.getState().stop());
        expect(welcomePushes()).toBe(1);
    });

    it('waits for a later launch when the app was opened from a notification', async () => {
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await show(<TimerScreen />);
        push.mockClear();
        await resetStorage();
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await act(async () => useUiStore.getState().deferWelcome());
        await show(<TimerScreen />);
        expect(welcomePushes()).toBe(0);
    });
});

describe('the welcome screen', () => {
    it('tells an existing user their diary has a new look, and Start marks it seen', async () => {
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await show(<WelcomeScreen />);
        expect(screen.getByText('Your diary has a new look.')).toBeOnTheScreen();
        expect(screen.getByLabelText('Pomo and Doro become the pages of one diary')).toBeOnTheScreen();
        await act(async () => {
            await fireEvent.press(screen.getByText('Start'));
        });
        expect(useUiStore.getState().hasSeenWelcome).toBe(true);
        expect(await load(STORAGE_KEYS.WELCOME, null)).toEqual({ seen: true });
        expect(router.back).toHaveBeenCalled();
    });

    it('introduces Pomo & Doro on a fresh install', async () => {
        await show(<WelcomeScreen />);
        expect(screen.getByText('Meet Pomo & Doro.')).toBeOnTheScreen();
    });
});
