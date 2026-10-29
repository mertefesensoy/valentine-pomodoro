import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionClock, type UseSessionClockReturn } from '../../hooks/useSessionClock';
import { formatTime } from '../../utils/time';

// Guard for plan §4.5. Timer text reaches the screen only because the 1 Hz tick
// re-renders every component that reads the clock: since Phase 1 B3 the clock
// engine increments the session store's `tick`, and useSessionClock() (what the
// screens use) subscribes to it. Phase 1 B4 replaces that chain; this test must
// keep passing through the change, or the timer has frozen. (The file keeps its
// path under context/ from when the chain ran through AppContext.)
jest.useFakeTimers();

let session: UseSessionClockReturn | null = null;

function TimerTextProbe() {
    const clock = useSessionClock();
    session = clock;
    return <Text testID="timer-text">{formatTime(clock.displayMs)}</Text>;
}

// covers: FR-TMR-006
describe('timer text through the session store', () => {
    it('updates every second while a session runs', async () => {
        await render(
            <StoreGate>
                <TimerTextProbe />
            </StoreGate>,
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
