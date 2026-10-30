import { Profiler } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { act, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionStore } from '../../stores/sessionStore';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import TimerScreen from '../TimerScreen';

// What the Timer screen commits while a session runs (Phase 1 B4). Reassure
// measures the same scenario (screens.perf-test.tsx); this pins it in the
// ordinary suite. The ring is a plain child of the screen, so its renders
// count the screen's own renders.
jest.useFakeTimers();
jest.setTimeout(30_000);

let mockRingRenders = 0;
jest.mock('../../components/CircularProgress', () => {
    const actual = jest.requireActual('../../components/CircularProgress');
    return {
        CircularProgress: (props: object) => {
            mockRingRenders++;
            return actual.CircularProgress(props);
        },
    };
});

// Starting with notifications on races a permission request against a 1 s
// timeout; denying settles it at once (as in timerScreenTicks.test.tsx).
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));

let commits = 0;

beforeEach(async () => {
    await resetStorage();
    commits = 0;
    mockRingRenders = 0;
});

// covers: NFR-PERF-003, FR-TMR-006
describe('the Timer screen during a session', () => {
    it('renders on start and stop only; each second commits just the timer text', async () => {
        await render(
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StoreGate>
                    <BottomTabBarHeightContext.Provider value={0}>
                        <Profiler id="timer" onRender={() => commits++}>
                            <TimerScreen />
                        </Profiler>
                    </BottomTabBarHeightContext.Provider>
                </StoreGate>
            </GestureHandlerRootView>,
        );
        await act(async () => {});
        expect(commits).toBe(1);
        expect(mockRingRenders).toBe(1);

        // One commit. Before B4 a second one followed it: PremiumCalmBackground's
        // unchanged setReduceMotion(false), queued at the Default lane on mount
        // and skipped by this Sync-lane render (B4 record, "double commit").
        const session = useSessionStore.getState();
        await act(() => session.start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        expect(commits).toBe(2);
        expect(mockRingRenders).toBe(2);

        await act(() => jest.advanceTimersByTime(10_000));
        expect(screen.getByText('24:50')).toBeOnTheScreen();
        expect(commits).toBe(2 + 10);
        expect(mockRingRenders).toBe(2);

        await act(() => session.stop());
        expect(commits).toBe(13);
        expect(mockRingRenders).toBe(3);
    });
});
