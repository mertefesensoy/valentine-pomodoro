import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { BANNER_ID } from '../ads/AdConfig';
import { noteBannerFailed, noteBannerLayout, noteBannerLoaded, noteBannerRequested } from '../ads/bannerStatus';
import { Icon } from '../components/icons/Icon';
import { goal as goalGlyph } from '../components/icons/art/goal';
import { streak as streakGlyph } from '../components/icons/art/streak';
import { ButtonRow, ListGroup } from '../components/settings/SettingsList';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatusBarScrim } from '../components/ui/StatusBarScrim';
import { useHasBeenFocused, useScreenFocused } from '../hooks/useScreenFocus';
import { formatNumber, t } from '../i18n';
import { useSettingsFocus } from '../stores/settingsFocusStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore, useStatsViews } from '../stores/statsStore';
import { fonts } from '../theme/type';
import { edgeWidth, radius, space } from '../theme/layout';
import { useTheme } from '../theme/useTheme';
import { goalCellsLeft } from './classic/TodayStickers';
import { DayEdge, TodayCard, todayCellsPerRow, type Metric } from './stats/WeekStack';
import { useTourBeatHere, useTourReach, useTourScroll } from './tutorial/useTour';

// The tour's layer (Phase 1 D5), evaluated when a tour first reaches Stats (tutorial brief §4).
const TourLayer = lazy(() => import('./tutorial/TourLayer'));

// AX1 and up (iOS reports a font scale of about 1.65 there): the stack becomes a list, today first.
const LIST_FONT_SCALE = 1.6;
// Compact height (an iPhone in landscape): today leads, the stack trails.
const COMPACT_HEIGHT = 500;
// Regular width (iPad, wide windows): the page centres at a readable width.
const READABLE_WIDTH = 560;
// A short screen (an iPhone SE, 667 pt) tightens the stack's pitch, so the week, the goal and the
// streak fit above the banner (D2 record §3.4: checked with a 375 × 667 render).
const SHORT_HEIGHT = 700;
// An edge's day column at the default text size: "Wed 29" in 13 pt semibold, with room to spare.
const DAY_COLUMN = 56;
// An edge's count column at the default text size: "1,440" (a day's most minutes) in 13 pt
// semibold tabular figures. A fixed width ends every Minutes track at the same x, so a full bar
// and a 2 % bar share the goal's length (finish review fix 3; they ended 9 pt apart).
const COUNT_COLUMN = 36;

/**
 * Stats (D2 Stats contract): the week as a stack of day postcards, today in front.
 *
 * - One summary line names the metric in view and is read first by VoiceOver (HIG review).
 * - The six earlier days stack as edges, oldest at the top; today's postcard sits in front, with
 *   dashed cells for the sessions still owed to the goal (D1 record §4.3).
 * - The goal and the love streak share one paper strip; with the goal off, a button opens Settings.
 * - All-time totals sit below, quietly; the banner keeps its slot above the tab bar.
 * - Nothing animates on entry: Stats is opened often (Emil's frequency gate).
 */
export default function StatsScreen() {
    const isReady = useStatsStore((s) => s.isReady);
    const goalMinutes = useStatsStore((s) => s.goalMinutes);
    const focusMinutes = useSettingsStore((s) => s.settings.durations.focus);
    const { today, totals, last7Days, streak } = useStatsViews();
    const { tokens } = useTheme();
    const { width, height, fontScale } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // The banner (B6 fix, record §9). The tab is rendered before it is first
    // opened (LazyTab), so the ad waits for Stats' first focus: no request for
    // a screen nobody has looked at. Its container is there from the start, as
    // before. bannerStatus keeps the load result and where the container
    // landed, for B7's hidden panel: build 46 showed no banner, cause unknown.
    const bannerAllowed = useHasBeenFocused();
    useEffect(() => {
        if (bannerAllowed) noteBannerRequested();
    }, [bannerAllowed]);
    const bannerBoxRef = useRef<React.ComponentRef<typeof View>>(null);
    // Its bottom edge against the tab bar's top edge, both in window
    // coordinates. Measured only while Stats is on screen (a hidden tab is out
    // of the window, so its numbers would mean nothing): on focus, on layout,
    // and when the ad answers, since a failed load changes no layout.
    const focused = useScreenFocused();
    // The tour (D5): its Stats step shows here, with the week lit; the tab coming to the front moves
    // its lead on. The page scrolls the week clear of the AX panel.
    useTourReach('stats', focused);
    const tourHere = useTourBeatHere('stats') && focused;
    const todayRef = useRef<React.ComponentRef<typeof View>>(null);
    // The banner's height above the tab bar: the tour keeps its bubble and pair clear of the ad.
    const [bannerReserve, setBannerReserve] = useState(0);
    const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
    const { track: trackScroll, scrollBy } = useTourScroll(tourHere, (y) => scrollRef.current?.scrollTo({ y, animated: true }));
    const measureBannerBox = useCallback(() => {
        if (!focused) return;
        bannerBoxRef.current?.measureInWindow((_x, y, _w, h) => noteBannerLayout(y + h, height - insets.bottom, h));
    }, [focused, height, insets.bottom]);
    useEffect(() => {
        if (bannerAllowed) measureBannerBox();
    }, [bannerAllowed, measureBannerBox]);

    const [metric, setMetric] = useState<Metric>('sessions');
    // The slot shows its paper and edge only once an ad fills it: empty (no fill, or before the
    // first answer), it drew a stray line and a band above the tab bar (build 52 device check).
    const [bannerFilled, setBannerFilled] = useState(false);

    const week = useMemo(() => {
        const days = last7Days.map(([key, stats]) => ({ key, stats }));
        return {
            earlier: days.slice(0, 6),
            today: days[6],
            sessions: days.reduce((n, d) => n + d.stats.focusSessions, 0),
            minutes: days.reduce((n, d) => n + d.stats.focusMinutes, 0),
            goalDays: days.filter((d) => d.stats.goalHit).length,
        };
    }, [last7Days]);

    // The loading return must come after every hook: returning before them
    // changes the hook count when isReady flips on a mounted screen, and React throws.
    if (!isReady) {
        return (
            <View style={[styles.loading, { backgroundColor: tokens.page }]}>
                <Text style={[styles.loadingText, { color: tokens.inkSoft }]}>{t('stats.loading')}</Text>
            </View>
        );
    }

    const goalOn = goalMinutes > 0;
    const list = fontScale >= LIST_FONT_SCALE;
    const compact = height < COMPACT_HEIGHT;
    const short = height < SHORT_HEIGHT;
    // Stickers and icons grow with Dynamic Type up to 1.3×, as Classic's timer does; cells stay whole.
    const grow = Math.min(fontScale, 1.3);
    const edgeHeight = (short ? 30 : 34) * grow + space.s;
    // The day's name grows with the text size, uncapped, up to where the list takes over; the
    // fixed 56 pt cut "Wed 29" to "Wed…" from xxLarge (HIG S-1).
    const dayWidth = DAY_COLUMN * Math.max(fontScale, 1);
    const countWidth = COUNT_COLUMN * Math.max(fontScale, 1);
    const todayGoal = today.goalMinutes ?? goalMinutes;
    // In landscape the week spans the width between the side insets (the brief; finish review fix
    // 1); the readable cap is for portrait and iPad.
    const columnWidth = compact ? width - insets.left - insets.right - space.l * 2 : Math.min(width, READABLE_WIDTH) - space.l * 2;
    const sticker = (short ? 34 : 40) * grow;
    // Today's card holds one row of whole cells, planned from its own width: a fixed eight wrapped
    // seven and one on a 393 pt phone (finish review round 2, D2 record §3.25). In landscape the
    // card shares the row with the stack.
    const todayPerRow = todayCellsPerRow(compact && !list ? (columnWidth - space.l) / 2 : columnWidth, sticker);
    const owed = goalCellsLeft({ goalMinutes: todayGoal, minutesToday: today.focusMinutes, focusMinutes, goalHit: !!today.goalHit });

    // Counts of 1,000 or more are grouped as the language writes them, in every line, so one
    // number never shows two ways on one screen (D2 record §3.13, break-ui #6).
    const summary = [
        metric === 'sessions'
            ? t('stats.weekSessions', { count: week.sessions, n: formatNumber(week.sessions) })
            : t('stats.weekMinutes', { count: Math.round(week.minutes), n: formatNumber(week.minutes) }),
        // No goal day this week says nothing rather than "goal reached on 0 days", which reads
        // as a miss (the contract; PRODUCT principle 2; break-ui #4).
        goalOn && week.goalDays > 0 ? t('stats.goalDays', { count: week.goalDays }) : null,
    ]
        .filter(Boolean)
        .join(' · ');

    const minutesLeftToday = Math.ceil(Math.max(goalMinutes - today.focusMinutes, 0));
    // A streak of 0 says how it starts, not "0 days" beside the best (the owner, D2; break-ui), and
    // the best takes a line of its own: joined by " · " it wrapped into a dangling "·" and a lone
    // "best 2" (build 52 device check).
    const streakLines =
        streak.current > 0
            ? [t('stats.streakValue', { count: streak.current, n: formatNumber(streak.current), best: formatNumber(streak.best) })]
            : [t('stats.streakStart'), ...(streak.best > 0 ? [t('stats.best', { best: formatNumber(streak.best) })] : [])];

    // Today's postcard is the tour's opening on Stats (D5 device check, build 57): the whole week left
    // the pair no room, and "today in front" is the line's subject.
    const todayCard = (
        <View ref={todayRef} collapsable={false}>
            <TodayCard
                day={week.today}
                metric={metric}
                goal={todayGoal}
                owed={owed}
                perRow={todayPerRow}
                sticker={sticker}
                compact={compact}
                tokens={tokens}
            />
        </View>
    );
    const edges = (list ? [...week.earlier].reverse() : week.earlier).map((day, i) => (
        <DayEdge
            key={day.key}
            day={day}
            metric={metric}
            goal={day.stats.goalMinutes ?? goalMinutes}
            height={edgeHeight}
            sticker={(short ? 16 : 18) * grow}
            flag={14 * grow}
            dayWidth={dayWidth}
            countWidth={countWidth}
            tilt={list ? 0 : i % 2 ? 0.6 : -0.6}
            stacked={!list}
            // In landscape today's card sits in the other column, so the stack's last edge closes
            // itself instead of ending open (finish review fix 2).
            closed={compact && !list && i === week.earlier.length - 1}
            tokens={tokens}
        />
    ));
    // The stack reads top to bottom, oldest first, today in front. At AX sizes, a list: today first.
    const stack = list ? (
        <View style={styles.list}>
            {todayCard}
            {edges}
        </View>
    ) : compact ? (
        <View style={styles.compactRow}>
            {todayCard}
            <View style={styles.compactStack}>{edges}</View>
        </View>
    ) : (
        <View>
            <View style={styles.edges}>{edges}</View>
            {todayCard}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: tokens.page }]}>
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={[styles.page, { paddingTop: insets.top + space.s }]}
                onScroll={tourHere ? trackScroll : undefined}
                // No drag while the tour is here: it would leave the opening behind.
                scrollEnabled={!tourHere}
                scrollEventThrottle={tourHere ? 32 : undefined}
                // Room to scroll the week clear of the bubble's panel, whenever it takes the bottom.
                contentInset={tourHere ? { bottom: height * 0.5 } : undefined}
            >
                <View style={[styles.column, { width: columnWidth }]}>
                    <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header" maxFontSizeMultiplier={1.4}>
                        {t('stats.title')}
                    </Text>
                    <SegmentedControl<Metric>
                        segments={[
                            { value: 'sessions', label: t('stats.metricSessions'), accessibilityLabel: t('stats.metricSessions') },
                            { value: 'minutes', label: t('stats.metricMinutes'), accessibilityLabel: t('stats.metricMinutes') },
                        ]}
                        value={metric}
                        onChange={setMetric}
                    />
                    <Text style={[styles.summary, { color: tokens.ink }]} accessibilityRole="summary">
                        {summary}
                    </Text>

                    {stack}

                    {week.sessions === 0 && (
                        <ListGroup>
                            <ButtonRow label={t('stats.startSession')} onPress={() => router.navigate('/')} />
                        </ListGroup>
                    )}

                    {/* At AX sizes the strip's halves stack: side by side, each text column was
                        about 110 pt, and "Hedef" and "serisi" broke mid-word (break-ui #5). */}
                    {goalOn ? (
                        <View
                            style={[
                                styles.strip,
                                list && styles.stripStacked,
                                { backgroundColor: tokens.paper, borderColor: tokens.edge },
                            ]}
                        >
                            <View style={[styles.half, !list && styles.halfSide]} accessible>
                                <Icon glyph={goalGlyph} size={22 * grow} color={tokens.successInk} />
                                <View style={styles.halfText}>
                                    <Text style={[styles.stripTitle, { color: tokens.ink }]}>
                                        {t('stats.goalTitle', { count: goalMinutes, n: formatNumber(goalMinutes) })}
                                    </Text>
                                    <Text style={[styles.stripValue, { color: tokens.inkSoft }]}>
                                        {today.goalHit
                                            ? t('stats.goalReachedToday')
                                            : t('stats.leftToday', { count: minutesLeftToday, n: formatNumber(minutesLeftToday) })}
                                    </Text>
                                </View>
                            </View>
                            <View style={[list ? styles.dividerStacked : styles.divider, { backgroundColor: tokens.edge }]} />
                            <View style={[styles.half, !list && styles.halfSide]} accessible>
                                <Icon glyph={streakGlyph} size={22 * grow} color={tokens.primaryInk} />
                                <View style={styles.halfText}>
                                    <Text style={[styles.stripTitle, { color: tokens.ink }]}>{t('stats.streakTitle')}</Text>
                                    {streakLines.map((line) => (
                                        <Text key={line} style={[styles.stripValue, { color: tokens.inkSoft }]}>
                                            {line}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <ListGroup footer={t('stats.goalOffFooter')}>
                            <ButtonRow
                                label={t('stats.turnOnGoal')}
                                onPress={() => {
                                    // Settings opens at the goal row, not its top (the contract).
                                    useSettingsFocus.getState().request('goal');
                                    router.navigate('/settings');
                                }}
                            />
                        </ListGroup>
                    )}

                    <Text style={[styles.allTime, { color: tokens.inkSoft }]}>
                        {t('stats.allTime', {
                            sessions: t('stats.sessionsN', { count: totals.focusSessions, n: formatNumber(totals.focusSessions) }),
                            minutes: t('stats.minutesN', { count: Math.round(totals.focusMinutes), n: formatNumber(totals.focusMinutes) }),
                        })}
                    </Text>
                </View>
            </ScrollView>
            <StatusBarScrim />
            {tourHere && (
                <Suspense fallback={null}>
                    <TourLayer
                        screen="stats"
                        targets={{ week: { ref: todayRef, radius: radius.l, a11y: { label: summary, role: 'text' } } }}
                        scrollBy={scrollBy}
                        bottomReserve={bannerReserve}
                    />
                </Suspense>
            )}
            {/* The bottom inset includes the native tab bar (Phase 1 B6); the slot sits above it,
                with about 12 pt between the ad and the bar (its own padding plus this margin). */}
            <View
                ref={bannerBoxRef}
                onLayout={(e) => {
                    measureBannerBox();
                    const reserve = Math.ceil(e.nativeEvent.layout.height + space.xs);
                    if (reserve !== bannerReserve) setBannerReserve(reserve);
                }}
                style={[
                    styles.banner,
                    {
                        backgroundColor: bannerFilled ? tokens.paper : 'transparent',
                        borderTopColor: bannerFilled ? tokens.edge : 'transparent',
                        marginBottom: insets.bottom + space.xs,
                    },
                ]}
            >
                {bannerAllowed && (
                    <BannerAd
                        unitId={BANNER_ID}
                        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                        onAdLoaded={(size) => {
                            setBannerFilled(true);
                            noteBannerLoaded(size);
                            measureBannerBox();
                        }}
                        onAdFailedToLoad={(error) => {
                            setBannerFilled(false);
                            noteBannerFailed(error);
                            measureBannerBox();
                        }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 15 },
    page: { alignItems: 'center', paddingBottom: space.l },
    column: { gap: space.l },
    title: { fontFamily: fonts.semiBold, fontSize: 34, lineHeight: 42, paddingHorizontal: space.xs },
    summary: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
    edges: { paddingHorizontal: space.s },
    list: { gap: space.s },
    compactRow: { flexDirection: 'row', gap: space.l, alignItems: 'flex-start' },
    compactStack: { flex: 1 },
    strip: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: edgeWidth, borderRadius: radius.m, paddingVertical: space.m },
    stripStacked: { flexDirection: 'column', flexWrap: 'nowrap' },
    half: { flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.m },
    halfSide: { flex: 1, minWidth: 150 },
    halfText: { flexShrink: 1 },
    divider: { width: edgeWidth, alignSelf: 'stretch' },
    dividerStacked: { height: StyleSheet.hairlineWidth, marginVertical: space.s, marginLeft: space.m },
    stripTitle: { fontSize: 15, fontWeight: '600' },
    stripValue: { fontSize: 13, fontVariant: ['tabular-nums'] },
    allTime: { fontSize: 14, fontVariant: ['tabular-nums'] },
    banner: { alignItems: 'center', paddingVertical: space.s, borderTopWidth: 1 },
});
