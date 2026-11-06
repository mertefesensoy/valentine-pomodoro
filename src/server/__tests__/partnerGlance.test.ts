// covers: FR-PAR-003, FR-ACC-001
// The small summary the Timer's strip reads (Phase 2 D2).
import { dismissGone, GLANCE_KEY, isGlanceStale, syncGlance, takePartnerNote, touchGlance, usePartnerGlance } from '../partnerGlance';
import type { HomeSnapshot } from '../types';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { appStorage } from '../../utils/appStorage';
import { ensureMigrated } from '../../utils/storageMigration';

const mockFlushShown = jest.fn(async () => {});
jest.mock('../noteDelivery', () => ({ flushShown: () => mockFlushShown() }));

const couple = { id: 'c', paired_at: '2026-11-05T10:00:00Z' };
const note = (id: string, body = id) => ({ id, body, created_at: '2026-11-06T09:00:00Z' });
const partner = { id: 'p', display_name: 'Deniz' };
const today = { day_key: '2026-11-06', focus_ms: 75 * 60_000, sessions: 3, goal_hit: false, goal_minutes: 100 };
const snapshot = (over: Partial<HomeSnapshot>): HomeSnapshot => ({
    me: { id: 'm', display_name: 'Ece' },
    couple: null,
    partner: null,
    partner_today: null,
    partner_updated_at: null,
    notes: [],
    invite: null,
    ...over,
});

beforeEach(async () => {
    await resetStorage();
    // The storage migration has always finished by the time anyone has a couple.
    await ensureMigrated();
    usePartnerGlance.setState({ glance: null, gone: null, notes: [], shown: [] });
    mockFlushShown.mockClear();
});

describe('your partner\'s notes', () => {
    it('takes them in from a snapshot, oldest first, with only what\'s needed', () => {
        syncGlance(snapshot({ couple, partner, notes: [note('a'), note('b')] }));
        expect(usePartnerGlance.getState().notes).toEqual([{ id: 'a', body: 'a' }, { id: 'b', body: 'b' }]);
    });

    it('hands over the oldest, once, and tells the server', async () => {
        syncGlance(snapshot({ couple, partner, notes: [note('a'), note('b')] }));
        expect(takePartnerNote()).toEqual({ id: 'a', body: 'a' });
        expect(usePartnerGlance.getState().notes).toEqual([{ id: 'b', body: 'b' }]);
        expect(usePartnerGlance.getState().shown).toEqual(['a']);
        await Promise.resolve();
        await Promise.resolve();
        await new Promise<void>((resolve) => setImmediate(() => resolve()));
        expect(mockFlushShown).toHaveBeenCalled();
    });

    it('has nothing to hand over, and tells nobody, with none waiting', async () => {
        expect(takePartnerNote()).toBeNull();
        await new Promise<void>((resolve) => setImmediate(() => resolve()));
        expect(mockFlushShown).not.toHaveBeenCalled();
    });

    it('can\'t bring one back: a refresh before the server has heard still lists it', () => {
        syncGlance(snapshot({ couple, partner, notes: [note('a')] }));
        takePartnerNote();
        syncGlance(snapshot({ couple, partner, notes: [note('a')] }));
        expect(usePartnerGlance.getState().notes).toEqual([]);
        expect(usePartnerGlance.getState().shown).toEqual(['a']);
    });

    it('lets go of the id once a snapshot stops listing it, which proves the server has it', () => {
        syncGlance(snapshot({ couple, partner, notes: [note('a')] }));
        takePartnerNote();
        syncGlance(snapshot({ couple, partner, notes: [] }));
        expect(usePartnerGlance.getState().shown).toEqual([]);
    });

    it('survives a restart, with what\'s been shown', () => {
        syncGlance(snapshot({ couple, partner, notes: [note('a'), note('b')] }));
        takePartnerNote();
        const saved = JSON.parse(appStorage.getString(GLANCE_KEY) ?? '{}');
        expect(saved.notes).toEqual([{ id: 'b', body: 'b' }]);
        expect(saved.shown).toEqual(['a']);
    });

    it('goes with the partner', () => {
        syncGlance(snapshot({ couple, partner, notes: [note('a')] }));
        syncGlance(snapshot({}));
        expect(usePartnerGlance.getState().notes).toEqual([]);
        expect(takePartnerNote()).toBeNull();
    });

    it('stays when only the "gone" line is dismissed', () => {
        usePartnerGlance.setState({ notes: [{ id: 'a', body: 'a' }], gone: { name: 'Deniz' } });
        dismissGone();
        expect(usePartnerGlance.getState().notes).toHaveLength(1);
    });
});

describe('syncGlance', () => {
    it('keeps what the strip needs from a snapshot with a couple, and saves it for the next launch\'s first frame', () => {
        syncGlance(snapshot({ couple, partner, partner_today: today, partner_updated_at: '2026-11-06T09:00:00Z' }), 1000);
        expect(usePartnerGlance.getState().glance).toEqual({
            coupleId: 'c',
            name: 'Deniz',
            today,
            updatedAt: '2026-11-06T09:00:00Z',
            fetchedAt: 1000,
        });
        expect(appStorage.getString(GLANCE_KEY)).toContain('Deniz');
    });

    it('never carries a day over: no row for their today means none here', () => {
        syncGlance(snapshot({ couple, partner, partner_today: today }), 1000);
        syncGlance(snapshot({ couple, partner, partner_today: null }), 2000);
        expect(usePartnerGlance.getState().glance?.today).toBeNull();
    });

    it('remembers who has gone, so a line can name them with nothing from the server', () => {
        syncGlance(snapshot({ couple, partner }), 1000);
        syncGlance(snapshot({}), 2000);
        expect(usePartnerGlance.getState()).toEqual({ glance: null, gone: { name: 'Deniz' }, notes: [], shown: [] });
    });

    it('says nothing has gone for someone who was never paired', () => {
        syncGlance(snapshot({}), 1000);
        expect(usePartnerGlance.getState()).toEqual({ glance: null, gone: null, notes: [], shown: [] });
    });

    it('clears the line on pairing again', () => {
        syncGlance(snapshot({ couple, partner }), 1000);
        syncGlance(snapshot({}), 2000);
        syncGlance(snapshot({ couple: { ...couple, id: 'c2' }, partner: { id: 'q', display_name: 'Ada' } }), 3000);
        expect(usePartnerGlance.getState().gone).toBeNull();
        expect(usePartnerGlance.getState().glance?.name).toBe('Ada');
    });
});

describe('dismissGone', () => {
    it('removes the line, for good', () => {
        syncGlance(snapshot({ couple, partner }), 1000);
        syncGlance(snapshot({}), 2000);
        dismissGone();
        expect(usePartnerGlance.getState().gone).toBeNull();
        expect(JSON.parse(appStorage.getString(GLANCE_KEY) ?? '{}').gone).toBeNull();
    });
});

describe('touchGlance', () => {
    it('publishes the same values as a new object, so the strip looks again', () => {
        syncGlance(snapshot({ couple, partner, partner_today: today }), 1000);
        const before = usePartnerGlance.getState().glance;
        touchGlance();
        expect(usePartnerGlance.getState().glance).not.toBe(before);
        expect(usePartnerGlance.getState().glance).toEqual(before);
    });

    it('does nothing for someone with no partner', () => {
        touchGlance();
        expect(usePartnerGlance.getState().glance).toBeNull();
    });
});

describe('isGlanceStale', () => {
    const at = (iso: string) => new Date(iso).getTime();

    it('is fresh all day, and stale past this phone\'s midnight', () => {
        const glance = { coupleId: 'c', name: 'Deniz', today, updatedAt: null, fetchedAt: at('2026-11-06T08:00:00') };
        expect(isGlanceStale(glance, at('2026-11-06T23:59:00'))).toBe(false);
        expect(isGlanceStale(glance, at('2026-11-07T00:01:00'))).toBe(true);
    });
});

describe('at launch', () => {
    it('a solo install reads nothing past the account flag', () => {
        jest.isolateModules(() => {
            const storage = jest.requireActual<typeof import('../../utils/storage')>('../../utils/storage');
            const load = jest.spyOn(storage, 'loadSync');
            const { usePartnerGlance: fresh } = jest.requireActual<typeof import('../partnerGlance')>('../partnerGlance');
            expect(fresh.getState()).toEqual({ glance: null, gone: null, notes: [], shown: [] });
            expect(load.mock.calls.map(([key]) => key)).not.toContain(GLANCE_KEY);
            load.mockRestore();
        });
    });
});
