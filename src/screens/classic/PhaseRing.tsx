import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ringDashOffset } from '../../utils/clockMath';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
    size: number;
    /** 0..1 from useSlotProgress, read on the UI thread. */
    progress: SharedValue<number>;
    isBreak: boolean;
    trackColor: string;
    focusColor: string;
    breakColor: string;
    children?: ReactNode;
};

/** One progress arc; its dash offset is an animated prop, so it moves with no React render (B4). */
function Arc({ size, stroke, progress, color }: { size: number; stroke: number; progress: SharedValue<number>; color: string }) {
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: ringDashOffset(circumference, progress.get()),
    }));
    return (
        <Svg width={size} height={size}>
            <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                animatedProps={animatedProps}
                strokeLinecap="round"
                rotation={-90}
                originX={size / 2}
                originY={size / 2}
            />
        </Svg>
    );
}

/**
 * Classic's ring (the brief's Ring layout): `ringFocus` or `ringBreak` on `ringTrack`, round caps,
 * the timer's only frame. The phase change crossfades the two colours over 250 ms (DESIGN.md:
 * "Ring colour and mascot pose crossfade over 200–300 ms") on a CSS opacity transition, so no
 * worklet runs for it and no React render either; colour and opacity stay under Reduce Motion.
 */
export function PhaseRing({ size, progress, isBreak, trackColor, focusColor, breakColor, children }: Props) {
    const stroke = Math.round(size * 0.055);
    const r = (size - stroke) / 2;
    return (
        <View style={{ width: size, height: size }} testID="phase-ring">
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
            </Svg>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fade, { opacity: isBreak ? 0 : 1 }]}>
                <Arc size={size} stroke={stroke} progress={progress} color={focusColor} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fade, { opacity: isBreak ? 1 : 0 }]}>
                <Arc size={size} stroke={stroke} progress={progress} color={breakColor} />
            </Animated.View>
            <View style={[StyleSheet.absoluteFill, styles.centre, { padding: stroke + 12 }]}>{children}</View>
        </View>
    );
}

const styles = css.create({
    fade: {
        transitionProperty: 'opacity',
        transitionDuration: 250,
        transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    },
    centre: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
