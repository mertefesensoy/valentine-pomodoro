import { Offline, rpc, SessionEnded } from '../../server/client';
import { refreshHome } from '../../server/home';

export type SendResult = 'ok' | 'rate_limited' | 'not_paired' | 'offline' | 'session_ended' | 'failed';

/**
 * Sends a note to your partner (Phase 2 D3).
 *   in : `clientId`, kept across retries of the same words, because `send_note` is idempotent on it, so a retry after
 *        a lost answer can't send twice; `body`, 1 to 280 characters.
 *   out: a status, and it never throws. `not_paired` refreshes first, which is how the strip finds out they've gone.
 */
export async function sendNote(clientId: string, body: string): Promise<SendResult> {
    try {
        const { status } = await rpc<{ status: string }>('send_note', { p_client_id: clientId, p_body: body });
        if (status === 'ok' || status === 'rate_limited') return status;
        if (status === 'not_paired') {
            await refreshHome().catch(() => {});
            return 'not_paired';
        }
        return 'failed';
    } catch (error) {
        if (error instanceof SessionEnded) return 'session_ended';
        return error instanceof Offline ? 'offline' : 'failed';
    }
}
