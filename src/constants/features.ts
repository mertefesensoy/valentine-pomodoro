import { Platform } from 'react-native';
import { AppMode } from '../types';

/**
 * Hides everything to do with accounts and pairing until 1.5.0's release build
 * turns it on (Phase 2 plan, F1). It controls what a person can reach: code behind
 * it still ships in the one Hermes bytecode file. Typed `boolean` rather than the
 * literal `false`, so the branches behind it stay reachable to the type checker.
 */
export const PAIRING_ENABLED: boolean = false;

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
