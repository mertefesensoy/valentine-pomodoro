import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ringDashOffset } from '../utils/clockMath';

// The progress arc's dash offset is an animated prop, set on the UI thread
// from the progress SharedValue: the ring moves with no React render (Phase 1
// B4; before, it moved only when TimerScreen re-rendered each second).
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
    size: number;
    strokeWidth?: number;
    /** 0..1, clamped. Read on the UI thread (useSlotProgress). */
    progress: SharedValue<number>;
    trackColor: string;
    progressColor: string;
}

export function CircularProgress({
    size,
    strokeWidth = Math.round(size * 0.055),
    progress,
    trackColor,
    progressColor,
}: CircularProgressProps) {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: ringDashOffset(circumference, progress.value),
    }));

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* Background track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress ring */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={progressColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={size / 2}
                    originY={size / 2}
                />
            </Svg>
        </View>
    );
}
