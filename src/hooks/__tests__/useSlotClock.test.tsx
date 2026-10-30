import { useEffect, type ReactNode } from 'react';
import { NavigationContext } from 'expo-router/react-navigation';
import { act, render } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionStore } from '../../stores/sessionStore';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import type { SessionSlot } from '../../types';
import { progressOf, remainingMsAt, slotRemainingMs } from '../../utils/clockMath';
import { slotClockValues, useSlotProgress, useSlotSharedValues, type SlotSharedValues } from '../useSlotClock';

// The UI thread's view of the session clock (Phase 1 B4). The Reanimated Jest
// mock runs no frames and no UI thread: useFrameCallback is replaced below to
// record setActive, and useDerivedValue computes once per render.
jest.useFakeTimers();

const mockSetActive = jest.fn();
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useFrameCallback: () => ({ setActive: mockSetActive, isActive: false, callbackId: 0 }),
}));

let values: SlotSharedValues | null = null;
let progress: SharedValue<number> | null = null;

function capture(v: SlotSharedValues, p: SharedValue<number>) {
    values = v;
    progress = p;
}

function Probe({ onRender }: { onRender: typeof capture }) {
    const v = useSlotSharedValues('pomodoro');
    // Re-render on slot changes, so the mock's useDerivedValue recomputes.
    useSessionStore((s) => s.clock.pomodoro);
    const p = useSlotProgress('pomodoro', 60_000);
    useEffect(() => onRender(v, p));
    return null;
}

async function renderProbe(wrap: (children: ReactNode) => ReactNode = (c) => c) {
    await render(<StoreGate>{wrap(<Probe onRender={capture} />)}</StoreGate>);
    await act(async () => {});
}

beforeEach(async () => {
    await resetStorage();
    mockSetActive.mockClear();
});

// covers: FR-TMR-003, FR-TMR-006
describe('useSlotSharedValues', () => {
    it('writes the slot into the SharedValues in the same tick as the change', async () => {
        await renderProbe();
        const session = useSessionStore.getState();
        expect(values!.isRunning.value).toBe(false);
        expect(values!.endAt.value).toBe(Number.NEGATIVE_INFINITY);

        // Asserted inside the act callback, before React flushes effects: a
        // useEffect mirror would still hold the old values here.
        await act(() => {
            session.start({ kind: 'pomodoro', durationMs: 60_000 });
            const slot = useSessionStore.getState().clock.pomodoro!;
            expect(values!.isRunning.value).toBe(true);
            expect(values!.endAt.value).toBe(slot.endAt);
            expect(values!.durationMs.value).toBe(60_000);
        });

        await act(() => jest.advanceTimersByTime(15_000));
        await act(() => {
            session.pause();
            expect(values!.isRunning.value).toBe(false);
            expect(values!.endAt.value).toBe(Number.NEGATIVE_INFINITY);
            expect(values!.pausedRemainingMs.value).toBe(45_000);
        });

        await act(() => {
            session.stop();
            expect(values!.pausedRemainingMs.value).toBeNull();
            expect(values!.durationMs.value).toBe(0);
        });
    });
});

describe('useSlotProgress', () => {
    it('derives the progress from the slot: 0 idle and at start, the paused share when paused', async () => {
        await renderProbe();
        const session = useSessionStore.getState();
        expect(progress!.value).toBe(0);

        await act(() => session.start({ kind: 'pomodoro', durationMs: 60_000 }));
        expect(progress!.value).toBe(0);

        await act(() => jest.advanceTimersByTime(15_000));
        await act(() => session.pause());
        expect(progress!.value).toBe(0.25);
    });

    it('runs its frame callback only while the slot runs and the screen is focused', async () => {
        const listeners: Record<string, () => void> = {};
        const navigation = {
            isFocused: () => true,
            addListener: (event: string, listener: () => void) => {
                listeners[event] = listener;
                return () => delete listeners[event];
            },
        };
        await renderProbe((children) => (
            <NavigationContext.Provider value={navigation as never}>{children}</NavigationContext.Provider>
        ));
        const session = useSessionStore.getState();
        const last = () => mockSetActive.mock.calls[mockSetActive.mock.calls.length - 1][0];
        expect(last()).toBe(false);

        await act(() => session.start({ kind: 'pomodoro', durationMs: 60_000 }));
        expect(last()).toBe(true);

        // The Timer tab hidden (freezeOnBlur doesn't stop worklets) and shown again.
        await act(() => listeners.blur());
        expect(last()).toBe(false);
        await act(() => listeners.focus());
        expect(last()).toBe(true);

        await act(() => session.pause());
        expect(last()).toBe(false);
    });
});

// The ring's two call paths must agree: the UI thread computes from the
// flattened SharedValues (slotClockValues → remainingMsAt), TimerScreen used
// to compute at render from the slot (useTimer's remainingMs, now
// slotRemainingMs). One function backs both, and this pins the flattening.
describe('the ring on the UI thread equals the ring TimerScreen rendered', () => {
    it('for every slot shape, at times before, at and after the end', () => {
        const total = 25 * 60_000;
        const base = 1_000_000;
        const shapes: (SessionSlot | null)[] = [
            null,
            { isRunning: true, endAt: base + total, pausedRemainingMs: null, durationMs: total, sessionStartedAt: base, sessionId: 'a' },
            { isRunning: true, endAt: null, pausedRemainingMs: null, durationMs: total, sessionStartedAt: base, sessionId: 'b' },
            { isRunning: false, endAt: null, pausedRemainingMs: 600_000, durationMs: total, sessionStartedAt: base, sessionId: 'c' },
            { isRunning: false, endAt: null, pausedRemainingMs: null, durationMs: null, sessionStartedAt: null, sessionId: null },
        ];
        for (const slot of shapes) {
            const v = slotClockValues(slot);
            for (let now = base - 1_000; now <= base + total + 2_000; now += 7_919) {
                const uiThread = progressOf(remainingMsAt(v.isRunning, v.endAt, v.pausedRemainingMs, total, now) as number, total);
                const jsRender = progressOf(slotRemainingMs(slot, total, now) as number, total);
                expect(uiThread).toBe(jsRender);
            }
        }
    });
});
