import { useEffect, useRef } from 'react';
import { Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    LayoutAnimationConfig,
    css,
    useFrameCallback,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
    type EntryAnimationsValues,
    type LayoutAnimation,
} from 'react-native-reanimated';

import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '../../components/icons/Icon';
import { goal } from '../../components/icons/art/goal';
import { Sticker } from '../../components/stickers/Sticker';
import { doroCelebrating } from '../../components/stickers/art/doroCelebrating';
import { pomoCelebrating } from '../../components/stickers/art/pomoCelebrating';
import { t } from '../../i18n';
import type { ThemeTokens } from '../../theme/palette';
import { radius, space } from '../../theme/layout';
import { noteCompletionFrames } from '../../startup/frameProbe';

const CELL = 34; // a sticker cell, sticker plus its gap
const STICKER = 28;
const ROWS = 2; // "the sticker row wraps in whole cells, up to two rows, then +n" (brief §5)
// The room the "Today" label takes from the first row, about two cells at default text size.
const LABEL_ROOM = 2 * CELL;

/**
 * The focus sessions still needed for today's goal (D1 record §4.3): the goal's minutes not yet
 * focused, in sessions of the current focus length, rounded up. None once the goal is reached, or
 * when there is no goal or no focus length. Pure; the row caps it at its two rows.
 */
export function goalCellsLeft({ goalMinutes, minutesToday, focusMinutes, goalHit }: {
    goalMinutes: number;
    minutesToday: number;
    focusMinutes: number;
    goalHit: boolean;
}): number {
    if (goalHit || !(goalMinutes > 0) || !(focusMinutes > 0)) return 0;
    return Math.max(0, Math.ceil((goalMinutes - minutesToday) / focusMinutes));
}

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
    /** The sessions still needed for today's goal (`goalCellsLeft`), drawn as dashed cells. */
    sessionsToGoal: number;
    /** The goal moment to play now, with its streak (the stats store's pulse), or null for none. */
    goalStreak: number | null;
    onGoalMomentDone: () => void;
    /** Whether a new sticker may play its placement (Timer focused); otherwise it just appears. */
    animate: boolean;
    /**
     * The width the row has, in points. Without it, the portrait column's width (the window's,
     * capped at 560, less the gutters). Landscape passes its trailing column's: planned from the
     * window, the row expected a dozen cells a line in a column a fraction as wide, and wrapped one
     * cell a line (build 53 device check, D2 record §3.20).
     */
    rowWidth?: number;
    /** The row's layout, for the Ring, which sizes to the height its neighbours leave. */
    onLayout?: (e: LayoutChangeEvent) => void;
};

/**
 * Today's stickers (Classic brief §3): one per completed focus, packed in whole cells, wrapping to
 * two rows, then "+n". A new one is pressed on with the placement and its burst; the ones already
 * there never animate, so returning to the tab replays nothing (HIG D1-L1). Never blocks a control.
 *
 * A "Today" label leads the row, and dashed cells stand for the sessions still needed for today's
 * goal, so how the day is going reads without a tap (finish review fix 6; the C4 sketches' row).
 * Each finished session fills the next cell. The cells never take the row past its two rows.
 *
 * "Goal reached" is an inline moment here (brief §6), not a modal: it shows for 1.4 s with the
 * streak, then leaves the goal mark in the row for the rest of the day.
 */
export function TodayStickers({ tokens, count, goalHit, sessionsToGoal, goalStreak, onGoalMomentDone, animate, rowWidth, onLayout }: Props) {
    const goalMoment = goalStreak !== null;
    const reduced = useReducedMotion();
    const { width } = useWindowDimensions();
    const row = rowWidth ?? Math.min(width, 560) - space.xl * 2;
    const perRow = Math.max(4, Math.floor((row - CELL - LABEL_ROOM) / CELL));
    const capacity = perRow * ROWS;
    const overflow = count > capacity ? count - (capacity - 1) : 0;
    const shown = overflow ? capacity - 1 : count;
    // The cells taken: the stickers, plus the "+n" cell once they overflow, which fills the rows.
    const taken = overflow ? capacity : shown;
    // At 0 with no goal, one dashed cell still shows where the first sticker lands.
    const empty = Math.max(0, Math.min(sessionsToGoal, capacity - taken)) || (count === 0 ? 1 : 0);
    // The row's cells keep one height through the day: the stickers replace dashed cells one for
    // one, so the Ring, which sizes to the height left, doesn't jump at a completion. It gives a
    // row's height up once, at the completion that first wraps the row onto its second row.
    const spoken = count === 0 ? t('today.a11y_zero') : t('today.a11y', { count });

    // NFR-PERF-004's readout: for one second after a placement, the UI thread records each frame's
    // delta and hands them over once, at the end, to B7's hidden panel (`startup/frameProbe`). No render.
    const deltas = useSharedValue<number[]>([]);
    const startedAt = useSharedValue(0);
    const finished = useSharedValue(true);
    const probe = useFrameCallback((info) => {
        'worklet';
        if (finished.get()) return;
        if (startedAt.get() === 0) startedAt.set(info.timestamp);
        const dt = info.timeSincePreviousFrame;
        if (dt !== null) {
            deltas.modify((a) => {
                'worklet';
                a.push(dt);
                return a;
            });
        }
        if (info.timestamp - startedAt.get() >= 1000) {
            finished.set(true);
            scheduleOnRN(noteCompletionFrames, deltas.get().slice());
        }
    }, false);
    const prevCount = useRef(count);
    useEffect(() => {
        const grew = count > prevCount.current;
        prevCount.current = count;
        if (!grew || !animate) return;
        deltas.set([]);
        startedAt.set(0);
        finished.set(false);
        probe.setActive(true);
        // The worklet reports at 1 s; the callback itself stops here, with room to spare.
        const stop = setTimeout(() => probe.setActive(false), 1500);
        return () => {
            clearTimeout(stop);
            probe.setActive(false);
        };
    }, [count, animate, probe, deltas, startedAt, finished]);

    useEffect(() => {
        if (!goalMoment) return;
        const id = setTimeout(onGoalMomentDone, 1400);
        return () => clearTimeout(id);
    }, [goalMoment, onGoalMomentDone]);

    const entering = !animate ? undefined : reduced ? STICKER_FADE : stickerPress;
    const burstColors = [tokens.primary, tokens.success, tokens.ink, tokens.accent];

    return (
        <View style={styles.wrap} onLayout={onLayout} testID="today-row">
            <View
                style={styles.line}
                accessible
                accessibilityLabel={sessionsToGoal > 0 ? `${spoken}. ${t('today.left', { count: sessionsToGoal })}` : spoken}
            >
                <Text style={[styles.label, { color: tokens.inkSoft }]} maxFontSizeMultiplier={1.4}>
                    {t('today.label')}
                </Text>
                <View style={styles.row}>
                    <LayoutAnimationConfig skipEntering>
                        {Array.from({ length: shown }, (_, i) => {
                            const isNewest = i === shown - 1 && !overflow;
                            return (
                                <Animated.View key={i} entering={isNewest ? entering : undefined} style={styles.cell}>
                                    <Sticker art={i % 2 ? doroCelebrating : pomoCelebrating} width={STICKER} shadow={tokens.stickerShadow} />
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
                    {Array.from({ length: empty }, (_, i) => (
                        <View key={`empty-${i}`} style={styles.cell}>
                            <View style={[styles.emptySlot, { borderColor: tokens.edgeStrong }]} />
                        </View>
                    ))}
                    {goalHit && !goalMoment && (
                        <View style={styles.cell} accessible accessibilityLabel={t('goal.reached')}>
                            <Icon glyph={goal} size={24} color={tokens.successInk} />
                        </View>
                    )}
                </View>
                {count === 0 && sessionsToGoal === 0 && (
                    // With no goal to count toward, a sentence explains the row before the first
                    // sticker lands (critique P2), beside its one cell so the row keeps its height.
                    // With a goal, the dashed cells explain it.
                    <Text style={[styles.emptyText, { color: tokens.inkSoft }]} maxFontSizeMultiplier={1.6}>
                        {t('today.empty')}
                    </Text>
                )}
            </View>
            {goalMoment && (
                <Animated.View entering={FadeIn.duration(250)} style={[styles.moment, { backgroundColor: tokens.success }]} accessibilityLiveRegion="polite">
                    <Icon glyph={goal} size={20} color={tokens.onSuccess} />
                    <Text style={[styles.momentText, { color: tokens.onSuccess }]} maxFontSizeMultiplier={1.6}>{t('goal.reached')}</Text>
                    {goalStreak !== null && goalStreak > 0 && (
                        <Text style={[styles.momentStreak, { color: tokens.onSuccess }]} maxFontSizeMultiplier={1.6}>{t('goal.streak', { count: goalStreak })}</Text>
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const styles = css.create({
    wrap: { alignItems: 'center', gap: space.s },
    line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s, maxWidth: '100%' },
    label: { fontSize: 13, fontWeight: '600' },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        flexShrink: 1,
        minHeight: CELL,
    },
    cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
    more: { borderRadius: radius.s, width: undefined, minWidth: CELL, paddingHorizontal: space.xs },
    emptySlot: { width: STICKER - 2, height: STICKER - 2, borderRadius: (STICKER - 2) / 2, borderWidth: 1.5, borderStyle: 'dashed' },
    emptyText: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
    moreText: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
    burst: { position: 'absolute', left: CELL / 2, top: CELL / 2 },
    particle: { position: 'absolute', width: 6, height: 9, marginLeft: -3, marginTop: -4.5, borderRadius: 2 },
    moment: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Turkish at AX sizes (break-ui #3)
        justifyContent: 'center',
        maxWidth: '100%',
        alignItems: 'center',
        gap: space.s,
        paddingHorizontal: space.l,
        paddingVertical: space.s,
        borderRadius: radius.pill,
    },
    momentText: { fontSize: 16, fontWeight: '700' },
    momentStreak: { fontSize: 15, fontWeight: '500' },
});
