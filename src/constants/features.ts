import { Platform } from 'react-native';
import { AppMode } from '../types';

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
