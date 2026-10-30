// covers: FR-SET-001
import { render } from '@testing-library/react-native';

import { PRESETS, classicLayoutOf, durationsOf, presetFor } from '../presets';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import { V131_FULL } from '../../__fixtures__/storage/v131';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { save, STORAGE_KEYS } from '../../utils/storage';

// Classic's presets (Phase 1 D1; the owner, 2026-10-30): each sets all three durations.
describe('the presets', () => {
    it('are 25/5, 50/10, 52/17 and 90/20, each with its long break', () => {
        expect(PRESETS.map((p) => [p.focus, p.shortBreak, p.longBreak])).toEqual([
            [25, 5, 15],
            [50, 10, 30],
            [52, 17, 17],
            [90, 20, 20],
        ]);
    });

    it('round-trip through the durations they write', () => {
        for (const p of PRESETS) expect(presetFor(durationsOf(p))).toBe(p);
    });

    it('select nothing ("Custom") when any duration differs', () => {
        expect(presetFor({ focus: 25, shortBreak: 5, longBreak: 20 })).toBeNull();
        expect(presetFor({ focus: 30, shortBreak: 5, longBreak: 15 })).toBeNull();
    });

    it("leave the defaults selected as 25/5: today's settings are that preset", () => {
        expect(presetFor(useSettingsStore.getState().settings.durations)?.id).toBe('25-5');
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
