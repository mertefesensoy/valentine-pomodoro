import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/icons/Icon';
import { goal as goalGlyph } from '../../components/icons/art/goal';
import { Sticker } from '../../components/stickers/Sticker';
import { doroCelebrating } from '../../components/stickers/art/doroCelebrating';
import { pomoCelebrating } from '../../components/stickers/art/pomoCelebrating';
import { formatNumber, language, t } from '../../i18n';
import type { ThemeTokens } from '../../theme/palette';
import { edgeWidth, radius, space } from '../../theme/layout';
import type { DayStats } from '../../types';
import { fonts } from '../../theme/type';

export type Metric = 'sessions' | 'minutes';
export type Day = { key: string; stats: DayStats };

const LOCALE = language === 'tr' ? 'tr-TR' : 'en-US';
// An edge shows at most this many stickers, then "+n" (whole cells, never shrunk).
const EDGE_STICKERS = 4;

/** "YYYY-MM-DD" as a local date (never parsed as UTC). */
export function dateOfKey(key: string): Date {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}


/** What VoiceOver reads for a day: its name and date, sessions, minutes, and the goal if reached. */
export function dayLabel(key: string, stats: DayStats, today: boolean): string {
    const date = dateOfKey(key);
    const name = today ? t('stats.today') : date.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric' });
    if (stats.focusSessions === 0) return `${name}, ${t('stats.noSessions')}`;
    const parts = [
        name,
        t('stats.sessions', { count: stats.focusSessions }),
        t('stats.minutes', { count: Math.round(stats.focusMinutes) }),
    ];
    if (stats.goalHit) parts.push(t('stats.goalReached'));
    return parts.join(', ');
}

function Stickers({ count, size, max, tokens }: { count: number; size: number; max: number; tokens: ThemeTokens }) {
    const shown = Math.min(count, max);
    return (
        <>
            {Array.from({ length: shown }, (_, i) => (
                <Sticker key={i} art={i % 2 ? doroCelebrating : pomoCelebrating} width={size} shadow={tokens.stickerShadow} />
            ))}
            {count > max && (
                <View style={[styles.more, { backgroundColor: tokens.primarySoft }]}>
                    <Text style={[styles.moreText, { color: tokens.primaryInk }]} maxFontSizeMultiplier={1.3}>
                        {t('today.more', { count: count - max })}
                    </Text>
                </View>
            )}
        </>
    );
}

/** A dashed cell: an empty day, or a session still owed to the goal. `edgeStrong`, 3:1 or more on paper. */
export function DashedCell({ size, tokens }: { size: number; tokens: ThemeTokens }) {
    return (
        <View
            style={{ width: size - 2, height: size - 2, borderRadius: size, borderWidth: 1.5, borderStyle: 'dashed', borderColor: tokens.edgeStrong }}
            testID="dashed-cell"
        />
    );
}

/**
 * How many whole cells fit on one row of today's card, `cardWidth` wide: its padding and edge
 * off, and each cell planned at the sticker's size (a dashed cell is 2 pt narrower), so any mix
 * of stickers and dashed cells fits.
 */
export function todayCellsPerRow(cardWidth: number, cell: number): number {
    const inner = cardWidth - space.l * 2 - edgeWidth * 2;
    return Math.max(1, Math.floor((inner + space.s) / (cell + space.s)));
}

/** The minutes view's fill toward the goal; full past it. Without a goal, no fill. */
function MinutesFill({ minutes, goal, tokens }: { minutes: number; goal: number; tokens: ThemeTokens }) {
    if (goal <= 0) return null;
    const share = Math.min(minutes / goal, 1);
    // The track is the goal's length, so it is drawn with an `edgeStrong` outline: `ringTrack` alone
    // is 1.13:1 on paper (HIG S-2).
    return (
        <View style={[styles.track, { backgroundColor: tokens.ringTrack, borderColor: tokens.edgeStrong }]}>
            <View style={[styles.fill, { width: `${share * 100}%`, backgroundColor: share >= 1 ? tokens.ringBreak : tokens.ringFocus }]} />
        </View>
    );
}

/**
 * One of the six earlier days, as a postcard's edge in the stack (D2 Stats contract): its day,
 * its stickers or its minutes, its count, and the goal flag. An empty day is one dashed cell,
 * never "missed" (PRODUCT principle 2). One element for VoiceOver.
 *
 * The day's name never truncates (HIG S-1, `typography.md`): in the stack its column is
 * `dayWidth`, which the caller grows with the text size; in the list (AX sizes) it takes a line of
 * its own. The goal flag is `flag` points, grown like the stickers.
 */
export function DayEdge({ day, metric, goal, height, sticker, flag, dayWidth, countWidth, tilt, stacked, closed, tokens }: {
    day: Day;
    metric: Metric;
    goal: number;
    height: number;
    sticker: number;
    flag: number;
    dayWidth: number;
    /** The count column's width, the same on every edge, so the Minutes tracks end together. */
    countWidth: number;
    tilt: number;
    stacked: boolean;
    /** The stack's last edge with nothing in front of it (landscape): it closes its own bottom. */
    closed?: boolean;
    tokens: ThemeTokens;
}) {
    const { focusSessions, focusMinutes, goalHit } = day.stats;
    const date = dateOfKey(day.key);
    const name = `${date.toLocaleDateString(LOCALE, { weekday: 'short' })} ${date.getDate()}`;
    return (
        <View
            style={[
                styles.edge,
                stacked ? styles.edgeStacked : styles.edgeList,
                closed && styles.edgeClosed,
                { minHeight: height, backgroundColor: tokens.paper, borderColor: tokens.edge, transform: [{ rotate: `${tilt}deg` }] },
            ]}
            accessible
            accessibilityLabel={dayLabel(day.key, day.stats, false)}
        >
            <Text style={[styles.edgeDay, stacked ? { width: dayWidth } : styles.edgeDayLine, { color: tokens.inkSoft }]}>
                {name}
            </Text>
            <View style={styles.edgeBody}>
                {focusSessions === 0 ? (
                    <DashedCell size={sticker} tokens={tokens} />
                ) : metric === 'sessions' ? (
                    <Stickers count={focusSessions} size={sticker} max={EDGE_STICKERS} tokens={tokens} />
                ) : (
                    <MinutesFill minutes={focusMinutes} goal={goal} tokens={tokens} />
                )}
            </View>
            {focusSessions > 0 && (
                <Text style={[styles.edgeCount, { minWidth: countWidth, color: tokens.ink }]}>
                    {metric === 'sessions' ? focusSessions : formatNumber(focusMinutes)}
                </Text>
            )}
            <View style={[styles.flagCell, { width: flag }]}>{goalHit ? <Icon glyph={goalGlyph} size={flag} color={tokens.successInk} /> : null}</View>
        </View>
    );
}

/** Today's postcard, in front of the stack: its stickers with dashed cells to the goal, and its line. */
export function TodayCard({ day, metric, goal, owed, perRow, sticker, compact, tokens }: {
    day: Day;
    metric: Metric;
    goal: number;
    /** Sessions still owed to today's goal (D1 record §4.3). */
    owed: number;
    /** Whole cells on the card's one row (`todayCellsPerRow`). */
    perRow: number;
    sticker: number;
    compact: boolean;
    tokens: ThemeTokens;
}) {
    const { focusSessions, focusMinutes, goalHit } = day.stats;
    // One row of whole cells, as the comp draws today's postcard: the stickers, with "+n" in the
    // last cell once they pass the row, then dashed cells for what's still owed, never wrapping a
    // lone cell (finish review round 2, D2 record §3.25). At 0 with nothing owed, one dashed cell.
    const over = focusSessions > perRow;
    const shown = over ? perRow - 1 : focusSessions;
    const dashed = Math.max(0, Math.min(owed, perRow - (over ? perRow : shown))) || (focusSessions === 0 ? 1 : 0);
    const date = dateOfKey(day.key).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    const minutesText = t('stats.minutesShort', { count: Math.round(focusMinutes), n: formatNumber(focusMinutes) });
    const left = Math.max(goal - focusMinutes, 0);
    const tail =
        goal <= 0 ? null : goalHit ? t('stats.goalReached') : t('stats.toGoal', { count: Math.ceil(left), n: formatNumber(Math.ceil(left)) });
    return (
        <View
            style={[styles.today, compact && styles.todayCompact, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}
            accessible
            accessibilityLabel={dayLabel(day.key, day.stats, true)}
        >
            <Text style={[styles.todayDate, { color: tokens.inkSoft }]}>{date}</Text>
            <Text style={[styles.todayTitle, { color: tokens.ink }]} maxFontSizeMultiplier={1.4}>
                {t('stats.today')}
            </Text>
            {metric === 'sessions' ? (
                <View style={styles.todayRow} testID="today-cells">
                    <Stickers count={focusSessions} size={sticker} max={shown} tokens={tokens} />
                    {Array.from({ length: dashed }, (_, i) => (
                        <DashedCell key={i} size={sticker} tokens={tokens} />
                    ))}
                </View>
            ) : (
                <View style={styles.todayFill}>
                    <MinutesFill minutes={focusMinutes} goal={goal} tokens={tokens} />
                </View>
            )}
            <Text style={[styles.todayLine, { color: tokens.ink }]}>
                {t('stats.sessions', { count: focusSessions })} · {minutesText}
                {tail ? <Text style={{ color: tokens.inkSoft }}> · {tail}</Text> : null}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    edge: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: space.s,
        paddingHorizontal: space.m,
        paddingTop: space.s,
        borderWidth: edgeWidth,
    },
    // In the stack each edge is a postcard's top, tucked under the next; as a list (AX sizes) each
    // is a whole slip.
    edgeStacked: { borderTopLeftRadius: radius.m, borderTopRightRadius: radius.m, borderBottomWidth: 0, marginBottom: -space.s },
    edgeClosed: {
        borderBottomWidth: edgeWidth,
        borderBottomLeftRadius: radius.m,
        borderBottomRightRadius: radius.m,
        paddingBottom: space.s,
        marginBottom: 0,
    },
    edgeList: { borderRadius: radius.m, paddingBottom: space.s, flexWrap: 'wrap' },
    edgeDay: { fontSize: 13, fontWeight: '600' },
    edgeDayLine: { flexBasis: '100%' },
    edgeBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 18 },
    edgeCount: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'right' },
    flagCell: { alignItems: 'center' },
    more: { borderRadius: radius.s, paddingHorizontal: space.xs, paddingVertical: 1 },
    moreText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
    track: { flex: 1, height: 8, borderRadius: 4, borderWidth: 1, overflow: 'hidden', marginTop: 5 },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
    today: { borderWidth: edgeWidth, borderRadius: radius.l, paddingHorizontal: space.l, paddingVertical: space.m, gap: space.xs },
    todayCompact: { flex: 1 },
    todayDate: { fontSize: 13, fontWeight: '600' },
    todayTitle: { fontFamily: fonts.semiBold, fontSize: 22, lineHeight: 28 },
    todayRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s, marginVertical: space.xs },
    todayFill: { flexDirection: 'row', marginVertical: space.s },
    todayLine: { fontSize: 15, fontVariant: ['tabular-nums'] },
});
