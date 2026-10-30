/* eslint-disable @typescript-eslint/no-require-imports -- each launch loads its modules after jest.resetModules() */
import type { StartupMode } from '../startupVariant';

// Phase 1 B7: start-up work waits for the first frame (record §3.2), the
// hidden switch picks the arm (§3.3), and the probe keeps the marks (§3.4).
//
// The scheduler, the probe and the switch hold per-launch state in their
// modules, so each "cold launch" loads fresh copies (jest.resetModules). Node
// has no requestIdleCallback; tests that need one install a stub that runs on
// the next (fake) timer tick, as an idle task would on an empty JS queue.

// MMKV's Jest mock keeps its data per instance, and a module reset would make
// a new, empty one. On a phone the file outlives the process, so this file
// gives every launch the same mock instance (react-native-mmkv's own, not a
// stand-in), and a test clears it when it wants a fresh install.
const mockLaunchStorage = jest.requireActual('react-native-mmkv').createMMKV();
jest.mock('../../utils/appStorage', () => ({ appStorage: mockLaunchStorage }));

type Scheduler = typeof import('../deferredStartup');
type Probe = typeof import('../startupProbe');
type Variant = typeof import('../startupVariant');

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

let requestIdle: jest.Mock<void, [IdleCallback, { timeout?: number }?]>;

function installIdle(didTimeout = false) {
    requestIdle = jest.fn((callback: IdleCallback) => {
        setTimeout(() => callback({ didTimeout, timeRemaining: () => 50 }), 0);
    });
    (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = requestIdle;
}

/** A cold launch: fresh modules over the current storage, optionally with a stored mode. */
function launch(opts: { clear?: boolean; mode?: StartupMode } = {}): { scheduler: Scheduler; probe: Probe; variant: Variant } {
    jest.resetModules();
    const { appStorage } = require('../../utils/appStorage');
    const { MIGRATION_DONE, MIGRATION_FLAG_KEY } = require('../../utils/storageMigration');
    if (opts.clear ?? true) appStorage.clearAll();
    appStorage.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
    if (opts.mode) appStorage.set('startup_variant_v1', JSON.stringify({ mode: opts.mode, last: null }));
    return {
        scheduler: require('../deferredStartup'),
        probe: require('../startupProbe'),
        variant: require('../startupVariant'),
    };
}

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    delete (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback;
    jest.useRealTimers();
    jest.restoreAllMocks();
});

// covers: NFR-PERF-001
describe('runAfterFirstFrame, deferred arm', () => {
    it('queues work until the first frame, then runs it in one idle callback, in order', () => {
        installIdle();
        const { scheduler } = launch();
        const ran: string[] = [];

        scheduler.runAfterFirstFrame('a', () => ran.push('a'));
        scheduler.runAfterFirstFrame('b', () => ran.push('b'));
        jest.advanceTimersByTime(scheduler.FIRST_FRAME_FALLBACK_MS - 1);
        expect(ran).toEqual([]);

        scheduler.markFirstFrame();
        expect(ran).toEqual([]); // not synchronously in the layout handler
        // The probe's interactive callback, then the drain, both with the same timeout.
        expect(requestIdle).toHaveBeenCalledTimes(2);
        expect(requestIdle.mock.calls.map((c) => c[1])).toEqual([
            { timeout: scheduler.IDLE_TIMEOUT_MS },
            { timeout: scheduler.IDLE_TIMEOUT_MS },
        ]);

        jest.advanceTimersByTime(0);
        expect(ran).toEqual(['a', 'b']);
    });

    it('takes the interactive mark before the deferred work starts', () => {
        installIdle();
        const { scheduler, probe } = launch();
        scheduler.runAfterFirstFrame('ads.init', () => {});

        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);

        const row = probe.currentProbeRow();
        expect(row.arm).toBe('deferred');
        expect(row.trigger).toBe('idle');
        const order = Object.keys(row.marks);
        expect(order.indexOf('firstLayout')).toBeLessThan(order.indexOf('interactive'));
        expect(order.indexOf('interactive')).toBeLessThan(order.indexOf('ads.init:start'));
        expect(order).toContain('drainEnd');
    });

    it('runs work registered after the first frame at the next idle moment', () => {
        installIdle();
        const { scheduler } = launch();
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);

        const late = jest.fn();
        scheduler.runAfterFirstFrame('late', late);
        expect(late).not.toHaveBeenCalled();
        jest.advanceTimersByTime(0);
        expect(late).toHaveBeenCalledTimes(1);
    });

    it('records an idle callback that ran on its timeout', () => {
        installIdle(true);
        const { scheduler, probe } = launch();
        scheduler.runAfterFirstFrame('a', () => {});
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
        expect(probe.currentProbeRow().trigger).toBe('idle-timeout');
    });

    it('falls back after FIRST_FRAME_FALLBACK_MS when no first-frame signal arrives', () => {
        installIdle();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { scheduler, probe } = launch();
        const task = jest.fn();

        scheduler.runAfterFirstFrame('ads.init', task);
        jest.advanceTimersByTime(scheduler.FIRST_FRAME_FALLBACK_MS - 1);
        expect(task).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(task).toHaveBeenCalledTimes(1);
        expect(probe.currentProbeRow().trigger).toBe('fallback');

        // Later work no longer waits for the signal.
        const later = jest.fn();
        scheduler.runAfterFirstFrame('later', later);
        jest.advanceTimersByTime(0);
        expect(later).toHaveBeenCalledTimes(1);
    });

    it('uses setTimeout(0) where the runtime has no requestIdleCallback', () => {
        const { scheduler } = launch();
        const task = jest.fn();
        scheduler.runAfterFirstFrame('a', task);
        scheduler.markFirstFrame();
        expect(task).not.toHaveBeenCalled();
        jest.advanceTimersByTime(0);
        expect(task).toHaveBeenCalledTimes(1);
    });

    it('cancel removes a queued task, and does nothing once it has run', () => {
        installIdle();
        const { scheduler } = launch();
        const cancelled = jest.fn();
        const kept = jest.fn();
        const cancel = scheduler.runAfterFirstFrame('cancelled', cancelled);
        const cancelKept = scheduler.runAfterFirstFrame('kept', kept);

        cancel();
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
        cancelKept();

        expect(cancelled).not.toHaveBeenCalled();
        expect(kept).toHaveBeenCalledTimes(1);
    });

    it('a task that throws or rejects is logged and the others still run', async () => {
        installIdle();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { scheduler, probe } = launch();
        const after = jest.fn();

        scheduler.runAfterFirstFrame('throws', () => {
            throw new Error('boom');
        });
        scheduler.runAfterFirstFrame('rejects', () => Promise.reject(new Error('later boom')));
        scheduler.runAfterFirstFrame('after', after);
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
        await Promise.resolve();

        expect(after).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith('[startup] throws failed', expect.any(Error));
        expect(warn).toHaveBeenCalledWith('[startup] rejects failed', expect.any(Error));
        const marks = probe.currentProbeRow().marks;
        expect(marks['throws:end']).toBeDefined();
        expect(marks['rejects:end']).toBeDefined();
    });

    it('marks a task as ended when its promise settles', async () => {
        installIdle();
        const { scheduler, probe } = launch();
        let finish!: () => void;
        scheduler.runAfterFirstFrame('update.check', () => new Promise<void>((resolve) => (finish = resolve)));
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);

        expect(probe.currentProbeRow().marks['update.check:start']).toBeDefined();
        expect(probe.currentProbeRow().marks['update.check:end']).toBeUndefined();
        jest.advanceTimersByTime(300);
        finish();
        await Promise.resolve();
        await Promise.resolve();
        const marks = probe.currentProbeRow().marks;
        expect(marks['update.check:end'] - marks['update.check:start']).toBeCloseTo(300);
    });

    it('only the first markFirstFrame counts (the root lays out again on rotation)', () => {
        installIdle();
        const { scheduler, probe } = launch();
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(50);
        scheduler.markFirstFrame();

        expect(requestIdle).toHaveBeenCalledTimes(1); // the probe's; the queue was empty
        expect(probe.currentProbeRow().marks.firstLayout).toBe(probe.currentProbeRow().marks.probeInit);
    });
});

// Phase 1 B6 fix (B6 record §9): the tabs' pre-render waits for the interactive
// mark in both arms, after the deferred drain, one task per idle callback.
// covers: NFR-PERF-001
describe('runAfterInteractive', () => {
    // Idle callbacks queued and run one at a time, in request order, as the
    // runtime's idle-priority tasks with one timeout are.
    let idleQueue: IdleCallback[] = [];
    function installManualIdle() {
        idleQueue = [];
        (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = (callback: IdleCallback) => {
            idleQueue.push(callback);
        };
    }
    function runNextIdle() {
        idleQueue.shift()!({ didTimeout: false, timeRemaining: () => 50 });
    }

    it('deferred arm: after the interactive mark and the drain, one task per idle callback', () => {
        installManualIdle();
        const { scheduler, probe } = launch();
        const ran: string[] = [];
        scheduler.runAfterInteractive('tab.stats', () => ran.push('stats'));
        scheduler.runAfterInteractive('tab.notes', () => ran.push('notes'));
        scheduler.runAfterFirstFrame('ads.init', () => ran.push('ads'));
        jest.advanceTimersByTime(scheduler.FIRST_FRAME_FALLBACK_MS - 1);
        expect(ran).toEqual([]);

        scheduler.markFirstFrame();
        expect(idleQueue).toHaveLength(2); // the interactive mark, then the drain
        runNextIdle();
        expect(ran).toEqual([]);
        expect(idleQueue).toHaveLength(2); // the drain, then the first tab
        runNextIdle();
        expect(ran).toEqual(['ads']);
        runNextIdle();
        expect(ran).toEqual(['ads', 'stats']);
        runNextIdle();
        expect(ran).toEqual(['ads', 'stats', 'notes']);
        expect(idleQueue).toHaveLength(0);

        const order = Object.keys(probe.currentProbeRow().marks);
        expect(order.indexOf('interactive')).toBeLessThan(order.indexOf('drainEnd'));
        expect(order.indexOf('drainEnd')).toBeLessThan(order.indexOf('tab.stats:start'));
        expect(order.indexOf('tab.stats:start')).toBeLessThan(order.indexOf('tab.notes:start'));
    });

    it('eager arm: still waits for the interactive mark, unlike runAfterFirstFrame', () => {
        installManualIdle();
        const { scheduler } = launch({ mode: 'eager' });
        const tab = jest.fn();
        const ads = jest.fn();
        scheduler.runAfterInteractive('tab.stats', tab);
        scheduler.runAfterFirstFrame('ads.init', ads);
        expect(ads).toHaveBeenCalledTimes(1);
        expect(tab).not.toHaveBeenCalled();

        scheduler.markFirstFrame();
        runNextIdle(); // the interactive mark
        expect(tab).not.toHaveBeenCalled();
        runNextIdle();
        expect(tab).toHaveBeenCalledTimes(1);
    });

    it('a task registered after the interactive mark runs at the next idle moment', () => {
        installManualIdle();
        const { scheduler } = launch();
        scheduler.markFirstFrame();
        runNextIdle();

        const late = jest.fn();
        scheduler.runAfterInteractive('tab.notes', late);
        expect(late).not.toHaveBeenCalled();
        runNextIdle();
        expect(late).toHaveBeenCalledTimes(1);
    });

    it('cancel removes a task that has not started', () => {
        installIdle();
        const { scheduler } = launch();
        const kept = jest.fn();
        const cancelled = jest.fn();
        scheduler.runAfterInteractive('tab.stats', kept);
        const cancel = scheduler.runAfterInteractive('tab.notes', cancelled);
        cancel();

        scheduler.markFirstFrame();
        jest.advanceTimersByTime(1_000);
        expect(kept).toHaveBeenCalledTimes(1);
        expect(cancelled).not.toHaveBeenCalled();
    });

    it('never runs without the first-frame signal: a tab then renders on its first focus', () => {
        installIdle();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { scheduler } = launch();
        const tab = jest.fn();
        scheduler.runAfterInteractive('tab.stats', tab);
        scheduler.runAfterFirstFrame('ads.init', () => {});
        jest.advanceTimersByTime(60_000);
        expect(tab).not.toHaveBeenCalled();
    });
});

// covers: NFR-PERF-001
describe('the before/after switch', () => {
    it('eager: the pre-B7 path, every task runs when it is registered', () => {
        installIdle();
        const { scheduler, probe } = launch({ mode: 'eager' });
        const task = jest.fn();

        scheduler.runAfterFirstFrame('ads.init', task);
        expect(task).toHaveBeenCalledTimes(1);
        expect(probe.currentProbeRow()).toMatchObject({ arm: 'eager', trigger: 'eager' });

        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
        expect(task).toHaveBeenCalledTimes(1);
        expect(probe.currentProbeRow().marks.interactive).toBeDefined();
    });

    it('nothing stored, or storage not yet migrated: deferred, and nothing is written', () => {
        const { variant } = launch();
        expect(variant.resolveLaunchArm()).toBe('deferred');
        expect(variant.hasStartupSetting()).toBe(false);

        // First launch after the update: the B2 copy hasn't run, so the
        // setting can't exist and isn't even read.
        jest.resetModules();
        mockLaunchStorage.clearAll();
        const fresh: Variant = require('../startupVariant');
        expect(fresh.resolveLaunchArm()).toBe('deferred');
        expect(mockLaunchStorage.getAllKeys()).toEqual([]);
    });

    it('alternate: each launch runs the arm the previous one didn\'t', () => {
        const arms: string[] = [];
        let { variant } = launch({ mode: 'alternate' });
        arms.push(variant.resolveLaunchArm());
        for (let i = 0; i < 3; i++) {
            ({ variant } = launch({ clear: false }));
            arms.push(variant.resolveLaunchArm());
        }
        expect(arms).toEqual(['deferred', 'eager', 'deferred', 'eager']);
        expect(variant.readStartupMode()).toBe('alternate');
    });

    it('a mode chosen in the panel applies from the next launch', () => {
        installIdle();
        const { scheduler, variant, probe } = launch();
        scheduler.runAfterFirstFrame('a', () => {});
        variant.writeStartupMode('eager', 'deferred');
        expect(probe.currentProbeRow().arm).toBe('deferred');

        const next = launch({ clear: false });
        const task = jest.fn();
        next.scheduler.runAfterFirstFrame('a', task);
        expect(task).toHaveBeenCalledTimes(1);
    });
});

// covers: NFR-PERF-001
describe('the probe\'s stored rows', () => {
    function completeLaunch(scheduler: Scheduler) {
        scheduler.runAfterFirstFrame('ads.init', () => {});
        scheduler.markFirstFrame();
        jest.advanceTimersByTime(0);
        jest.advanceTimersByTime(1000); // the debounced write
    }

    it('writes nothing on an install where the panel was never opened', () => {
        installIdle();
        const { scheduler, probe } = launch();
        completeLaunch(scheduler);
        expect(probe.readProbeRows()).toEqual([]);
    });

    it('writes one row per launch once the panel has been opened, after the interactive mark', () => {
        installIdle();
        let { scheduler, probe } = launch({ mode: 'deferred' });
        scheduler.runAfterFirstFrame('ads.init', () => {});
        scheduler.markFirstFrame();
        expect(probe.readProbeRows()).toEqual([]); // nothing on the start-up path
        jest.advanceTimersByTime(0);
        jest.advanceTimersByTime(1000);
        expect(probe.readProbeRows()).toHaveLength(1);

        probe.markStartup('ads.loaded'); // a later mark updates the same row
        jest.advanceTimersByTime(1000);
        expect(probe.readProbeRows()).toHaveLength(1);
        expect(probe.readProbeRows()[0].marks['ads.loaded']).toBeDefined();

        jest.setSystemTime(Date.now() + 60_000); // the next launch gets a new id
        ({ scheduler, probe } = launch({ clear: false }));
        completeLaunch(scheduler);
        expect(probe.readProbeRows()).toHaveLength(2);
    });

    it('opening the panel stores the current launch; clearing drops it and every earlier row', () => {
        installIdle();
        const { scheduler, probe } = launch();
        completeLaunch(scheduler);
        expect(probe.readProbeRows()).toEqual([]);

        probe.enableProbePersistence();
        jest.advanceTimersByTime(1000);
        expect(probe.readProbeRows()).toHaveLength(1);

        probe.clearProbeRows();
        probe.markStartup('ads.loaded');
        jest.advanceTimersByTime(1000);
        expect(probe.readProbeRows()).toEqual([]);
    });

    it('keeps the newest MAX_PROBE_ROWS rows', () => {
        installIdle();
        const { scheduler, probe } = launch({ mode: 'deferred' });
        const older = Array.from({ length: probe.MAX_PROBE_ROWS }, (_, i) => ({ ...probe.currentProbeRow(), id: i + 1 }));
        mockLaunchStorage.set(probe.STARTUP_PROBE_KEY, JSON.stringify(older));

        completeLaunch(scheduler);

        const rows = probe.readProbeRows();
        expect(rows).toHaveLength(probe.MAX_PROBE_ROWS);
        expect(rows[0].id).toBe(2);
        expect(rows[rows.length - 1].id).toBe(probe.currentProbeRow().id);
    });
});

// covers: NFR-PERF-001
describe('clean runs (record §4.3)', () => {
    const { probe } = launch();
    const clean: import('../startupProbe').ProbeRow = {
        v: 1,
        id: 1,
        arm: 'deferred',
        trigger: 'idle',
        version: '1.4.0',
        build: '46',
        migrated: true,
        appState: 'active',
        clockOk: true,
        marks: { probeInit: 300, firstLayout: 620, interactive: 640, drainEnd: 642 },
    };

    it('accepts a complete launch of the build under test', () => {
        expect(probe.isCleanRun(clean, '46')).toBe(true);
        expect(probe.isCleanRun({ ...clean, arm: 'eager', trigger: 'eager' }, '46')).toBe(true);
        // iOS may still say `inactive` while a cold launch becomes active.
        expect(probe.isCleanRun({ ...clean, appState: 'inactive' }, '46')).toBe(true);
    });

    it('measures TTI from the bundle start when the clock check passed, and from the probe start always', () => {
        expect(probe.ttiOf(clean, 'jsStart')).toBe(640);
        expect(probe.ttiOf(clean, 'probeInit')).toBe(340);
        expect(probe.ttiPlusOf(clean, 'jsStart')).toBe(642);
        expect(probe.ttiPlusOf(clean, 'probeInit')).toBe(342);
        expect(probe.ttiPlusOf({ ...clean, marks: { probeInit: 300, interactive: 640 } }, 'probeInit')).toBe(340);
        expect(probe.ttiOf({ ...clean, marks: { probeInit: 300 } }, 'probeInit')).toBeNull();
    });

    it('a failed clock check keeps the run, with no bundle-relative TTI', () => {
        // Without the native marker the marks are relative to the probe's start.
        const noClock = { ...clean, clockOk: false, marks: { probeInit: 0, firstLayout: 320, interactive: 340, drainEnd: 342 } };
        expect(probe.isCleanRun(noClock, '46')).toBe(true);
        expect(probe.ttiOf(noClock, 'jsStart')).toBeNull();
        expect(probe.ttiPlusOf(noClock, 'jsStart')).toBeNull();
        expect(probe.ttiOf(noClock, 'probeInit')).toBe(probe.ttiOf(clean, 'probeInit'));
    });

    it.each([
        ['the one-time migration ran', { migrated: false }],
        ['no interactive mark', { marks: { probeInit: 300, firstLayout: 620 } }],
        ['it went to the background before the interactive mark', { appState: 'background' }],
        ['the first-frame signal was missing', { trigger: 'fallback' as const }],
        ['another build', { build: '45' }],
        ['no arm', { arm: null }],
    ])('excludes a launch when %s', (_reason, patch) => {
        expect(probe.isCleanRun({ ...clean, ...patch }, '46')).toBe(false);
    });
});
