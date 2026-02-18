/**
 * WaveLines — subtle animated sine-wave lines for CalmBackground.
 *
 * Uses react-native-svg + react-native-reanimated (both already installed).
 * Each line is a sine wave with unique phase, speed, amplitude, and opacity.
 * Animation runs on the JS thread via requestAnimationFrame; SVG path strings
 * are updated via useAnimatedProps for smooth 60fps rendering.
 *
 * Design knobs (all tunable):
 *   LINE_COUNT   8–12 lines
 *   OPACITY      0.08–0.18 per line
 *   AMPLITUDE    6–16px
 *   SPEED        0.2–0.6 (relative)
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- Per-line config ---
type WaveConfig = {
    yPct: number;       // vertical position as fraction of height (0–1)
    amplitude: number;  // px
    frequency: number;  // cycles across screen width
    speed: number;      // phase shift per second (radians)
    opacity: number;
    strokeWidth: number;
};

const WAVE_CONFIGS: WaveConfig[] = [
    { yPct: 0.12, amplitude: 8, frequency: 1.4, speed: 0.28, opacity: 0.10, strokeWidth: 1.0 },
    { yPct: 0.24, amplitude: 12, frequency: 1.1, speed: 0.20, opacity: 0.13, strokeWidth: 0.8 },
    { yPct: 0.35, amplitude: 7, frequency: 1.7, speed: 0.35, opacity: 0.09, strokeWidth: 1.2 },
    { yPct: 0.46, amplitude: 14, frequency: 0.9, speed: 0.22, opacity: 0.15, strokeWidth: 0.7 },
    { yPct: 0.55, amplitude: 9, frequency: 1.5, speed: 0.30, opacity: 0.11, strokeWidth: 1.0 },
    { yPct: 0.64, amplitude: 11, frequency: 1.2, speed: 0.18, opacity: 0.12, strokeWidth: 0.9 },
    { yPct: 0.73, amplitude: 6, frequency: 1.8, speed: 0.40, opacity: 0.08, strokeWidth: 1.1 },
    { yPct: 0.82, amplitude: 13, frequency: 1.0, speed: 0.25, opacity: 0.14, strokeWidth: 0.8 },
    { yPct: 0.90, amplitude: 8, frequency: 1.3, speed: 0.32, opacity: 0.10, strokeWidth: 1.0 },
];

// Phase offsets so lines don't all start in sync
const PHASE_OFFSETS = [0, 0.8, 1.6, 2.4, 0.4, 1.2, 2.0, 0.6, 1.8];

/** Build an SVG path string for one sine wave at a given phase */
function buildWavePath(
    width: number,
    centerY: number,
    amplitude: number,
    frequency: number,
    phase: number,
): string {
    const steps = Math.ceil(width / 4); // one point every 4px
    let d = '';
    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const y = centerY + amplitude * Math.sin(frequency * 2 * Math.PI * (i / steps) + phase);
        d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
}

// --- Single animated wave line ---
function WaveLine({
    config,
    phaseOffset,
    width,
    height,
    color,
}: {
    config: WaveConfig;
    phaseOffset: number;
    width: number;
    height: number;
    color: string;
}) {
    // Animate phase from 0 → 2π (one full cycle) then repeat
    const phase = useSharedValue(phaseOffset);

    useEffect(() => {
        // Duration for one full cycle: 2π / speed seconds
        const durationMs = (2 * Math.PI / config.speed) * 1000;
        phase.value = phaseOffset;
        phase.value = withRepeat(
            withTiming(phaseOffset + 2 * Math.PI, {
                duration: durationMs,
                easing: Easing.linear,
            }),
            -1, // infinite
            false,
        );
        return () => {
            cancelAnimation(phase);
        };
    }, [config.speed, phaseOffset, phase]);

    const centerY = config.yPct * height;

    const animatedProps = useAnimatedProps(() => {
        'worklet';
        const d = buildWavePath(width, centerY, config.amplitude, config.frequency, phase.value);
        return { d };
    });

    return (
        <AnimatedPath
            animatedProps={animatedProps}
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeOpacity={config.opacity}
            fill="none"
        />
    );
}

// --- Main export ---
export default function WaveLines({ color }: { color: string }) {
    const { width, height } = useWindowDimensions();

    if (width === 0 || height === 0) return null;

    return (
        <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
            {WAVE_CONFIGS.map((cfg, i) => (
                <WaveLine
                    key={i}
                    config={cfg}
                    phaseOffset={PHASE_OFFSETS[i] ?? 0}
                    width={width}
                    height={height}
                    color={color}
                />
            ))}
        </Svg>
    );
}
