import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';

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
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
const MOVE_MS = 420;
const ARRIVE_MS = 360;
const ROLE_MS = 280;

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
    const [faces, setFaces] = useState({ cur: pose, prev: pose, look, prevLook: look });
    // React's pattern for a prop change: adjust the state during render, once.
    if (faces.cur !== pose || faces.look !== look) setFaces({ cur: pose, prev: faces.cur, look, prevLook: faces.look });
    const cur = recipe(faces.cur, faces.look, outer);
    const prev = recipe(faces.prev, faces.prevLook, outer);

    // Milliseconds into the latest change; CHANGE_MS when settled.
    const change = useSharedValue(CHANGE_MS);
    const changedAt = useRef(0);
    const first = useRef(true);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        changedAt.current = Date.now();
        cancelAnimation(change);
        if (reduced) {
            change.set(CHANGE_MS);
            return;
        }
        change.set(0);
        change.set(withTiming(CHANGE_MS, { duration: CHANGE_MS, easing: Easing.linear }));
    }, [faces, change, reduced]);

    // The gesture's clock, after the change: a wave swings, a point nudges.
    const gesture = useSharedValue(0);
    useEffect(() => {
        cancelAnimation(gesture);
        gesture.set(0);
        if (reduced || !cur.hand) return;
        const span = cur.hand.startsWith('wave') ? WAVE.periodMs * WAVE.cycles + WAVE.homeMs : POINT.nudgeMs;
        gesture.set(withDelay(CHANGE_MS, withTiming(span, { duration: span, easing: Easing.linear })));
    }, [cur.hand, faces, gesture, reduced]);

    // Arriving: a drop of 28 pt and a fade on the strong ease-out, then the landing's squash.
    const arrive = useSharedValue(0);
    const land = useSharedValue(CHANGE_MS);
    useEffect(() => {
        if (reduced || !entrance) {
            arrive.set(withDelay(reduced ? arriveDelay : 0, withTiming(1, { duration: 200 })));
            return;
        }
        arrive.set(withDelay(arriveDelay, withTiming(1, { duration: ARRIVE_MS, easing: EASE_OUT })));
        land.set(0);
        land.set(withDelay(arriveDelay + ARRIVE_MS - 60, withTiming(CHANGE_MS, { duration: CHANGE_MS, easing: Easing.linear })));
        // The entrance is decided when the character mounts; a later change of it changes nothing.
    }, [arrive, land, arriveDelay, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

    // The speaker breathes; the listener holds still (T-10). A random phase, so the two never sync.
    const period = BREATH.periodMs[who];
    const [phase0] = useState(() => Math.random() * period);
    const breath = useSharedValue(phase0);
    useEffect(() => {
        cancelAnimation(breath);
        if (reduced || role !== 'speaker') return;
        // From the current phase to the period's end, then whole periods: sin is equal at 0 and P,
        // so the wrap shows no jump.
        const from = breath.get() % period;
        breath.set(from);
        breath.set(
            withSequence(
                withTiming(period, { duration: period - from, easing: Easing.linear }),
                withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(period, { duration: period, easing: Easing.linear })), -1),
            ),
        );
    }, [breath, period, reduced, role]);

    // The blink: the eyes swap to closed for 110 ms, now and then, never mid-change.
    const blink = useSharedValue(0);
    useEffect(() => {
        blink.set(0);
        if (reduced || !cur.blinks) return;
        let timer: ReturnType<typeof setTimeout>;
        const schedule = () => {
            const { waitMs, double } = nextBlink(Math.random(), Math.random());
            timer = setTimeout(() => {
                if (Date.now() - changedAt.current > CHANGE_MS) {
                    const shut = withSequence(withTiming(1, { duration: 0 }), withDelay(BLINK.closedMs, withTiming(0, { duration: 0 })));
                    blink.set(double ? withSequence(shut, withDelay(BLINK.doubleGapMs, shut)) : shut);
                }
                schedule();
            }, waitMs);
        };
        schedule();
        return () => clearTimeout(timer);
    }, [blink, cur.blinks, reduced]);

    // The role: the speaker at full size, the listener at 140/190, about the feet.
    const roleScale = useSharedValue(role === 'speaker' ? 1 : LISTEN / SPEAK);
    useEffect(() => {
        const target = role === 'speaker' ? 1 : LISTEN / SPEAK;
        roleScale.set(reduced ? target : withTiming(target, { duration: ROLE_MS, easing: EASE_IN_OUT }));
    }, [role, roleScale, reduced]);

    // Where the feet stand, and the pair's scale.
    const x = useSharedValue(feet.x);
    const y = useSharedValue(feet.y);
    const k = useSharedValue(scale);
    useEffect(() => {
        const to = (v: number) => (reduced ? v : withTiming(v, { duration: MOVE_MS, easing: EASE_SHEET }));
        x.set(to(feet.x));
        y.set(to(feet.y));
        k.set(to(scale));
    }, [feet.x, feet.y, scale, x, y, k, reduced]);

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
        const sy = squashAt(t) * squashAt(land.get()) * b * holdSy;
        const s = roleScale.get() * k.get();
        const a = arrive.get();
        return {
            opacity: a,
            transform: [
                { translateX: x.get() - (fx / 512) * BOX },
                { translateY: y.get() - (fy / 512) * BOX - (reduced || !entrance ? 0 : 28 * (1 - a)) },
                { rotate: `${rotate}deg` },
                { scaleX: s / sy },
                { scaleY: s * sy },
            ],
        };
    });
    const curFace = useAnimatedStyle(() => ({ opacity: faceInAt(change.get()) }));
    const prevFace = useAnimatedStyle(() => ({ opacity: faceOutAt(change.get()) }));
    const curEyes = useAnimatedStyle(() => ({ opacity: 1 - blink.get() }));
    const blinkEyes = useAnimatedStyle(() => ({ opacity: blink.get() }));
    const ownMouth = useAnimatedStyle(() => ({ opacity: talks && mouth.get() > 0 ? 0 : 1 }));
    const talk1 = useAnimatedStyle(() => ({ opacity: mouth.get() === 1 ? 1 : 0 }));
    const talk2 = useAnimatedStyle(() => ({ opacity: mouth.get() === 2 ? 1 : 0 }));
    const talk3 = useAnimatedStyle(() => ({ opacity: mouth.get() === 3 ? 1 : 0 }));
    const talkStyles = [talk1, talk2, talk3];

    return (
        <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.box, { transformOrigin: `${(fx / 512) * 100}% ${(fy / 512) * 100}%` }, body]}
            testID={`tour-${who}`}
        >
            {/* The die-cut silhouette carries the lift: only stickers lift (DESIGN.md). */}
            <View style={StyleSheet.absoluteFill}>
                <Sticker art={kit.bodyCut} width={BOX} shadow={shadow} />
            </View>
            {prev.hand && prev.hand !== cur.hand && (
                <HandLayer who={who} hand={prev.hand} change={change} gesture={gesture} grow={false} reduced={reduced} />
            )}
            {cur.hand && <HandLayer who={who} hand={cur.hand} change={change} gesture={gesture} grow={prev.hand !== cur.hand} reduced={reduced} />}
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
 * A nub: it grows from its root over the change (or goes back, for the face being left), then
 * waves about its pivot or nudges along its axis. Under Reduce Motion it is simply there or not.
 */
function HandLayer({
    who,
    hand,
    change,
    gesture,
    grow,
    reduced,
}: {
    who: Speaker;
    hand: Hand;
    change: SharedValue<number>;
    gesture: SharedValue<number>;
    grow: boolean;
    reduced: boolean;
}) {
    const { pivot, axis } = HANDS[who][hand];
    const wave = hand.startsWith('wave');
    const mirror = hand.endsWith('left') ? -1 : 1;
    const style = useAnimatedStyle(() => {
        const t = change.get();
        const s = reduced ? (grow ? 1 : 0) : grow ? faceInAt(t) : faceOutAt(t);
        const g = gesture.get();
        const angle = !grow || reduced ? 0 : wave ? mirror * waveAt(g) : 0;
        const nudge = !grow || reduced || wave ? 0 : pointAt(g) * UNIT;
        return {
            opacity: s > 0.01 ? 1 : 0,
            transform: [{ translateX: nudge * axis[0] }, { translateY: nudge * axis[1] }, { rotate: `${angle}deg` }, { scale: Math.max(0.01, s) }],
        };
    });
    return (
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: `${(pivot[0] / 512) * 100}% ${(pivot[1] / 512) * 100}%` }, style]}>
            <Sticker art={KIT[who].hand[hand]} width={BOX} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    box: { position: 'absolute', left: 0, top: 0, width: BOX, height: BOX },
});
