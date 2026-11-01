/**
 * The tutorials' content (Phase 1 D5; tutorial brief `.impeccable/surfaces/app-tutorial-tsx.md`,
 * D5 record §3.7).
 *
 * The owner's rule, for every version: one general tutorial for first-timers, and one version
 * tutorial for each later feature release, for people updating. v1.4 has only the general one, and
 * shows it to everyone, new installs and v1.3.1 updaters alike, since no tutorial came before it.
 * So the list is keyed by version: a later version adds its tutorial here as content, with no new
 * engine (brief §7).
 *
 * A step is one idea, spoken by one of the pair. A tab step has two beats: a lead on the screen
 * before, with the ribbon at the tab, and the step itself once that tab is in front. Every beat
 * names its opening (the one control or region that stays lit and live), the speaker's face, and
 * its line as an i18n key chosen for the moment (T-6).
 */

export type TourScreen = 'timer' | 'stats' | 'notes';
/** The tab routes a lead points at. */
export type TourTab = 'index' | 'stats' | 'notes';
/** The in-screen openings: the presets, today's row, Modes and Start focus on the Timer; the week on Stats; Add on Notes. */
export type TourOpening = 'presets' | 'today' | 'modes' | 'start' | 'week' | 'add';
export type Speaker = 'pomo' | 'doro';
/** The speaker's face for a beat: an expression from the tour kit (assets record §3.2). */
export type Face = 'wave' | 'happy' | 'curious' | 'point' | 'excited' | 'wink' | 'proud';

/** What a line can depend on, read when the beat shows. */
export type LineContext = {
    /** 'updated' for an install that used v1.3.1 (the welcome's own audience). */
    audience: 'fresh' | 'updated';
    replay: boolean;
    goalOn: boolean;
    flyAvailable: boolean;
    /** No focus in the last seven days: the week's postcards are still blank. */
    weekEmpty: boolean;
    /** The Timer's next phase is a break, so its button reads Start break (break-ui #1). */
    breakNext: boolean;
};

/** An i18n key, and the controls' own labels it names (keys, so Turkish follows the control). */
export type Line = { key: string; names?: Record<string, string> };

export type Beat = {
    screen: TourScreen;
    target: { opening: TourOpening } | { tab: TourTab };
    face: Face;
    line: (c: LineContext) => Line;
};

export type TourStep = {
    id: 'presets' | 'today' | 'modes' | 'stats' | 'notes' | 'invite';
    speaker: Speaker;
    lead?: Beat;
    here: Beat;
};

export type Tutorial = {
    id: string;
    /** The app version this tutorial belongs to: the stored "seen" version after it. */
    version: string;
    kind: 'general' | 'version';
    steps: readonly TourStep[];
};

const MODES = { modes: 'modes.button', ring: 'modes.ring', spread: 'modes.spread', fly: 'modes.fly' };

/** The general tutorial (brief §3; T-11's six steps). Odd steps are Pomo's, even ones Doro's. */
export const GENERAL: Tutorial = {
    id: 'general',
    version: '1.4',
    kind: 'general',
    steps: [
        {
            id: 'presets',
            speaker: 'pomo',
            here: {
                screen: 'timer',
                target: { opening: 'presets' },
                face: 'wave',
                line: (c) => ({ key: c.replay ? 'tour.presets.replay' : c.audience === 'updated' ? 'tour.presets.updated' : 'tour.presets.fresh' }),
            },
        },
        {
            id: 'today',
            speaker: 'doro',
            here: {
                screen: 'timer',
                target: { opening: 'today' },
                face: 'happy',
                line: (c) => ({ key: c.goalOn ? 'tour.today.goal' : 'tour.today.noGoal' }),
            },
        },
        {
            id: 'modes',
            speaker: 'pomo',
            here: {
                screen: 'timer',
                target: { opening: 'modes' },
                face: 'curious',
                line: (c) => ({ key: c.flyAvailable ? 'tour.modes.fly' : 'tour.modes.noFly', names: MODES }),
            },
        },
        {
            id: 'stats',
            speaker: 'doro',
            lead: {
                screen: 'timer',
                target: { tab: 'stats' },
                face: 'point',
                line: () => ({ key: 'tour.stats.lead', names: { tab: 'tabs.stats' } }),
            },
            here: {
                screen: 'stats',
                target: { opening: 'week' },
                face: 'excited',
                line: (c) => ({ key: c.weekEmpty ? 'tour.stats.empty' : c.goalOn ? 'tour.stats.week' : 'tour.stats.weekNoGoal' }),
            },
        },
        {
            id: 'notes',
            speaker: 'pomo',
            lead: {
                screen: 'stats',
                target: { tab: 'notes' },
                face: 'point',
                line: () => ({ key: 'tour.notes.lead', names: { tab: 'tabs.notes' } }),
            },
            here: {
                screen: 'notes',
                target: { opening: 'add' },
                face: 'wink',
                line: () => ({ key: 'tour.notes.here' }),
            },
        },
        {
            id: 'invite',
            speaker: 'doro',
            lead: {
                screen: 'notes',
                target: { tab: 'index' },
                face: 'proud',
                line: () => ({ key: 'tour.invite.lead', names: { tab: 'tabs.timer' } }),
            },
            here: {
                screen: 'timer',
                target: { opening: 'start' },
                face: 'excited',
                // The line names the button that's lit: with a break up next it reads Start break, and the
                // line says so (break-ui #1, the owner's choice).
                line: (c) =>
                    c.breakNext
                        ? { key: 'tour.invite.break', names: { start: 'controls.startBreak' } }
                        : { key: !c.replay && c.audience === 'fresh' ? 'tour.invite.first' : 'tour.invite.again', names: { start: 'controls.startFocus' } },
            },
        },
    ],
};

/** Every tutorial, oldest first. v1.4 ships the general one only. */
export const TUTORIALS: readonly Tutorial[] = [GENERAL];

/**
 * The Modes sheet's own bubble at the Modes step (T-4): Pomo, still speaking. One line: Fly isn't
 * offered there, since choosing it ends the tour, and it names the bubble's own Continue (review H-4).
 */
export const MODES_SHEET_LINE: Line = { key: 'tour.modes.sheet', names: { ...MODES, continue: 'tour.continue' } };

/** -1, 0 or 1 as dotted version a is below, equal to or above b ("1.4" < "1.10"). */
export function compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (d !== 0) return d < 0 ? -1 : 1;
    }
    return 0;
}

/**
 * The tutorial to show, given the version of the last one seen (`null`: none yet).
 *
 * - Never seen one: the general tutorial. That covers a new install and, in v1.4, an updater
 *   from v1.3.1, which had no tutorial.
 * - Seen one: the newest version tutorial above it, if any; none exist in v1.4.
 * - Nothing due: null.
 */
export function dueTutorial(seen: string | null, list: readonly Tutorial[] = TUTORIALS): Tutorial | null {
    if (seen === null) return list.find((t) => t.kind === 'general') ?? null;
    const newer = list.filter((t) => t.kind === 'version' && compareVersions(t.version, seen) > 0);
    return newer.length ? newer[newer.length - 1] : null;
}

/** The newest version any tutorial carries: what finishing or skipping stores as seen. */
export function latestTutorialVersion(list: readonly Tutorial[] = TUTORIALS): string {
    return list.reduce((v, t) => (compareVersions(t.version, v) > 0 ? t.version : v), '0');
}

export function tutorialById(id: string, list: readonly Tutorial[] = TUTORIALS): Tutorial | null {
    return list.find((t) => t.id === id) ?? null;
}
