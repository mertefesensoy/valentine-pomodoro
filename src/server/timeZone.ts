import { appStorage } from '../utils/appStorage';
import { rpc } from './client';

/**
 * Tells the server this phone's time zone when it changes (Phase 2 C3): home_snapshot finds a partner's
 * today from it. Never throws: a failure just tries again next time.
 */
export const LAST_TZ_KEY = 'profile_tz_v1';

export async function syncTimeZone(zone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): Promise<void> {
    if (!zone || appStorage.getString(LAST_TZ_KEY) === zone) return;
    try {
        const { status } = await rpc<{ status: string }>('set_profile', { p_tz: zone });
        if (status === 'ok') appStorage.set(LAST_TZ_KEY, zone);
    } catch {
        // Offline, or the session ended: the next launch or foreground tries again.
    }
}
