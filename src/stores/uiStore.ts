import { create } from 'zustand';
import type { AppMode } from '../types';
import { resolveAppMode } from '../constants/features';
import { loadSync, saveSync, STORAGE_KEYS } from '../utils/storage';
import { isRecord } from './isRecord';

// The UI store (Phase 1 B3): which timer experience is shown (`app_mode`) and
// whether the first-launch gift screen has been seen (`gift_mode`). Replaces
// AppProvider's mode state and the useGiftMode hook.

export interface UiStore {
    /** Always a mode this platform can open: a stored or requested 'fly' becomes 'default' where Fly is unavailable. */
    activeMode: AppMode;
    hasSeenGiftMode: boolean;
    /** True once hydrate() has run. Everything below StoreGate sees true. */
    isReady: boolean;

    /** Reads both keys from MMKV synchronously. Never throws. */
    hydrate(): void;
    /** Resolves `mode` for this platform (resolveAppMode), then sets and persists it. */
    setActiveMode(mode: AppMode): void;
    dismissGiftMode(): void;
}

export const useUiStore = create<UiStore>()((set) => ({
    activeMode: 'default',
    // true until hydrated, so the gift screen can never flash before the stored value is known
    hasSeenGiftMode: true,
    isReady: false,

    hydrate() {
        try {
            const storedMode = loadSync<unknown>(STORAGE_KEYS.APP_MODE, 'default');
            const storedGift = loadSync<unknown>(STORAGE_KEYS.GIFT_MODE, null);
            set({
                // resolveAppMode turns a 'fly' this platform can't open into 'default'
                activeMode: resolveAppMode(storedMode === 'fly' ? 'fly' : 'default'),
                hasSeenGiftMode: isRecord(storedGift) && storedGift.hasSeenGiftMode === true,
                isReady: true,
            });
        } catch (error) {
            console.error('[uiStore] hydrate failed; using defaults:', error);
            // Unknown state: don't greet an existing user with the first-launch screen.
            set({ activeMode: 'default', hasSeenGiftMode: true, isReady: true });
        }
    },

    setActiveMode(mode) {
        const activeMode = resolveAppMode(mode);
        set({ activeMode });
        saveSync(STORAGE_KEYS.APP_MODE, activeMode);
    },

    dismissGiftMode() {
        set({ hasSeenGiftMode: true });
        saveSync(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
    },
}));
