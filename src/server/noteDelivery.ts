import { rpc } from './client';
import { usePartnerGlance } from './partnerGlance';

/**
 * Tells the server which of your partner's notes have been shown (Phase 2 D3), so they aren't delivered again. Reached
 * by `import()` only, from code that has a partner's note or an account, so a solo launch never evaluates this.
 *
 *   out: one `mark_note_shown` call per id in `shown`, stopping at the first failure, since that's almost always the
 *        network. Nothing is removed here: an id leaves `shown` when a snapshot no longer lists it, which is the proof
 *        the server has it. Calling again is harmless, since on the server the first time counts. Never throws.
 */
export async function flushShown(): Promise<void> {
    for (const id of usePartnerGlance.getState().shown) {
        try {
            await rpc('mark_note_shown', { p_id: id });
        } catch {
            return;
        }
    }
}
