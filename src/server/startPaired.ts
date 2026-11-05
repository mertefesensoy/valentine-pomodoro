import { PAIRING_ENABLED } from '../constants/features';
import { runAfterInteractive } from '../startup/deferredStartup';
import { hasAccount } from './account';

/**
 * The gate every launch passes (Phase 2 C2, ADR-0049). It imports no SDK. With no account it does nothing
 * beyond reading one flag, so a solo launch never evaluates the client, Query or the Keychain. Returns a
 * cancel function.
 */
export function schedulePairedRuntime(): () => void {
    if (!PAIRING_ENABLED || !hasAccount()) return () => {};
    return runAfterInteractive('paired.start', async () => {
        const { startPairedRuntime } = await import('./runtime');
        startPairedRuntime();
    });
}
