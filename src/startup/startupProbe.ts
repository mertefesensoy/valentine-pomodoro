import { AppState } from 'react-native';
import * as Application from 'expo-application';
import { loadSync, saveSync } from '../utils/storage';
import { isStorageMigrated } from '../utils/storageMigration';
import { hasStartupSetting, type StartupArm } from './startupVariant';

/**
 * The start-up probe (Phase 1 B7, record §3.4 and §4.1): a few timestamps per
 * launch, from the JS bundle's start to the first frame and the first idle
 * moment, plus when the deferred start-up work ran.
 *
 * - Marks are kept in memory on every launch (a few performance.now() calls).
 * - They are written to MMKV only once the hidden panel in Settings has been
 *   opened on this install (record §5), and only after the interactive mark,
 *   so ordinary users store nothing and no write lands on the start-up path.
 * - The panel reads the stored rows; nothing leaves the phone unless the
 *   owner shares them from the panel.
 */

export const STARTUP_PROBE_KEY = 'startup_probe_v1';
export const MAX_PROBE_ROWS = 40;

/** How the deferred work was started on this launch. */
export type DrainTrigger = 'idle' | 'idle-timeout' | 'fallback' | 'eager';

export type ProbeRow = {
    v: 1;
    /** Wall-clock ms when this module was evaluated: the launch's id. */
    id: number;
    arm: StartupArm | null;
    trigger: DrainTrigger | null;
    version: string | null;
    build: string | null;
    /** Storage was already migrated when the bundle ran (false: the one-time B2 copy ran). */
    migrated: boolean;
    /** AppState when the interactive mark was taken. */
    appState: string | null;
    /** The bundle-start marker exists and passed the plausibility check (§4.1); marks are then relative to it. */
    clockOk: boolean;
    /** ms since the bundle started (or since this module evaluated, when !clockOk), 0.1 ms resolution. */
    marks: Record<string, number>;
};

type PerformanceLike = {
    now?: () => number;
    rnStartupTiming?: { executeJavaScriptBundleEntryPointStart?: number | null; endTime?: number | null };
};

function perf(): PerformanceLike | undefined {
    return (globalThis as { performance?: PerformanceLike }).performance;
}

function now(): number {
    return perf()?.now?.() ?? Date.now();
}

/** A bundle-start marker more than this before the probe's first timestamp is on another clock. */
const MAX_PLAUSIBLE_JS_START_MS = 10_000;
const PERSIST_DEBOUNCE_MS = 500;

// Taken while the bundle evaluates: this module is imported by AdManager and
// useUpdateCheck, both on the cold-start import graph.
const probeInitAt = now();
const launchId = Date.now();
const migratedAtLaunch = isStorageMigrated();

const marks = new Map<string, number>();
let arm: StartupArm | null = null;
let trigger: DrainTrigger | null = null;
let appStateAtInteractive: string | null = null;

let persistEnabled: boolean | null = null; // resolved at the first persist
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let excludeThisLaunch = false;

/** Records `name` at the current time. The first call for a name wins. */
export function markStartup(name: string): void {
    if (marks.has(name)) return;
    marks.set(name, now());
    if (marks.has('interactive')) schedulePersist();
}

/** The arm this launch runs (set once, by the scheduler). */
export function noteArm(value: StartupArm): void {
    if (arm === null) arm = value;
}

/** How the deferred work started; the first call wins. */
export function noteTrigger(value: DrainTrigger): void {
    if (trigger === null) trigger = value;
}

/** The first idle moment after the first frame: the TTI mark (§4.1). */
export function noteInteractive(): void {
    if (marks.has('interactive')) return;
    appStateAtInteractive = AppState.currentState ?? null;
    markStartup('interactive');
}

function readStartupTiming(): { jsStart?: number; jsEnd?: number } {
    try {
        const timing = perf()?.rnStartupTiming;
        const jsStart = timing?.executeJavaScriptBundleEntryPointStart;
        const jsEnd = timing?.endTime;
        return {
            jsStart: typeof jsStart === 'number' && Number.isFinite(jsStart) ? jsStart : undefined,
            jsEnd: typeof jsEnd === 'number' && Number.isFinite(jsEnd) ? jsEnd : undefined,
        };
    } catch {
        // Not every runtime has the native startup timing (Jest, web).
        return {};
    }
}

const round1 = (ms: number) => Math.round(ms * 10) / 10;

/** This launch's row, built from the marks so far. */
export function currentProbeRow(): ProbeRow {
    const { jsStart, jsEnd } = readStartupTiming();
    const clockOk =
        jsStart !== undefined &&
        probeInitAt - jsStart >= 0 &&
        probeInitAt - jsStart <= MAX_PLAUSIBLE_JS_START_MS;
    const origin = clockOk ? (jsStart as number) : probeInitAt;

    const rel: Record<string, number> = { probeInit: round1(probeInitAt - origin) };
    if (clockOk && jsEnd !== undefined) rel.jsEnd = round1(jsEnd - origin);
    for (const [name, at] of marks) rel[name] = round1(at - origin);

    return {
        v: 1,
        id: launchId,
        arm,
        trigger,
        version: Application.nativeApplicationVersion ?? null,
        build: Application.nativeBuildVersion ?? null,
        migrated: migratedAtLaunch,
        appState: appStateAtInteractive,
        clockOk,
        marks: rel,
    };
}

/** The stored rows, oldest first. */
export function readProbeRows(): ProbeRow[] {
    if (!isStorageMigrated()) return [];
    const rows = loadSync<unknown>(STARTUP_PROBE_KEY, []);
    return Array.isArray(rows) ? (rows as ProbeRow[]).filter((r) => r && r.v === 1) : [];
}

/** Deletes the stored rows; this launch isn't stored again either (the protocol's warm-up launch). */
export function clearProbeRows(): void {
    excludeThisLaunch = true;
    saveSync<ProbeRow[]>(STARTUP_PROBE_KEY, []);
}

/** Turns persistence on for this launch (the panel was just opened). */
export function enableProbePersistence(): void {
    persistEnabled = true;
    if (marks.has('interactive')) schedulePersist();
}

function schedulePersist(): void {
    if (persistTimer !== null) return;
    persistTimer = setTimeout(() => {
        persistTimer = null;
        persist();
    }, PERSIST_DEBOUNCE_MS);
}

function persist(): void {
    if (persistEnabled === null) persistEnabled = hasStartupSetting();
    if (!persistEnabled || excludeThisLaunch || !isStorageMigrated()) return;
    const row = currentProbeRow();
    const rows = readProbeRows().filter((r) => r.id !== row.id);
    rows.push(row);
    saveSync(STARTUP_PROBE_KEY, rows.slice(-MAX_PROBE_ROWS));
}

/**
 * Where a TTI is measured from (record §4.1):
 * - `jsStart`, b₀, the bundle's start: the absolute number for NFR-PERF-001,
 *   defined only when the row passed the clock check;
 * - `probeInit`, p₀, this module's first evaluation: always defined, and the
 *   two arms run identical code up to it, so it is what they are compared on.
 */
export type TtiOrigin = 'jsStart' | 'probeInit';

function fromOrigin(row: ProbeRow, at: number | undefined, origin: TtiOrigin): number | null {
    if (at === undefined) return null;
    if (origin === 'jsStart') return row.clockOk ? at : null;
    return at - (row.marks.probeInit ?? 0);
}

/** TTI = I − origin (§4.1), or null when the launch has no interactive mark or no such origin. */
export function ttiOf(row: ProbeRow, origin: TtiOrigin): number | null {
    return fromOrigin(row, row.marks.interactive, origin);
}

/** TTI⁺ = max(I, D) − origin: also charges the deferred arm for its own synchronous work. */
export function ttiPlusOf(row: ProbeRow, origin: TtiOrigin): number | null {
    const i = row.marks.interactive;
    if (i === undefined) return null;
    return fromOrigin(row, Math.max(i, row.marks.drainEnd ?? i), origin);
}

/**
 * The exclusion rules of the B7 record §4.3, fixed before measuring. A row is
 * a clean run of `build` when none of them applies. A failed clock check
 * doesn't exclude a row: it only has no `jsStart` TTI (ttiOf returns null).
 */
export function isCleanRun(row: ProbeRow, build: string | null): boolean {
    if (!row.migrated) return false;
    if (row.marks.interactive === undefined) return false;
    // Only a launch that went to the background is out: iOS may still report
    // `inactive` while a cold launch is becoming active.
    if (row.appState === 'background') return false;
    if (row.arm === 'deferred' && row.trigger === 'fallback') return false;
    if (row.build !== build) return false;
    return row.arm === 'deferred' || row.arm === 'eager';
}
