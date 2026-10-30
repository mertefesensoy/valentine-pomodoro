import { useState, type ReactNode } from 'react';
import { Pressable, type AccessibilityState, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '../../stores/settingsStore';

type Props = {
    onPress: () => void;
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    /** The selection tick on press-in; off where a press only navigates. */
    haptic?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: 'button' | 'link';
    accessibilityState?: AccessibilityState;
    hitSlop?: number;
    testID?: string;
};

/**
 * Press feedback for the app's pills and buttons (DESIGN.md motion grammar; animate-expo
 * "Press feedback"): press-in scales to 0.97 over 100 ms on the strong ease-out (180 ms back), with the
 * selection haptic on the same press-in. A CSS transition, so no worklet and no per-frame work;
 * the state changes twice per press, never per frame.
 *
 * Reduce Motion drops the scale and keeps a dimming in its place (opacity stays, transforms go).
 * The haptic follows Settings › Haptics, read at press time, so the setting re-renders nothing.
 */
export function PressableScale({
    onPress,
    children,
    style,
    haptic = true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole = 'button',
    accessibilityState,
    hitSlop = 8,
    testID,
}: Props) {
    const [pressed, setPressed] = useState(false);
    const reduced = useReducedMotion();

    const onPressIn = () => {
        setPressed(true);
        if (haptic && useSettingsStore.getState().settings.haptics) {
            Haptics.selectionAsync().catch(() => {});
        }
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={() => setPressed(false)}
            hitSlop={hitSlop}
            pressRetentionOffset={16}
            accessibilityRole={accessibilityRole}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            <Animated.View style={[styles.base, style, pressed && (reduced ? styles.pressedReduced : styles.pressed)]}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

// css.create types Reanimated's CSS transition properties, which StyleSheet.create doesn't know.
const styles = css.create({
    // Asymmetric (review-animations standard 9): the press snaps in at 100 ms, the release settles
    // back over 180 ms. A CSS transition takes the duration of the style it moves to.
    base: {
        transform: [{ scale: 1 }],
        opacity: 1,
        transitionProperty: ['transform', 'opacity'],
        transitionDuration: 180,
        transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    },
    pressed: { transform: [{ scale: 0.97 }], transitionDuration: 100 },
    pressedReduced: { opacity: 0.85, transitionDuration: 100 },
});
