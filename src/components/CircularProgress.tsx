import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
    size: number;
    strokeWidth: number;
    progress: number; // 0..1
    trackColor: string;
    progressColor: string;
}

export function CircularProgress({
    size,
    strokeWidth,
    progress,
    trackColor,
    progressColor,
}: CircularProgressProps) {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;

    // Clamp progress to 0-1
    const clamped = Math.min(1, Math.max(0, progress));
    const dashOffset = useMemo(() => circumference * (1 - clamped), [circumference, clamped]);

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
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={progressColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={size / 2}
                    originY={size / 2}
                />
            </Svg>
        </View>
    );
}
