import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, AccessibilityInfo, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';

type Props = { enabled: boolean };

export default function CalmBackground({ enabled }: Props) {
    const { colors } = useTheme();
    const [reduceMotion, setReduceMotion] = useState(false);

    // Animation values
    const pulse = useRef(new Animated.Value(0)).current;

    const blob1X = useRef(new Animated.Value(0)).current;
    const blob1Y = useRef(new Animated.Value(0)).current;

    const blob2X = useRef(new Animated.Value(0)).current;
    const blob2Y = useRef(new Animated.Value(0)).current;

    const loopsRef = useRef<Animated.CompositeAnimation[]>([]);
    const appStateRef = useRef(AppState.currentState);

    // Read + subscribe reduce motion
    useEffect(() => {
        let mounted = true;

        AccessibilityInfo.isReduceMotionEnabled()
            .then((v) => mounted && setReduceMotion(v))
            .catch(() => { });

        // RN versions differ; keep it defensive
        const sub: any =
            (AccessibilityInfo as any).addEventListener?.('reduceMotionChanged', (v: boolean) => {
                setReduceMotion(v);
            });

        return () => {
            mounted = false;
            sub?.remove?.();
        };
    }, []);

    const isActive = enabled && !reduceMotion;

    const stopAll = () => {
        loopsRef.current.forEach((a) => a.stop());
        loopsRef.current = [];
    };

    const resetValues = () => {
        pulse.setValue(0);
        blob1X.setValue(0);
        blob1Y.setValue(0);
        blob2X.setValue(0);
        blob2Y.setValue(0);
    };

    const startAll = () => {
        stopAll();
        resetValues();

        // Pulse: 18s breath (opacity via interpolation)
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

        // Blob 1: 25s diagonal drift
        const b1 = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(blob1X, {
                        toValue: 50,
                        duration: 12500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(blob1X, {
                        toValue: -50,
                        duration: 12500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(blob1Y, {
                        toValue: 30,
                        duration: 12500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(blob1Y, {
                        toValue: -30,
                        duration: 12500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        // Blob 2: 30s opposite drift (slightly different amplitudes)
        const b2 = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(blob2X, {
                        toValue: -45,
                        duration: 15000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(blob2X, {
                        toValue: 45,
                        duration: 15000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(blob2Y, {
                        toValue: -28,
                        duration: 15000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(blob2Y, {
                        toValue: 28,
                        duration: 15000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        loopsRef.current = [pulseLoop, b1, b2];
        loopsRef.current.forEach((a) => a.start());
    };

    // Start/stop based on enabled + reduce motion
    useEffect(() => {
        if (!isActive) {
            stopAll();
            resetValues();
            return;
        }
        startAll();
        return () => stopAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    // Optional: pause animations when app backgrounded (battery)
    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            const prev = appStateRef.current;
            appStateRef.current = next;

            if (!isActive) return;

            if (prev === 'active' && next !== 'active') {
                stopAll();
            } else if (prev !== 'active' && next === 'active') {
                startAll();
            }
        });

        return () => sub.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    const pulseOpacity = useMemo(
        () =>
            pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.08, 0.15],
            }),
        [pulse]
    );

    if (!isActive) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Gradient pulse */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
                <LinearGradient
                    colors={[colors.accentLight, colors.accentPurple]}
                    start={{ x: 0.2, y: 0.2 }}
                    end={{ x: 0.8, y: 0.8 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* Blob 1 */}
            <Animated.View
                style={[
                    styles.blob,
                    {
                        top: '28%',
                        left: '15%',
                        backgroundColor: colors.accentLight,
                        opacity: 0.12,
                        transform: [{ translateX: blob1X }, { translateY: blob1Y }],
                    },
                ]}
            />

            {/* Blob 2 */}
            <Animated.View
                style={[
                    styles.blob,
                    {
                        top: '62%',
                        right: '18%',
                        backgroundColor: colors.accentPurple,
                        opacity: 0.10,
                        transform: [{ translateX: blob2X }, { translateY: blob2Y }],
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    blob: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 999,
    },
});
