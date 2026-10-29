import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { AppProvider, useApp } from '../AppContext';
import { formatTime } from '../../utils/time';
import type { UseSessionClockReturn } from '../../hooks/useSessionClock';

// Guard for plan §4.5. Timer text reaches the screen only because the 1 Hz tick
// re-renders AppProvider and every useApp() consumer. Phase 1 replaces that chain;
// this test must keep passing through the change, or the timer has frozen.
jest.useFakeTimers();

let session: UseSessionClockReturn | null = null;

function TimerTextProbe() {
    const app = useApp();
    session = app.session;
    return <Text testID="timer-text">{formatTime(app.session.displayMs)}</Text>;
}

describe('timer text through AppProvider', () => {
    it('updates every second while a session runs', async () => {
        await render(
            <AppProvider>
                <TimerTextProbe />
            </AppProvider>,
        );
        await act(async () => {});

        await act(() => session!.start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        expect(screen.getByTestId('timer-text')).toHaveTextContent('25:00');

        await act(() => jest.advanceTimersByTime(1_000));
        expect(screen.getByTestId('timer-text')).toHaveTextContent('24:59');

        await act(() => jest.advanceTimersByTime(59_000));
        expect(screen.getByTestId('timer-text')).toHaveTextContent('24:00');
    });
});
