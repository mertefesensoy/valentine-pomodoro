/**
 * Classic's duration presets (Phase 1 D1; plan §3.5, idea 8; the owner, 2026-10-30).
 *
 * A preset sets all three durations. 52/17 and 90/20 come from methods with no separate
 * long break, so theirs equals the short one. `longBreakEvery` is untouched, and the session
 * engine sees only the durations it already reads.
 *
 * Contract: pure. `presetFor` returns the preset whose three durations all match, or null
 * ("Custom") for any other combination the user set in Settings.
 */
import type { Settings } from '../types';

type Durations = Settings['durations'];

export type PresetId = '25-5' | '50-10' | '52-17' | '90-20';

export type Preset = { id: PresetId } & Durations;

export const PRESETS: readonly Preset[] = [
    { id: '25-5', focus: 25, shortBreak: 5, longBreak: 15 },
    { id: '50-10', focus: 50, shortBreak: 10, longBreak: 30 },
    { id: '52-17', focus: 52, shortBreak: 17, longBreak: 17 },
    { id: '90-20', focus: 90, shortBreak: 20, longBreak: 20 },
];

export function presetFor(d: Durations): Preset | null {
    return PRESETS.find((p) => p.focus === d.focus && p.shortBreak === d.shortBreak && p.longBreak === d.longBreak) ?? null;
}

export function durationsOf({ focus, shortBreak, longBreak }: Preset): Durations {
    return { focus, shortBreak, longBreak };
}

export type ClassicLayout = 'ring' | 'spread';

/** The stored layout, read defensively: anything but 'spread' is the Ring (the default). */
export function classicLayoutOf(settings: Pick<Settings, 'classicLayout'>): ClassicLayout {
    return settings.classicLayout === 'spread' ? 'spread' : 'ring';
}
