import { Platform } from 'react-native';
import { AppMode } from '../types';

/**
 * Where a person can sign in, which accounts and pairing need. Sign in with Apple is the
 * only way in (src/server/appleSignIn.ts), and expo-apple-authentication is Apple-only:
 * on Android its button renders nothing and signInAsync throws, so the pairing sheet
 * would be a dead end. True only on iOS, which includes the iPhone and iPad app on a Mac.
 * Android gains it with Sign in with Google (the Android closed-test plan, Stage 3). Pure.
 */
export function isPairingAvailable(os: typeof Platform.OS = Platform.OS): boolean {
    return os === 'ios';
}

/**
 * Everything to do with accounts and pairing, on since 1.5.0 (Phase 2 plan, F1), where
 * sign-in exists (isPairingAvailable): on iOS, and off on Android as 1.4 shipped it
 * everywhere (the Android closed-test plan, Stage 1). It controls what a person can
 * reach: code behind it still ships in the one Hermes bytecode file. Platform.OS can't
 * change while the app runs, so this is read once, at load.
 */
export const PAIRING_ENABLED: boolean = isPairingAvailable();

/**
 * The anonymous start-up report and its groups (ADR-0051) reach people together with pairing, under one
 * set of privacy labels, so until then the app sends nothing and shows no switch. Off on Android with
 * pairing: the table can't tell an Android row from an iPhone row (model 'unknown', os the API level).
 */
export const STARTUP_REPORTS_ENABLED: boolean = PAIRING_ENABLED;

/**
 * Fly Mode draws a real map with react-native-maps. Only iOS has a provider that
 * works without setup (Apple Maps): Android needs a Google Maps API key the app
 * doesn't ship, and react-native-maps has no web implementation, so opening Fly
 * there crashes. Fly stays hidden on both until the illustrated map (rehaul plan
 * §4.8, Phase 4b) gives every platform a key-free Fly Together.
 */
export function isFlyModeAvailable(os: typeof Platform.OS = Platform.OS): boolean {
    return os === 'ios';
}

/**
 * The mode to actually use for a stored or requested one. A 'fly' where Fly is
 * unavailable becomes 'default', so a persisted mode can never relaunch the app
 * into a crash (the Android crash loop found on 2026-10-29).
 */
export function resolveAppMode(mode: AppMode, os: typeof Platform.OS = Platform.OS): AppMode {
    return mode === 'fly' && !isFlyModeAvailable(os) ? 'default' : mode;
}
