import { act, render } from '@testing-library/react-native';
import { StoreGate } from '../StoreGate';
import { useSessionStore } from '../sessionStore';
import { subscribeClock } from '../clockStore';
import { EMISSION_EPSILON_MS } from '../../utils/clockMath';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// The clock store's scheduler (Phase 1 B4, plan §4.2). Modern fake timers also
// fake Date.now(), so the wakes and the endAt − now arithmetic advance together.
jest.useFakeTimers();

/** Mounts StoreGate alone, which mounts the clock engine. */
async function mountEngine() {
    const view = await render(<StoreGate>{null}</StoreGate>);
    await act(async () => {});
    return view;
}

/** Records Date.now() at each notification from the clock store. */
function recordNotifications() {
    const times: number[] = [];
    const unsubscribe = subscribeClock(() => times.push(Date.now()));
    return { times, unsubscribe };
}

beforeEach(async () => {
    await resetStorage();
});

// covers: FR-TMR-006, NFR-PERF-003
describe('the clock store', () => {
    it('notifies once per displayed second, ε after each boundary', async () => {
        await mountEngine();
        await act(() => useSessionStore.getState().start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        const endAt = useSessionStore.getState().clock.pomodoro!.endAt!;

        const { times, unsubscribe } = recordNotifications();
        await act(() => jest.advanceTimersByTime(10_000));
        unsubscribe();

        expect(times).toHaveLength(10);
        for (const t of times) {
            expect((endAt - t) % 1000).toBe(1000 - EMISSION_EPSILON_MS);
        }
    });

    it('does not notify while paused, and resumes on resume', async () => {
        await mountEngine();
        const session = useSessionStore.getState();
        await act(() => session.start({ kind: 'pomodoro', durationMs: 60_000 }));
        await act(() => jest.advanceTimersByTime(2_500));
        await act(() => session.pause());

        const { times, unsubscribe } = recordNotifications();
        await act(() => jest.advanceTimersByTime(30_000));
        expect(times).toHaveLength(0);

        // The resume itself (a clock change) notifies once; then one per second.
        await act(() => session.resume());
        await act(() => jest.advanceTimersByTime(3_000));
        unsubscribe();
        expect(times).toHaveLength(1 + 3);
    });

    it('completes the session once, when the remaining time reaches 0', async () => {
        await mountEngine();
        const handler = jest.fn();
        const unsubscribeHandler = useSessionStore.getState().onComplete(handler);
        await act(() => useSessionStore.getState().start({ kind: 'pomodoro', durationMs: 3_000 }));

        await act(() => jest.advanceTimersByTime(2_999));
        expect(handler).not.toHaveBeenCalled();

        await act(() => jest.advanceTimersByTime(1 + EMISSION_EPSILON_MS));
        expect(handler).toHaveBeenCalledTimes(1);
        expect(useSessionStore.getState().clock.pomodoro).toBeNull();

        await act(() => jest.advanceTimersByTime(10_000));
        expect(handler).toHaveBeenCalledTimes(1);
        unsubscribeHandler();
    });

    it('stops waking when the engine unmounts', async () => {
        const view = await mountEngine();
        await act(() => useSessionStore.getState().start({ kind: 'pomodoro', durationMs: 60_000 }));
        await view.unmount();

        const { times, unsubscribe } = recordNotifications();
        await act(() => jest.advanceTimersByTime(5_000));
        unsubscribe();
        expect(times).toHaveLength(0);
    });
});
