import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { css, cubicBezier } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { t } from '../../i18n';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTheme } from '../../theme/useTheme';
import { edgeWidth, minTarget, radius } from '../../theme/layout';

export type Segment<T extends string> = {
    value: T;
    /** What the segment shows ("25/5"). */
    label: string;
    /** What VoiceOver says ("25 minutes focus, 5 minutes break", HIG review M-3). */
    accessibilityLabel: string;
};

type Props<T extends string> = {
    segments: readonly Segment<T>[];
    /** The selected value, or null when none applies (custom durations). */
    value: T | null;
    onChange: (value: T) => void;
};

// AX1 and up (iOS reports fontScale ≈ 1.65 there): four labels no longer fit one row.
const WRAP_FONT_SCALE = 1.6;

/**
 * A segmented control, built rather than the native module (Stage D plan §5; brief §6):
 * one track, equal segments and a selection that slides between them, so it keeps the
 * native control's sizing, placement and behaviour (`branding.md`), while each segment
 * speaks in words and four Turkish labels can wrap at accessibility sizes.
 *
 * - VoiceOver: each segment is a button with a selected state, its spoken label and its
 *   position ("1 of 4"). Never a "tab": tabs navigate, and this sets a value (HIG D1-M2).
 * - Motion: the selection slides on a CSS transition of its own-width percentage
 *   (200 ms, ease-in-out, because it moves across the control rather than entering), so it
 *   runs with no per-frame work. The selection haptic fires on the change, not on landing.
 * - At AX sizes it wraps into two rows, and the selected segment fills in place instead.
 */
export function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
    const { tokens } = useTheme();
    const { fontScale } = useWindowDimensions();
    const wrap = fontScale >= WRAP_FONT_SCALE;
    const index = segments.findIndex((s) => s.value === value);

    const select = (next: T) => {
        if (next === value) return;
        if (useSettingsStore.getState().settings.haptics) Haptics.selectionAsync().catch(() => {});
        onChange(next);
    };

    return (
        <View
            style={[
                styles.track,
                wrap && styles.trackWrap,
                { backgroundColor: tokens.field, borderColor: tokens.edge },
            ]}
        >
            {!wrap && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.indicator,
                        {
                            width: `${100 / segments.length}%`,
                            transform: [{ translateX: `${Math.max(index, 0) * 100}%` }],
                            opacity: index >= 0 ? 1 : 0,
                            backgroundColor: tokens.paper,
                            borderColor: tokens.edgeStrong,
                        },
                    ]}
                />
            )}
            {segments.map((s, i) => {
                const selected = i === index;
                return (
                    <Pressable
                        key={s.value}
                        onPress={() => select(s.value)}
                        accessibilityRole="button"
                        accessibilityLabel={s.accessibilityLabel}
                        accessibilityValue={{ text: t('presets.position', { n: i + 1, total: segments.length }) }}
                        accessibilityState={{ selected }}
                        style={[
                            styles.segment,
                            wrap && styles.segmentWrap,
                            wrap && selected && { backgroundColor: tokens.paper, borderColor: tokens.edgeStrong },
                        ]}
                    >
                        <Text
                            style={[styles.label, { color: selected ? tokens.ink : tokens.inkSoft }]}
                            maxFontSizeMultiplier={2}
                        >
                            {s.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = css.create({
    track: {
        flexDirection: 'row',
        borderRadius: radius.pill,
        borderWidth: edgeWidth,
        padding: 3,
        alignSelf: 'stretch',
    },
    trackWrap: {
        flexWrap: 'wrap',
        borderRadius: radius.m,
        gap: 4,
    },
    indicator: {
        position: 'absolute',
        top: 3,
        bottom: 3,
        left: 3,
        borderRadius: radius.pill,
        borderWidth: edgeWidth,
        transitionProperty: ['transform', 'opacity'],
        transitionDuration: 200,
        transitionTimingFunction: cubicBezier(0.77, 0, 0.175, 1),
    },
    segment: {
        flex: 1,
        minHeight: minTarget,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    segmentWrap: {
        flexBasis: '48%',
        flexGrow: 1,
        borderRadius: radius.s,
        borderWidth: edgeWidth,
        borderColor: 'transparent',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
});
