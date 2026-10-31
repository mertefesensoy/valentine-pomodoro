import { create } from 'zustand';

/** The Settings groups another screen can open Settings at. */
export type SettingsSection = 'goal';

/**
 * A Settings group another screen asks to show (Phase 1 D2; the Stats contract: "Turn on a daily
 * goal" opens Settings at the goal row). Not persisted, like the love-note sheet's store.
 * - `request(section)`: the caller asks, then navigates to `/settings`.
 * - `clear()`: Settings calls it once it has scrolled the group into view, so a later visit opens
 *   where it was left.
 */
export interface SettingsFocusStore {
    section: SettingsSection | null;
    request(section: SettingsSection): void;
    clear(): void;
}

export const useSettingsFocus = create<SettingsFocusStore>()((set) => ({
    section: null,
    request: (section) => set({ section }),
    clear: () => set({ section: null }),
}));
