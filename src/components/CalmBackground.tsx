import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';

type HeartSpec = {
    id: string;
    topPct: number;   // 0..100
    leftPct: number;  // 0..100
    size: number;     // fontSize
    driftX: number;   // px
    driftY: number;   // px
    durationMs: number;
    delayMs: number;
    baseOpacity: number; // 0..1
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

    // 1) Reactive Reduce Motion
    useEffect(() => {
        let mounted = true;
        const sync = (v: boolean) => mounted && setReduceMotion(Boolean(v));

        AccessibilityInfo.isReduceMotionEnabled().then(sync);

        // Modern RN support for listener
        const sub = (AccessibilityInfo as any).addEventListener?.('reduceMotionChanged', sync);

        return () => {
            mounted = false;
            sub?.remove?.();
        };
    }, []);

    // Gradient pulse (opacity only)
    const pulse = useRef(new Animated.Value(0)).current;

    // 2) Heart specs with Colors & Glow
    const hearts: HeartSpec[] = useMemo(() => {
        const o1 = isDark ? 0.10 : 0.12;
        const o2 = isDark ? 0.08 : 0.10;
        const o3 = isDark ? 0.06 : 0.08;

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
                emoji: '❤️',
                color: colors.accentLight,
                glowColor: isDark ? 'rgba(255,154,162,0.22)' : 'rgba(255,179,186,0.22)',
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
                emoji: '❤️',
                color: colors.accentPurple,
                glowColor: isDark ? 'rgba(193,151,210,0.20)' : 'rgba(212,165,217,0.20)',
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
                emoji: '❤️',
                color: colors.accent,
                glowColor: isDark ? 'rgba(255,107,122,0.18)' : 'rgba(230,57,70,0.16)',
            },
        ];
    }, [isDark, colors.accent, colors.accentLight, colors.accentPurple]);

    // One progress value per heart (0..1)
    const heartProgress = useRef(hearts.map(() => new Animated.Value(0))).current;

    // 3) Theme switch smooth reset handled in existing effect dependencies
    // But explicit reset helps avoid jumps
    useEffect(() => {
        if (!enabled || reduceMotion) return;
        // Resetting on theme change (implied by hearts usage in dependency) or just letting it flow?
        // User suggestion: reset values if isDark changes.
        // However, hearts array changes when isDark changes, so this component re-renders. UseRef values persist.
        // If we want to reset:
        heartProgress.forEach(v => v.setValue(0));
        pulse.setValue(0);
    }, [isDark]);

    // Main Loop Effect
    useEffect(() => {
        if (!enabled || reduceMotion) {
            pulse.setValue(0);
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

        const heartLoops = hearts.map((h, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(heartProgress[i], {
                        toValue: 1,
                        duration: h.durationMs,
                        delay: h.delayMs,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(heartProgress[i], {
                        toValue: 0,
                        duration: h.durationMs,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            )
        );

        pulseLoop.start();
        heartLoops.forEach((l) => l.start());

        return () => {
            pulseLoop.stop();
            heartLoops.forEach((l) => l.stop());
        };
    }, [enabled, reduceMotion, hearts, pulse, heartProgress]);

    if (!enabled || reduceMotion) return null;

    const pulseOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? 0.06 : 0.08, isDark ? 0.11 : 0.14],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Layer 1: Gradient pulse */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
                <LinearGradient
                    colors={[colors.accentLight, colors.accentPurple]}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Layer 2: Heart bokeh */}
            {hearts.map((h, i) => {
                const p = heartProgress[i];

                const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [0, h.driftX] });
                const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [0, h.driftY] });

                // Tiny breathing scale
                const scale = p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

                // Tiny rotation for organic drift
                const rotate = p.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

                // Fade in/out loop
                const opacity = p.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [
                        clamp(h.baseOpacity - 0.02, 0, 0.2),
                        clamp(h.baseOpacity + 0.02, 0, 0.2),
                        clamp(h.baseOpacity - 0.02, 0, 0.2),
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
                                // Center on anchor
                                marginLeft: -h.size * 0.35,
                                marginTop: -h.size * 0.55,
                                opacity,
                                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.heartText,
                                {
                                    fontSize: h.size,
                                    color: h.color,
                                    textShadowColor: h.glowColor,
                                },
                            ]}
                        >
                            {h.emoji}
                        </Text>
                    </Animated.View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    heartWrap: {
        position: 'absolute',
    },
    heartText: {
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
        // textShadowColor overridden inline
    },
});
