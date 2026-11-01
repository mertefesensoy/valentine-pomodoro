import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    FadeOut,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import { Sticker } from '../../components/stickers/Sticker';
import { HANDS, KIT, TALK, recipe, type Hand, type Pose, type Side } from './kit';
import {
    BLINK,
    BREATH,
    CHANGE_MS,
    FEET,
    POINT,
    WAVE,
    breathAt,
    faceInAt,
    faceOutAt,
    holdAt,
    nextBlink,
    pointAt,
    squashAt,
    waveAt,
} from './motion';
import { LISTEN, SPEAK, type Point } from './placement';
import type { Speaker } from './tutorials';

// The layout box is the speaker's 190 pt square; the listener and a squeezed pair are scales of it,
// about the feet. Positions move on the sheet curve (the opening's own glide).
const BOX = SPEAK;
const UNIT = BOX / 512;
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const MOVE_MS = 420;
const ARRIVE_MS = 360;
/** Under Reduce Motion: the opening's crossfade, which a real move of the pair follows. */
const FADE_MS = 150;
/** A smaller move than this under Reduce Motion is a jump, not a dip. */
const REDUCED_JUMP = 24;
/** When the layer switches to the AX panel, the pair leave (built once, outside render). */
const PAIR_EXIT = FadeOut.duration(FADE_MS).easing(EASE_OUT);

type Props = {
    who: Speaker;
    role: 'speaker' | 'listener';
    pose: Pose;
    /** The side the character faces: the opening's side, for listening eyes and a pointing hand. */
    look: Side;
    feet: Point;
    /** The pair's scale (placement.ts); the listener is 140/190 of it. */
    scale: number;
    /** 0 shows the face's own mouth; 1–3 a talking mouth (TALK), set by the line's clock. */
    mouth: SharedValue<number>;
    /** 1 while the line writes on: the breath halves. */
    talking: SharedValue<number>;
    reduced: boolean;
    shadow: string;
    /** Milliseconds to wait before arriving, so the pair land one after the other. */
    arriveDelay: number;
    /** The run's first arrival drops in and lands; later ones (a new screen, a sheet closed) fade in. */
    entrance: boolean;
};

function Layer({ art }: { art: Parameters<typeof Sticker>[0]['art'] }) {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Sticker art={art} width={BOX} />
        </View>
    );
}

/**
 * Pomo or Doro in the tour (Phase 1 D5; assets record §3.3, the approved pose sheet's motion).
 *
 * - A change of pose: 280 ms of squash and stretch about the feet, the old face fading out as the
 *   new one fades in (they cross at 77 ms), a held tilt or stretch easing in over 220 ms, and a
 *   hand growing from its root or going back.
 * - The speaker breathes (±1.2 %, half while talking) and talks: the line's clock sets `mouth`.
 * - Open-eyed faces blink every 2.8–5.2 s, one blink in five a double. The listener holds its one
 *   pose and only blinks (T-10).
 * - A wave swings 2.5 times after the change; a point nudges along the nub's axis.
 * - Arriving, the character drops in and lands with a squash: the tour's one delight.
 * - Reduce Motion: swaps only, with no squash, breath, blink, talking or gesture; holds apply at
 *   once, the hand is simply there, and arriving is a fade.
 *
 * Everything moves on the UI thread from shared values; React renders only when the pose, the
 * role or the placement changes. Decoration: hidden from VoiceOver (the bubble speaks).
 */
export function TourCharacter({ who, role, pose, look, feet, scale, mouth, talking, reduced, shadow, arriveDelay, entrance }: Props) {
    const kit = KIT[who];
    const outer: Side = who === 'doro' ? 'left' : 'right';
    // Effects read Reduce Motion through a ref: turning it on mid-tour must not replay the last
    // change, the landing or a gesture (review M-15). The worklets read the prop itself.
    const reducedRef = useRef(reduced);
    useEffect(() => {
        reducedRef.current = reduced;
    }, [reduced]);

    // The pose on show. A new pose waits until the current change has settled (M-7). A change of
    // pose always animates; the look alone changing (a glance) swaps the eyes quietly, or changes
    // nothing when no layer differs (M-8). `id` counts the animated changes.
    const [settled, setSettled] = useState(true);
    const [faces, setFaces] = useState({ cur: pose, prev: pose, look, prevLook: look, id: 0 });
    if ((faces.cur !== pose || faces.look !== look) && settled) {
        const from = recipe(faces.cur, faces.look, outer);
        const to = recipe(pose, look, outer);
        const glance = faces.cur === pose && from.mouth === to.mouth && from.hand === to.hand && from.rotate === to.rotate && from.sy === to.sy;
        if (glance) {
            setFaces({ cur: pose, prev: pose, look, prevLook: look, id: faces.id });
        } else {
            setFaces({ cur: pose, prev: faces.cur, look, prevLook: faces.look, id: faces.id + 1 });
            setSettled(false);
        }
    }
    const cur = recipe(faces.cur, faces.look, outer);
    const prev = recipe(faces.prev, faces.prevLook, outer);

    // Milliseconds into the latest change; CHANGE_MS when settled.
    const change = useSharedValue(CHANGE_MS);
    useEffect(() => {
        if (faces.id === 0) return;
        const swap = reducedRef.current;
        if (swap) {
            change.set(CHANGE_MS);
        } else {
            change.set(0);
            change.set(withTiming(CHANGE_MS, { duration: CHANGE_MS, easing: Easing.linear }));
        }
        const id = setTimeout(() => setSettled(true), swap ? 0 : CHANGE_MS);
        return () => clearTimeout(id);
    }, [faces.id, change]);

    // The gesture's clock: the first pose's wave or point starts once the character has landed; a
    // change's, once the change is done (M-1).
    const gesture = useSharedValue(0);
    useEffect(() => {
        cancelAnimation(gesture);
        gesture.set(0);
        if (reducedRef.current || !cur.hand) return;
        const span = cur.hand.startsWith('wave') ? WAVE.periodMs * WAVE.cycles + WAVE.homeMs : POINT.nudgeMs;
        const delay = faces.id === 0 ? (entrance ? arriveDelay + ARRIVE_MS : FADE_MS) : CHANGE_MS;
        gesture.set(withDelay(delay, withTiming(span, { duration: span, easing: Easing.linear })));
        // A new id is the only new gesture; the hand and the entrance are fixed with it.
    }, [faces.id, gesture]); // eslint-disable-line react-hooks/exhaustive-deps

    // Arriving: the run's entrance drops 28 pt and fades on the strong ease-out, then lands with a
    // squash; under Reduce Motion it fades. A later layer's pair fade in over 150 ms: they mount once
    // the opening is found, when the layer's own fade is mostly done, so they neither pop in nor
    // multiply with it (M-13, second pass).
    const arrive = useSharedValue(0);
    const land = useSharedValue(CHANGE_MS);
    useEffect(() => {
        if (!entrance) {
            arrive.set(withTiming(1, { duration: FADE_MS, easing: EASE_OUT }));
            return;
        }
        if (reducedRef.current) {
            arrive.set(withDelay(arriveDelay, withTiming(1, { duration: 200, easing: EASE_OUT })));
            return;
        }
        arrive.set(withDelay(arriveDelay, withTiming(1, { duration: ARRIVE_MS, easing: EASE_OUT })));
        land.set(0);
        land.set(withDelay(arriveDelay + ARRIVE_MS - 60, withTiming(CHANGE_MS, { duration: CHANGE_MS, easing: Easing.linear })));
        // The entrance is decided when the character mounts.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // The speaker breathes; the listener holds still (T-10). A random phase, so the two never sync.
    // The retarget reads the phase on the UI thread, in one worklet (M-5).
    const period = BREATH.periodMs[who];
    const [phase0] = useState(() => Math.random() * period);
    const breath = useSharedValue(phase0);
    const breathe = (p: number) => {
        'worklet';
        // From the current phase to the period's end, then whole periods: sin is equal at 0 and P,
        // so the wrap shows no jump.
        const from = breath.get() % p;
        breath.set(from);
        breath.set(
            withSequence(
                withTiming(p, { duration: p - from, easing: Easing.linear }),
                withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(p, { duration: p, easing: Easing.linear })), -1),
            ),
        );
    };
    useEffect(() => {
        cancelAnimation(breath);
        if (reducedRef.current || role !== 'speaker') return;
        scheduleOnUI(breathe, period);
    }, [breath, period, role]); // eslint-disable-line react-hooks/exhaustive-deps

    // The blink: the eyes swap to closed for 110 ms, now and then. The worklets show it only
    // between changes, so a blink never runs into one (M-12).
    const blink = useSharedValue(0);
    useEffect(() => {
        blink.set(0);
        if (reducedRef.current || !cur.blinks) return;
        let timer: ReturnType<typeof setTimeout>;
        const schedule = () => {
            const { waitMs, double } = nextBlink(Math.random(), Math.random());
            timer = setTimeout(() => {
                const shut = withSequence(withTiming(1, { duration: 0 }), withDelay(BLINK.closedMs, withTiming(0, { duration: 0 })));
                blink.set(double ? withSequence(shut, withDelay(BLINK.doubleGapMs, shut)) : shut);
                schedule();
            }, waitMs);
        };
        schedule();
        return () => clearTimeout(timer);
    }, [blink, cur.blinks]);

    // The role: the speaker at full size, the listener at 140/190, about the feet, on the same
    // curve and time as the move, since the size is their product (M-11).
    // Under Reduce Motion the size changes while the pair are dipped out, as a move does (M-14).
    const roleScale = useSharedValue(role === 'speaker' ? 1 : LISTEN / SPEAK);
    const dip = useSharedValue(1);
    const firstRole = useRef(true);
    useEffect(() => {
        const target = role === 'speaker' ? 1 : LISTEN / SPEAK;
        if (firstRole.current) {
            firstRole.current = false;
            return;
        }
        if (!reducedRef.current) {
            roleScale.set(withTiming(target, { duration: MOVE_MS, easing: EASE_SHEET }));
            return;
        }
        roleScale.set(withDelay(FADE_MS, withTiming(target, { duration: 0 })));
        dip.set(withSequence(withTiming(0, { duration: FADE_MS, easing: EASE_OUT }), withTiming(1, { duration: FADE_MS, easing: EASE_OUT })));
    }, [role, roleScale, dip]);

    // Where the feet stand, and the pair's scale: a glide on the sheet curve. Under Reduce Motion a
    // real move dips out and back in on the opening's own 150 + 150 ms, moving while hidden (M-14).
    const x = useSharedValue(feet.x);
    const y = useSharedValue(feet.y);
    const k = useSharedValue(scale);
    const placed = useRef({ x: feet.x, y: feet.y, k: scale });
    useEffect(() => {
        const was = placed.current;
        placed.current = { x: feet.x, y: feet.y, k: scale };
        if (was.x === feet.x && was.y === feet.y && was.k === scale) return;
        if (!reducedRef.current) {
            const to = (v: number) => withTiming(v, { duration: MOVE_MS, easing: EASE_SHEET });
            x.set(to(feet.x));
            y.set(to(feet.y));
            k.set(to(scale));
            return;
        }
        if (Math.hypot(feet.x - was.x, feet.y - was.y) < REDUCED_JUMP) {
            x.set(feet.x);
            y.set(feet.y);
            k.set(scale);
            return;
        }
        const jump = (v: number) => withDelay(FADE_MS, withTiming(v, { duration: 0 }));
        x.set(jump(feet.x));
        y.set(jump(feet.y));
        k.set(jump(scale));
        dip.set(withSequence(withTiming(0, { duration: FADE_MS, easing: EASE_OUT }), withTiming(1, { duration: FADE_MS, easing: EASE_OUT })));
    }, [feet.x, feet.y, scale, x, y, k, dip]);

    const holdFrom = { rotate: prev.rotate, sy: prev.sy };
    const holdTo = { rotate: cur.rotate, sy: cur.sy };
    const [fx, fy] = FEET[who];
    const talks = role === 'speaker';
    const body = useAnimatedStyle(() => {
        const t = change.get();
        const h = reduced ? 1 : holdAt(t);
        const holdSy = holdFrom.sy + (holdTo.sy - holdFrom.sy) * h;
        const rotate = holdFrom.rotate + (holdTo.rotate - holdFrom.rotate) * h;
        const b = talks && !reduced ? breathAt(breath.get(), period, talking.get() > 0 ? BREATH.talkingFactor : 1) : 1;
        // The squash, the landing and the breath keep the area; a held stretch only grows taller,
        // as on the pose sheet (M-12).
        const sy = reduced ? 1 : squashAt(t) * squashAt(land.get()) * b;
        const s = roleScale.get() * k.get();
        const a = arrive.get();
        return {
            opacity: a * dip.get(),
            transform: [
                { translateX: x.get() - (fx / 512) * BOX },
                { translateY: y.get() - (fy / 512) * BOX - (reduced || !entrance ? 0 : 28 * (1 - a)) },
                { rotate: `${rotate}deg` },
                { scaleX: s / sy },
                { scaleY: s * sy * holdSy },
            ],
        };
    });
    const curFace = useAnimatedStyle(() => ({ opacity: faceInAt(change.get()) }));
    const prevFace = useAnimatedStyle(() => ({ opacity: faceOutAt(change.get()) }));
    const shut = () => {
        'worklet';
        return !reduced && change.get() >= CHANGE_MS ? blink.get() : 0;
    };
    const curEyes = useAnimatedStyle(() => ({ opacity: 1 - shut() }));
    const blinkEyes = useAnimatedStyle(() => ({ opacity: shut() }));
    const ownMouth = useAnimatedStyle(() => ({ opacity: talks && mouth.get() > 0 ? 0 : 1 }));
    const talk1 = useAnimatedStyle(() => ({ opacity: mouth.get() === 1 ? 1 : 0 }));
    const talk2 = useAnimatedStyle(() => ({ opacity: mouth.get() === 2 ? 1 : 0 }));
    const talk3 = useAnimatedStyle(() => ({ opacity: mouth.get() === 3 ? 1 : 0 }));
    const talkStyles = [talk1, talk2, talk3];
    // The hand that stays, grows (a new one) or goes back (the one being left).
    const kept = cur.hand && prev.hand === cur.hand;

    return (
        <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            exiting={PAIR_EXIT}
            style={[styles.box, { transformOrigin: `${(fx / 512) * 100}% ${(fy / 512) * 100}%` }, body]}
            testID={`tour-${who}`}
        >
            {/* The die-cut silhouette carries the lift: only stickers lift (DESIGN.md). */}
            <View style={StyleSheet.absoluteFill}>
                <Sticker art={kit.bodyCut} width={BOX} shadow={shadow} />
            </View>
            {prev.hand && prev.hand !== cur.hand && <HandLayer who={who} hand={prev.hand} change={change} gesture={gesture} mode="shrink" reduced={reduced} />}
            {cur.hand && <HandLayer who={who} hand={cur.hand} change={change} gesture={gesture} mode={kept ? 'keep' : 'grow'} reduced={reduced} />}
            <Layer art={kit.bodyFill} />
            <Animated.View style={[StyleSheet.absoluteFill, prevFace]}>
                <Layer art={kit.eyes[prev.eyes]} />
                <Layer art={kit.mouth[prev.mouth]} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, curFace]}>
                <Animated.View style={[StyleSheet.absoluteFill, curEyes]}>
                    <Layer art={kit.eyes[cur.eyes]} />
                </Animated.View>
                {cur.blinks && !reduced && (
                    <Animated.View style={[StyleSheet.absoluteFill, blinkEyes]}>
                        <Layer art={kit.eyes.blink} />
                    </Animated.View>
                )}
                <Animated.View style={[StyleSheet.absoluteFill, ownMouth]}>
                    <Layer art={kit.mouth[cur.mouth]} />
                </Animated.View>
                {talks &&
                    !reduced &&
                    TALK.map((m, i) => (
                        <Animated.View key={m} style={[StyleSheet.absoluteFill, talkStyles[i]]}>
                            <Layer art={kit.mouth[m]} />
                        </Animated.View>
                    ))}
            </Animated.View>
        </Animated.View>
    );
}

/**
 * A nub: it grows from its root over the change, stays, or goes back (for the face being left),
 * and a hand that's there waves about its pivot or nudges along its axis. Under Reduce Motion it
 * is simply there or not.
 */
function HandLayer({
    who,
    hand,
    change,
    gesture,
    mode,
    reduced,
}: {
    who: Speaker;
    hand: Hand;
    change: SharedValue<number>;
    gesture: SharedValue<number>;
    mode: 'grow' | 'keep' | 'shrink';
    reduced: boolean;
}) {
    const { pivot, axis } = HANDS[who][hand];
    const wave = hand.startsWith('wave');
    const mirror = hand.endsWith('left') ? -1 : 1;
    const style = useAnimatedStyle(() => {
        const t = change.get();
        const s = mode === 'keep' ? 1 : mode === 'shrink' ? (reduced ? 0 : faceOutAt(t)) : reduced ? 1 : faceInAt(t);
        const g = gesture.get();
        const moves = mode !== 'shrink' && !reduced;
        const angle = moves && wave ? mirror * waveAt(g) : 0;
        const nudge = moves && !wave ? pointAt(g) * UNIT : 0;
        return {
            opacity: s > 0.01 ? 1 : 0,
            transform: [{ translateX: nudge * axis[0] }, { translateY: nudge * axis[1] }, { rotate: `${angle}deg` }, { scale: Math.max(0.01, s) }],
        };
    });
    return (
        <Animated.View
            style={[StyleSheet.absoluteFill, { transformOrigin: `${(pivot[0] / 512) * 100}% ${(pivot[1] / 512) * 100}%` }, style]}
            testID={`tour-hand-${hand}`}
        >
            <Sticker art={KIT[who].hand[hand]} width={BOX} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    box: { position: 'absolute', left: 0, top: 0, width: BOX, height: BOX },
});
