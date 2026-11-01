import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    interpolate,
    SharedValue,
    useAnimatedStyle,
    Extrapolation,
} from 'react-native-reanimated';
import { ValentineSpec } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import TimerText from './TimerText';
import { Icon } from './icons/Icon';
import { fly } from './icons/art/fly';

interface FlyTimerPillProps {
    sheetProgress: SharedValue<number>; // 0 = peek, 1 = full
    /** What the timer shows with no flight running or paused (ms), or null for --:--. */
    idleMs: number | null;
    onTap: () => void;
    topInset: number;
    isLandscape: boolean;
    isDark: boolean;
}

export default function FlyTimerPill({
    sheetProgress,
    idleMs,
    onTap,
    topInset,
    isLandscape,
    isDark,
}: FlyTimerPillProps) {
    const { tokens } = useTheme();

    const pillStyle = useAnimatedStyle(() => {
        // Fully visible at peek (progress=0) and through mid-drag (≤0.5).
        // Fades out as sheet approaches full (progress→1) to prevent overlap.
        const opacity = interpolate(
            sheetProgress.value,
            [0, 0.5, 1],
            [1, 1, 0],
            Extrapolation.CLAMP,
        );
        const translateY = interpolate(
            sheetProgress.value,
            [0, 1],
            [0, -6],
            Extrapolation.CLAMP,
        );
        return { opacity, transform: [{ translateY }] };
    });

    const topOffset = topInset + 8;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: topOffset,
                    ...(isLandscape ? { left: 16 } : { alignSelf: 'center' }),
                    backgroundColor: isDark
                        ? 'rgba(45,45,45,0.92)'
                        : 'rgba(247,243,240,0.92)',
                    borderColor: `${ValentineSpec.accentPrimary}50`,
                },
                pillStyle,
            ]}
            pointerEvents="box-none"
        >
            <Pressable style={styles.pressable} onPress={onTap}>
                {/* The custom fly icon, not an emoji (NFR-UX-002; D2). */}
                <Icon glyph={fly} size={16} color={tokens.primaryInk} />
                <TimerText
                    kind="fly"
                    idleMs={idleMs}
                    style={[styles.digits, { color: isDark ? tokens.ink : ValentineSpec.textPrimary }]}
                />
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        zIndex: 90, // below map controls (zIndex 100) so compass stays on top
    },
    pressable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 6,
    },
    digits: {
        fontSize: 18,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    },
});
