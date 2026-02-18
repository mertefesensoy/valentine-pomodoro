/**
 * WaveLines — subtle animated sine-wave lines for CalmBackground.
 *
 * SAFE IMPLEMENTATION: uses only react-native Animated (native driver) +
 * react-native-svg. Zero Reanimated worklets → no WorkletRuntime crash.
 *
 * Animation strategy:
 *   - SVG is 2× screen width; a looping translateX slides it left by 1× width
 *     for a seamless horizontal scroll effect.
 *   - A slow vertical drift adds organic movement.
 *   - All paths are computed once on the JS thread (useMemo) — no per-frame JS.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
    color?: string;
    lineCount?: number;
    amplitude?: number;
    speedMs?: number;
    opacity?: number;
};

/** Build one SVG path string for a sine wave across `width` pixels. */
function makeWavePath(
    width: number,
    y: number,
    amp: number,
    phasePx: number,
    step = 18,
): string {
    const w = Math.max(width, 1);
    let d = 'M 0 ' + y.toFixed(2);
    for (let x = 0; x <= w; x += step) {
        const t = ((x + phasePx) / w) * Math.PI * 2;
        const yy = y + Math.sin(t) * amp;
        d += ' L ' + x.toFixed(2) + ' ' + yy.toFixed(2);
    }
    return d;
}

export default function WaveLines({
    color = 'rgba(255,255,255,0.14)',
    lineCount = 10,
    amplitude = 10,
    speedMs = 14000,
    opacity = 1,
}: Props) {
    const { width, height } = useWindowDimensions();

    const svgW = Math.max(1, width * 2);
    const svgH = Math.max(1, height);

    const tx = useRef(new Animated.Value(0)).current;
    const drift = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (width <= 0) return;

        tx.setValue(0);
        drift.setValue(0);

        const moveLoop = Animated.loop(
            Animated.timing(tx, {
                toValue: -width,
                duration: speedMs,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            { resetBeforeIteration: true },
        );

        const driftLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(drift, {
                    toValue: 1,
                    duration: 9000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(drift, {
                    toValue: 0,
                    duration: 9000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );

        moveLoop.start();
        driftLoop.start();

        return () => {
            moveLoop.stop();
            driftLoop.stop();
        };
    }, [tx, drift, width, speedMs]);

    const driftY = drift.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });

    // Compute all path strings once — no per-frame JS work
    const paths = useMemo(() => {
        const result: Array<{ d: string; strokeWidth: number; alphaMul: number }> = [];
        const paddingTop = 30;
        const paddingBottom = 40;
        const usableH = Math.max(1, svgH - paddingTop - paddingBottom);

        for (let i = 0; i < lineCount; i++) {
            const frac = (i + 1) / (lineCount + 1);
            const y = paddingTop + usableH * frac;
            const amp = amplitude * (0.65 + 0.35 * Math.sin(i * 1.7));
            const phasePx = (i * width) / (lineCount + 1);
            const strokeWidth = 1 + (i % 3) * 0.25;
            const alphaMul = 0.75 + 0.25 * Math.cos(i * 1.3);

            // First copy: phase starts at phasePx
            result.push({ d: makeWavePath(width, y, amp, phasePx), strokeWidth, alphaMul });
            // Second copy: phase shifted by width → seamless tile when SVG scrolls
            result.push({ d: makeWavePath(width, y, amp, phasePx + width), strokeWidth, alphaMul });
        }
        return result;
    }, [svgH, width, lineCount, amplitude]);

    if (width === 0 || height === 0) return null;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                StyleSheet.absoluteFill,
                {
                    opacity,
                    transform: [{ translateX: tx }, { translateY: driftY }],
                },
            ]}
        >
            <Svg width={svgW} height={svgH}>
                {paths.map((p, idx) => (
                    <Path
                        key={idx}
                        d={p.d}
                        stroke={color}
                        strokeWidth={p.strokeWidth}
                        fill="none"
                        opacity={p.alphaMul}
                    />
                ))}
            </Svg>
        </Animated.View>
    );
}
