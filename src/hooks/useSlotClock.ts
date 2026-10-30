/**
 * useSlotClock.ts
 *
 * A session slot's clock as the UI thread sees it (Phase 1 B4): SharedValues
 * that animations read from worklets, so the progress ring and Fly's plane
 * move with no React render per frame.
 *
 * Every write happens inside a session-store listener. Zustand calls listeners
 * synchronously inside set(), so a SharedValue changes in the same JS tick as
 * the slot it mirrors. A useEffect mirror would change it a frame later, and a
 * worklet would draw that frame from the old slot (the project's SharedValue
 * lesson). Effects only subscribe and take the first value.
 *
 * JS-side writes use `.set()`, the form the React Compiler accepts (Phase 1
 * B5); worklets keep `.value`.
 */

import { useContext, useEffect, useMemo } from 'react';
// Expo Router's own copy of React Navigation's context, the one its screens
// provide. `@react-navigation/native` exports a different object, which reads
// undefined inside a router screen (Phase 1 B6). Deprecated upstream: when it
// is removed, take the focus signal from FreezeOnBlur instead.
import { NavigationContext } from 'expo-router/react-navigation';
import { useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { getClockNow } from '../stores/clockStore';
import { useSessionStore } from '../stores/sessionStore';
import type { SessionKind, SessionSlot } from '../types';
import { progressOf, remainingMsAt } from '../utils/clockMath';

/** A slot's clock fields, flattened for a worklet. */
export interface SlotClockValues {
    /** Running with an end time; the only state in which time moves. */
    isRunning: boolean;
    /** The end epoch ms while running; −∞ otherwise (FlyModeScreen's sentinel). */
    endAt: number;
    /** The slot's duration, 0 with no slot or none recorded. */
    durationMs: number;
    /** The paused remainder, or null. */
    pausedRemainingMs: number | null;
}

/** Flattens a slot (or its absence) into the values a worklet reads. Pure. */
export function slotClockValues(slot: SessionSlot | null | undefined): SlotClockValues {
    const isRunning = !!slot?.isRunning && !!slot.endAt;
    return {
        isRunning,
        endAt: isRunning ? (slot!.endAt as number) : Number.NEGATIVE_INFINITY,
        durationMs: slot?.durationMs ?? 0,
        pausedRemainingMs: slot?.pausedRemainingMs ?? null,
    };
}

export interface SlotSharedValues {
    isRunning: SharedValue<boolean>;
    endAt: SharedValue<number>;
    durationMs: SharedValue<number>;
    pausedRemainingMs: SharedValue<number | null>;
}

/**
 * SharedValues equal to the `kind` slot's clock fields (slotClockValues), kept
 * equal synchronously on every change of that slot. The returned object and
 * its SharedValues keep their identity for the component's life.
 */
export function useSlotSharedValues(kind: SessionKind): SlotSharedValues {
    // First values only: useSharedValue ignores its argument after mount.
    const initial = slotClockValues(useSessionStore.getState().clock[kind]);
    const isRunning = useSharedValue(initial.isRunning);
    const endAt = useSharedValue(initial.endAt);
    const durationMs = useSharedValue(initial.durationMs);
    const pausedRemainingMs = useSharedValue(initial.pausedRemainingMs);

    useEffect(() => {
        const write = (slot: SessionSlot | null) => {
            const v = slotClockValues(slot);
            isRunning.set(v.isRunning);
            endAt.set(v.endAt);
            durationMs.set(v.durationMs);
            pausedRemainingMs.set(v.pausedRemainingMs);
        };
        // Catch up on a change between the first render and this effect.
        write(useSessionStore.getState().clock[kind]);
        return useSessionStore.subscribe((state, prev) => {
            if (state.clock[kind] !== prev.clock[kind]) write(state.clock[kind]);
        });
    }, [kind, isRunning, endAt, durationMs, pausedRemainingMs]);

    return useMemo(
        () => ({ isRunning, endAt, durationMs, pausedRemainingMs }),
        [isRunning, endAt, durationMs, pausedRemainingMs],
    );
}

/**
 * The progress (0 → 1) of the `kind` slot against `totalMs`, as a SharedValue
 * derived on the UI thread: 1 − remaining/total, with the remaining time from
 * endAt − now while it runs, else the paused remainder, else `totalMs` (0).
 * The same functions compute it as TimerScreen did at render before B4
 * (clockMath; pinned equal by useSlotClock.test).
 *
 * While the slot runs, a frame callback advances `now` each frame. It runs only
 * while the slot runs **and the screen is focused**: freezeOnBlur suspends
 * React in a hidden tab, not worklets, so the hook switches the callback off on
 * `blur` and back on on `focus`, in the navigation listeners themselves (a
 * frozen screen wouldn't commit a state update). Outside a navigator (tests)
 * the screen counts as focused.
 */
export function useSlotProgress(kind: SessionKind, totalMs: number): SharedValue<number> {
    const clock = useSlotSharedValues(kind);
    const now = useSharedValue(getClockNow());
    const frame = useFrameCallback(() => {
        'worklet';
        now.value = Date.now();
    }, false);
    const navigation = useContext(NavigationContext);

    useEffect(() => {
        let focused = navigation?.isFocused() ?? true;
        // Runs after useSlotSharedValues' listener (subscribed first), so the
        // clock values are already the new ones.
        const apply = () => {
            now.set(Date.now());
            frame.setActive(focused && slotClockValues(useSessionStore.getState().clock[kind]).isRunning);
        };
        apply();
        const unsubscribers = [
            useSessionStore.subscribe((state, prev) => {
                if (state.clock[kind] !== prev.clock[kind]) apply();
            }),
        ];
        if (navigation) {
            unsubscribers.push(
                navigation.addListener('focus', () => {
                    focused = true;
                    apply();
                }),
                navigation.addListener('blur', () => {
                    focused = false;
                    apply();
                }),
            );
        }
        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
            frame.setActive(false);
        };
    }, [kind, navigation, now, frame]);

    return useDerivedValue(() =>
        progressOf(
            remainingMsAt(clock.isRunning.value, clock.endAt.value, clock.pausedRemainingMs.value, totalMs, now.value) as number,
            totalMs,
        ),
    );
}
