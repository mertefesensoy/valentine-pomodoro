// covers: NFR-A11Y-003, NFR-A11Y-004, NFR-I18N-001, FR-SET-004

import en from '../../../i18n/en.json';
import tr from '../../../i18n/tr.json';
import { BODY_MOUTHS, DETUNE_CENTS, END_MOUTHS, GAIN_DB, pickSyllable, variation } from '../babble';
import { HANDS, KIT, TALK, recipe } from '../kit';
import {
    BLINK,
    BREATH,
    CHANGE_MS,
    FACE_IN,
    FACE_OUT,
    FEET,
    HOLD_MS,
    POINT,
    SQUASH_KEYS,
    WAVE,
    breathAt,
    faceInAt,
    faceOutAt,
    pointAt,
    squashAt,
    waveAt,
} from '../motion';
import { CHAR_MS, LETTERS_PER_SYLLABLE, OPEN_SHARE, PAUSE_MS, shownAt, speechFor } from '../speech';
import { GENERAL, MODES_SHEET_LINE, compareVersions, dueTutorial, latestTutorialVersion, type LineContext, type Tutorial } from '../tutorials';

// The tour's numbers come from the owner-approved pose sheet and listening page (D5 assets record):
// these tests hold the app to the same files the pages play, so the two can't drift.
// The project has no @types/node, so the two functions used are typed here (as noRawText.test.ts does).
const fs = jest.requireActual<{ readFileSync: (file: string, encoding: 'utf8') => string }>('fs');
const vm = jest.requireActual<{ runInNewContext: (code: string, context: object) => unknown }>('vm');
// Jest runs from the repository's root.
const read = (file: string) => fs.readFileSync(`${process.cwd()}/${file}`, 'utf8');
const expressions = JSON.parse(read('art/src/tour/expressions.json'));
const sounds = JSON.parse(read('art/sound/sounds.json'));
const motion = expressions.motion;

// The pose sheet's own write-on (scripts/art/tour-motion.js), run as the review pages run it: a
// browser script reading the kit's JSON as `KIT` and defining `window.TourMotion`.
function referenceWriteOn(): (text: string, who: 'pomo' | 'doro') => { chars: number[]; syllables: { t: number; end?: string }[]; length: number } {
    const window: Record<string, unknown> = {};
    vm.runInNewContext(read('scripts/art/tour-motion.js'), {
        KIT: expressions,
        window,
        requestAnimationFrame: () => 0,
        performance: { now: () => 0 },
        matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    });
    return (window.TourMotion as { writeOn: ReturnType<typeof referenceWriteOn> }).writeOn;
}

describe('how a line is spoken (assets record §3.4, §4.4)', () => {
    it('uses the approved pace', () => {
        expect(CHAR_MS).toBe(motion.talk.charMs);
        expect(PAUSE_MS).toEqual(motion.talk.pauseMs);
        expect(LETTERS_PER_SYLLABLE).toEqual(motion.talk.lettersPerSyllable);
        expect(OPEN_SHARE).toBe(motion.talk.openShare);
    });

    // The assets record §4.4 gives 62 characters and 3.24 s; the line has 61 characters, and the pose
    // sheet's own script times it at 3,195 ms (61 × 45 + 300 + 150). The record is a character out.
    it("times Pomo's sample line as the pose sheet does: 61 characters in 3,195 ms, falling at the end", () => {
        const s = speechFor(sounds.babble.lines.pomo, 'pomo');
        expect(s.chars).toHaveLength(61);
        expect(s.total).toBe(3195);
        expect(s.syllables).toHaveLength(16);
        expect(s.syllables[s.syllables.length - 1].end).toBe('down');
        expect(s.mouthMs).toBe(81);
    });

    it("times Doro's: 69 characters in 3,405 ms, rising for its question", () => {
        const s = speechFor(sounds.babble.lines.doro, 'doro');
        expect(s.chars).toHaveLength(69);
        expect(s.total).toBe(3405);
        expect(s.syllables).toHaveLength(14);
        expect(s.syllables[s.syllables.length - 1].end).toBe('up');
        expect(s.mouthMs).toBe(108);
    });

    it('starts the count again after a pause, and treats Turkish letters as letters', () => {
        const s = speechFor('Şu, öyle.', 'pomo');
        // Ş starts a count; after the comma's pause and the space, ö starts a new one, and e (3 letters on) the next.
        expect(s.syllables.map((x) => x.at)).toEqual([0, 4 * CHAR_MS + PAUSE_MS.comma, 7 * CHAR_MS + PAUSE_MS.comma]);
        expect(shownAt(s, 0)).toBe(1);
        expect(shownAt(s, s.total)).toBe(s.chars.length);
    });

    it('speaks every tour line exactly as the pose sheet’s script would, in both languages', () => {
        const writeOn = referenceWriteOn();
        const strings = (o: unknown): string[] => (typeof o === 'string' ? [o] : Object.values(o as object).flatMap(strings));
        const lines = [...strings(en.tour), ...strings(tr.tour), sounds.babble.lines.pomo, sounds.babble.lines.doro];
        for (const line of lines)
            for (const who of ['pomo', 'doro'] as const) {
                const ours = speechFor(line, who);
                const theirs = writeOn(line, who);
                expect(ours.reveal).toEqual(theirs.chars);
                expect(ours.total).toBe(theirs.length);
                expect(ours.syllables.map((x) => [x.at, x.end])).toEqual(theirs.syllables.map((x) => [x.t, x.end]));
            }
    });
});

describe('the pair’s motion (assets record §3.3, §4.4)', () => {
    it('matches the pose sheet’s numbers', () => {
        expect(CHANGE_MS).toBe(motion.change.totalMs);
        expect(SQUASH_KEYS).toEqual(motion.change.keys.map((k: { at: number; sy: number }) => [k.at * CHANGE_MS, k.sy]));
        expect(FACE_OUT).toEqual(motion.change.faceOut.map((f: number) => f * CHANGE_MS));
        expect(FACE_IN).toEqual(motion.change.faceIn.map((f: number) => f * CHANGE_MS));
        expect(HOLD_MS).toBe(motion.hold.ms);
        expect(BLINK).toEqual({ ...motion.blink, intervalMs: motion.blink.intervalMs });
        expect(BREATH).toEqual(motion.breath);
        expect({ periodMs: WAVE.periodMs, cycles: WAVE.cycles }).toEqual({ periodMs: motion.wave.periodMs, cycles: motion.wave.cycles });
        expect(POINT).toEqual(motion.point);
        expect(FEET).toEqual(expressions.feet);
        expect(HANDS).toEqual(expressions.hands);
    });

    it('squashes, stretches and keeps the area', () => {
        for (const [t, v] of SQUASH_KEYS) expect(squashAt(t)).toBeCloseTo(v, 6);
        expect(squashAt(-5)).toBe(1);
        expect(squashAt(CHANGE_MS + 5)).toBe(1);
    });

    // The faces are equal at 77 ms, just after the bottom of the squash. They meet at S(21/98) ≈ 0.118
    // each, not at 0.5 as the assets record §4.4 states: S(a) + S(1 − a) = 1 places the crossing, but
    // the two windows overlap only 42 ms, so the face is briefly faint (D5 record §4).
    it('crosses the faces at 77 ms, just after the bottom of the squash', () => {
        expect(faceOutAt(77)).toBeCloseTo(faceInAt(77), 9);
        expect(faceInAt(77)).toBeCloseTo(0.118, 3);
        expect(faceOutAt(0)).toBe(1);
        expect(faceInAt(CHANGE_MS)).toBe(1);
    });

    it('waves between −16° and +12° and comes home; points 10 units out at the middle of its nudge', () => {
        const angles = Array.from({ length: 1211 }, (_, t) => waveAt(t));
        expect(Math.min(...angles)).toBeCloseTo(-16, 1);
        expect(Math.max(...angles)).toBeCloseTo(12, 1);
        expect(waveAt(1210)).toBeCloseTo(0, 6);
        expect(pointAt(160)).toBeCloseTo(10, 6);
        expect(pointAt(320)).toBe(0);
    });

    it('breathes by 1.2 %, half as much while talking', () => {
        expect(breathAt(850, 3400, 1)).toBeCloseTo(1.012, 6);
        expect(breathAt(850, 3400, 0.5)).toBeCloseTo(1.006, 6);
    });

    it('builds every expression from the approved recipes', () => {
        const byId = Object.fromEntries(expressions.expressions.map((e: { id: string }) => [e.id, e]));
        const check = (pose: Parameters<typeof recipe>[0], id: string, look: 'left' | 'right' = 'left') => {
            const r = recipe(pose, look, 'right');
            const e = byId[id];
            const eyes = e.eyes === 'look' ? `look-${look}` : e.eyes;
            expect([r.eyes, r.mouth, r.blinks]).toEqual([eyes, e.mouth, !!e.blinks]);
            expect(r.rotate).toBe(e.hold?.rotate ?? 0);
            expect(r.sy).toBe(e.hold?.sy ?? 1);
            if (e.hand) expect(r.hand?.startsWith(e.hand)).toBe(true);
        };
        check('happy', 'happy');
        check('excited', 'excited');
        check('curious', 'curious');
        check('proud', 'proud');
        check('wink', 'wink');
        check('wave', 'wave');
        check('point', 'point', 'right');
        check('listen', 'listening-left', 'left');
        expect(expressions.order).toEqual(['body-cut', 'hand', 'body-fill', 'eyes', 'mouth']);
        expect(TALK).toEqual(byId.talking.talks);
        // Every layer the recipes name is in the kit, for both characters.
        for (const who of ['pomo', 'doro'] as const) {
            expect(Object.keys(KIT[who].eyes)).toHaveLength(9);
            expect(Object.keys(KIT[who].mouth)).toHaveLength(7);
            expect(Object.keys(KIT[who].hand)).toHaveLength(4);
        }
    });
});

describe('the babble (assets record §3.5, §3.7)', () => {
    it('plays the approved variation, never louder than unity', () => {
        expect(DETUNE_CENTS).toBe(sounds.babble.playback.detuneCents);
        expect(GAIN_DB).toBe(sounds.babble.playback.gainDb);
        const low = variation(0, 0);
        const high = variation(0.9999999, 0.9999999);
        expect(low.rate).toBeCloseTo(Math.pow(2, -10 / 1200), 9);
        expect(high.rate).toBeCloseTo(Math.pow(2, 10 / 1200), 6);
        expect(low.volume).toBeCloseTo(Math.pow(10, -3 / 20), 9);
        expect(high.volume).toBeLessThanOrEqual(1);
        expect(variation(0.5, 0.5).volume).toBeCloseTo(Math.pow(10, -1.5 / 20), 9);
    });

    it('never plays the same syllable twice running', () => {
        for (let last = 0; last < 4; last++) {
            for (let r = 0; r < 1; r += 0.01) expect(pickSyllable(r, 4, last)).not.toBe(last);
        }
        const seen = new Set(Array.from({ length: 100 }, (_, i) => pickSyllable(i / 100, 4, 0)));
        expect([...seen].sort()).toEqual([1, 2, 3]);
    });

    it('opens each syllable’s own mouth', () => {
        const mouthIndex = (m: string) => TALK.indexOf(m as (typeof TALK)[number]) + 1;
        for (const who of ['pomo', 'doro'] as const) {
            const voices = sounds.babble.voices[who] as { mouth: string; role?: 'up' | 'down' }[];
            expect(voices.filter((v) => !v.role).map((v) => mouthIndex(v.mouth))).toEqual(BODY_MOUTHS[who]);
            for (const end of ['up', 'down'] as const) expect(mouthIndex(voices.find((v) => v.role === end)!.mouth)).toBe(END_MOUTHS[who][end]);
        }
    });
});

// break-ui #4 (the owner's choice): at AX5 a 375 pt iPhone's panel holds about 11 letters a line, so
// no Turkish word in the tour runs past 10. The tab's own name, "Zamanlayıcı", is the one exception.
describe('the tour’s Turkish at AX5', () => {
    it('has no word past 10 letters but the Timer tab’s own name', () => {
        const strings = (o: unknown): string[] => (typeof o === 'string' ? [o] : Object.values(o as object).flatMap(strings));
        const long = strings(tr.tour)
            .flatMap((line) => line.replace(/\{\{\w+\}\}/g, ' ').split(/[\s,.!?:]+/))
            .filter((word) => Array.from(word).length > 10);
        expect(long).toEqual([]);
        expect(Array.from(tr.tabs.timer).length).toBe(11);
    });
});

describe('the tutorials (the owner’s per-version rule)', () => {
    it('shows the general tour to anyone who has seen none, and nothing after it in v1.4', () => {
        expect(dueTutorial(null)?.id).toBe('general');
        expect(dueTutorial('1.4')).toBeNull();
        expect(latestTutorialVersion()).toBe('1.4');
    });

    it('would show a later version’s tour to an updater, and only the newest', () => {
        const step = GENERAL.steps[0];
        const list: Tutorial[] = [GENERAL, { id: 'v1.5', version: '1.5', kind: 'version', steps: [step] }, { id: 'v1.10', version: '1.10', kind: 'version', steps: [step] }];
        expect(dueTutorial('1.4', list)?.id).toBe('v1.10');
        expect(dueTutorial(null, list)?.id).toBe('general');
        expect(latestTutorialVersion(list)).toBe('1.10');
        expect(compareVersions('1.4', '1.10')).toBe(-1);
        expect(compareVersions('1.4.0', '1.4')).toBe(0);
    });

    it('has six steps, Pomo and Doro taking turns, with a lead before each tab', () => {
        expect(GENERAL.steps.map((s) => s.id)).toEqual(['presets', 'today', 'modes', 'stats', 'notes', 'invite']);
        expect(GENERAL.steps.map((s) => s.speaker)).toEqual(['pomo', 'doro', 'pomo', 'doro', 'pomo', 'doro']);
        for (const s of GENERAL.steps) {
            if (s.lead) expect(s.lead.screen).not.toBe(s.here.screen);
        }
    });

    it('says every line in both languages, inside its budget, with the controls’ own names', () => {
        const lookup = (tree: object, key: string): unknown => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], tree);
        const contexts: LineContext[] = [];
        for (const audience of ['fresh', 'updated'] as const)
            for (const replay of [false, true])
                for (const goalOn of [false, true])
                    for (const flyAvailable of [false, true])
                        for (const weekEmpty of [false, true])
                            for (const breakNext of [false, true]) contexts.push({ audience, replay, goalOn, flyAvailable, weekEmpty, breakNext });
        const lines = new Map<string, Record<string, string>>();
        for (const s of GENERAL.steps)
            for (const beat of [s.lead, s.here])
                for (const c of contexts) {
                    if (!beat) continue;
                    const l = beat.line(c);
                    lines.set(l.key, l.names ?? {});
                }
        lines.set(MODES_SHEET_LINE.key, MODES_SHEET_LINE.names ?? {});
        expect(lines.size).toBe(18);
        for (const [tree, budget] of [
            [en, 90],
            [tr, 110],
        ] as const) {
            for (const [key, names] of lines) {
                const text = lookup(tree, key);
                expect(typeof text).toBe('string');
                const filled = (text as string).replace(/\{\{(\w+)\}\}/g, (_, n: string) => String(lookup(tree, names[n])));
                expect(filled).not.toMatch(/\{\{|undefined/);
                expect(Array.from(filled).length).toBeLessThanOrEqual(budget);
            }
        }
    });
});
