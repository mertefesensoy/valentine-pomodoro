import { useEffect } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    LayoutAnimationConfig,
    css,
    useReducedMotion,
    withSpring,
    withTiming,
    type EntryAnimationsValues,
    type LayoutAnimation,
} from 'react-native-reanimated';

import { Icon } from '../../components/icons/Icon';
import { goal } from '../../components/icons/art/goal';
import { Sticker } from '../../components/stickers/Sticker';
import { doroCelebrating } from '../../components/stickers/art/doroCelebrating';
import { pomoCelebrating } from '../../components/stickers/art/pomoCelebrating';
import { t } from '../../i18n';
import type { ThemeTokens } from '../../theme/palette';
import { radius, space } from '../../theme/layout';

const CELL = 34; // a sticker cell, sticker plus its gap
const STICKER = 28;
const ROWS = 2; // "the sticker row wraps in whole cells, up to two rows, then +n" (brief §5)

// The sticker placement, the product's one bounce (DESIGN.md signature move; Stage D plan §4.4):
// a spring with dampingRatio 0.75, bounce 0.25, about 2.8 % overshoot, over 450 ms.
const PRESS_SPRING = { duration: 450, dampingRatio: 0.75 } as const;
// Everything that enters or flies out decelerates on the strong ease-out (review-animations standard 3).
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function stickerPress(): LayoutAnimation {
    'worklet';
    return {
        initialValues: { opacity: 0, transform: [{ translateY: -16 }, { scale: 1.35 }, { rotate: '-10deg' }] },
        animations: {
            opacity: withTiming(1, { duration: 120, easing: EASE_OUT }),
            transform: [
                { translateY: withSpring(0, PRESS_SPRING) },
                { scale: withSpring(1, PRESS_SPRING) },
                { rotate: withSpring('0deg', PRESS_SPRING) },
            ],
        },
    };
}

const STICKER_FADE = FadeIn.duration(200); // Reduce Motion: opacity only

// The paper bits: at most 24 (DESIGN.md); 12 here, transform and opacity only. Each rests where it
// lands, invisible, so its entering animation is the whole flight and nothing needs a timer.
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
    const distance = 26 + (i % 3) * 8;
    return { dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance - 6, spin: (i % 2 ? 1 : -1) * (90 + i * 15) };
});

function particleFlight(dx: number, dy: number, spin: number) {
    return (_: EntryAnimationsValues): LayoutAnimation => {
        'worklet';
        const fly = { duration: 600, easing: EASE_OUT };
        return {
            initialValues: { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] },
            animations: {
                opacity: withTiming(0, fly),
                transform: [
                    { translateX: withTiming(dx, fly) },
                    { translateY: withTiming(dy, fly) },
                    { rotate: withTiming(`${spin}deg`, fly) },
                    { scale: withTiming(0.6, fly) },
                ],
            },
        };
    };
}

const FLIGHTS = PARTICLES.map((p) => particleFlight(p.dx, p.dy, p.spin));

function Burst({ colors }: { colors: string[] }) {
    return (
        <View pointerEvents="none" style={styles.burst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {PARTICLES.map((p, i) => (
                <Animated.View
                    key={i}
                    entering={FLIGHTS[i]}
                    style={[
                        styles.particle,
                        {
                            backgroundColor: colors[i % colors.length],
                            opacity: 0,
                            transform: [{ translateX: p.dx }, { translateY: p.dy }, { rotate: `${p.spin}deg` }, { scale: 0.6 }],
                        },
                    ]}
                />
            ))}
        </View>
    );
}

type Props = {
    tokens: ThemeTokens;
    /** Focus sessions completed today. */
    count: number;
    /** Today's goal reached (sticky for the day). */
    goalHit: boolean;
    /** The goal moment to play now, with its streak (the stats store's pulse), or null for none. */
    goalStreak: number | null;
    onGoalMomentDone: () => void;
    /** Whether a new sticker may play its placement (Timer focused); otherwise it just appears. */
    animate: boolean;
};

/**
 * Today's stickers (Classic brief §3): one per completed focus, packed in whole cells, wrapping to
 * two rows, then "+n". A new one is pressed on with the placement and its burst; the ones already
 * there never animate, so returning to the tab replays nothing (HIG D1-L1). Never blocks a control.
 *
 * "Goal reached" is an inline moment here (brief §6), not a modal: it shows for 1.4 s with the
 * streak, then leaves the goal mark in the row for the rest of the day.
 */
export function TodayStickers({ tokens, count, goalHit, goalStreak, onGoalMomentDone, animate }: Props) {
    const goalMoment = goalStreak !== null;
    const reduced = useReducedMotion();
    const { width } = useWindowDimensions();
    const perRow = Math.max(4, Math.floor((Math.min(width, 560) - space.xl * 2 - CELL) / CELL));
    const capacity = perRow * ROWS;
    const overflow = count > capacity ? count - (capacity - 1) : 0;
    const shown = overflow ? capacity - 1 : count;

    useEffect(() => {
        if (!goalMoment) return;
        const id = setTimeout(onGoalMomentDone, 1400);
        return () => clearTimeout(id);
    }, [goalMoment, onGoalMomentDone]);

    const entering = !animate ? undefined : reduced ? STICKER_FADE : stickerPress;
    const burstColors = [tokens.primary, tokens.success, tokens.ink, tokens.accent];

    return (
        <View style={styles.wrap}>
            <View
                style={styles.row}
                accessible
                accessibilityLabel={count === 0 ? t('today.a11y_zero') : t('today.a11y', { count })}
            >
                <LayoutAnimationConfig skipEntering>
                    {Array.from({ length: shown }, (_, i) => {
                        const isNewest = i === shown - 1 && !overflow;
                        return (
                            <Animated.View key={i} entering={isNewest ? entering : undefined} style={styles.cell}>
                                <Sticker art={i % 2 ? doroCelebrating : pomoCelebrating} width={STICKER} />
                                {isNewest && animate && !reduced && <Burst key={count} colors={burstColors} />}
                            </Animated.View>
                        );
                    })}
                </LayoutAnimationConfig>
                {overflow > 0 && (
                    <View style={[styles.cell, styles.more, { backgroundColor: tokens.primarySoft }]}>
                        <Text style={[styles.moreText, { color: tokens.primaryInk }]} maxFontSizeMultiplier={1.3}>
                            {t('today.more', { count: overflow })}
                        </Text>
                    </View>
                )}
                {count === 0 && (
                    // The empty state explains the row before the first sticker lands (critique P2).
                    <View style={styles.emptyRow}>
                        <View style={[styles.emptySlot, { borderColor: tokens.edgeStrong }]} />
                        <Text style={[styles.emptyText, { color: tokens.inkSoft }]} maxFontSizeMultiplier={1.6}>
                            {t('today.empty')}
                        </Text>
                    </View>
                )}
                {goalHit && !goalMoment && (
                    <View style={styles.cell} accessible accessibilityLabel={t('goal.reached')}>
                        <Icon glyph={goal} size={24} color={tokens.successInk} />
                    </View>
                )}
            </View>
            {goalMoment && (
                <Animated.View entering={FadeIn.duration(250)} style={[styles.moment, { backgroundColor: tokens.success }]} accessibilityLiveRegion="polite">
                    <Icon glyph={goal} size={20} color={tokens.onSuccess} />
                    <Text style={[styles.momentText, { color: tokens.onSuccess }]}>{t('goal.reached')}</Text>
                    {goalStreak !== null && goalStreak > 0 && (
                        <Text style={[styles.momentStreak, { color: tokens.onSuccess }]}>{t('goal.streak', { count: goalStreak })}</Text>
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const styles = css.create({
    wrap: { alignItems: 'center', gap: space.s },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        minHeight: CELL,
    },
    cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
    more: { borderRadius: radius.s, width: undefined, minWidth: CELL, paddingHorizontal: space.xs },
    emptyRow: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: CELL, flexShrink: 1 },
    emptySlot: { width: STICKER - 2, height: STICKER - 2, borderRadius: (STICKER - 2) / 2, borderWidth: 1.5, borderStyle: 'dashed' },
    emptyText: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
    moreText: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
    burst: { position: 'absolute', left: CELL / 2, top: CELL / 2 },
    particle: { position: 'absolute', width: 6, height: 9, marginLeft: -3, marginTop: -4.5, borderRadius: 2 },
    moment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s,
        paddingHorizontal: space.l,
        paddingVertical: space.s,
        borderRadius: radius.pill,
    },
    momentText: { fontSize: 16, fontWeight: '700' },
    momentStreak: { fontSize: 15, fontWeight: '500' },
});
