import { setAccountNotice, setDeletionPending, setHasAccount } from './account';
import { clearSession } from './client';
import { PENDING_KEY } from './dayReports';
import { clearHome, HOME_KEY, homeClient } from './home';
import { clearPartner } from './partnerGlance';
import { LAST_TZ_KEY } from './timeZone';
import { appStorage } from '../utils/appStorage';

/** One step of forgetting an account: the account is already gone, so a failure here mustn't stop the next. */
async function attempt(step: () => unknown): Promise<void> {
    try {
        await step();
    } catch {
        // Whatever this held is about an account that no longer exists.
    }
}

/**
 * Leaves this phone solo, once the server has deleted the account (Phase 2 D4). Reached by `import()` only.
 *
 *   out: everything about the account gone from this phone, and a line in Settings saying so. The account flag goes
 *        last, because it's what flips the screens, and everything they read has to be gone by then. Your stats and
 *        notes aren't touched, and nor is `pair_celebrated_v1`, since the morph is once per person. Never throws.
 */
export async function forgetAccount(): Promise<void> {
    await attempt(() => clearPartner());
    await attempt(() => homeClient.cancelQueries({ queryKey: HOME_KEY }));
    await attempt(() => clearHome());
    await attempt(() => appStorage.remove(PENDING_KEY));
    await attempt(() => appStorage.remove(LAST_TZ_KEY));
    await attempt(() => clearSession());
    setDeletionPending(false);
    setAccountNotice('deleted');
    setHasAccount(false);
}
