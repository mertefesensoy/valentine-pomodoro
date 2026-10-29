import { Text } from 'react-native';
import { act } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';

// Finding F1 (plan §1.2): a component that only reads settings re-renders once
// per second while a timer runs, because every tick changed the context value.
// Phase 1 must bring this component's render count during the scenario to ~0.
// Since B3 it reads the settings store through a selector, as SettingsScreen
// and useTheme do, and the scenario drives the session store's actions.
// (The file keeps its path under context/ from when it measured AppContext.)
jest.useFakeTimers();

function SettingsOnlyConsumer() {
    const themeMode = useSettingsStore((s) => s.settings.themeMode);
    return <Text>{themeMode}</Text>;
}

// covers: NFR-PERF-003
test('settings-only consumer during 10 s of a running session', async () => {
    await measureRenders(
        <StoreGate>
            <SettingsOnlyConsumer />
        </StoreGate>,
        {
            runs: 3,
            warmupRuns: 1,
            scenario: async () => {
                const session = useSessionStore.getState();
                await act(async () => {});
                await act(() => session.start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
                for (let i = 0; i < 10; i++) {
                    await act(() => jest.advanceTimersByTime(1_000));
                }
                await act(() => session.stop());
            },
        },
    );
});
