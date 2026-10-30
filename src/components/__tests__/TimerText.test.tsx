import { Profiler } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionStore } from '../../stores/sessionStore';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import TimerText from '../TimerText';

// The <TimerText> leaf (Phase 1 B4): the only subscriber to the displayed
// second. It must change every second and render only when its text changes.
jest.useFakeTimers();

let commits = 0;

async function renderLeaf(idleMs: number | null) {
    commits = 0;
    await render(
        <StoreGate>
            <Profiler id="leaf" onRender={() => commits++}>
                <TimerText kind="pomodoro" idleMs={idleMs} />
            </Profiler>
        </StoreGate>,
    );
    await act(async () => {});
}

beforeEach(async () => {
    await resetStorage();
});

// covers: FR-TMR-006, NFR-PERF-003
describe('TimerText', () => {
    it('renders once per displayed second, and not when the text stays the same', async () => {
        await renderLeaf(25 * 60_000);
        const session = useSessionStore.getState();
        expect(screen.getByText('25:00')).toBeOnTheScreen();
        expect(commits).toBe(1);

        // Starting a 25:00 session shows 25:00: no render.
        await act(() => session.start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        expect(commits).toBe(1);

        await act(() => jest.advanceTimersByTime(1_000));
        expect(screen.getByText('24:59')).toBeOnTheScreen();
        expect(commits).toBe(2);

        await act(() => jest.advanceTimersByTime(9_000));
        expect(screen.getByText('24:50')).toBeOnTheScreen();
        expect(commits).toBe(11);

        // Paused on 24:50: the text doesn't change, so neither the pause nor
        // the next 30 s render it.
        await act(() => session.pause());
        await act(() => jest.advanceTimersByTime(30_000));
        expect(screen.getByText('24:50')).toBeOnTheScreen();
        expect(commits).toBe(11);

        await act(() => session.stop());
        expect(screen.getByText('25:00')).toBeOnTheScreen();
        expect(commits).toBe(12);
    });

    it('shows --:-- with nothing to time', async () => {
        await renderLeaf(null);
        expect(screen.getByText('--:--')).toBeOnTheScreen();
    });

    it('counts down a session of another length from its own end', async () => {
        await renderLeaf(25 * 60_000);
        await act(() => useSessionStore.getState().start({ kind: 'pomodoro', durationMs: 5 * 60_000 }));
        await act(() => jest.advanceTimersByTime(61_000));
        expect(screen.getByText('03:59')).toBeOnTheScreen();
    });
});
