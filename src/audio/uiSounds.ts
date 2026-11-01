/**
 * The three UI sounds (Phase 1 D4; FR-SET-004): focus start, break start and completion, made in
 * SoundCraft (D4 record) and played through expo-audio. Classic plays them; Fly keeps its own
 * ambience and plays none.
 *
 * Contract
 *   - `loadUiSounds()` creates the three players, once; later calls do nothing. Classic queues it
 *     after the first frame (B7's deferred queue), never on the cold-start path (NFR-PERF-001).
 *     `playUiSound` loads them itself if a sound is asked for before that.
 *   - `playUiSound(name)` plays one from its start, unless Settings › Sound is off (read at the
 *     moment it plays). The three are level with one another (within 0.4 LU, D4 record §4.3), so
 *     each plays at full volume.
 *   - `applyUiAudioMode()` sets the audio session the sounds need: they respect the silent switch
 *     (`playsInSilentMode: false`) and mix with other apps' audio rather than pausing it
 *     (`mixWithOthers`); on iOS that's the `.ambient` category. Fly's ambience sets its own mode
 *     when Fly opens, which plays through the switch, so Classic sets this one back whenever it is
 *     in front. The two never play at once: Fly's screen and its player are gone in Classic.
 *   - Nothing here throws: a sound that can't load or play never stops the timer.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useSettingsStore } from '../stores/settingsStore';

export type UiSound = 'focusStart' | 'breakStart' | 'complete';

const SOURCES: Record<UiSound, number> = {
    focusStart: require('../assets/sounds/focus-start.m4a'),
    breakStart: require('../assets/sounds/break-start.m4a'),
    complete: require('../assets/sounds/complete.m4a'),
};

let players: Partial<Record<UiSound, AudioPlayer>> | null = null;

export function loadUiSounds(): void {
    if (players) return;
    players = {};
    for (const name of Object.keys(SOURCES) as UiSound[]) {
        try {
            players[name] = createAudioPlayer(SOURCES[name]);
        } catch {
            // That one stays silent; the others and the timer carry on.
        }
    }
}

export function playUiSound(name: UiSound): void {
    if (!useSettingsStore.getState().settings.sound) return;
    loadUiSounds();
    const player = players?.[name];
    if (!player) return;
    try {
        // A finished player stays at its end, so every play starts from the top.
        player.seekTo(0).catch(() => {});
        player.play();
    } catch {
        // Silent rather than broken.
    }
}

export function applyUiAudioMode(): void {
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
}

/** Tests only: forget the players, so the next play loads them again. */
export function resetUiSounds(): void {
    players = null;
}
