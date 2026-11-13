import { act, render } from '@testing-library/react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake, ExpoKeepAwakeTag } from 'expo-keep-awake';
import { StoreGate } from '../../stores/StoreGate';
import { useSessionStore } from '../../stores/sessionStore';
import { save, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { isSessionRunning, KEEP_AWAKE_TAG } from '../useKeepScreenAwake';
import type { SessionClockState, SessionSlot } from '../../types';

// DEF-010: the screen stays on while a session runs, and only then. The tests
// mount the real StoreGate, so removing the hook's mount fails them. The
// native module is a stand-in that keeps the set of held tags, the way
// KeepAwakeModule.swift does: the screen stays on while any tag is held.
const mockHeldTags = new Set<string>();
const mockCalls: string[] = [];

jest.mock('expo-keep-awake', () => ({
    ExpoKeepAwakeTag: 'ExpoKeepAwakeDefaultTag',
    activateKeepAwakeAsync: jest.fn(async (tag: string) => {
        mockCalls.push(`activate ${tag}`);
        mockHeldTags.add(tag);
    }),
    deactivateKeepAwake: jest.fn(async (tag: string) => {
        mockCalls.push(`deactivate ${tag}`);
        mockHeldTags.delete(tag);
    }),
}));

// Modern fake timers also fake Date.now(), so sessions end on schedule.
jest.useFakeTimers();

/** Mounts StoreGate alone (it mounts the hook), and lets the hydration finish. */
async function mountGate() {
    const view = await render(<StoreGate>{null}</StoreGate>);
    await act(async () => {});
    return view;
}

/** Runs a session action, then lets the queued native mockCalls finish. */
async function run(action: () => void) {
    await act(async () => action());
    await act(async () => {});
}

const screenHeld = () => mockHeldTags.has(KEEP_AWAKE_TAG);
const session = () => useSessionStore.getState();

beforeEach(async () => {
    await resetStorage();
    mockHeldTags.clear();
    mockCalls.length = 0;
    jest.mocked(activateKeepAwakeAsync).mockClear();
    jest.mocked(deactivateKeepAwake).mockClear();
});

// covers: FR-TMR-011
describe('keeping the screen on (DEF-010)', () => {
    it('lets the screen lock while no session runs', async () => {
        await mountGate();
        expect(screenHeld()).toBe(false);
        expect(activateKeepAwakeAsync).not.toHaveBeenCalled();
    });

    it('keeps it on while a focus runs, and lets it lock when paused, resumed and stopped', async () => {
        await mountGate();

        await run(() => session().start({ kind: 'pomodoro', durationMs: 25 * 60_000, extras: { phase: 'focus' } }));
        expect(screenHeld()).toBe(true);

        await run(() => session().pause());
        expect(screenHeld()).toBe(false);

        await run(() => session().resume());
        expect(screenHeld()).toBe(true);

        // Skip and reset both stop the slot.
        await run(() => session().stop());
        expect(screenHeld()).toBe(false);
    });

    it('keeps it on during a break too', async () => {
        await mountGate();
        await run(() => session().start({ kind: 'pomodoro', durationMs: 5 * 60_000, extras: { phase: 'shortBreak' } }));
        expect(screenHeld()).toBe(true);
    });

    it('keeps it on during a flight, and lets it lock when switching to an idle Classic', async () => {
        await mountGate();
        await run(() => session().start({ kind: 'fly', durationMs: 60 * 60_000 }));
        expect(screenHeld()).toBe(true);

        // switchTo pauses the flight; Classic has no session yet.
        await run(() => session().switchTo('pomodoro'));
        expect(screenHeld()).toBe(false);
        expect(session().clock.fly?.isRunning).toBe(false);
    });

    it('lets the screen lock once the session completes', async () => {
        await mountGate();
        const unsubscribe = session().onComplete(() => {}, 'pomodoro');
        await run(() => session().start({ kind: 'pomodoro', durationMs: 60_000 }));
        expect(screenHeld()).toBe(true);

        await act(async () => jest.advanceTimersByTime(61_000));
        await act(async () => {});
        expect(session().clock.pomodoro).toBeNull();
        expect(screenHeld()).toBe(false);
        unsubscribe();
    });

    it('releases the screen when the gate unmounts mid-session', async () => {
        const view = await mountGate();
        await run(() => session().start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        expect(screenHeld()).toBe(true);

        await act(async () => view.unmount());
        await act(async () => {});
        expect(screenHeld()).toBe(false);
    });

    it('keeps the screen on at launch when a session is still running', async () => {
        const now = Date.now();
        await save(STORAGE_KEYS.SESSION_CLOCK, {
            activeKind: 'pomodoro',
            pomodoro: { isRunning: true, endAt: now + 10 * 60_000, pausedRemainingMs: null, durationMs: 25 * 60_000, sessionStartedAt: now - 15 * 60_000, sessionId: 'running' },
            fly: null,
        });
        await mountGate();
        expect(screenHeld()).toBe(true);
    });

    it('does not keep it on for an ended session that waits for its handler (DEF-004)', async () => {
        const now = Date.now();
        await save(STORAGE_KEYS.SESSION_CLOCK, {
            activeKind: 'fly',
            pomodoro: null,
            fly: { isRunning: true, endAt: now - 60_000, pausedRemainingMs: null, durationMs: 25 * 60_000, sessionStartedAt: now - 26 * 60_000, sessionId: 'ended' },
        });
        await mountGate();
        expect(session().clock.fly).not.toBeNull(); // still waiting: no fly handler here
        expect(screenHeld()).toBe(false);
    });

    it('uses its own tag, never the default one the dev wrapper holds', async () => {
        await mountGate();
        await run(() => session().start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        await run(() => session().stop());
        expect(KEEP_AWAKE_TAG).not.toBe(ExpoKeepAwakeTag);
        expect(mockCalls).toEqual([`activate ${KEEP_AWAKE_TAG}`, `deactivate ${KEEP_AWAKE_TAG}`]);
    });

    it('sends the release only after a slow hold has finished', async () => {
        let finishHold: () => void = () => {};
        jest.mocked(activateKeepAwakeAsync).mockImplementationOnce(
            (tag?: string) =>
                new Promise<void>((resolve) => {
                    finishHold = () => {
                        mockCalls.push(`activate ${tag}`);
                        mockHeldTags.add(tag!);
                        resolve();
                    };
                }),
        );
        await mountGate();
        await run(() => session().start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        await run(() => session().pause());
        expect(deactivateKeepAwake).not.toHaveBeenCalled();

        await act(async () => finishHold());
        await act(async () => {});
        expect(mockCalls).toEqual([`activate ${KEEP_AWAKE_TAG}`, `deactivate ${KEEP_AWAKE_TAG}`]);
        expect(screenHeld()).toBe(false);
    });

    it('carries on after a native call fails', async () => {
        jest.mocked(activateKeepAwakeAsync).mockRejectedValueOnce(new Error('no wake lock'));
        await mountGate();
        await run(() => session().start({ kind: 'pomodoro', durationMs: 25 * 60_000 }));
        await run(() => session().pause());
        await run(() => session().resume());
        expect(screenHeld()).toBe(true);
    });
});

describe('isSessionRunning', () => {
    const now = 1_000_000;
    const slot = (over: Partial<SessionSlot>): SessionSlot => ({
        isRunning: true, endAt: now + 1, pausedRemainingMs: null, durationMs: 60_000, sessionStartedAt: now - 59_999, sessionId: 's', ...over,
    });
    const clock = (over: Partial<SessionClockState>): SessionClockState => ({ activeKind: null, pomodoro: null, fly: null, ...over });

    it('is true only for a running active slot whose end is ahead', () => {
        expect(isSessionRunning(clock({}), now)).toBe(false);
        expect(isSessionRunning(clock({ activeKind: 'pomodoro', pomodoro: slot({}) }), now)).toBe(true);
        expect(isSessionRunning(clock({ activeKind: 'fly', fly: slot({}) }), now)).toBe(true);
        expect(isSessionRunning(clock({ activeKind: 'pomodoro', pomodoro: slot({ endAt: now }) }), now)).toBe(false);
        expect(isSessionRunning(clock({ activeKind: 'pomodoro', pomodoro: slot({ isRunning: false, endAt: null, pausedRemainingMs: 5_000 }) }), now)).toBe(false);
        // A running slot that isn't the active one doesn't count.
        expect(isSessionRunning(clock({ activeKind: 'fly', pomodoro: slot({}), fly: null }), now)).toBe(false);
    });
});
