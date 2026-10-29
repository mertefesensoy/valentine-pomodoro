import type { ReactNode } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { act } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { measureRenders } from 'reassure';
import { AppProvider, useApp } from '../../context/AppContext';
import { formatTime } from '../../utils/time';
import type { UseSessionClockReturn } from '../../hooks/useSessionClock';
import TimerScreen from '../TimerScreen';
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

let session: UseSessionClockReturn | null = null;

// Holds the session API for the scenario. It renders outside the Profiler, so
// its own renders are not counted.
function SessionHandle() {
    session = useApp().session;
    return null;
}

function Providers({ children }: { children: ReactNode }) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
                <BottomTabBarHeightContext.Provider value={0}>
                    <SessionHandle />
                    {children}
                </BottomTabBarHeightContext.Provider>
            </AppProvider>
        </GestureHandlerRootView>
    );
}

// Stand-in for the <TimerText> leaf B4 introduces: the smallest component that
// shows the remaining time. B4 swaps in the real leaf; its target is 1 + n
// renders for n displayed seconds.
function TimerTextLeaf() {
    const { session: clock } = useApp();
    return <Text>{formatTime(clock.displayMs)}</Text>;
}

const tenSecondSession = {
    wrapper: Providers,
    runs: 3,
    warmupRuns: 1,
    // Every run hydrates from the same (empty) storage.
    beforeEach: () => AsyncStorage.clear(),
    scenario: async () => {
        await act(async () => {});
        await act(() => session!.start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        for (let i = 0; i < 10; i++) {
            await act(() => jest.advanceTimersByTime(1_000));
        }
        await act(() => session!.stop());
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
