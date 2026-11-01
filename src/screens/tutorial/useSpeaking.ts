import { useEffect, useRef, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { BODY_COUNT, BODY_MOUTHS, END_MOUTHS, pickSyllable, playSyllable } from './babble';
import { speechFor } from './speech';
import type { Speaker } from './tutorials';

type Options = {
    /** VoiceOver is on: the whole line at once, no babble (T-1). */
    instant: boolean;
    /** Not yet known whether VoiceOver is on: the line waits, empty and silent. */
    hold: boolean;
    /** Reduce Motion: the line still writes on and sounds, but the mouth stays still (T-10). */
    reduced: boolean;
    /** The speaker's mouth (0: its face's own; 1–3: a talking mouth) and whether it is talking. */
    mouth: SharedValue<number>;
    talking: SharedValue<number>;
};

/**
 * The line's clock (Phase 1 D5; speech.ts holds the schedule): it reveals the line a character at
 * a time, plays each syllable and opens the speaker's mouth for it, so the three stay in step.
 *
 * - Returns how many characters show, whether the line is whole, and `finish()` (a tap on the
 *   bubble finishes the line at once, brief §6).
 * - Only the caller re-renders, once a character (about 22 times a second): the bubble's text. The
 *   mouth is a shared value, so the character never renders for it.
 * - A new line, or `instant`, restarts it; leaving stops every timer and closes the mouth.
 */
export function useSpeaking(line: string, who: Speaker, { instant, hold, reduced, mouth, talking }: Options) {
    const [state, setState] = useState({ line, who, shown: 0 });
    // A new line starts empty (React's pattern for resetting state on a prop change).
    if (state.line !== line || state.who !== who) setState({ line, who, shown: 0 });
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const speech = speechFor(line, who);
        const clear = () => {
            timers.current.forEach(clearTimeout);
            timers.current = [];
        };
        clear();
        if (hold) return clear;
        if (instant) {
            talking.set(0);
            mouth.set(0);
            return clear;
        }
        talking.set(1);
        const syllableAt = new Map(speech.syllables.map((s) => [s.at, s]));
        let last = -1;
        speech.reveal.forEach((at, i) => {
            timers.current.push(
                setTimeout(() => {
                    setState((s) => (s.line === line ? { ...s, shown: Math.max(s.shown, i + 1) } : s));
                    const syllable = syllableAt.get(at);
                    if (!syllable) return;
                    let open: number;
                    if (syllable.end) {
                        playSyllable(who, syllable.end);
                        open = END_MOUTHS[who][syllable.end];
                    } else {
                        last = pickSyllable(Math.random(), BODY_COUNT, last);
                        playSyllable(who, last);
                        open = BODY_MOUTHS[who][last];
                    }
                    if (reduced) return;
                    mouth.set(open);
                    timers.current.push(setTimeout(() => mouth.set(0), speech.mouthMs));
                }, at),
            );
        });
        timers.current.push(
            setTimeout(() => {
                talking.set(0);
                mouth.set(0);
            }, speech.total),
        );
        return () => {
            clear();
            talking.set(0);
            mouth.set(0);
        };
    }, [line, who, instant, hold, reduced, mouth, talking]);

    const total = Array.from(line).length;
    const finish = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        talking.set(0);
        mouth.set(0);
        setState({ line, who, shown: total });
    };
    // Held, nothing yet; with VoiceOver on, the whole line at once (T-1), however far the clock had got.
    const shown = hold ? 0 : instant ? total : state.line === line ? state.shown : 0;
    return { shown, done: shown >= total, finish };
}
