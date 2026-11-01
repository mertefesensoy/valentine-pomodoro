import { create } from 'zustand';

import { isRecord } from '../../stores/isRecord';
import { loadSync, saveSync, STORAGE_KEYS } from '../../utils/storage';
import { GENERAL, dueTutorial, latestTutorialVersion, tutorialById, type Beat, type TourScreen, type TourStep, type Tutorial } from './tutorials';

/**
 * The tour's state (Phase 1 D5; brief §4, D5 record §3.7).
 *
 * Persisted under one additive key, `tutorial` (no existing key or the B2 migration changes):
 *   { seen?: string, resumeAt?: number, resumed?: true }
 * - `seen`: the version of the last tutorial finished or skipped. Finishing or skipping writes
 *   the newest tutorial version, so a new install that sees the general tour isn't also shown
 *   that version's update tour.
 * - `resumeAt`: the step a first run had reached. A tour killed half-way resumes there at the next
 *   calm launch, once (T-9, amending the brief's "from the start"). `resumed` marks that the one
 *   resume has happened; a run killed again after it counts as seen, so the tour never nags.
 *
 * In memory only: the run itself (which tutorial, which step and beat, first run or replay) and the
 * mute (T-8, for the rest of the tour).
 * Backgrounded mid-tour, the app comes back to the same step (brief §5).
 */

export type Run = {
    tutorialId: string;
    /** The indices of the tutorial's steps this run plays, in order. */
    steps: readonly number[];
    /** The position in `steps`. */
    at: number;
    beat: 'lead' | 'here';
    replay: boolean;
    /** A first run picked up from a saved step: its one resume is used. */
    resumed: boolean;
};

type Stored = { seen?: string; resumeAt?: number; resumed?: true };

export interface TourStore {
    isReady: boolean;
    seen: string | null;
    resumeAt: number | null;
    run: Run | null;
    muted: boolean;

    hydrate(): void;
    /**
     * Starts a run. A first run plays the due tutorial from its saved step, or the start. A replay
     * plays the general tutorial; with a session running or paused it skips the presets (hidden
     * while a session runs) and stops before the invitation, ending on "Done" (T-7).
     */
    start(opts: { replay: boolean; sessionActive?: boolean }): void;
    /** Next: a lead moves to its step, a step to the next one; past the last, the tour finishes. */
    next(): void;
    /** A tab came to the front: a lead pointing at it moves to its step. */
    reachScreen(screen: TourScreen): void;
    /** Skip tour, Not now, Done, or Start focus: the run ends and a first run is remembered as seen. */
    finish(): void;
    toggleMute(): void;
}

function save(value: Stored): void {
    saveSync(STORAGE_KEYS.TUTORIAL, value);
}

export const useTourStore = create<TourStore>()((set, get) => ({
    isReady: false,
    // Seen until hydrated, so a tour can never start before the stored value is known.
    seen: latestTutorialVersion(),
    resumeAt: null,
    run: null,
    muted: false,

    hydrate() {
        try {
            const stored = loadSync<unknown>(STORAGE_KEYS.TUTORIAL, null);
            const s: Stored = isRecord(stored) ? (stored as Stored) : {};
            let seen = typeof s.seen === 'string' ? s.seen : null;
            let resumeAt = typeof s.resumeAt === 'number' && Number.isInteger(s.resumeAt) && s.resumeAt >= 0 ? s.resumeAt : null;
            if (seen === null && resumeAt !== null && s.resumed === true) {
                // The one resume was used and that run was killed too: remembered as seen.
                seen = latestTutorialVersion();
                resumeAt = null;
                save({ seen });
            }
            set({ isReady: true, seen, resumeAt, run: null });
        } catch (error) {
            console.error('[tourStore] hydrate failed; the tour stays hidden:', error);
            set({ isReady: true, seen: latestTutorialVersion(), resumeAt: null, run: null });
        }
    },

    start({ replay, sessionActive = false }) {
        if (get().run) return;
        if (replay) {
            const all = GENERAL.steps.map((_, i) => i);
            // A session running or paused: the presets are hidden and the invitation can't happen.
            const steps = sessionActive ? all.filter((i) => GENERAL.steps[i].id !== 'presets' && GENERAL.steps[i].id !== 'invite') : all;
            set({ run: { tutorialId: GENERAL.id, steps, at: 0, beat: beatOf(GENERAL.steps[steps[0]]), replay: true, resumed: false }, muted: false });
            return;
        }
        const tutorial = dueTutorial(get().seen);
        if (!tutorial) return;
        const steps = tutorial.steps.map((_, i) => i);
        const resumeAt = get().resumeAt;
        const at = resumeAt !== null && resumeAt < steps.length ? resumeAt : 0;
        if (resumeAt !== null) save({ resumeAt: at, resumed: true });
        else save({ resumeAt: at });
        set({ run: { tutorialId: tutorial.id, steps, at, beat: beatOf(tutorial.steps[at]), replay: false, resumed: resumeAt !== null }, muted: false });
    },

    next() {
        const run = get().run;
        if (!run) return;
        const tutorial = tutorialById(run.tutorialId);
        if (!tutorial) return get().finish();
        const step = tutorial.steps[run.steps[run.at]];
        if (run.beat === 'lead' && step.lead) {
            set({ run: { ...run, beat: 'here' } });
            return;
        }
        const at = run.at + 1;
        if (at >= run.steps.length) return get().finish();
        if (!run.replay) {
            save(run.resumed ? { resumeAt: run.steps[at], resumed: true } : { resumeAt: run.steps[at] });
        }
        set({ run: { ...run, at, beat: beatOf(tutorial.steps[run.steps[at]]) } });
    },

    reachScreen(screen) {
        const run = get().run;
        if (!run || run.beat !== 'lead') return;
        const step = currentStep(run);
        if (step?.lead && step.here.screen === screen) set({ run: { ...run, beat: 'here' } });
    },

    finish() {
        const run = get().run;
        if (!run) return;
        if (!run.replay) {
            const seen = latestTutorialVersion();
            save({ seen });
            set({ seen, resumeAt: null });
        }
        set({ run: null });
    },

    toggleMute() {
        set({ muted: !get().muted });
    },

}));

function beatOf(step: TourStep): Run['beat'] {
    return step.lead ? 'lead' : 'here';
}

export function currentTutorial(run: Run): Tutorial | null {
    return tutorialById(run.tutorialId);
}

export function currentStep(run: Run): TourStep | null {
    return currentTutorial(run)?.steps[run.steps[run.at]] ?? null;
}

export function currentBeat(run: Run): Beat | null {
    const step = currentStep(run);
    if (!step) return null;
    return run.beat === 'lead' && step.lead ? step.lead : step.here;
}

/** The run's last beat: no Next follows it (the invitation ends on Start focus or Not now; a replay mid-session on Done). */
export function isLastBeat(run: Run): boolean {
    return run.at === run.steps.length - 1 && (run.beat === 'here' || !currentStep(run)?.lead);
}
