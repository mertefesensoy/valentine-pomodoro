// covers: NFR-A11Y-003, FR-MIG-001
import { resetStorage } from '../../../__fixtures__/storage/resetStorage';
import { loadSync, save, STORAGE_KEYS } from '../../../utils/storage';
import { ensureMigrated } from '../../../utils/storageMigration';
import { HEAD, SPEAK, pairWidth, place, tabCentre, type Insets, type PlaceInput } from '../placement';
import { currentBeat, currentStep, isLastBeat, useTourStore } from '../tourStore';

// A 390 × 844 iPhone in portrait inside a tab (the bottom inset includes the tab bar).
const PHONE: Insets = { top: 47, bottom: 83, left: 0, right: 0 };
const base = (over: Partial<PlaceInput>): PlaceInput => ({
    W: 390,
    H: 844,
    insets: PHONE,
    opening: null,
    tab: null,
    speaker: 'pomo',
    bubbleH: 128,
    wide: false,
    panel: null,
    ...over,
});
const inside = (v: number, lo: number, hi: number) => expect(v >= lo - 0.5 && v <= hi + 0.5).toBe(true);

describe('placement (the contract’s FIRST VIEWPORT)', () => {
    it('stands the pair at full size above the presets, never over them, with the bubble above them', () => {
        const opening = { x: 18, y: 560, w: 354, h: 74 };
        const p = place(base({ opening }));
        expect(p.side).toBe('above');
        expect(p.scale).toBe(1);
        // The feet stand above the opening, and the speaker (Pomo, on the right) nearer the ribbon's tip.
        expect(p.feet.pomo.y).toBeLessThanOrEqual(opening.y);
        expect(p.feet.pomo.x).toBeGreaterThan(p.feet.doro.x);
        expect(p.bubble.y + 128).toBeLessThanOrEqual(p.feet.pomo.y - HEAD * SPEAK);
        inside(p.bubble.y, PHONE.top, 844);
        // The ribbon hangs from beyond the top-right edge to just above the opening.
        expect(p.ribbon!.ay).toBeLessThan(0);
        expect(p.ribbon!.ax).toBeGreaterThan(300);
        expect(p.ribbon!.py).toBeLessThan(opening.y);
        inside(p.ribbon!.px, opening.x, opening.x + opening.w);
        // The tail sits under the speaker; everything fits.
        expect(Math.abs(p.bubble.x + p.tailX - p.feet.pomo.x)).toBeLessThan(1);
        expect(p.overflow).toBe(false);
    });

    it('goes below an opening at the top, with the ribbon hanging straight onto it', () => {
        const opening = { x: 324, y: 49, w: 56, h: 56 };
        const p = place(base({ opening, speaker: 'pomo' }));
        expect(p.side).toBe('below');
        expect(p.bubble.y).toBeGreaterThanOrEqual(opening.y + opening.h);
        expect(p.ribbon!.ax).toBe(p.ribbon!.px);
        expect(p.ribbon!.py).toBeLessThan(opening.y);
    });

    it('shrinks the pair on a small phone, never under half size', () => {
        const se = { W: 375, H: 667, insets: { top: 20, bottom: 49, left: 0, right: 0 }, opening: { x: 18, y: 300, w: 339, h: 60 } };
        const p = place(base({ ...se, bubbleH: 128 }));
        expect(p.scale).toBeLessThan(1);
        expect(p.scale).toBeGreaterThanOrEqual(0.5);
        expect(pairWidth(p.scale)).toBeLessThanOrEqual(375);
        expect(p.overflow).toBe(false);
    });

    // covers: NFR-A11Y-003
    // The HIG review's H-1: a long line on an SE put the bubble's top 3–48 pt above the screen.
    it('never puts the bubble above the safe area, and asks for the panel when even half size won\'t fit', () => {
        const se = { W: 375, H: 667, insets: { top: 20, bottom: 49, left: 0, right: 0 }, opening: { x: 18, y: 300, w: 339, h: 60 } };
        for (const bubbleH of [200, 245]) {
            const p = place(base({ ...se, bubbleH }));
            expect(p.bubble.y).toBeGreaterThanOrEqual(se.insets.top);
            expect(p.overflow).toBe(true);
        }
    });

    it('takes the side away from the control in landscape', () => {
        const p = place(base({ W: 844, H: 390, insets: { top: 0, bottom: 21, left: 47, right: 47 }, opening: { x: 470, y: 120, w: 300, h: 70 }, wide: true, bubbleH: 100 }));
        expect(['left', 'right']).toContain(p.side);
        expect(p.side).toBe('left');
        expect(p.bubble.x + p.bubble.w).toBeLessThanOrEqual(470);
    });

    it('on a tab step, drapes the ribbon to just above the tab and stands the pair on the roomier side', () => {
        const x = tabCentre(390, PHONE, 1, 4, true);
        const p = place(base({ tab: { x, atBottom: true }, speaker: 'doro' }));
        expect(p.side).toBe('tab');
        expect(p.ribbon!.px).toBe(x);
        expect(p.ribbon!.py).toBeLessThan(844 - PHONE.bottom);
        expect(p.ribbon!.py).toBeGreaterThan(844 - PHONE.bottom - 10);
        // Stats is the second of four tabs: the pair stand to its right, clear of the tip.
        expect(p.feet.doro.x - (SPEAK * p.scale) / 2).toBeGreaterThan(x);
        expect(p.feet.doro.y).toBeLessThanOrEqual(844 - PHONE.bottom);
    });

    it('gives the AX panel the bottom, full width, and the ribbon a short tab', () => {
        const opening = { x: 18, y: 300, w: 354, h: 74 };
        const p = place(base({ opening, panel: { h: 320 } }));
        expect(p.side).toBe('panel');
        expect(p.bubble.w).toBe(390 - 24);
        expect(p.bubble.y + 320).toBe(844 - PHONE.bottom - 12);
        expect(p.ribbon!.py - p.ribbon!.ay).toBeLessThanOrEqual(56);
        expect(place(base({ tab: { x: 100, atBottom: true }, panel: { h: 320 } })).ribbon).toBeNull();
    });
});

describe('the tour store (brief §4; T-7, T-9)', () => {
    beforeEach(async () => {
        await resetStorage();
        // An empty install, migrated: the stores read and write MMKV only after the B2 migration.
        await ensureMigrated();
        useTourStore.setState({ run: null, muted: false });
    });

    const stored = () => loadSync<Record<string, unknown> | null>(STORAGE_KEYS.TUTORIAL, null);

    it('stays hidden until hydrated, then is due for anyone who has seen none', () => {
        useTourStore.setState({ isReady: false, seen: '1.4' });
        useTourStore.getState().start({ replay: false });
        expect(useTourStore.getState().run).toBeNull();
        useTourStore.getState().hydrate();
        expect(useTourStore.getState().seen).toBeNull();
    });

    it('walks the six steps, a lead before each tab, and remembers the version once finished', () => {
        useTourStore.getState().hydrate();
        const s = useTourStore.getState();
        s.start({ replay: false });
        const walked: string[] = [];
        for (let i = 0; i < 20 && useTourStore.getState().run; i++) {
            const run = useTourStore.getState().run!;
            walked.push(`${currentStep(run)!.id}:${run.beat}:${currentBeat(run)!.screen}`);
            if (isLastBeat(run)) break;
            useTourStore.getState().next();
        }
        expect(walked).toEqual([
            'presets:here:timer',
            'today:here:timer',
            'modes:here:timer',
            'stats:lead:timer',
            'stats:here:stats',
            'notes:lead:stats',
            'notes:here:notes',
            'invite:lead:notes',
            'invite:here:timer',
        ]);
        expect(stored()).toEqual({ resumeAt: 5 });
        useTourStore.getState().finish();
        expect(useTourStore.getState().run).toBeNull();
        expect(stored()).toEqual({ seen: '1.4' });
    });

    it('moves a lead on only when its own tab comes to the front', () => {
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        for (let i = 0; i < 3; i++) useTourStore.getState().next();
        expect(useTourStore.getState().run!.beat).toBe('lead');
        useTourStore.getState().reachScreen('notes');
        expect(useTourStore.getState().run!.beat).toBe('lead');
        useTourStore.getState().reachScreen('stats');
        expect(useTourStore.getState().run!.beat).toBe('here');
    });

    it('resumes a killed tour at its step, once (T-9)', async () => {
        await save(STORAGE_KEYS.TUTORIAL, { resumeAt: 3 });
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        expect(currentStep(useTourStore.getState().run!)!.id).toBe('stats');
        expect(stored()).toEqual({ resumeAt: 3, resumed: true });
        useTourStore.getState().next();
        useTourStore.getState().next();
        expect(stored()).toEqual({ resumeAt: 4, resumed: true });
        // Killed again after its one resume: remembered as seen.
        useTourStore.setState({ run: null });
        useTourStore.getState().hydrate();
        expect(useTourStore.getState().seen).toBe('1.4');
        expect(stored()).toEqual({ seen: '1.4' });
    });

    it('skips at any step, and a skipped tour is seen', () => {
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        useTourStore.getState().next();
        useTourStore.getState().finish();
        expect(stored()).toEqual({ seen: '1.4' });
        useTourStore.getState().start({ replay: false });
        expect(useTourStore.getState().run).toBeNull();
    });

    it('replays without touching what is stored; mid-session it plays steps 2–5 and ends on Notes (T-7)', async () => {
        await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: true, sessionActive: true });
        const run = useTourStore.getState().run!;
        expect(run.steps).toEqual([1, 2, 3, 4]);
        expect(currentStep(run)!.id).toBe('today');
        for (let i = 0; i < 5; i++) useTourStore.getState().next();
        const end = useTourStore.getState().run!;
        expect(currentStep(end)!.id).toBe('notes');
        expect(end.beat).toBe('here');
        expect(isLastBeat(end)).toBe(true);
        useTourStore.getState().finish();
        expect(stored()).toEqual({ seen: '1.4' });

        useTourStore.getState().start({ replay: true });
        expect(useTourStore.getState().run!.steps).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('mutes for the rest of the tour, and a new run starts with the voices on (T-8)', () => {
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        useTourStore.getState().toggleMute();
        expect(useTourStore.getState().muted).toBe(true);
        useTourStore.getState().finish();
        useTourStore.getState().start({ replay: true });
        expect(useTourStore.getState().muted).toBe(false);
    });
});
