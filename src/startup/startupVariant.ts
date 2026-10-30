import { loadSync, saveSync } from '../utils/storage';
import { isStorageMigrated } from '../utils/storageMigration';

/**
 * The hidden before/after switch for the start-up measurement (Phase 1 B7,
 * record §3.3). One TestFlight build has to give both the "before" and the
 * "after" numbers, so the pre-B7 path stays selectable at run time:
 *
 * - `deferred` (the default, also when nothing is stored): start-up work
 *   waits for the first frame;
 * - `eager`: every task runs when it is registered, as before B7;
 * - `alternate`: each launch runs the arm the previous one didn't, so one
 *   session of cold starts measures both arms with drift spread evenly.
 *
 * Set only from the hidden panel in Settings → About. A user who never opens
 * it never has the key written.
 */

export type StartupMode = 'deferred' | 'eager' | 'alternate';
export type StartupArm = 'deferred' | 'eager';

export const STARTUP_VARIANT_KEY = 'startup_variant_v1';

type StoredVariant = { mode: StartupMode; last: StartupArm | null };

function isMode(v: unknown): v is StartupMode {
    return v === 'deferred' || v === 'eager' || v === 'alternate';
}

/** The stored setting, or null when the panel was never opened. */
function readStored(): StoredVariant | null {
    // Before the one-time B2 copy has finished the key can't exist, and
    // loadSync would refuse to read; don't ask.
    if (!isStorageMigrated()) return null;
    const stored = loadSync<Partial<StoredVariant> | null>(STARTUP_VARIANT_KEY, null);
    if (!stored || !isMode(stored.mode)) return null;
    return { mode: stored.mode, last: stored.last === 'eager' || stored.last === 'deferred' ? stored.last : null };
}

/** The mode the next launches use, for the panel. */
export function readStartupMode(): StartupMode {
    return readStored()?.mode ?? 'deferred';
}

/** Whether the panel has ever been opened on this install (the probe persists only then). */
export function hasStartupSetting(): boolean {
    return readStored() !== null;
}

/** Stores the mode for the next launches; the current launch keeps its arm. */
export function writeStartupMode(mode: StartupMode, current: StartupArm): void {
    saveSync<StoredVariant>(STARTUP_VARIANT_KEY, { mode, last: current });
}

/**
 * Chooses this launch's arm. Called once per launch, by the scheduler's first
 * use. Writes only in `alternate` mode, to remember the arm it chose.
 */
export function resolveLaunchArm(): StartupArm {
    const stored = readStored();
    if (!stored || stored.mode === 'deferred') return 'deferred';
    if (stored.mode === 'eager') return 'eager';
    const arm: StartupArm = stored.last === 'deferred' ? 'eager' : 'deferred';
    saveSync<StoredVariant>(STARTUP_VARIANT_KEY, { mode: 'alternate', last: arm });
    return arm;
}
