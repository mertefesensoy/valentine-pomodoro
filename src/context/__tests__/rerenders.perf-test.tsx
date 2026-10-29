import { Text } from 'react-native';
import { act } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import { AppProvider, useApp } from '../AppContext';
import type { UseSessionClockReturn } from '../../hooks/useSessionClock';

// Finding F1 (plan §1.2): a component that only reads settings re-renders once
// per second while a timer runs, because every tick changes the context value.
// Phase 1 must bring this component's render count during the scenario to ~0.
jest.useFakeTimers();

let session: UseSessionClockReturn | null = null;

function SettingsOnlyConsumer() {
    const app = useApp();
    session = app.session;
    return <Text>{app.settings.settings.themeMode}</Text>;
}

test('settings-only consumer during 10 s of a running session', async () => {
    await measureRenders(
        <AppProvider>
            <SettingsOnlyConsumer />
        </AppProvider>,
        {
            runs: 3,
            warmupRuns: 1,
            scenario: async () => {
                await act(async () => {});
                await act(() => session!.start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
                for (let i = 0; i < 10; i++) {
                    await act(() => jest.advanceTimersByTime(1_000));
                }
                await act(() => session!.stop());
            },
        },
    );
});
