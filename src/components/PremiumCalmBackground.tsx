import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, AccessibilityInfo, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';

// --- Strict "Premium Calm" Specs ---

// 1. Sparkles: Premium (no glitter)
// Count: 16 (max 18)
// Opacity range: 0 -> 0.28 max
// Duration: 6000–12000ms
// Color: White-ish
const SPARKLE_COUNT = 16;

// 2. Hearts: Bokeh
// Count: 5-7 (Use 6)
// Scale: 1.00 -> 1.04 max
// Drift: Y max 14-18px, X max 6-10px
// Opacity: 0.02-0.08 max
const HEART_COUNT = 6;

// 3. Aurora
// Sheet Opacity: Dark 0.18-0.26, Light 0.12-0.18
// Scale: 1.05-1.18
// Rotation: +/- 8deg max
// Translation: 40-60px max

type HeartSpec = {
    id: string;
    x: number; // 0-1
    y: number; // 0-1
    size: number;
    rotation: number;
    delay: number;
    duration: number; // 25s-50s
};

type SparkleSpec = {
    id: string;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number; // 6000-12000ms
};

// Deterministic generation
const HEARTS: HeartSpec[] = [
    { id: 'h1', x: 0.15, y: 0.2, size: 140, rotation: -12, delay: 0, duration: 35000 },
    { id: 'h2', x: 0.75, y: 0.15, size: 110, rotation: 8, delay: 5000, duration: 42000 },
    { id: 'h3', x: 0.4, y: 0.45, size: 160, rotation: -4, delay: 2000, duration: 48000 },
    { id: 'h4', x: 0.8, y: 0.6, size: 130, rotation: 15, delay: 8000, duration: 38000 },
    { id: 'h5', x: 0.1, y: 0.8, size: 100, rotation: -8, delay: 12000, duration: 45000 },
    { id: 'h6', x: 0.65, y: 0.85, size: 125, rotation: 6, delay: 15000, duration: 40000 },
];

const SPARKLES: SparkleSpec[] = Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
    id: `s${i}`,
    x: (Math.sin(i * 132.1) + 1) / 2, // Deterministic pseudo-random
    y: (Math.cos(i * 93.7) + 1) / 2,
    size: (i % 3) + 2, // 2-4px
    delay: (i * 900) % 5000,
    duration: 6000 + ((i * 1000) % 6000), // 6000-12000ms
}));

// --- SVG Components ---
const HeartPath = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const HeartIcon = React.memo(({ color, size }: { color: string, size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={HeartPath} fill={color} />
    </Svg>
));

export default function PremiumCalmBackground({ enabled }: { enabled: boolean }) {
    const { colors, isDark } = useTheme();
    const [reduceMotion, setReduceMotion] = useState(false);
    const { width, height } = useWindowDimensions(); // 5. Responsive sizing

    // --- Animation Values (Stable Refs) ---
    const aurora1Anim = useRef(new Animated.Value(0)).current;
    const aurora2Anim = useRef(new Animated.Value(0)).current;
    const crossfadeAnim = useRef(new Animated.Value(0)).current;

    // Hearts
    const heartsAnim = useRef(HEARTS.map(() => new Animated.Value(0))).current;

    // Sparkles
    const sparklesAnim = useRef(SPARKLES.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        let mounted = true;
        const sync = (v: boolean) => mounted && setReduceMotion(v);
        AccessibilityInfo.isReduceMotionEnabled().then(sync);
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', sync);
        return () => {
            mounted = false;
            sub?.remove();
        };
    }, []);

    useEffect(() => {
        // 6. Reduce Motion / Disabled Handling - Return early logic handled in render, 
        // but checking here prevents loops from starting/running
        if (!enabled || reduceMotion) {
            aurora1Anim.setValue(0);
            aurora2Anim.setValue(0);
            crossfadeAnim.setValue(0);
            heartsAnim.forEach(a => a.setValue(0));
            sparklesAnim.forEach(a => a.setValue(0));
            return;
        }

        // 1. Aurora Loop (Drift: 30-70s)
        const loop1 = Animated.loop(
            Animated.sequence([
                Animated.timing(aurora1Anim, { toValue: 1, duration: 60000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(aurora1Anim, { toValue: 0, duration: 60000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );

        const loop2 = Animated.loop(
            Animated.sequence([
                Animated.timing(aurora2Anim, { toValue: 1, duration: 80000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(aurora2Anim, { toValue: 0, duration: 80000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );

        // Crossfade Loop (40-90s)
        const crossfadeLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(crossfadeAnim, { toValue: 1, duration: 45000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(crossfadeAnim, { toValue: 0, duration: 45000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );

        // 2. Hearts Loop (Drift 25-50s)
        const heartLoops = heartsAnim.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: HEARTS[i].duration / 2,
                        delay: HEARTS[i].delay, // Initial delay
                        easing: Easing.inOut(Easing.quad), // Quad is softer than ease
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: HEARTS[i].duration / 2,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ])
            )
        );

        // 3. Sparkles Loop (Twinkle 6-12s)
        const sparkleLoops = sparklesAnim.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: SPARKLES[i].duration / 2,
                        delay: SPARKLES[i].delay,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: SPARKLES[i].duration / 2,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ])
            )
        );

        loop1.start();
        loop2.start();
        crossfadeLoop.start();
        heartLoops.forEach(l => l.start());
        sparkleLoops.forEach(l => l.start());

        return () => {
            loop1.stop();
            loop2.stop();
            crossfadeLoop.stop();
            heartLoops.forEach(l => l.stop());
            sparkleLoops.forEach(l => l.stop());
        };
    }, [enabled, reduceMotion]);

    // --- Interpolations ---

    // 1. Aurora Intensity (Reduced)
    // Opacity: dark 0.18–0.26, light 0.12–0.18
    const auroraOpacity = isDark ? 0.22 : 0.15;

    // Scale 1.05-1.18, Rot +/- 8deg, Tx 40-60px
    const aurora1Transform = {
        transform: [
            { rotate: aurora1Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] }) },
            { scale: aurora1Anim.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.15] }) },
            { translateX: aurora1Anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] }) },
        ],
        opacity: auroraOpacity,
    };

    const aurora2Transform = {
        transform: [
            { rotate: aurora2Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) },
            { scale: aurora2Anim.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1.18] }) },
            { translateY: aurora2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
        ],
        opacity: auroraOpacity * 0.9, // Slightly less op for back layer
    };

    // 2. Crossfade Conservation
    const opacityBase = Animated.subtract(1, crossfadeAnim); // (1 - crossfade)
    const opacityOverlay = crossfadeAnim;

    // --- Render ---

    // 6. Reduce Motion / Disabled
    if (enabled && reduceMotion) {
        return (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
                <LinearGradient
                    // @ts-ignore
                    colors={[...colors.gradientA]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </View>
        );
    }

    if (!enabled) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Base Background Color */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />

            {/* Aurora Sheet 1 */}
            <Animated.View style={[styles.auroraSheet, aurora1Transform]}>
                {/* Base Gradient A */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityBase }]}>
                    <LinearGradient
                        // @ts-ignore
                        colors={[...colors.gradientA]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
                {/* Overlay Gradient A2 */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityOverlay }]}>
                    <LinearGradient
                        // @ts-ignore
                        colors={[...(colors.gradientA2 || colors.gradientA)]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </Animated.View>

            {/* Aurora Sheet 2 */}
            <Animated.View style={[styles.auroraSheet, aurora2Transform]}>
                {/* Base Gradient B */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityBase }]}>
                    <LinearGradient
                        // @ts-ignore
                        colors={[...colors.gradientB]}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
                {/* Overlay Gradient B2 */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityOverlay }]}>
                    <LinearGradient
                        // @ts-ignore
                        colors={[...(colors.gradientB2 || colors.gradientB)]}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </Animated.View>

            {/* 3. Sparkles Layer (Premium White-ish, Max opacity 0.28) */}
            {SPARKLES.map((spec, i) => (
                <Animated.View
                    key={spec.id}
                    style={{
                        position: 'absolute',
                        left: spec.x * width,
                        top: spec.y * height,
                        width: spec.size,
                        height: spec.size,
                        backgroundColor: 'rgba(255,255,255,0.9)', // Premium white-ish
                        borderRadius: spec.size / 2,
                        opacity: sparklesAnim[i].interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }), // Max 0.28
                        transform: [
                            { scale: sparklesAnim[i].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }
                        ]
                    }}
                />
            ))}

            {/* 4. Heart Bokeh Layer (Subtle, Breathing 1.04 max, Opacity 0.08 max) */}
            {HEARTS.map((spec, i) => (
                <Animated.View
                    key={spec.id}
                    style={{
                        position: 'absolute',
                        left: spec.x * width,
                        top: spec.y * height,
                        width: spec.size,
                        height: spec.size,
                        opacity: heartsAnim[i].interpolate({ inputRange: [0, 1], outputRange: [0.02, 0.08] }),
                        transform: [
                            { rotate: `${spec.rotation}deg` },
                            { scale: heartsAnim[i].interpolate({ inputRange: [0, 1], outputRange: [1.00, 1.04] }) },
                            // Reduced Drift: Y max 18px, X max 10px
                            { translateY: heartsAnim[i].interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
                            { translateX: heartsAnim[i].interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }
                        ]
                    }}
                >
                    <HeartIcon color={colors.accent} size={spec.size} />
                </Animated.View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    auroraSheet: {
        position: 'absolute',
        width: '200%',
        height: '200%',
        left: '-50%',
        top: '-50%',
    }
});
