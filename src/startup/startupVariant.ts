import { STARTUP_REPORTS_ENABLED } from '../constants/features';
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
 *
 * With no setting from the panel, a launch uses the install's group (Phase 2 C4,
 * ADR-0051): drawn once at random, half and half, under a key of its own, so
 * that hasStartupSetting() keeps meaning that the panel was opened.
 */

export type StartupMode = 'deferred' | 'eager' | 'alternate';
export type StartupArm = 'deferred' | 'eager';

export const STARTUP_VARIANT_KEY = 'startup_variant_v1';
export const STARTUP_GROUP_KEY = 'startup_group_v1';

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

/** The install's group: read, or drawn and stored on its first launch. Today's order until the flag is on. */
function installGroup(): StartupArm {
    if (!STARTUP_REPORTS_ENABLED || !isStorageMigrated()) return 'deferred';
    const stored = loadSync<unknown>(STARTUP_GROUP_KEY, null);
    if (stored === 'deferred' || stored === 'eager') return stored;
    const group: StartupArm = Math.random() < 0.5 ? 'deferred' : 'eager';
    saveSync(STARTUP_GROUP_KEY, group);
    return group;
}

/**
 * Chooses this launch's arm. Called once per launch, by the scheduler's first
 * use. Writes in `alternate` mode, to remember the arm it chose, and once per
 * install, to store its group.
 */
export function resolveLaunchArm(): StartupArm {
    const stored = readStored();
    if (!stored) return installGroup();
    if (stored.mode === 'deferred') return 'deferred';
    if (stored.mode === 'eager') return 'eager';
    const arm: StartupArm = stored.last === 'deferred' ? 'eager' : 'deferred';
    saveSync<StoredVariant>(STARTUP_VARIANT_KEY, { mode: 'alternate', last: arm });
    return arm;
}
