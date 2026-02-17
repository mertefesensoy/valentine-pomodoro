import React, { useEffect, useRef } from 'react';
import { Modal, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

type Props = {
    visible: boolean;
    newStreak: number;
    animationsEnabled: boolean;
    onClose: () => void;
    autoDismissMs?: number; // set to 0 to require tap
};

export default function GoalReachedPopup({
    visible,
    newStreak,
    animationsEnabled,
    onClose,
    autoDismissMs = 0,
}: Props) {
    const { colors } = useTheme();

    const backdrop = useRef(new Animated.Value(0)).current;
    const card = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    const closingRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const close = () => {
        if (closingRef.current) return;
        closingRef.current = true;

        if (!animationsEnabled) {
            closingRef.current = false;
            onClose();
            return;
        }

        Animated.parallel([
            Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
            Animated.timing(card, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(({ finished }) => {
            if (!finished) return;
            closingRef.current = false;
            onClose();
        });
    };

    useEffect(() => {
        if (!visible) return;

        // reset
        closingRef.current = false;
        backdrop.setValue(0);
        card.setValue(0);
        rotate.setValue(0);

        if (!animationsEnabled) {
            backdrop.setValue(1);
            card.setValue(1);
        } else {
            // Duolingo-ish: fade in backdrop + pop card + spin heart once
            Animated.parallel([
                Animated.timing(backdrop, { toValue: 1, duration: 140, useNativeDriver: true }),
                Animated.timing(card, {
                    toValue: 1,
                    duration: 520,
                    easing: Easing.out(Easing.back(1.35)),
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 1,
                    duration: 520,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        }

        if (autoDismissMs > 0) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => close(), autoDismissMs);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = null;
        };
    }, [visible, animationsEnabled, autoDismissMs, backdrop, card, rotate]);

    if (!visible) return null;

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'], // spin up then stop
    });

    const cardScale = card.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1],
    });

    const cardOpacity = card.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Modal visible transparent animationType="none" onRequestClose={close}>
            <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
                {/* Tap outside to close (optional) */}
                <Pressable style={StyleSheet.absoluteFill} onPress={close} />

                <Animated.View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            opacity: cardOpacity,
                            transform: [{ scale: cardScale }],
                        },
                    ]}
                >
                    <View style={styles.center}>
                        <Animated.Text style={[styles.heart, { transform: [{ rotate: spin }] }]}>
                            💗
                        </Animated.Text>

                        <Text style={[styles.title, { color: colors.text }]}>daily goal reached</Text>
                        <Text style={[styles.streak, { color: colors.accent }]}>streak +1</Text>

                        <View style={[styles.streakPill, { backgroundColor: colors.surfaceTint }]}>
                            <Text style={[styles.streakPillText, { color: colors.text }]}>
                                current love streak: <Text style={{ color: colors.accent, fontWeight: '900' }}>{newStreak}</Text>
                            </Text>
                        </View>

                        <Pressable
                            onPress={close}
                            style={[styles.cta, { backgroundColor: colors.accent }]}
                        >
                            <Text style={styles.ctaText}>continue</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 20,
        borderWidth: 1,
        paddingVertical: 22,
        paddingHorizontal: 18,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    heart: {
        fontSize: 64,
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.3,
        marginTop: 4,
        textTransform: 'lowercase',
    },
    streak: {
        fontSize: 22,
        fontWeight: '900',
        marginTop: 8,
        textTransform: 'lowercase',
    },
    streakPill: {
        marginTop: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
    },
    streakPillText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'lowercase',
    },
    cta: {
        marginTop: 18,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 999,
        minWidth: 180,
        alignItems: 'center',
    },
    ctaText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'lowercase',
    },
});
