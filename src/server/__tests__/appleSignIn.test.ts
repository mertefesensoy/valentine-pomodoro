// covers: FR-ACC-002
// Asking Apple (Phase 2 C1): the nonce, the name, and a cancel.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { requestDeletionCode, requestSignIn } from '../appleSignIn';

jest.mock('expo-apple-authentication', () => ({
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
    signInAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    randomUUID: jest.fn(() => 'raw-nonce'),
    digestStringAsync: jest.fn(async () => 'hashed-nonce'),
}));

const signIn = jest.mocked(AppleAuthentication.signInAsync);
const cancel = Object.assign(new Error('cancelled'), { code: 'ERR_REQUEST_CANCELED' });

beforeEach(() => signIn.mockReset());

describe('requestSignIn', () => {
    it('asks for the name and not the email, with the hashed nonce, and returns the raw one', async () => {
        signIn.mockResolvedValue({ identityToken: 'token', fullName: { givenName: 'Ece', familyName: 'Yılmaz' } } as never);

        await expect(requestSignIn()).resolves.toEqual({ identityToken: 'token', rawNonce: 'raw-nonce', firstName: 'Ece' });

        expect(signIn).toHaveBeenCalledWith({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME], nonce: 'hashed-nonce' });
        expect(Crypto.digestStringAsync).toHaveBeenCalledWith('SHA-256', 'raw-nonce');
    });

    it('has no name on a later sign-in, when Apple sends none', async () => {
        signIn.mockResolvedValue({ identityToken: 'token', fullName: null } as never);
        await expect(requestSignIn()).resolves.toMatchObject({ firstName: null });
    });

    it('makes do with another part of the name, and ignores blanks', async () => {
        signIn.mockResolvedValue({ identityToken: 'token', fullName: { givenName: '  ', familyName: 'Yılmaz' } } as never);
        await expect(requestSignIn()).resolves.toMatchObject({ firstName: 'Yılmaz' });
    });

    it('returns null when the person cancels, never an error', async () => {
        signIn.mockRejectedValue(cancel);
        await expect(requestSignIn()).resolves.toBeNull();
    });

    it('passes on a real failure', async () => {
        signIn.mockRejectedValue(new Error('no network'));
        await expect(requestSignIn()).rejects.toThrow('no network');
    });

    it('returns null with no identity token', async () => {
        signIn.mockResolvedValue({ identityToken: null } as never);
        await expect(requestSignIn()).resolves.toBeNull();
    });
});

describe('requestDeletionCode', () => {
    it('asks Apple again, with no scopes, and returns the fresh code', async () => {
        signIn.mockResolvedValue({ authorizationCode: 'fresh-code' } as never);
        await expect(requestDeletionCode()).resolves.toBe('fresh-code');
        expect(signIn).toHaveBeenCalledWith({ requestedScopes: [] });
    });

    it('returns null when the person cancels', async () => {
        signIn.mockRejectedValue(cancel);
        await expect(requestDeletionCode()).resolves.toBeNull();
    });
});
