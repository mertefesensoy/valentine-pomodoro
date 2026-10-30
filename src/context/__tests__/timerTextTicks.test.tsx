import { useEffect } from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionClock, type UseSessionClockReturn } from '../../hooks/useSessionClock';
import { formatTime } from '../../utils/time';

// Guard for plan §4.5. Timer text reaches the screen only because something
// re-renders its reader each second. Since Phase 1 B4 that is the clock store
// (src/stores/clockStore.ts): its scheduler wakes when the displayed second
// changes and notifies its subscribers, among them useSessionClock(), which
// this probe reads. (Before: B3's 1 Hz `tick` in the session store; before
// that, setDisplayTick in AppContext.) If this fails, the timer has frozen.
// The file keeps its path under context/ from the AppContext days.
jest.useFakeTimers();

let session: UseSessionClockReturn | null = null;

function TimerTextProbe() {
    const clock = useSessionClock();
    // Captured after commit, not during render (Phase 1 B5, react-hooks/globals).
    // The test calls session.start() only after the first render has settled.
    useEffect(() => {
        session = clock;
    });
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
