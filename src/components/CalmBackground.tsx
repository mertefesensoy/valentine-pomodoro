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
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export default function CalmBackground({ enabled }: { enabled: boolean }) {
    const { colors, isDark } = useTheme();
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled().then((v) => {
            if (mounted) setReduceMotion(Boolean(v));
        });
        return () => {
            mounted = false;
        };
    }, []);

    // Gradient pulse (opacity only)
    const pulse = useRef(new Animated.Value(0)).current;

    // Create a small set of hearts once (stable layout)
    const hearts: HeartSpec[] = useMemo(() => {
        // Keep it subtle: 3 hearts usually feels right
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
                baseOpacity: isDark ? 0.10 : 0.12,
                emoji: '❤',
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
                baseOpacity: isDark ? 0.08 : 0.10,
                emoji: '❤',
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
                baseOpacity: isDark ? 0.06 : 0.08,
                emoji: '❤',
            },
        ];
    }, [isDark]);

    // One progress value per heart (0..1) – transforms derive from this
    const heartProgress = useRef(hearts.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (!enabled || reduceMotion) {
            // Reset values so re-enable starts cleanly
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
            {/* Layer 1: Gradient pulse (opacity only = GPU-safe) */}
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

                // Tiny rotation for organic drift (degrees)
                const rotate = p.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

                // Slight opacity variation (still very subtle)
                const opacity = p.interpolate({
                    inputRange: [0, 1],
                    outputRange: [clamp(h.baseOpacity - 0.02, 0, 0.2), clamp(h.baseOpacity + 0.02, 0, 0.2)],
                });

                return (
                    <Animated.View
                        key={h.id}
                        style={[
                            styles.heartWrap,
                            {
                                top: `${h.topPct}%`,
                                left: `${h.leftPct}%`,
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
                                    color: colors.accent, // static color, not animated
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
        // Softening (static). Keep conservative; too much can look fuzzy.
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
        textShadowColor: 'rgba(0,0,0,0.15)',
    },
});
