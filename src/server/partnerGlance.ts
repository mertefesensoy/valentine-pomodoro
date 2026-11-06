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

type GlanceState = {
    glance: PartnerGlance | null;
    /** A partner who has gone, for one quiet line until it's tapped. */
    gone: { name: string | null } | null;
};

const EMPTY: GlanceState = { glance: null, gone: null };

export const usePartnerGlance = create<GlanceState>()(() => (hasAccount() ? loadSync<GlanceState>(GLANCE_KEY, EMPTY) : EMPTY));

function store(next: GlanceState): void {
    saveSync(GLANCE_KEY, next);
    usePartnerGlance.setState(next);
}

/**
 * Takes in a snapshot.
 *   in : `snapshot`, from `home_snapshot`; `now`, for tests.
 *   out: the store and its key. With a couple, the summary is replaced and any "gone" line cleared. With no couple
 *        where there was one, the summary goes and its name moves into `gone`, which is how a later line can name
 *        them with nothing from the server. With neither, nothing changes.
 */
export function syncGlance(snapshot: HomeSnapshot, now: number = Date.now()): void {
    if (snapshot.couple) {
        store({
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
    if (glance) store({ glance: null, gone: { name: glance.name } });
}

/** The "aren't paired any more" line has been seen. */
export function dismissGone(): void {
    store({ glance: usePartnerGlance.getState().glance, gone: null });
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
