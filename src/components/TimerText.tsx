import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { useDisplayedSeconds } from '../stores/clockStore';
import type { SessionKind } from '../types';
import { formatTime } from '../utils/time';

interface TimerTextProps {
    /** The session slot whose remaining time this shows. */
    kind: SessionKind;
    /**
     * What it shows with no session of that kind, or a paused one with no
     * remainder: a duration in ms, or null for `--:--`.
     */
    idleMs: number | null;
    style?: StyleProp<TextStyle>;
}

/**
 * The remaining time of one session slot, as MM:SS (Phase 1 B4).
 *
 * The leaf the clock store exists for: it is the only component in the app
 * that subscribes to the displayed second, so while a session runs it is the
 * only thing that re-renders each second (FR-TMR-006, NFR-PERF-003). Its
 * parent re-renders only when the session itself changes (start, pause,
 * resume, stop).
 *
 * Its digits are always tabular ("The Steady Digits Rule", DESIGN.md; ADR-0046): the variant
 * is applied after the caller's style, so no caller can drop it and no digit jiggles as it counts.
 */
export default function TimerText({ kind, idleMs, style }: TimerTextProps) {
    const seconds = useDisplayedSeconds(kind, idleMs);
    return <Text style={[style, styles.steady]}>{seconds === null ? '--:--' : formatTime(seconds * 1000)}</Text>;
}

const styles = StyleSheet.create({
    steady: { fontVariant: ['tabular-nums'] },
});
