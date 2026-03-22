/**
 * useFlyModeAudio.ts
 *
 * Manages ambient sound playback for Fly Mode sessions.
 * Uses expo-audio's useAudioPlayer hook.
 *
 * ── How to add a sound ───────────────────────────────────────────────────────
 * 1. Place your .mp3 file in src/assets/sounds/
 * 2. Add a key to SOUND_SOURCES below with require(...)
 * 3. Pass the new key as `soundKey` where you call useFlyModeAudio()
 *
 * ── Audio file setup ─────────────────────────────────────────────────────────
 * Place a looping cabin ambient MP3 at:
 *   src/assets/sounds/fly-ambient.mp3
 *
 * Recommended: ~30s seamlessly loopable airplane cabin hum, ~30–60 KB
 * Free sources: freesound.org (search "airplane cabin ambient"), zapsplat.com
 *
 * Until the file is added, SOUND_SOURCES.flyAmbient is null and no sound
 * plays (graceful no-op).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';

// ─── Sound registry ───────────────────────────────────────────────────────────
// Set to null until the user provides the audio file.
// To activate: replace null with require('../assets/sounds/fly-ambient.mp3')

const SOUND_SOURCES = {
    flyAmbient: require('../assets/sounds/fly-ambient.m4a'),
    // Example of adding more sounds in the future:
    // takeoff: require('../assets/sounds/takeoff.mp3'),
    // landing: require('../assets/sounds/landing.mp3'),
} as const;

export type FlySound = keyof typeof SOUND_SOURCES;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Plays a looping Fly Mode ambient sound while `active` is true and
 * `enabled` is true. Pauses when either condition becomes false.
 * Cleans up the player on unmount.
 *
 * @param soundKey - key from SOUND_SOURCES registry
 * @param active   - true when the timer is running (not paused)
 * @param enabled  - from settings.flyModeSound (user preference)
 */
export function useFlyModeAudio(
    soundKey: FlySound,
    active: boolean,
    enabled: boolean
) {
    const source = SOUND_SOURCES[soundKey];
    const player = useAudioPlayer(source);
    const hasPlayedRef = useRef(false);

    useEffect(() => {
        if (active && enabled) {
            player.loop = true;
            player.play();
            hasPlayedRef.current = true;
        } else {
            // Only pause if we've previously started playing (avoids spurious pauses on mount)
            if (hasPlayedRef.current) {
                player.pause();
            }
        }
    }, [active, enabled, source, player]);

    // Reset the "has played" flag when session resets (active goes false → true)
    useEffect(() => {
        if (!active) {
            // Will be set back to true next time we actually play
        }
    }, [active]);

    // Cleanup: release the player when the component unmounts
    useEffect(() => {
        return () => {
            player.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
