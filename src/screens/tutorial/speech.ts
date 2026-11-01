import type { Speaker } from './tutorials';

/**
 * How a line is spoken (Phase 1 D5; assets record §3.4 and §4.4, the numbers in
 * `art/src/tour/expressions.json` `motion.talk`, checked by the tests).
 *
 * - The write-on: one character every 45 ms (22.2 a second, about adult reading speed), with a
 *   pause of 150 ms after a comma and 300 ms after a stop inside the line.
 * - The babble: a syllable on the line's first letter, then on every 3rd letter for Pomo and every
 *   4th for Doro; the count starts again after each pause. The last syllable is the line's end: it
 *   rises for a question and falls otherwise.
 * - The mouth is open for the first 60 % of a syllable's slot (k × 45 ms).
 *
 * Pure and synchronous: the bubble's clock walks this schedule, so the letters, the syllables and
 * the mouth stay in step.
 */

export const CHAR_MS = 45;
export const PAUSE_MS = { comma: 150, stop: 300 } as const;
export const LETTERS_PER_SYLLABLE: Record<Speaker, number> = { pomo: 3, doro: 4 };
export const OPEN_SHARE = 0.6;

export type Syllable = {
    /** Milliseconds from the line's start. */
    at: number;
    /** Set on the line's last syllable: the rising or falling ending. */
    end?: 'up' | 'down';
};

export type Speech = {
    /** The characters (code points, so an accented or astral character is one step). */
    chars: string[];
    /** When each character shows, in ms from the start; the line is whole at `total`. */
    reveal: number[];
    syllables: Syllable[];
    total: number;
    /** How long the mouth stays open per syllable. */
    mouthMs: number;
};

const LETTER = /\p{L}/u;
const COMMA = /[,;:]/;
const STOP = /[.!?…]/;

export function speechFor(line: string, who: Speaker): Speech {
    const chars = Array.from(line);
    const k = LETTERS_PER_SYLLABLE[who];
    const reveal: number[] = [];
    const syllables: Syllable[] = [];
    let t = 0;
    let letters = 0;
    chars.forEach((ch, i) => {
        reveal.push(t);
        if (LETTER.test(ch)) {
            if (letters % k === 0) syllables.push({ at: t });
            letters++;
        }
        t += CHAR_MS;
        // The pose sheet's own rules (scripts/art/tour-motion.js writeOn): a comma always rests; a
        // stop rests unless it ends the line.
        if (COMMA.test(ch)) {
            t += PAUSE_MS.comma;
            letters = 0;
        } else if (STOP.test(ch) && i < chars.length - 1) {
            t += PAUSE_MS.stop;
            letters = 0;
        }
    });
    if (syllables.length) {
        syllables[syllables.length - 1] = { ...syllables[syllables.length - 1], end: /\?\s*$/.test(line) ? 'up' : 'down' };
    }
    return { chars, reveal, syllables, total: t, mouthMs: Math.round(OPEN_SHARE * k * CHAR_MS) };
}

/** How many characters show at `ms` from the line's start. */
export function shownAt(speech: Speech, ms: number): number {
    let n = 0;
    while (n < speech.reveal.length && speech.reveal[n] <= ms) n++;
    return n;
}
