import { create } from 'zustand';
import type { AppMode } from '../types';
import { resolveAppMode } from '../constants/features';
import { loadSync, saveSync, STORAGE_KEYS } from '../utils/storage';
import { isRecord } from './isRecord';

// The UI store (Phase 1 B3): which timer experience is shown (`app_mode`) and
// whether the first-launch gift screen has been seen (`gift_mode`). Replaces
// AppProvider's mode state and the useGiftMode hook. Phase 1 D1 adds the one-time
// v1.4 welcome (`welcome_v14`, an additive key; welcome brief §4).

export interface UiStore {
    /** Always a mode this platform can open: a stored or requested 'fly' becomes 'default' where Fly is unavailable. */
    activeMode: AppMode;
    hasSeenGiftMode: boolean;
    /** Whether the v1.4 welcome has shown. True until hydrated, so it can never flash early. */
    hasSeenWelcome: boolean;
    /**
     * Who the welcome greets, fixed at hydrate: 'updated' for an install that had already seen the
     * v1 gift screen (an existing user), 'fresh' otherwise. Read before the gift screen can change it.
     */
    welcomeAudience: 'updated' | 'fresh';
    /** Set when the app was opened from a notification: the welcome waits for a later launch. */
    welcomeDeferred: boolean;
    /** True once hydrate() has run. Everything below StoreGate sees true. */
    isReady: boolean;

    /** Reads both keys from MMKV synchronously. Never throws. */
    hydrate(): void;
    /** Resolves `mode` for this platform (resolveAppMode), then sets and persists it. */
    setActiveMode(mode: AppMode): void;
    dismissGiftMode(): void;
    /** Persists that the welcome has shown; it never shows again (the About replay is D2's). */
    markWelcomeSeen(): void;
    /** Holds the welcome back for this launch (opened from a notification; welcome brief §4). */
    deferWelcome(): void;
}

export const useUiStore = create<UiStore>()((set) => ({
    activeMode: 'default',
    // true until hydrated, so the gift screen can never flash before the stored value is known
    hasSeenGiftMode: true,
    hasSeenWelcome: true,
    welcomeAudience: 'updated',
    welcomeDeferred: false,
    isReady: false,

    hydrate() {
        try {
            const storedMode = loadSync<unknown>(STORAGE_KEYS.APP_MODE, 'default');
            const storedGift = loadSync<unknown>(STORAGE_KEYS.GIFT_MODE, null);
            const storedWelcome = loadSync<unknown>(STORAGE_KEYS.WELCOME, null);
            const hasSeenGiftMode = isRecord(storedGift) && storedGift.hasSeenGiftMode === true;
            set({
                // resolveAppMode turns a 'fly' this platform can't open into 'default'
                activeMode: resolveAppMode(storedMode === 'fly' ? 'fly' : 'default'),
                hasSeenGiftMode,
                hasSeenWelcome: isRecord(storedWelcome) && storedWelcome.seen === true,
                welcomeAudience: hasSeenGiftMode ? 'updated' : 'fresh',
                isReady: true,
            });
        } catch (error) {
            console.error('[uiStore] hydrate failed; using defaults:', error);
            // Unknown state: don't greet an existing user with the first-launch screen.
            set({ activeMode: 'default', hasSeenGiftMode: true, hasSeenWelcome: true, isReady: true });
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

    markWelcomeSeen() {
        set({ hasSeenWelcome: true });
        saveSync(STORAGE_KEYS.WELCOME, { seen: true });
    },

    deferWelcome() {
        set({ welcomeDeferred: true });
    },
}));
