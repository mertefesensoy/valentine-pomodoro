/**
 * Classic's duration presets, and Custom (Phase 1 D1; plan §3.5, idea 8; the owner, 2026-10-30,
 * revised after the build 48 device check, F4: "25/5, 50/10, 90/20 and Custom; no 52/17").
 *
 * A preset sets all three durations; 90/20 comes from a method with no separate long break, so
 * its long break equals the short one. Custom is the durations typed in Settings, kept apart from
 * the presets so that choosing a preset never loses them. `longBreakEvery` is untouched.
 *
 * The session engine reads only `settings.durations`, as before. Two optional settings fields sit
 * beside it, read defensively, so stored settings from any version load with no migration:
 *   - `presetChoice`: what the Timer's control shows as selected.
 *   - `customDurations`: what Custom applies, and what Settings edits.
 *
 * Contract: pure. The patch functions return a `Partial<Settings>` for `updateSettings`; each
 * writes the active durations together with the choice and the custom durations, so the three
 * never disagree in storage.
 */
import type { Settings } from '../types';

type Durations = Settings['durations'];

export type PresetId = '25-5' | '50-10' | '90-20';
export type PresetChoice = PresetId | 'custom';

export type Preset = { id: PresetId } & Durations;

export const PRESETS: readonly Preset[] = [
    { id: '25-5', focus: 25, shortBreak: 5, longBreak: 15 },
    { id: '50-10', focus: 50, shortBreak: 10, longBreak: 30 },
    { id: '90-20', focus: 90, shortBreak: 20, longBreak: 20 },
];

/** Settings' limits for each duration, in minutes (FR-TMR-009). */
export const DURATION_LIMITS: Record<keyof Durations, { min: number; max: number }> = {
    focus: { min: 1, max: 180 },
    shortBreak: { min: 1, max: 60 },
    longBreak: { min: 1, max: 120 },
};

export function presetFor(d: Durations): Preset | null {
    return PRESETS.find((p) => p.focus === d.focus && p.shortBreak === d.shortBreak && p.longBreak === d.longBreak) ?? null;
}

export function durationsOf({ focus, shortBreak, longBreak }: Preset): Durations {
    return { focus, shortBreak, longBreak };
}

function isDurations(value: unknown): value is Durations {
    if (!value || typeof value !== 'object') return false;
    const d = value as Record<string, unknown>;
    return (Object.keys(DURATION_LIMITS) as (keyof Durations)[]).every((k) => {
        const n = d[k];
        return typeof n === 'number' && Number.isInteger(n) && n >= DURATION_LIMITS[k].min && n <= DURATION_LIMITS[k].max;
    });
}

/**
 * The selected choice. A stored one wins; with none stored (every install before build 49), the
 * preset whose three durations match the current ones, else Custom.
 */
export function presetChoiceOf(settings: Pick<Settings, 'durations' | 'presetChoice'>): PresetChoice {
    const stored = settings.presetChoice;
    if (stored === 'custom' || PRESETS.some((p) => p.id === stored)) return stored as PresetChoice;
    return presetFor(settings.durations)?.id ?? 'custom';
}

/** Custom's durations. Stored ones win; with none stored, the current durations, which until now were the user's own. */
export function customDurationsOf(settings: Pick<Settings, 'durations' | 'customDurations'>): Durations {
    return isDurations(settings.customDurations) ? settings.customDurations : settings.durations;
}

/** Choosing a preset or Custom on the Timer. */
export function choosePresetPatch(settings: Settings, choice: PresetChoice): Partial<Settings> {
    const customDurations = customDurationsOf(settings);
    const preset = PRESETS.find((p) => p.id === choice);
    return {
        presetChoice: preset ? preset.id : 'custom',
        durations: preset ? durationsOf(preset) : customDurations,
        customDurations,
    };
}

/** Editing one duration in Settings: it becomes Custom's, and Custom becomes the choice, so a typed duration is the one in use. */
export function editCustomPatch(settings: Settings, field: keyof Durations, minutes: number): Partial<Settings> {
    const customDurations = { ...customDurationsOf(settings), [field]: minutes };
    return { presetChoice: 'custom', durations: customDurations, customDurations };
}

export type ClassicLayout = 'ring' | 'spread';

/** The stored layout, read defensively: anything but 'spread' is the Ring (the default). */
export function classicLayoutOf(settings: Pick<Settings, 'classicLayout'>): ClassicLayout {
    return settings.classicLayout === 'spread' ? 'spread' : 'ring';
}
