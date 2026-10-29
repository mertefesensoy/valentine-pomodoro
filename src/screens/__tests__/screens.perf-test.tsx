import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { act } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { measureRenders } from 'reassure';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionStore } from '../../stores/sessionStore';
import { useSessionClock } from '../../hooks/useSessionClock';
import { formatTime } from '../../utils/time';
import TimerScreen from '../TimerScreen';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import StatsScreen from '../StatsScreen';
import SettingsScreen from '../SettingsScreen';
import LoveNotesScreen from '../LoveNotesScreen';

// Phase 1 task A2: the render baseline B4 must improve on (plan §4.3). Every
// scenario runs the same 10 s session as context/__tests__/rerenders.perf-test.tsx.
// The providers sit in Reassure's `wrapper`, outside its Profiler, so each count
// is the number of commits in which the measured screen (or leaf) rendered.
jest.useFakeTimers();
// Four mounts of a full screen take longer than Jest's 5 s default in real time.
// A test that times out keeps measuring in the background and writes its counts
// under the next test's name, so the limit must not be hit.
jest.setTimeout(120_000);

// Settings checks the store for a newer version on mount; no network in tests.
jest.mock('../../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));

// The scenario drives the session through the store's actions (Phase 1 B3;
// before, a SessionHandle component outside the Profiler captured them from
// useApp()). Nothing outside the measured element renders for it.
function Providers({ children }: { children: ReactNode }) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>
                <BottomTabBarHeightContext.Provider value={0}>
                    {children}
                </BottomTabBarHeightContext.Provider>
            </StoreGate>
        </GestureHandlerRootView>
    );
}

// Stand-in for the <TimerText> leaf B4 introduces: the smallest component that
// shows the remaining time. B4 swaps in the real leaf; its target is 1 + n
// renders for n displayed seconds.
function TimerTextLeaf() {
    const clock = useSessionClock();
    return <Text>{formatTime(clock.displayMs)}</Text>;
}

const tenSecondSession = {
    wrapper: Providers,
    runs: 3,
    warmupRuns: 1,
    // Every run hydrates from the same (empty) storage: AsyncStorage and, since
    // B2, MMKV with its migration flag, so every run also migrates the same way.
    beforeEach: () => resetStorage(),
    scenario: async () => {
        const session = useSessionStore.getState();
        await act(async () => {});
        await act(() => session.start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        for (let i = 0; i < 10; i++) {
            await act(() => jest.advanceTimersByTime(1_000));
        }
        await act(() => session.stop());
    },
};

test('Timer screen (Classic) during 10 s of a running session', async () => {
    await measureRenders(<TimerScreen />, tenSecondSession);
});

test('Stats screen during 10 s of a running session', async () => {
    await measureRenders(<StatsScreen />, tenSecondSession);
});

test('Settings screen during 10 s of a running session', async () => {
    await measureRenders(<SettingsScreen />, tenSecondSession);
});

test('Notes screen during 10 s of a running session', async () => {
    await measureRenders(<LoveNotesScreen />, tenSecondSession);
});

test('TimerText-sized leaf during 10 s of a running session', async () => {
    await measureRenders(<TimerTextLeaf />, tenSecondSession);
});
