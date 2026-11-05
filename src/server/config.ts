import Constants from 'expo-constants';

/**
 * The hosted project's address and publishable key, from app.json (NFR-SEC-002: publishable, so they
 * may ship). A secret key never comes to the phone. Supabase's new keys go on the `apikey` header and
 * aren't JWTs, so they can't stand in for a user's token on `Authorization`.
 */
const extra = Constants.expoConfig?.extra as { supabaseUrl?: string; supabasePublishableKey?: string } | undefined;

export const SUPABASE_URL = extra?.supabaseUrl ?? '';
export const SUPABASE_PUBLISHABLE_KEY = extra?.supabasePublishableKey ?? '';
