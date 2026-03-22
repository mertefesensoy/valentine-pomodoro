/**
 * useFlyModeAudio.ts
 *
 * Manages ambient sound playback for Fly Mode sessions.
 * Uses expo-audio's useAudioPlayer hook.
 *
 * ── How to add a sound ───────────────────────────────────────────────────────
 * 1. Place your .m4a / .mp3 file in src/assets/sounds/
 * 2. Add a key to SOUND_SOURCES below with require(...)
 * 3. Pass the new key as `soundKey` where you call useFlyModeAudio()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// ─── Sound registry ───────────────────────────────────────────────────────────

const SOUND_SOURCES = {
    flyAmbient: require('../assets/sounds/fly-ambient.m4a'),
    // Future sounds:
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

    // Configure the audio session once on mount:
    // • playsInSilentMode — sound plays even when the iOS hardware mute switch
    //   is flipped on. Without this, the cabin hum is completely silent on muted
    //   devices (the most common reason ambient sounds aren't heard).
    // • mixWithOthers — the cabin hum layers over the user's music rather than
    //   pausing it when playback starts.
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: 'mixWithOthers',
        }).catch(() => {}); // non-fatal
    }, []);

    useEffect(() => {
        if (active && enabled) {
            player.loop = true;
            player.volume = 1.0;  // explicit full volume
            player.play();
            hasPlayedRef.current = true;
        } else {
            // Only pause if we've previously started playing (avoids spurious pauses on mount)
            if (hasPlayedRef.current) {
                player.pause();
            }
        }
    }, [active, enabled, source, player]);

    // Cleanup: pause first to avoid a play/remove race, then release player
    useEffect(() => {
        return () => {
            try { player.pause(); } catch { /* ignore */ }
            try { player.remove(); } catch { /* ignore */ }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
