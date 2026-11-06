import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

/**
 * Asking Apple (Phase 2 C1). Apple's own sheet is the whole interface here; this only prepares the request
 * and reads the answer. Reached only through import(), like the client.
 */

export type AppleSignIn = {
    identityToken: string;
    rawNonce: string;
    /** The person's first name. Apple sends it only on the first sign-in, so the caller saves it at once. */
    firstName: string | null;
};

const isCancel = (error: unknown) => (error as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED';

/**
 * Asks Apple to sign in, for the full name and not the email (NFR-PRIV-001). Returns null if the person
 * cancels. Apple receives the nonce's SHA-256, and Supabase receives the raw value and compares them, so a
 * token captured elsewhere can't be replayed here.
 */
export async function requestSignIn(): Promise<AppleSignIn | null> {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    try {
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
            nonce: hashedNonce,
        });
        if (!credential.identityToken) return null;
        const name = credential.fullName;
        return {
            identityToken: credential.identityToken,
            rawNonce,
            firstName: name?.givenName?.trim() || name?.nickname?.trim() || name?.familyName?.trim() || null,
        };
    } catch (error) {
        if (isCancel(error)) return null;
        throw error;
    }
}

/**
 * Asks Apple to confirm a deletion, which gives the fresh authorization code delete-account exchanges for
 * the token it revokes (plan B3). Returns null if the person cancels.
 */
export async function requestDeletionCode(): Promise<string | null> {
    try {
        const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
        return credential.authorizationCode ?? null;
    } catch (error) {
        if (isCancel(error)) return null;
        throw error;
    }
}
