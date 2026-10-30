// covers: FR-SET-001, FR-TMR-009, FR-TMR-010
import { render } from '@testing-library/react-native';

import {
    PRESETS,
    choosePresetPatch,
    classicLayoutOf,
    customDurationsOf,
    durationsOf,
    editCustomPatch,
    presetChoiceOf,
    presetFor,
} from '../presets';
import { DEFAULT_SETTINGS } from '../defaults';
import type { Settings } from '../../types';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import { V131_FULL } from '../../__fixtures__/storage/v131';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { save, STORAGE_KEYS } from '../../utils/storage';

// Classic's presets (Phase 1 D1; the owner, 2026-10-30): each sets all three durations.
// After build 48 (F4): 25/5, 50/10 and 90/20, with Custom keeping the durations typed in Settings.
describe('the presets', () => {
    it('are 25/5, 50/10 and 90/20, each with its long break; 52/17 is gone', () => {
        expect(PRESETS.map((p) => [p.focus, p.shortBreak, p.longBreak])).toEqual([
            [25, 5, 15],
            [50, 10, 30],
            [90, 20, 20],
        ]);
    });

    it('round-trip through the durations they write', () => {
        for (const p of PRESETS) expect(presetFor(durationsOf(p))).toBe(p);
    });

    it('match nothing when any duration differs', () => {
        expect(presetFor({ focus: 25, shortBreak: 5, longBreak: 20 })).toBeNull();
        expect(presetFor({ focus: 52, shortBreak: 17, longBreak: 17 })).toBeNull();
    });

    it("leave the defaults selected as 25/5: today's settings are that preset", () => {
        expect(presetChoiceOf(useSettingsStore.getState().settings)).toBe('25-5');
    });
});

const settingsWith = (patch: Partial<Settings>): Settings => ({ ...DEFAULT_SETTINGS, ...patch });

describe('Custom', () => {
    beforeEach(async () => {
        await resetStorage();
    });

    it('with nothing stored, derives the choice from the durations, and Custom keeps them', () => {
        const mine = { focus: 40, shortBreak: 8, longBreak: 20 };
        expect(presetChoiceOf(settingsWith({ durations: mine }))).toBe('custom');
        expect(customDurationsOf(settingsWith({ durations: mine }))).toEqual(mine);
        // A build 48 tester's 52/17 becomes Custom 52/17.
        expect(presetChoiceOf(settingsWith({ durations: { focus: 52, shortBreak: 17, longBreak: 17 } }))).toBe('custom');
    });

    it('never loses the typed durations to a preset, and gets them back', () => {
        const mine = { focus: 40, shortBreak: 8, longBreak: 20 };
        const afterPreset = settingsWith({ durations: mine, ...choosePresetPatch(settingsWith({ durations: mine }), '90-20') });
        expect(afterPreset.durations).toEqual({ focus: 90, shortBreak: 20, longBreak: 20 });
        expect(presetChoiceOf(afterPreset)).toBe('90-20');
        expect(customDurationsOf(afterPreset)).toEqual(mine);

        const back = settingsWith({ ...afterPreset, ...choosePresetPatch(afterPreset, 'custom') });
        expect(back.durations).toEqual(mine);
        expect(presetChoiceOf(back)).toBe('custom');
    });

    it("a duration edited in Settings becomes Custom's and the one in use", () => {
        const on50 = settingsWith(choosePresetPatch(settingsWith({}), '50-10'));
        const edited = settingsWith({ ...on50, ...editCustomPatch(on50, 'focus', 35) });
        expect(presetChoiceOf(edited)).toBe('custom');
        expect(edited.durations).toEqual({ focus: 35, shortBreak: 5, longBreak: 15 });
        expect(customDurationsOf(edited)).toEqual(edited.durations);
    });

    it('reads a stored choice or custom durations defensively', () => {
        const d = { focus: 25, shortBreak: 5, longBreak: 15 };
        expect(presetChoiceOf(settingsWith({ durations: d, presetChoice: '52-17' as never }))).toBe('25-5');
        expect(customDurationsOf(settingsWith({ durations: d, customDurations: { focus: 0, shortBreak: 5, longBreak: 15 } }))).toEqual(d);
        expect(customDurationsOf(settingsWith({ durations: d, customDurations: { focus: 999 } as never }))).toEqual(d);
    });

    it("an existing install keeps its v1.3.1 lengths, as Custom when they match no preset (the fixture's 50/10/20)", async () => {
        await save(STORAGE_KEYS.SETTINGS, V131_FULL.settings);
        await render(<StoreGate>{null}</StoreGate>);
        const { settings } = useSettingsStore.getState();
        expect(settings.durations).toEqual(V131_FULL.settings.durations);
        expect(presetChoiceOf(settings)).toBe('custom');
        expect(customDurationsOf(settings)).toEqual(V131_FULL.settings.durations);
    });

    it('persists the choice and Custom across a restart', async () => {
        await render(<StoreGate>{null}</StoreGate>);
        const { updateSettings } = useSettingsStore.getState();
        updateSettings(editCustomPatch(useSettingsStore.getState().settings, 'focus', 45));
        updateSettings(choosePresetPatch(useSettingsStore.getState().settings, '50-10'));
        useSettingsStore.getState().hydrate();
        const { settings } = useSettingsStore.getState();
        expect(presetChoiceOf(settings)).toBe('50-10');
        expect(settings.durations).toEqual({ focus: 50, shortBreak: 10, longBreak: 30 });
        expect(customDurationsOf(settings)).toEqual({ focus: 45, shortBreak: 5, longBreak: 15 });
    });
});

describe('classicLayout', () => {
    beforeEach(async () => {
        await resetStorage();
    });

    it('reads anything but "spread" as the Ring', () => {
        expect(classicLayoutOf({ classicLayout: 'spread' })).toBe('spread');
        expect(classicLayoutOf({ classicLayout: 'ring' })).toBe('ring');
        expect(classicLayoutOf({ classicLayout: 'pages' as never })).toBe('ring');
        expect(classicLayoutOf({ classicLayout: undefined as never })).toBe('ring');
    });

    it('defaults to the Ring for an existing install, whose stored settings never had it, and keeps every other value', async () => {
        await save(STORAGE_KEYS.SETTINGS, V131_FULL.settings);
        await render(<StoreGate>{null}</StoreGate>);
        const { settings } = useSettingsStore.getState();
        expect(settings.classicLayout).toBe('ring');
        expect(settings).toEqual({ ...V131_FULL.settings, classicLayout: 'ring' });
    });

    it('persists a change to Facing Pages across a restart', async () => {
        await render(<StoreGate>{null}</StoreGate>);
        useSettingsStore.getState().updateSettings({ classicLayout: 'spread' });
        useSettingsStore.getState().hydrate();
        expect(useSettingsStore.getState().settings.classicLayout).toBe('spread');
    });
});
