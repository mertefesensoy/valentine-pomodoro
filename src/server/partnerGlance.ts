import { create } from 'zustand';
import { appStorage } from '../utils/appStorage';
import { loadSync, saveSync } from '../utils/storage';
import { getDayKeyFromDate } from '../utils/time';
import { hasAccount } from './account';
import type { HomeSnapshot } from './types';

/**
 * What the Timer's strip knows about your partner (Phase 2 D2). The strip is on screen from the first frame, before
 * any paired code has loaded, so it reads this small persisted summary and never the query. This module imports no
 * SDK, as `account.ts` doesn't, and with no account it reads nothing past the account flag, so a solo launch stays
 * as it was. `syncGlance`, called from `fetchHome`, is the only writer of the values.
 */
export const GLANCE_KEY = 'partner_glance_v1';

export type PartnerGlance = {
    coupleId: string;
    name: string | null;
    /** Their today when this was fetched. */
    today: HomeSnapshot['partner_today'];
    /** When their day was last reported. */
    updatedAt: string | null;
    /** When this phone last heard, in ms. */
    fetchedAt: number;
};

export type PartnerNote = { id: string; body: string };

type GlanceState = {
    glance: PartnerGlance | null;
    /** A partner who has gone, for one quiet line until it's tapped. */
    gone: { name: string | null } | null;
    /** Their notes waiting to be shown here, oldest first (Phase 2 D3). */
    notes: PartnerNote[];
    /** Notes shown here that a snapshot still listed, so a refresh can't bring them back. */
    shown: string[];
};

const EMPTY: GlanceState = { glance: null, gone: null, notes: [], shown: [] };

export const usePartnerGlance = create<GlanceState>()(() =>
    hasAccount() ? { ...EMPTY, ...loadSync<Partial<GlanceState>>(GLANCE_KEY, EMPTY) } : EMPTY,
);

function store(patch: Partial<GlanceState>): void {
    const next = { ...usePartnerGlance.getState(), ...patch };
    saveSync(GLANCE_KEY, next);
    usePartnerGlance.setState(next);
}

/**
 * Takes in a snapshot.
 *   in : `snapshot`, from `home_snapshot`; `now`, for tests.
 *   out: the store and its key. With a couple, the summary is replaced and any "gone" line cleared, and their notes
 *        are taken in, less any already shown here. An id leaves `shown` once a snapshot stops listing it, which is
 *        the proof the server has it. With no couple where there was one, the summary and notes go and the name moves
 *        into `gone`, which is how a later line can name them with nothing from the server. With neither, nothing
 *        changes.
 */
export function syncGlance(snapshot: HomeSnapshot, now: number = Date.now()): void {
    if (snapshot.couple) {
        const { shown } = usePartnerGlance.getState();
        store({
            notes: snapshot.notes.filter((note) => !shown.includes(note.id)).map(({ id, body }) => ({ id, body })),
            shown: shown.filter((id) => snapshot.notes.some((note) => note.id === id)),
            glance: {
                coupleId: snapshot.couple.id,
                name: snapshot.partner?.display_name ?? null,
                today: snapshot.partner_today,
                updatedAt: snapshot.partner_updated_at,
                fetchedAt: now,
            },
            gone: null,
        });
        return;
    }
    const { glance } = usePartnerGlance.getState();
    if (glance) store({ glance: null, gone: { name: glance.name }, notes: [], shown: [] });
}

/**
 * The clock has moved, though nothing else has: the app has come back, and any refresh may fail. Publishes the same
 * values as a new object, so the strip looks again at whether "today" still holds. No side effects past the store.
 */
export function touchGlance(): void {
    const { glance } = usePartnerGlance.getState();
    if (glance) usePartnerGlance.setState({ glance: { ...glance } });
}

/**
 * The next note from your partner, for showing now, and it won't come again: it moves out of `notes` and into `shown`
 * in one write, before anything can show it, and the server hears straight away, or at the next refresh. It's
 * marked on showing, not on closing, because someone who kills the app with it open has still seen it.
 *   out: the oldest note, or null, with no effect, when there's none.
 */
export function takePartnerNote(): PartnerNote | null {
    const { notes, shown } = usePartnerGlance.getState();
    const [next, ...rest] = notes;
    if (!next) return null;
    store({ notes: rest, shown: [...shown, next.id] });
    void import('./noteDelivery').then(({ flushShown }) => flushShown()).catch(() => {});
    return next;
}

/** The "aren't paired any more" line has been seen. */
export function dismissGone(): void {
    store({ gone: null });
}

/**
 * Whether "today" in this summary might be yesterday: it was fetched on an earlier day here. A partner's own day can
 * differ from this phone's, but past this phone's midnight with no refresh the strip can't claim to know.
 */
export function isGlanceStale(glance: PartnerGlance, now: number = Date.now()): boolean {
    return getDayKeyFromDate(glance.fetchedAt) !== getDayKeyFromDate(now);
}

/** The morph plays once per person, at their first pairing: pairing again with someone new doesn't replay it. */
export const CELEBRATED_KEY = 'pair_celebrated_v1';

export function markCelebrated(coupleId: string): void {
    appStorage.set(CELEBRATED_KEY, coupleId);
}

export function wasCelebrated(): boolean {
    return appStorage.getString(CELEBRATED_KEY) !== undefined;
}
