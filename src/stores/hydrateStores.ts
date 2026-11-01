import { useNotesStore } from './notesStore';
import { useSessionStore } from './sessionStore';
import { useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';
import { useUiStore } from './uiStore';
import { useTourStore } from '../screens/tutorial/tourStore';

/**
 * Hydrates all six stores from MMKV, synchronously (Phase 1 B3; the tour's joined in D5).
 *
 * - Precondition: the B2 migration has finished (isStorageMigrated()). Before
 *   that, loadSync() reads nothing and every store would get its defaults.
 * - Each store's hydrate() replaces its persisted fields with the stored values
 *   (defaults where a key is missing or unusable), resets its transient fields
 *   (the tick, the goal pulse) and sets isReady. None of them throws.
 * - Idempotent: running it again re-reads the same MMKV values. React may run
 *   StoreGate's initializer twice in development (Strict Mode), and each test
 *   that mounts a StoreGate gets stores reset to what its storage holds.
 */
export function hydrateStores(): void {
    useSettingsStore.getState().hydrate();
    useNotesStore.getState().hydrate();
    useStatsStore.getState().hydrate();
    useSessionStore.getState().hydrate();
    useUiStore.getState().hydrate();
    useTourStore.getState().hydrate();
}
