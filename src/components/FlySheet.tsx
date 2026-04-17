/**
 * FlySheet.tsx
 *
 * A snap-to-point container for the Fly Mode dashboard.
 *
 * Portrait: bottom sheet with 3 snap points (full / mid / peek).
 *   - full = 55 % of viewport height
 *   - mid  = 30 % of viewport height  (pickers hidden, timer+controls visible)
 *   - peek = 6 % of viewport height   (handle only; FlyTimerPill floats at top)
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
 */

import React, {
    forwardRef, useCallback, useEffect,
    useImperativeHandle,
} from 'react';
import { StyleSheet, View } from 'react-native';
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

export type FlySnapPoint = 'full' | 'mid' | 'peek';

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
    /** Slot for the Globe/Flat toggle — rendered in the drag-handle row. */
    headerControl?: React.ReactNode;
    /** Background colour of the card surface. */
    cardBgColor: string;
    children: React.ReactNode;
}

// ─── Snap geometry helpers ────────────────────────────────────────────────────

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };
const VELOCITY_THRESHOLD = 600; // pt/s for velocity-based fling snap
const PEEK_STRIP = 32; // landscape: visible width when peeked

function portraitSnaps(h: number) {
    return {
        full: 0,
        mid: h * 0.55 - h * 0.30, // (fullH - midH)
        peek: h * 0.55 - Math.max(h * 0.06, 52), // (fullH - peekH)
        fullH: h * 0.55,
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
        bottomInset, onSnapChange, headerControl, cardBgColor, children,
    } = props;

    // Primary animation value (translateY portrait / translateX landscape)
    const translation = useSharedValue(0);

    // Dimension SharedValues so worklets stay fresh across rotations
    const fullTransSV = useSharedValue(0);
    const midTransSV = useSharedValue(0);
    const peekTransSV = useSharedValue(0);
    const maxTransSV = useSharedValue(1);
    const isLandscapeSV = useSharedValue(isLandscape);
    const panelWSV = useSharedValue(0);

    // Recalculate snap targets & reset to full on dimension/orientation change
    useEffect(() => {
        isLandscapeSV.value = isLandscape;
        if (isLandscape) {
            const s = landscapeSnaps(viewportWidth);
            fullTransSV.value = s.full;
            midTransSV.value = s.full; // no mid in landscape
            peekTransSV.value = s.peek;
            maxTransSV.value = s.peek;
            panelWSV.value = s.panelW;
        } else {
            const s = portraitSnaps(viewportHeight);
            fullTransSV.value = s.full;
            midTransSV.value = s.mid;
            peekTransSV.value = s.peek;
            maxTransSV.value = s.peek;
        }
        // Reset sheet to full on every rotate/resize
        translation.value = withSpring(0, SPRING);
        sheetProgress.value = 1;
    }, [isLandscape, viewportWidth, viewportHeight]);

    // JS-side snap tracking for haptics + callback
    const onSnap = useCallback((snap: FlySnapPoint) => {
        Haptics.selectionAsync().catch(() => {});
        onSnapChange?.(snap);
    }, [onSnapChange]);

    // Convert translation → nearest snap
    const resolveSnap = useCallback((pos: number, velocity: number): FlySnapPoint => {
        'worklet';
        const fling = Math.abs(velocity) > VELOCITY_THRESHOLD;
        const projected = fling ? pos + velocity * 0.15 : pos;

        const full = fullTransSV.value;
        const mid = midTransSV.value;
        const peek = peekTransSV.value;

        const dFull = Math.abs(projected - full);
        const dMid = Math.abs(projected - mid);
        const dPeek = Math.abs(projected - peek);

        if (!isLandscapeSV.value && dMid < dFull && dMid < dPeek) return 'mid';
        return dPeek < dFull ? 'peek' : 'full';
    }, [fullTransSV, midTransSV, peekTransSV, isLandscapeSV]);

    const snapToTarget = useCallback((snap: FlySnapPoint) => {
        'worklet';
        let target = 0;
        if (snap === 'mid') target = midTransSV.value;
        else if (snap === 'peek') target = peekTransSV.value;
        translation.value = withSpring(target, SPRING);

        // Update progress: 0 = peek, 1 = full
        const progress = maxTransSV.value > 0
            ? 1 - target / maxTransSV.value
            : 1;
        sheetProgress.value = Math.max(0, Math.min(1, progress));
    }, [midTransSV, peekTransSV, maxTransSV, translation, sheetProgress]);

    // Gesture — pan starts at last position
    const dragStart = useSharedValue(0);

    const portraitGesture = Gesture.Pan()
        .activeOffsetY([-5, 5])
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
        });

    const landscapeGesture = Gesture.Pan()
        .activeOffsetX([-5, 5])
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
        });

    const gesture = isLandscape ? landscapeGesture : portraitGesture;

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
                    style={[
                        styles.sidePanel,
                        { width: panelW, backgroundColor: cardBgColor },
                        containerStyle,
                    ]}
                >
                    {/* Drag handle on the left edge */}
                    <View style={styles.sideDragHandle}>
                        <View style={[styles.handleBarVertical, { backgroundColor: `${ValentineSpec.accentPrimary}55` }]} />
                    </View>

                    {/* Panel content */}
                    <View style={styles.sidePanelContent}>
                        {/* Header control slot (globe toggle) */}
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
                {/* Drag handle row */}
                <View style={styles.dragHandleRow}>
                    <View style={[styles.handleBar, { backgroundColor: `${ValentineSpec.accentPrimary}55` }]} />
                    {/* Header control (globe toggle) — reachable at all snap points */}
                    {headerControl && (
                        <View style={styles.headerControlSlot}>{headerControl}</View>
                    )}
                </View>

                {/* Scrollable-ish content area */}
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
    headerControlSlot: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 4,
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
    landscapeHeaderControl: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
});
