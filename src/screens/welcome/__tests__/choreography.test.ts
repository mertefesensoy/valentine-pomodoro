// covers: NFR-A11Y-004, NFR-PERF-001
import {
    CHARACTERS,
    CLOSED_SHIFT,
    DIARY_ORIGIN,
    DURATION,
    ASPECT,
    CHARACTER_SIZE,
    FEET,
    LAND_MS,
    PARTICLE_COUNT,
    characterPose,
    diaryPose,
    ease,
    headroom,
    linePose,
    particlePose,
    track,
    type Ease,
    type Who,
} from '../choreography';

// The welcome morph's timeline (build 48, F5): the owner asked for squash and stretch, anticipation,
// staging, slow in and slow out, secondary action and exaggeration. These tests pin each of those,
// and that the last frame is exactly the static mark, so Reduce Motion's fade shows the same art.

const WHO: Who[] = ['pomo', 'doro'];
const frames = (step = 1) => Array.from({ length: Math.floor(DURATION / step) + 1 }, (_, i) => i * step);

describe('the easing and the tracks', () => {
    it.each<Ease>(['lin', 'sine', 'inOut', 'out', 'in'])('%s runs from 0 to 1 without leaving them', (kind) => {
        expect(ease(kind, 0)).toBeCloseTo(0, 9);
        expect(ease(kind, 1)).toBeCloseTo(1, 9);
        for (let u = 0; u <= 1; u += 0.01) {
            expect(ease(kind, u)).toBeGreaterThanOrEqual(-1e-9);
            expect(ease(kind, u)).toBeLessThanOrEqual(1 + 1e-9);
        }
    });

    it('slow in and slow out: the gentle and in-out curves start and end slowly; out brakes, in accelerates', () => {
        const slope = (kind: Ease, u: number) => (ease(kind, u + 1e-4) - ease(kind, u)) / 1e-4;
        for (const kind of ['sine', 'inOut'] as const) {
            expect(slope(kind, 0)).toBeLessThan(0.05);
            expect(slope(kind, 1 - 1e-4)).toBeLessThan(0.05);
        }
        expect(slope('out', 0)).toBeGreaterThan(3);
        expect(slope('in', 0)).toBeLessThan(0.01);
    });

    it('holds a track before its first key and after its last, and passes through every key', () => {
        const keys = [[100, 2], [200, 4, 'lin'], [300, 1]] as const;
        expect(track(0, keys)).toBe(2);
        expect(track(150, keys)).toBeCloseTo(3, 9);
        expect(track(200, keys)).toBe(4);
        expect(track(999, keys)).toBe(1);
    });
});

describe('the first frame is the closed diary, centred, with Pomo & Doro on it', () => {
    it('shows only the cover, slid so it sits centred', () => {
        const d = diaryPose(0);
        expect(d.shiftX).toBe(-CLOSED_SHIFT);
        expect(d.coverOpacity).toBe(1);
        expect(d.leftOpacity).toBe(0);
        expect(d.rightOpacity).toBe(0);
        expect(DIARY_ORIGIN).toBe('71.0% 86.8%');
    });

    it.each(WHO)('%s sits on the cover top, whole and visible', (who) => {
        const c = characterPose(who, 0);
        expect(c.y).toBeCloseTo(34 / 576, 6);
        expect(c.opacity).toBe(1);
        expect(c.sx).toBe(1);
        expect(c.sy).toBe(1);
    });

    it('keeps the line out of sight', () => {
        expect(linePose(0).opacity).toBe(0);
    });
});

describe('the last frame is the static mark', () => {
    it('has the spread open, flat, centred and at rest', () => {
        const d = diaryPose(DURATION);
        expect(d).toEqual({
            shiftX: 0,
            sx: 1,
            sy: 1,
            coverAngle: -180,
            coverOpacity: 0,
            leftAngle: 0,
            leftOpacity: 1,
            rightOpacity: 1,
            bump: 1,
            dip: 0,
        });
    });

    it.each(WHO)('%s has become the face: invisible', (who) => {
        expect(characterPose(who, DURATION).opacity).toBe(0);
    });

    it('has no sparkle left and the line in place', () => {
        for (let i = 0; i < PARTICLE_COUNT; i++) expect(particlePose(i, DURATION).opacity).toBe(0);
        expect(linePose(DURATION)).toEqual({ opacity: 1, dy: 0 });
    });
});

describe('the twelve principles the owner asked for', () => {
    it('staging: the closed diary holds still for the first 600 ms', () => {
        for (const t of [0, 200, 400, 600]) {
            const d = diaryPose(t);
            expect(d.coverAngle).toBe(0);
            expect(d.sy).toBe(1);
        }
    });

    it('anticipation: both crouch deeply and the cover leans back before anything leaps or opens', () => {
        expect(characterPose('pomo', 1000).sy).toBeLessThan(0.8);
        expect(characterPose('doro', 1070).sy).toBeLessThan(0.76);
        expect(diaryPose(1000).coverAngle).toBe(8);
        expect(diaryPose(1000).sy).toBeLessThan(0.96);
    });

    it.each(WHO)('squash and stretch: %s stretches on take-off and squashes hard on landing, keeping roughly its area', (who) => {
        const c = CHARACTERS[who];
        const sy = frames().map((t) => characterPose(who, t).sy);
        const takeOff = Math.max(...frames().filter((t) => t > c.launch && t < c.launch + 150).map((t) => characterPose(who, t).sy));
        const landing = Math.min(...frames().filter((t) => t > c.launch + c.air && t < c.launch + c.air + 150).map((t) => characterPose(who, t).sy));
        expect(takeOff).toBeGreaterThan(1.15);
        expect(landing).toBeLessThan(0.7);
        for (const t of frames(10).filter((t) => t < 2860)) {
            const p = characterPose(who, t);
            expect(p.sx * p.sy).toBeGreaterThan(0.85);
            expect(p.sx * p.sy).toBeLessThan(1.15);
        }
        expect(sy.length).toBe(DURATION + 1);
    });

    it.each(WHO)('arcs and slow in, slow out: %s rises above the cover, hangs at the apex, and falls fastest at the end', (who) => {
        const c = CHARACTERS[who];
        const ys = frames().filter((t) => t >= c.launch && t <= c.launch + c.air).map((t) => characterPose(who, t).y);
        const takeOffY = ys[0];
        const apex = Math.min(...ys);
        expect(apex).toBeLessThan(takeOffY - 0.05);
        const speed = (i: number) => Math.abs(ys[i + 1] - ys[i]);
        const apexIndex = ys.indexOf(apex);
        expect(speed(apexIndex)).toBeLessThan(speed(ys.length - 2) / 10);
        expect(speed(ys.length - 2)).toBeGreaterThan(speed(0));
    });

    it("the haptic's frame is Pomo's contact with the page", () => {
        const c = CHARACTERS.pomo;
        expect(LAND_MS).toBe(c.launch + c.air);
        expect(characterPose('pomo', LAND_MS).y).toBeCloseTo(0.64, 6);
        expect(characterPose('pomo', LAND_MS - 20).y).toBeLessThan(0.64);
    });

    it('follow-through: the left page swings past flat and settles; the pages give under the landing; the spread bumps as they become its faces', () => {
        const angles = frames().map((t) => diaryPose(t).leftAngle);
        expect(Math.min(...angles)).toBeLessThan(-10);
        expect(diaryPose(LAND_MS - 1).dip).toBe(0);
        expect(Math.max(...frames().map((t) => diaryPose(t).dip))).toBeGreaterThan(0.01);
        // Pomo rides the page down: the feet follow the dip.
        expect(characterPose('pomo', 1700).y - 0.64).toBeCloseTo(diaryPose(1700).dip, 9);
        expect(Math.max(...frames().map((t) => diaryPose(t).bump))).toBeGreaterThan(1.03);
    });

    it('overlapping action and character: Doro leaps later and lower, and squashes deeper', () => {
        expect(CHARACTERS.doro.launch).toBeGreaterThan(CHARACTERS.pomo.launch);
        expect(CHARACTERS.doro.lift).toBeLessThan(CHARACTERS.pomo.lift);
        const deepest = (who: Who) => Math.min(...frames().filter((t) => t > 1600 && t < 1900).map((t) => characterPose(who, t).sy));
        expect(deepest('doro')).toBeLessThan(deepest('pomo'));
    });

    it('secondary action: they hop and lean towards each other before diving into the faces', () => {
        expect(characterPose('pomo', 2420).rot).toBeGreaterThan(5);
        expect(characterPose('doro', 2440).rot).toBeLessThan(-5);
        expect(characterPose('pomo', 2320).y).toBeLessThan(0.64);
        const lit = (t: number) => Array.from({ length: PARTICLE_COUNT }, (_, i) => particlePose(i, t).opacity).filter((o) => o > 0).length;
        expect(lit(3300)).toBe(PARTICLE_COUNT);
        expect(PARTICLE_COUNT).toBeLessThanOrEqual(12);
    });

    it('one face of the cover shows at a time, and the right page shows only once the cover lifts', () => {
        for (const t of frames()) {
            const d = diaryPose(t);
            expect(d.coverOpacity + d.leftOpacity).toBe(1);
            if (d.coverAngle >= 0) expect(d.rightOpacity).toBe(0);
        }
    });
});

describe('the headroom the screen keeps above the art', () => {
    it.each([1, 0.5])('bounds every head on every frame (room %s)', (room) => {
        for (const who of WHO) {
            for (const t of frames(5)) {
                const c = characterPose(who, t, room);
                const head = c.y - ((FEET * CHARACTER_SIZE) / ASPECT) * c.sy;
                expect(-head).toBeLessThanOrEqual(headroom(room));
            }
        }
    });
});

describe('continuity: nothing jumps between frames', () => {
    it('moves no character more than a sliver per millisecond, and changes no scale abruptly', () => {
        for (const who of WHO) {
            let prev = characterPose(who, 0);
            for (const t of frames().slice(1)) {
                const p = characterPose(who, t);
                expect(Math.abs(p.x - prev.x)).toBeLessThan(0.002);
                expect(Math.abs(p.y - prev.y)).toBeLessThan(0.006);
                expect(Math.abs(p.sy - prev.sy)).toBeLessThan(0.04);
                expect(Math.abs(p.opacity - prev.opacity)).toBeLessThan(0.02);
                prev = p;
            }
        }
    });

    it('turns the cover smoothly, and slides and squashes the diary smoothly', () => {
        let prev = diaryPose(0);
        for (const t of frames().slice(1)) {
            const d = diaryPose(t);
            expect(Math.abs(d.coverAngle - prev.coverAngle)).toBeLessThan(1.5);
            expect(Math.abs(d.shiftX - prev.shiftX)).toBeLessThan(0.002);
            // The release out of the squash is the fastest change: 0.08 at a braking start, under 0.07 a frame at 60 Hz.
            expect(Math.abs(d.sy - prev.sy)).toBeLessThan(0.004);
            prev = d;
        }
    });
});
