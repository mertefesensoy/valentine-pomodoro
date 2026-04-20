/**
 * FlySheet.tsx
 *
 * A snap-to-point container for the Fly Mode dashboard.
 *
 * Portrait: bottom sheet with 2 snap points (full / peek).
 *   - full = 45 % of viewport height
 *   - peek = thin strip: handle + timer row + mode-indicator (~10 % of viewport, min 80 px)
 *
 * Landscape: right-side panel with 2 snap points (full / peek).
 *   - full = min(42 % of viewport width, 400 px)
 *   - peek = thin 32 px strip (drag handle only)
 *
 * sheetProgress (0 = peek, 1 = full) is an externally-created SharedValue
 * that this component WRITES to.  The parent uses it to:
 *   - fade in/out the airport pickers
 *   - position the mapHint banner
 *   - adjust fitToCoordinates edgePadding
 *   - drive FlyTimerPill opacity
 *
 * Snap velocity threshold: |v| > 600 pt/s snaps in the fling direction.
 * Otherwise we find the nearest snap via projected position (0.15 s lookahead).
 *
 * Double-tap anywhere on the sheet toggles between full and peek.
 * Rotating the device preserves the current snap (no force-reset to full).
 */

import React, {
    forwardRef, useCallback, useEffect, useMemo, useRef,
    useImperativeHandle,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ValentineSpec } from '../theme/tokens';

// ─── Public types ─────────────────────────────────────────────────────────────

export type FlySnapPoint = 'full' | 'peek';

export interface FlySheetRef {
    expandTo(snap: FlySnapPoint): void;
}

interface FlySheetProps {
    /** SharedValue<number> owned by the parent; FlySheet writes 0 (peek) → 1 (full). */
    sheetProgress: SharedValue<number>;
    isLandscape: boolean;
    viewportWidth: number;
    viewportHeight: number;
    /** Bottom safe-area inset (portrait only) */
    bottomInset: number;
    onSnapChange?: (snap: FlySnapPoint) => void;
    /** When true, a haptic fires on each snap. */
    hapticsEnabled?: boolean;
    /** Background colour of the card surface. */
    cardBgColor: string;
    /** Rendered beside the drag handle (portrait) or at the top of the side panel (landscape). */
    headerControl?: React.ReactNode;
    children: React.ReactNode;
}

// ─── Snap geometry helpers ────────────────────────────────────────────────────

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };
const VELOCITY_THRESHOLD = 600; // pt/s for velocity-based fling snap
const PEEK_STRIP = 32; // landscape: visible width when peeked

function portraitSnaps(h: number) {
    return {
        full: 0,
        peek: h * 0.45 - Math.max(h * 0.10, 80), // (fullH − peekVisibleH); shows handle + timer + mode strip
        fullH: h * 0.45,
    };
}

function landscapeSnaps(w: number) {
    const panelW = Math.min(w * 0.42, 400);
    return {
        full: 0,
        peek: panelW - PEEK_STRIP,
        panelW,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

const FlySheet = forwardRef<FlySheetRef, FlySheetProps>((props, ref) => {
    const {
        sheetProgress, isLandscape, viewportWidth, viewportHeight,
        bottomInset, onSnapChange, hapticsEnabled, cardBgColor, headerControl, children,
    } = props;

    // Primary animation value (translateY portrait / translateX landscape)
    const translation = useSharedValue(0);

    // Dimension SharedValues so worklets stay fresh across rotations
    const fullTransSV = useSharedValue(0);
    const peekTransSV = useSharedValue(0);
    const maxTransSV = useSharedValue(1);
    const isLandscapeSV = useSharedValue(isLandscape);
    const panelWSV = useSharedValue(0);

    // JS-side tracking of current snap — used to preserve position across rotation
    const currentSnapRef = useRef<FlySnapPoint>('full');

    // JS-side snap callback: updates tracking ref, fires haptic, notifies parent
    const onSnap = useCallback((snap: FlySnapPoint) => {
        currentSnapRef.current = snap;
        if (hapticsEnabled) Haptics.selectionAsync().catch(() => {});
        onSnapChange?.(snap);
    }, [hapticsEnabled, onSnapChange]);

    // ── snapToTarget (worklet) ──────────────────────────────────────────────
    const snapToTarget = useCallback((snap: FlySnapPoint) => {
        'worklet';
        const target = snap === 'peek' ? peekTransSV.value : fullTransSV.value;
        translation.value = withSpring(target, SPRING);

        // sheetProgress: 0 = peek, 1 = full — also spring-driven for smooth pill fade
        const progress = maxTransSV.value > 0
            ? 1 - target / maxTransSV.value
            : 1;
        sheetProgress.value = withSpring(Math.max(0, Math.min(1, progress)), SPRING);
    }, [fullTransSV, peekTransSV, maxTransSV, translation, sheetProgress]);

    // ── Recalculate snap targets on dimension / orientation change ──────────
    // Preserves the current snap name instead of force-resetting to full.
    useEffect(() => {
        isLandscapeSV.value = isLandscape;
        if (isLandscape) {
            const s = landscapeSnaps(viewportWidth);
            fullTransSV.value = s.full;
            peekTransSV.value = s.peek;
            maxTransSV.value = s.peek;
            panelWSV.value = s.panelW;
        } else {
            const s = portraitSnaps(viewportHeight);
            fullTransSV.value = s.full;
            peekTransSV.value = s.peek;
            maxTransSV.value = s.peek;
        }
        // Re-apply the preserved snap (not force-to-full)
        snapToTarget(currentSnapRef.current);
    }, [isLandscape, viewportWidth, viewportHeight]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── resolveSnap (worklet) ───────────────────────────────────────────────
    const resolveSnap = useCallback((pos: number, velocity: number): FlySnapPoint => {
        'worklet';
        const fling = Math.abs(velocity) > VELOCITY_THRESHOLD;
        const projected = fling ? pos + velocity * 0.15 : pos;
        return Math.abs(projected - fullTransSV.value) < Math.abs(projected - peekTransSV.value)
            ? 'full'
            : 'peek';
    }, [fullTransSV, peekTransSV]);

    // ── Gestures ────────────────────────────────────────────────────────────
    const dragStart = useSharedValue(0);

    // Memoized so gesture-handler only rebuilds when snap callbacks change,
    // not on every render — prevents stale axis config after orientation change.
    const portraitGesture = useMemo(() => Gesture.Pan()
        .activeOffsetY([-2, 2])
        .failOffsetX([-10, 10])
        .onBegin(() => { dragStart.value = translation.value; })
        .onUpdate((e) => {
            const raw = dragStart.value + e.translationY;
            const clamped = Math.max(fullTransSV.value, Math.min(peekTransSV.value, raw));
            translation.value = clamped;
            sheetProgress.value = maxTransSV.value > 0
                ? Math.max(0, Math.min(1, 1 - clamped / maxTransSV.value))
                : 1;
        })
        .onEnd((e) => {
            const snap = resolveSnap(translation.value, e.velocityY);
            snapToTarget(snap);
            runOnJS(onSnap)(snap);
        }), [onSnap, resolveSnap, snapToTarget]); // eslint-disable-line react-hooks/exhaustive-deps

    const landscapeGesture = useMemo(() => Gesture.Pan()
        .activeOffsetX([-2, 2])
        .failOffsetY([-10, 10])
        .onBegin(() => { dragStart.value = translation.value; })
        .onUpdate((e) => {
            const raw = dragStart.value + e.translationX;
            const clamped = Math.max(0, Math.min(peekTransSV.value, raw));
            translation.value = clamped;
            sheetProgress.value = maxTransSV.value > 0
                ? Math.max(0, Math.min(1, 1 - clamped / maxTransSV.value))
                : 1;
        })
        .onEnd((e) => {
            const snap = resolveSnap(translation.value, e.velocityX);
            snapToTarget(snap);
            runOnJS(onSnap)(snap);
        }), [onSnap, resolveSnap, snapToTarget]); // eslint-disable-line react-hooks/exhaustive-deps

    // Double-tap toggles between full and peek
    const doubleTap = useMemo(() => Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((_e, success) => {
            'worklet';
            if (!success) return;
            const nearPeek = Math.abs(translation.value - peekTransSV.value) <
                             Math.abs(translation.value - fullTransSV.value);
            const nextSnap: FlySnapPoint = nearPeek ? 'full' : 'peek';
            snapToTarget(nextSnap);
            runOnJS(onSnap)(nextSnap);
        }), [onSnap, snapToTarget]); // eslint-disable-line react-hooks/exhaustive-deps

    const gesture = useMemo(
        () => Gesture.Race(doubleTap, isLandscape ? landscapeGesture : portraitGesture),
        [doubleTap, portraitGesture, landscapeGesture, isLandscape],
    );

    // Expose imperative API
    useImperativeHandle(ref, () => ({
        expandTo(snap: FlySnapPoint) {
            snapToTarget(snap);
            onSnap(snap);
        },
    }), [snapToTarget, onSnap]);

    // Animated container style
    const containerStyle = useAnimatedStyle(() => ({
        transform: isLandscape
            ? [{ translateX: translation.value }]
            : [{ translateY: translation.value }],
    }));

    // Dimensions for static layout
    const { fullH } = portraitSnaps(viewportHeight);
    const { panelW } = landscapeSnaps(viewportWidth);

    // ── Landscape: right-side panel ─────────────────────────────────────────
    if (isLandscape) {
        return (
            <GestureDetector gesture={gesture}>
                <Animated.View
                    collapsable={false}
                    style={[
                        styles.sidePanel,
                        { width: panelW, backgroundColor: cardBgColor },
                        containerStyle,
                    ]}
                >
                    {/* Drag handle on the left edge — tap to expand from peek */}
                    <Pressable onPress={() => { snapToTarget('full'); onSnap('full'); }}>
                        <View style={styles.sideDragHandle}>
                            <View style={[styles.handleBarVertical, { backgroundColor: `${ValentineSpec.accentPrimary}55` }]} />
                        </View>
                    </Pressable>

                    {/* Panel content */}
                    <View style={styles.sidePanelContent}>
                        {headerControl && (
                            <View style={styles.landscapeHeaderControl}>{headerControl}</View>
                        )}
                        {children}
                    </View>
                </Animated.View>
            </GestureDetector>
        );
    }

    // ── Portrait: bottom sheet ───────────────────────────────────────────────
    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                collapsable={false}
                style={[
                    styles.sheet,
                    {
                        height: fullH,
                        paddingBottom: bottomInset > 0 ? bottomInset + 8 : 20,
                        backgroundColor: cardBgColor,
                    },
                    containerStyle,
                ]}
            >
                {/* Drag handle row — tap to expand from peek */}
                <Pressable onPress={() => { snapToTarget('full'); onSnap('full'); }}>
                    <View style={styles.dragHandleRow}>
                        <View style={[styles.handleBar, { backgroundColor: `${ValentineSpec.accentPrimary}55` }]} />
                    </View>
                </Pressable>

                {headerControl && (
                    <View style={styles.headerControlSlot}>{headerControl}</View>
                )}

                {/* Sheet content */}
                <View style={styles.sheetBody}>
                    {children}
                </View>
            </Animated.View>
        </GestureDetector>
    );
});

FlySheet.displayName = 'FlySheet';
export default FlySheet;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // Portrait bottom sheet
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 12,
        overflow: 'hidden',
    },
    dragHandleRow: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 2,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        marginBottom: 2,
    },
    sheetBody: {
        flex: 1,
    },
    // Landscape side panel
    sidePanel: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 12,
        overflow: 'hidden',
    },
    sideDragHandle: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: `${ValentineSpec.accentPrimary}30`,
    },
    handleBarVertical: {
        width: 4,
        height: 40,
        borderRadius: 2,
    },
    sidePanelContent: {
        flex: 1,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 20,
    },
    headerControlSlot: {
        position: 'absolute',
        right: 16,
        top: 6,
        zIndex: 2,
    },
    landscapeHeaderControl: {
        paddingBottom: 6,
        alignItems: 'flex-start',
    },
});
