/**
 * Pomo & Doro's babble (Phase 1 D5; FR-SET-004, NFR-PERF-005): the 12 syllables made in SoundCraft
 * (assets record §3.5, version 2, approved by the owner), played through expo-audio.
 *
 * Contract
 *   - `loadBabble()` creates the 12 players when the tour starts, never on the cold-start path
 *     (brief §4: "the tutorial's art and sounds load only when it starts"); `releaseBabble()`
 *     frees them when it ends. Both are idempotent.
 *   - `playSyllable(who, choice)` plays one syllable, unless Settings › Sound is off or the tour is
 *     muted (read at the moment it plays). The line's clock picks it (`pickSyllable`: random, never
 *     the last one again; the line's last syllable is its rising or falling ending), so the mouth
 *     moves with the line whether or not it sounds.
 *   - The variation the owner approved ("version 2 with variation is the way to go"; the numbers
 *     in `art/sound/sounds.json` `babble.playback`): a pitch shift uniform in ±10 cents, as a rate
 *     of 2^(c/1200) with pitch correction off, and a gain uniform in ±1.5 dB. expo-audio's volume
 *     stops at 1.0, so the gain's base is −1.5 dB and +1.5 dB reaches unity: on average the voices
 *     sit 1.5 dB under the measured −20 LUFS line (D5 record §3.7).
 *   - The audio session is D4's ambient one, which Classic sets: the babble respects the silent
 *     switch and mixes with other audio.
 *   - Nothing here throws: a voice that can't load or play leaves the tour silent, never stuck.
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { useSettingsStore } from '../../stores/settingsStore';
import { useTourStore } from './tourStore';
import type { Speaker } from './tutorials';

export const DETUNE_CENTS = 10;
export const GAIN_DB = 1.5;

const BODY: Record<Speaker, number[]> = {
    pomo: [
        require('../../assets/sounds/babble/pomo-pa.m4a'),
        require('../../assets/sounds/babble/pomo-pi.m4a'),
        require('../../assets/sounds/babble/pomo-po.m4a'),
        require('../../assets/sounds/babble/pomo-pe.m4a'),
    ],
    doro: [
        require('../../assets/sounds/babble/doro-mo.m4a'),
        require('../../assets/sounds/babble/doro-mu.m4a'),
        require('../../assets/sounds/babble/doro-ma.m4a'),
        require('../../assets/sounds/babble/doro-me.m4a'),
    ],
};
const ENDS: Record<Speaker, Record<'up' | 'down', number>> = {
    pomo: { up: require('../../assets/sounds/babble/pomo-up.m4a'), down: require('../../assets/sounds/babble/pomo-down.m4a') },
    doro: { up: require('../../assets/sounds/babble/doro-up.m4a'), down: require('../../assets/sounds/babble/doro-down.m4a') },
};

/**
 * The tour kit's mouth for each syllable while it sounds (`sounds.json` `mouth`): 1 talk-small,
 * 2 talk-wide, 3 talk-round (kit.ts `TALK`). Body syllables in BODY's order, then the endings.
 */
export const BODY_MOUTHS: Record<Speaker, number[]> = { pomo: [2, 1, 3, 1], doro: [3, 3, 2, 1] };
export const END_MOUTHS: Record<Speaker, Record<'up' | 'down', number>> = { pomo: { up: 2, down: 3 }, doro: { up: 3, down: 3 } };
export const BODY_COUNT = 4;

type Voice = { body: (AudioPlayer | null)[]; up: AudioPlayer | null; down: AudioPlayer | null };
let voices: Record<Speaker, Voice> | null = null;

function player(source: number): AudioPlayer | null {
    try {
        return createAudioPlayer(source);
    } catch {
        return null;
    }
}

export function loadBabble(): void {
    if (voices) return;
    const voice = (who: Speaker): Voice => ({
        body: BODY[who].map(player),
        up: player(ENDS[who].up),
        down: player(ENDS[who].down),
    });
    voices = { pomo: voice('pomo'), doro: voice('doro') };
}

export function releaseBabble(): void {
    if (!voices) return;
    for (const v of Object.values(voices)) {
        for (const p of [...v.body, v.up, v.down]) {
            try {
                p?.remove();
            } catch {
                // Already gone.
            }
        }
    }
    voices = null;
}

// The run ending frees the voices, wherever it ended (a screen's layer may unmount first).
useTourStore.subscribe((s, prev) => {
    if (prev.run && !s.run) releaseBabble();
});

/** A body syllable's index from a uniform draw in [0, 1), never the last one again. */
export function pickSyllable(r: number, count: number, last: number): number {
    if (count <= 1) return 0;
    if (last < 0 || last >= count) return Math.min(count - 1, Math.floor(r * count));
    const i = Math.min(count - 2, Math.floor(r * (count - 1)));
    return i >= last ? i + 1 : i;
}

/** The playback rate and volume for draws r1, r2 in [0, 1). */
export function variation(r1: number, r2: number): { rate: number; volume: number } {
    const cents = (2 * r1 - 1) * DETUNE_CENTS;
    const db = (2 * r2 - 1) * GAIN_DB - GAIN_DB;
    return { rate: Math.pow(2, cents / 1200), volume: Math.min(1, Math.pow(10, db / 20)) };
}

/** Plays body syllable `choice` (its index in BODY), or a line's ending. */
export function playSyllable(who: Speaker, choice: number | 'up' | 'down', random: () => number = Math.random): void {
    if (!useSettingsStore.getState().settings.sound || useTourStore.getState().muted) return;
    loadBabble();
    const v = voices?.[who];
    if (!v) return;
    const p = typeof choice === 'number' ? (v.body[choice] ?? null) : v[choice];
    if (!p) return;
    try {
        const { rate, volume } = variation(random(), random());
        p.shouldCorrectPitch = false;
        p.setPlaybackRate(rate);
        p.volume = volume;
        // A finished player stays at its end, so every syllable starts from the top.
        p.seekTo(0).catch(() => {});
        p.play();
    } catch {
        // Silent rather than broken.
    }
}
