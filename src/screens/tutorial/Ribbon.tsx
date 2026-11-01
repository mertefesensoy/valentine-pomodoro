import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import type { ThemeTokens } from '../../theme/palette';
import type { RibbonCurve } from './placement';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** The drape between controls, on the sheet curve (brief §6). */
const DRAPE_MS = 420;
/** The drop from the top of the page at the start (the contract's STORY). */
const DROP_MS = 520;
const FADE_MS = 150;
/** The band: 11 pt of strawberry inside a 1.5 pt `ringFocus` edge; the swallowtail is 16 pt long. */
const BAND = 11;
const EDGE = 1.5;
const TIP = 16;
const NOTCH = 6;

type G = readonly [number, number, number, number, number, number, number, number];

const toG = (c: RibbonCurve): G => [c.ax, c.ay, c.c1x, c.c1y, c.c2x, c.c2y, c.px, c.py];
/** Everything gathered at the anchor: the ribbon before it drops. */
const furled = (c: RibbonCurve): G => [c.ax, c.ay, c.ax, c.ay, c.ax, c.ay, c.ax, c.ay + 2];

/** The unit tangent at the tip, from the last control point (or the anchor, if they meet). */
function tangent(ax: number, ay: number, c2x: number, c2y: number, px: number, py: number): [number, number] {
    'worklet';
    let tx = px - c2x;
    let ty = py - c2y;
    if (Math.hypot(tx, ty) < 0.5) {
        tx = px - ax;
        ty = py - ay;
    }
    const len = Math.hypot(tx, ty) || 1;
    return [tx / len, ty / len];
}

function mix(a: readonly number[], b: readonly number[], k: number): number[] {
    'worklet';
    return a.map((v, i) => v + (b[i] - v) * k);
}

/**
 * The bookmark ribbon (the direction contract's FORM, owner's pick 2026-11-01): the diary's
 * strawberry ribbon hangs from beyond the top edge and drapes to the control the pair are talking
 * about, its swallowtail tip pointing at it. Between beats its curve's four points glide on the
 * sheet curve (the signature interaction); at the run's start it drops from the top, and on a later
 * screen it fades in, already hanging. Under Reduce Motion it fades out and back in at its new place.
 *
 * The curve is computed on the UI thread from three shared values (where it was, where it's going,
 * how far along), so a drape renders nothing in React. Decoration: no touches, hidden from
 * VoiceOver; the bubble names what it points at.
 */
export function Ribbon({ curve, tokens, reduced, entrance }: { curve: RibbonCurve | null; tokens: ThemeTokens; reduced: boolean; entrance: boolean }) {
    const from = useSharedValue<number[]>(curve ? [...furled(curve)] : [0, 0, 0, 0, 0, 0, 0, 0]);
    const to = useSharedValue<number[]>(curve ? [...toG(curve)] : [0, 0, 0, 0, 0, 0, 0, 0]);
    const k = useSharedValue(0);
    const opacity = useSharedValue(curve ? 1 : 0);
    const shown = useRef(false);

    const key = curve ? toG(curve).map((v) => v.toFixed(1)).join(',') : 'none';
    useEffect(() => {
        if (!curve) {
            opacity.set(withTiming(0, { duration: FADE_MS }));
            return;
        }
        const target = [...toG(curve)];
        if (!shown.current) {
            shown.current = true;
            from.set([...furled(curve)]);
            to.set(target);
            // The drop is the run's entrance; on a later screen the ribbon is already hanging.
            if (reduced || !entrance) {
                k.set(1);
                opacity.set(0);
                opacity.set(withTiming(1, { duration: FADE_MS * 2 }));
            } else {
                k.set(0);
                opacity.set(1);
                k.set(withTiming(1, { duration: DROP_MS, easing: EASE_OUT }));
            }
            return;
        }
        // From wherever it is now, mid-drape included.
        from.set(mix(from.get(), to.get(), k.get()));
        to.set(target);
        k.set(0);
        if (reduced) {
            opacity.set(withSequence(withTiming(0, { duration: FADE_MS }), withTiming(1, { duration: FADE_MS })));
            k.set(withDelay(FADE_MS, withTiming(1, { duration: 0 })));
        } else {
            opacity.set(withTiming(1, { duration: FADE_MS }));
            k.set(withTiming(1, { duration: DRAPE_MS, easing: EASE_SHEET }));
        }
        // `key` stands for the curve's numbers: a new curve object with the same points is no change.
    }, [key, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

    const band = useAnimatedProps(() => {
        const [ax, ay, c1x, c1y, c2x, c2y, px, py] = mix(from.get(), to.get(), k.get());
        // The band stops under the swallowtail, whose points reach the tip.
        const [tx, ty] = tangent(ax, ay, c2x, c2y, px, py);
        return { d: `M ${ax} ${ay} C ${c1x} ${c1y} ${c2x} ${c2y} ${px - tx * (TIP - 2)} ${py - ty * (TIP - 2)}` };
    });
    const tip = useAnimatedProps(() => {
        const [ax, ay, , , c2x, c2y, px, py] = mix(from.get(), to.get(), k.get());
        const [tx, ty] = tangent(ax, ay, c2x, c2y, px, py);
        const nx = -ty;
        const ny = tx;
        const hw = BAND / 2 + EDGE;
        // The swallowtail runs back from the tip: its two points reach the tip, its base covers the band's end.
        const bx = px - tx * TIP;
        const by = py - ty * TIP;
        const p = (s: number, along: number) => `${bx + nx * hw * s + tx * along} ${by + ny * hw * s + ty * along}`;
        return { d: `M ${p(1, 0)} L ${p(-1, 0)} L ${p(-1, TIP)} L ${bx + tx * (TIP - NOTCH)} ${by + ty * (TIP - NOTCH)} L ${p(1, TIP)} Z` };
    });
    const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    return (
        <Animated.View style={[StyleSheet.absoluteFill, fade]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Svg style={StyleSheet.absoluteFill}>
                <AnimatedPath animatedProps={band} fill="none" stroke={tokens.ringFocus} strokeWidth={BAND + EDGE * 2} />
                <AnimatedPath animatedProps={band} fill="none" stroke={tokens.primary} strokeWidth={BAND} />
                <AnimatedPath animatedProps={tip} fill={tokens.primary} stroke={tokens.ringFocus} strokeWidth={EDGE} strokeLinejoin="round" />
            </Svg>
        </Animated.View>
    );
}
