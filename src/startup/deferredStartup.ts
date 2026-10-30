import { resolveLaunchArm, type StartupArm } from './startupVariant';
import { markStartup, noteArm, noteInteractive, noteTrigger, type DrainTrigger } from './startupProbe';

/**
 * Start-up work that can wait for the first frame (Phase 1 B7, record §3.2).
 *
 * The ads SDK start and the update check used to run in the root's mount
 * effects, before the first frame. They now queue here and run in one idle
 * callback once the root view has laid out.
 *
 * - `markFirstFrame()` is the signal: the root view's first `onLayout`. It is
 *   called from the app's root layout (B6's `app/_layout.tsx`, record §3.6).
 * - If no signal arrives within FIRST_FRAME_FALLBACK_MS of the first task, the
 *   queue runs anyway (trigger `fallback`), so the interstitial and the update
 *   check never depend on the wiring (FR-ADS-001, FR-UPD-001).
 * - In the `eager` arm of the hidden before/after switch (startupVariant.ts),
 *   every task runs when it is registered: the path before B7.
 *
 * RN 0.88 facts this relies on (record §3.2): requestAnimationFrame is
 * setTimeout(0) in bridgeless mode, so it is not used; requestIdleCallback is
 * an idle-priority task in the runtime scheduler, and a `timeout` under 5 min
 * becomes 10 s + timeout, so a drain runs at most ~11 s after it is scheduled.
 */

/** Passed to requestIdleCallback; RN turns it into 10 s + this (see above). */
export const IDLE_TIMEOUT_MS = 1000;
/** How long the queue waits for markFirstFrame() after its first task. */
export const FIRST_FRAME_FALLBACK_MS = 2000;

type Task = { name: string; run: () => unknown };
type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
type RequestIdleCallback = (callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }) => unknown;

let launchArm: StartupArm | null = null;
let firstFrameSeen = false;
// True once the queue may drain: after the first frame, or after the fallback.
let released = false;
let drainScheduled = false;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
const queue: Task[] = [];
// runAfterInteractive (Phase 1 B6 fix): released by the interactive mark, in both arms.
let interactiveSeen = false;
let afterInteractiveScheduled = false;
const afterInteractive: Task[] = [];

function arm(): StartupArm {
    if (launchArm === null) {
        launchArm = resolveLaunchArm();
        noteArm(launchArm);
    }
    return launchArm;
}

/**
 * Calls `callback` once the JS thread has no higher-priority work queued:
 * requestIdleCallback where the runtime has it (RN bridgeless), else a
 * setTimeout(0). Idle callbacks with the same timeout run in the order they
 * were requested.
 */
function whenIdle(callback: (didTimeout: boolean) => void): void {
    const requestIdle = (globalThis as { requestIdleCallback?: RequestIdleCallback }).requestIdleCallback;
    if (typeof requestIdle === 'function') {
        requestIdle((deadline) => callback(deadline.didTimeout), { timeout: IDLE_TIMEOUT_MS });
    } else {
        setTimeout(() => callback(false), 0);
    }
}

function startTask(task: Task): void {
    markStartup(`${task.name}:start`);
    const finished = () => markStartup(`${task.name}:end`);
    let result: unknown;
    try {
        result = task.run();
    } catch (e) {
        console.warn(`[startup] ${task.name} failed`, e);
        finished();
        return;
    }
    Promise.resolve(result).then(finished, (e: unknown) => {
        console.warn(`[startup] ${task.name} failed`, e);
        finished();
    });
}

function drain(trigger: DrainTrigger): void {
    drainScheduled = false;
    noteTrigger(trigger);
    const tasks = queue.splice(0);
    for (const task of tasks) startTask(task);
    if (tasks.length > 0) markStartup('drainEnd');
}

function scheduleDrain(): void {
    if (drainScheduled) return;
    drainScheduled = true;
    whenIdle((didTimeout) => drain(didTimeout ? 'idle-timeout' : 'idle'));
}

function onFallback(): void {
    fallbackTimer = null;
    if (released) return;
    released = true;
    if (__DEV__) {
        console.warn('[startup] no first-frame signal: call markFirstFrame() from the root view\'s onLayout');
    }
    drain('fallback');
}

/**
 * Runs `run` after the first frame (record §3.2).
 *
 * @param name  the probe's label for the task's start and end marks
 * @param run   the work; synchronous, or returning a promise
 * @returns     a cancel function: removes the task if it hasn't started yet
 *
 * Each task runs at most once. Queued tasks run in registration order; one
 * that throws or rejects is logged and doesn't stop the others. In the eager
 * arm the task runs now, synchronously.
 */
export function runAfterFirstFrame(name: string, run: () => unknown): () => void {
    const task: Task = { name, run };
    if (arm() === 'eager') {
        noteTrigger('eager');
        startTask(task);
        return () => {};
    }

    queue.push(task);
    if (released) {
        scheduleDrain();
    } else if (fallbackTimer === null) {
        fallbackTimer = setTimeout(onFallback, FIRST_FRAME_FALLBACK_MS);
    }
    return () => {
        const i = queue.indexOf(task);
        if (i >= 0) queue.splice(i, 1);
    };
}

/** Runs the next after-interactive task in its own idle callback, then schedules the one after. */
function scheduleAfterInteractive(): void {
    if (afterInteractiveScheduled || afterInteractive.length === 0) return;
    afterInteractiveScheduled = true;
    whenIdle(() => {
        afterInteractiveScheduled = false;
        const task = afterInteractive.shift();
        if (task) startTask(task);
        scheduleAfterInteractive();
    });
}

/**
 * Runs `run` once start-up has gone idle after the interactive mark (Phase 1
 * B6 fix, B6 record §9): the tabs' pre-render.
 *
 * - Waits for the interactive mark in **both** arms. Unlike runAfterFirstFrame,
 *   it never runs at registration, so it changes neither arm's TTI.
 * - The first task's idle callback is requested from inside the interactive
 *   callback, so it lands after the deferred drain (same timeout, FIFO): the
 *   interactive mark, then the deferred start-up work, then these. TTI⁺
 *   (max of the mark and `drainEnd`, marked synchronously) doesn't move either.
 * - **One task per idle callback**, in registration order, so each piece of
 *   work is its own slice of the JS thread.
 * - No fallback: without markFirstFrame() these never run. Their callers
 *   (LazyTab) have another trigger, a tab's first focus.
 *
 * @returns a cancel function: removes the task if it hasn't started yet
 */
export function runAfterInteractive(name: string, run: () => unknown): () => void {
    const task: Task = { name, run };
    afterInteractive.push(task);
    if (interactiveSeen) scheduleAfterInteractive();
    return () => {
        const i = afterInteractive.indexOf(task);
        if (i >= 0) afterInteractive.splice(i, 1);
    };
}

/**
 * The first-frame signal: call it from the root view's `onLayout`. Only the
 * first call counts, so it can be the handler itself (it fires again on
 * rotation). Records the probe's first-layout mark, times the first idle
 * moment after it (requested before the drain, so it fires first), then lets
 * the queue drain. The interactive callback also releases runAfterInteractive.
 */
export function markFirstFrame(): void {
    if (firstFrameSeen) return;
    firstFrameSeen = true;
    arm();
    markStartup('firstLayout');
    whenIdle(() => {
        noteInteractive();
        interactiveSeen = true;
        scheduleAfterInteractive();
    });

    if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
    }
    if (!released) {
        released = true;
        if (queue.length > 0) scheduleDrain();
    }
}
