import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';

type HeartSpec = {
    id: string;
    topPct: number;
    leftPct: number;
    size: number;
    driftX: number;
    driftY: number;
    durationMs: number;
    delayMs: number;
    baseOpacity: number;
    emoji: string;
    color: string;
    glowColor: string;
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export default function CalmBackground({ enabled }: { enabled: boolean }) {
    const { colors, isDark } = useTheme();
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        let mounted = true;
        const sync = (v: boolean) => mounted && setReduceMotion(Boolean(v));
        AccessibilityInfo.isReduceMotionEnabled().then(sync);
        const sub = (AccessibilityInfo as any).addEventListener?.('reduceMotionChanged', sync);
        return () => {
            mounted = false;
            sub?.remove?.();
        };
    }, []);

    // --- NEW: Aurora layers (2 sheets) + pulse + Crossfade Shifts ---
    const pulse = useRef(new Animated.Value(0)).current;
    const g1 = useRef(new Animated.Value(0)).current;
    const g2 = useRef(new Animated.Value(0)).current;
    const shift1 = useRef(new Animated.Value(0)).current;
    const shift2 = useRef(new Animated.Value(0)).current;

    // Hearts
    const hearts: HeartSpec[] = useMemo(() => {
        const o1 = isDark ? 0.11 : 0.13;
        const o2 = isDark ? 0.09 : 0.11;
        const o3 = isDark ? 0.07 : 0.09;

        return [
            {
                id: 'h1',
                topPct: 22,
                leftPct: 14,
                size: 84,
                driftX: 18,
                driftY: -22,
                durationMs: 28000,
                delayMs: 0,
                baseOpacity: o1,
                emoji: '❤',
                color: colors.accentLight,
                glowColor: isDark ? 'rgba(233,213,255,0.22)' : 'rgba(216,180,254,0.22)',
            },
            {
                id: 'h2',
                topPct: 58,
                leftPct: 70,
                size: 72,
                driftX: -16,
                driftY: -18,
                durationMs: 32000,
                delayMs: 600,
                baseOpacity: o2,
                emoji: '❤',
                color: colors.accentPurple,
                glowColor: isDark ? 'rgba(196,181,253,0.20)' : 'rgba(199,210,254,0.20)',
            },
            {
                id: 'h3',
                topPct: 40,
                leftPct: 40,
                size: 110,
                driftX: 10,
                driftY: -14,
                durationMs: 36000,
                delayMs: 1200,
                baseOpacity: o3,
                emoji: '❤',
                color: colors.accent,
                glowColor: isDark ? 'rgba(124,58,237,0.18)' : 'rgba(167,139,250,0.16)',
            },
        ];
    }, [isDark, colors.accent, colors.accentLight, colors.accentPurple]);

    const heartProgress = useRef(hearts.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (!enabled || reduceMotion) {
            pulse.setValue(0);
            g1.setValue(0);
            g2.setValue(0);
            shift1.setValue(0);
            shift2.setValue(0);
            heartProgress.forEach((v) => v.setValue(0));
            return;
        }

        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 9000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 9000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const g1Loop = Animated.loop(
            Animated.sequence([
                Animated.timing(g1, {
                    toValue: 1,
                    duration: 26000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(g1, {
                    toValue: 0,
                    duration: 26000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const g2Loop = Animated.loop(
            Animated.sequence([
                Animated.timing(g2, {
                    toValue: 1,
                    duration: 34000,
                    delay: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(g2, {
                    toValue: 0,
                    duration: 34000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const shift1Loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shift1, { toValue: 1, duration: 42000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(shift1, { toValue: 0, duration: 42000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );

        const shift2Loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shift2, { toValue: 1, duration: 56000, delay: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(shift2, { toValue: 0, duration: 56000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );

        const heartLoops = hearts.map((h, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(heartProgress[i], {
                        toValue: 1,
                        duration: h.durationMs,
                        delay: h.delayMs,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(heartProgress[i], {
                        toValue: 0,
                        duration: h.durationMs,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            )
        );

        pulseLoop.start();
        g1Loop.start();
        g2Loop.start();
        shift1Loop.start();
        shift2Loop.start();
        heartLoops.forEach((l) => l.start());

        return () => {
            pulseLoop.stop();
            g1Loop.stop();
            g2Loop.stop();
            shift1Loop.stop();
            shift2Loop.stop();
            heartLoops.forEach((l) => l.stop());
        };
    }, [enabled, reduceMotion, hearts, pulse, g1, g2, shift1, shift2, heartProgress]);

    if (!enabled || reduceMotion) return null;

    // Reduce intensity slightly as requested to avoid wash
    const pulseOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? 0.06 : 0.04, isDark ? 0.18 : 0.14],
    });

    const g1Opacity = g1.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? 0.19 : 0.13, isDark ? 0.31 : 0.23],
    });

    const g2Opacity = g2.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? 0.16 : 0.12, isDark ? 0.28 : 0.20],
    });

    const g1Tx = g1.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
    const g1Ty = g1.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });
    const g1Rot = g1.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
    const g1Scale = g1.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1.16] });

    const g2Tx = g2.interpolate({ inputRange: [0, 1], outputRange: [45, -45] });
    const g2Ty = g2.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
    const g2Rot = g2.interpolate({ inputRange: [0, 1], outputRange: ['10deg', '-10deg'] });
    const g2Scale = g2.interpolate({ inputRange: [0, 1], outputRange: [1.10, 1.18] });

    const g1FadeOut = shift1.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const g2FadeOut = shift2.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Pulse veil */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
                <LinearGradient
                    colors={colors.gradientA} // Simple pulse uses stable gradient
                    start={{ x: 0.1, y: 0.0 }}
                    end={{ x: 0.9, y: 1.0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Aurora sheet 1 (Crossfading A <-> A2) */}
            <Animated.View
                style={[
                    styles.auroraSheet,
                    {
                        opacity: g1Opacity,
                        transform: [{ translateX: g1Tx }, { translateY: g1Ty }, { rotate: g1Rot }, { scale: g1Scale }],
                    },
                ]}
            >
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: g1FadeOut }]}>
                    <LinearGradient
                        colors={colors.gradientA}
                        start={{ x: 0.0, y: 0.2 }}
                        end={{ x: 1.0, y: 0.8 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <Animated.View style={[StyleSheet.absoluteFill, { opacity: shift1 }]}>
                    <LinearGradient
                        colors={colors.gradientA2 || colors.gradientA}
                        start={{ x: 0.2, y: 0.0 }}
                        end={{ x: 0.8, y: 1.0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </Animated.View>

            {/* Aurora sheet 2 (Crossfading B <-> B2) */}
            <Animated.View
                style={[
                    styles.auroraSheet,
                    {
                        opacity: g2Opacity,
                        transform: [{ translateX: g2Tx }, { translateY: g2Ty }, { rotate: g2Rot }, { scale: g2Scale }],
                    },
                ]}
            >
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: g2FadeOut }]}>
                    <LinearGradient
                        colors={colors.gradientB}
                        start={{ x: 1.0, y: 0.0 }}
                        end={{ x: 0.0, y: 1.0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <Animated.View style={[StyleSheet.absoluteFill, { opacity: shift2 }]}>
                    <LinearGradient
                        colors={colors.gradientB2 || colors.gradientB}
                        start={{ x: 0.9, y: 0.1 }}
                        end={{ x: 0.1, y: 0.9 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </Animated.View>

            {/* Hearts on top (Unchanged) */}
            {hearts.map((h, i) => {
                const p = heartProgress[i];
                const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [0, h.driftX] });
                const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [0, h.driftY] });
                const scale = p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
                const rotate = p.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

                const opacity = p.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [
                        clamp(h.baseOpacity - 0.02, 0, 0.25),
                        clamp(h.baseOpacity + 0.02, 0, 0.25),
                        clamp(h.baseOpacity - 0.02, 0, 0.25),
                    ],
                });

                return (
                    <Animated.View
                        key={h.id}
                        style={[
                            styles.heartWrap,
                            {
                                top: `${h.topPct}%`,
                                left: `${h.leftPct}%`,
                                marginLeft: -h.size * 0.35,
                                marginTop: -h.size * 0.55,
                                opacity,
                                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
                            },
                        ]}
                    >
                        <Text style={[styles.heartText, { fontSize: h.size, color: h.color, textShadowColor: h.glowColor }]}>
                            {h.emoji}
                        </Text>
                    </Animated.View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    auroraSheet: {
        position: 'absolute',
        // Reduced to 180% as requested for efficiency
        width: '180%',
        height: '180%',
        left: '-40%',
        top: '-40%',
    },
    heartWrap: {
        position: 'absolute',
    },
    heartText: {
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
    },
});
