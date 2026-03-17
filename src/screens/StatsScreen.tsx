import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/useTheme';
import { BANNER_ID } from '../ads/AdConfig';

type Metric = 'sessions' | 'minutes';

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

const BAR_MAX = 120;       // keep your existing scale (you already use 120)
const BAR_AREA = 150;      // matches styles.bars height

function parseLocalDateKey(dayKey: string) {
    // dayKey format: YYYY-MM-DD
    const [y, m, d] = dayKey.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1); // ✅ local time, avoids UTC parsing bugs
}

function formatNumber(n: number) {
    // Avoid "25.0"
    if (Number.isInteger(n)) return String(n);
    // keep 1 decimal for test configs like 0.1 min
    return n.toFixed(1).replace(/\.0$/, '');
}

export default function StatsScreen() {
    const { stats } = useApp();
    const { isReady, today, totals, last7Days, goalMinutes, streak } = stats;
    const { colors } = useTheme();
    const tabBarHeight = useBottomTabBarHeight();

    const [metric, setMetric] = useState<Metric>('minutes');
    const [barAreaWidth, setBarAreaWidth] = useState(0);

    if (!isReady) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading stats…</Text>
            </SafeAreaView>
        );
    }

    const hasStats = totals.focusSessions > 0;

    const weekTotals = useMemo(() => {
        return last7Days.reduce(
            (acc, [, day]) => ({
                focusSessions: acc.focusSessions + day.focusSessions,
                focusMinutes: acc.focusMinutes + day.focusMinutes,
            }),
            { focusSessions: 0, focusMinutes: 0 }
        );
    }, [last7Days]);

    const avgPerDay = useMemo(() => {
        return {
            focusSessions: weekTotals.focusSessions / 7,
            focusMinutes: weekTotals.focusMinutes / 7,
        };
    }, [weekTotals]);

    const showGoalLine = metric === 'minutes' && (goalMinutes ?? 0) > 0;

    const maxValue = useMemo(() => {
        const values = last7Days.map(([, day]) =>
            metric === 'sessions' ? day.focusSessions : day.focusMinutes
        );
        const baseMax = Math.max(...values, 1);
        return showGoalLine ? Math.max(baseMax, goalMinutes ?? 0, 1) : baseMax;
    }, [last7Days, metric, showGoalLine, goalMinutes]);

    // SVG uses y-from-top; BAR_AREA is the container height (150px)
    const goalLineY = useMemo(() => {
        if (!showGoalLine) return 0;
        const yFromBottom = ((goalMinutes ?? 0) / maxValue) * BAR_AREA;
        const clampedFromBottom = clamp(yFromBottom, 0, BAR_AREA);
        return BAR_AREA - clampedFromBottom;
    }, [showGoalLine, goalMinutes, maxValue]);

    const leftToday = useMemo(() => Math.max(goalMinutes - today.focusMinutes, 0), [goalMinutes, today.focusMinutes]);

    const chartTitle = metric === 'sessions' ? 'Last 7 Days (Sessions)' : 'Last 7 Days (Minutes)';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.header, { color: colors.text }]}>Stats</Text>

                {/* Summary Cards */}
                <View style={styles.cardsRow}>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardValue, { color: colors.accent }]}>{today.focusSessions}</Text>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Today Sessions</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardValue, { color: colors.accent }]}>
                            {formatNumber(today.focusMinutes)}
                        </Text>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Today Minutes</Text>
                    </View>
                </View>

                <View style={styles.cardsRow}>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardValue, { color: colors.accent }]}>{totals.focusSessions}</Text>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>All-Time Sessions</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardValue, { color: colors.accent }]}>
                            {formatNumber(totals.focusMinutes)}
                        </Text>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>All-Time Minutes</Text>
                    </View>
                </View>

                <View style={styles.cardsRow}>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardValue, { color: colors.accent }]}>
                            {formatNumber(goalMinutes)}
                        </Text>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Daily Goal (min)</Text>
                        <Text style={[styles.cardHint, { color: colors.textMuted }]}>
                            Left today: {formatNumber(leftToday)}
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardValue, { color: colors.accent }]}>
                            {streak.current}
                        </Text>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Love Streak</Text>
                        <Text style={[styles.cardHint, { color: colors.textMuted }]}>
                            Best: {streak.best}
                        </Text>
                    </View>
                </View>

                {/* Last 7 Days Chart */}
                <View
                    style={[
                        styles.chartContainer,
                        { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                >
                    <View style={styles.chartHeaderRow}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>{chartTitle}</Text>

                        {/* Metric Toggle */}
                        <View style={[styles.segment, { backgroundColor: colors.surfaceTint }]}>
                            <Pressable
                                onPress={() => setMetric('minutes')}
                                style={[
                                    styles.segmentItem,
                                    metric === 'minutes' && {
                                        backgroundColor: colors.accent,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: metric === 'minutes' ? '#FFFFFF' : colors.textMuted },
                                    ]}
                                >
                                    Minutes
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setMetric('sessions')}
                                style={[
                                    styles.segmentItem,
                                    metric === 'sessions' && {
                                        backgroundColor: colors.accent,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: metric === 'sessions' ? '#FFFFFF' : colors.textMuted },
                                    ]}
                                >
                                    Sessions
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Weekly rollups */}
                    <View style={styles.weekSummaryRow}>
                        <Text style={[styles.weekSummaryText, { color: colors.text }]}>
                            This week: {weekTotals.focusSessions} sessions •{' '}
                            {formatNumber(weekTotals.focusMinutes)} minutes
                        </Text>
                        <Text style={[styles.weekSummarySubtext, { color: colors.textMuted }]}>
                            Avg/day: {formatNumber(avgPerDay.focusMinutes)} min •{' '}
                            {formatNumber(avgPerDay.focusSessions)} sessions
                        </Text>
                    </View>

                    {!hasStats ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No stats yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                                Complete a focus session to see your progress.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.chart}>
                            <View
                                style={styles.barArea}
                                onLayout={(e) => setBarAreaWidth(e.nativeEvent.layout.width)}
                            >
                                <View style={styles.bars}>
                                    {last7Days.map(([dayKey, day], idx) => {
                                        const value = metric === 'sessions' ? day.focusSessions : day.focusMinutes;
                                        const height = (value / maxValue) * BAR_MAX;

                                        const isToday = idx === last7Days.length - 1;
                                        const labelDate = parseLocalDateKey(dayKey);
                                        const weekday = labelDate.toLocaleDateString('en', { weekday: 'short' });

                                        return (
                                            <View key={dayKey} style={styles.barColumn}>
                                                <View style={styles.barContainer}>
                                                    {value > 0 && (
                                                        <Text style={[styles.barValue, { color: colors.text }]}>
                                                            {metric === 'sessions' ? value : formatNumber(value)}
                                                        </Text>
                                                    )}
                                                    <View
                                                        style={[
                                                            styles.bar,
                                                            {
                                                                height: Math.max(height, 4),
                                                                backgroundColor: isToday
                                                                    ? colors.accent
                                                                    : colors.accentPurple,
                                                            },
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                                                    {weekday}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* SVG dashed goal line — reliable on all iOS/Android */}
                                {showGoalLine && barAreaWidth > 0 && (
                                    <Svg
                                        pointerEvents="none"
                                        width={barAreaWidth}
                                        height={BAR_AREA}
                                        style={styles.goalOverlay}
                                    >
                                        <Line
                                            x1={0}
                                            y1={goalLineY}
                                            x2={barAreaWidth}
                                            y2={goalLineY}
                                            stroke={colors.textMuted}
                                            strokeWidth={2}
                                            strokeDasharray="6 6"
                                            opacity={0.75}
                                        />
                                    </Svg>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
            <View style={{ marginBottom: tabBarHeight }}>
                <BannerAd
                    unitId={BANNER_ID}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                />
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed - now inline
    },
    scrollContent: {
        padding: 16,
    },
    loadingText: {
        fontSize: 16,
        // color removed - now inline
        textAlign: 'center',
        marginTop: 24,
    },

    header: {
        fontSize: 24,
        fontWeight: '600',
        // color removed - now inline
        marginBottom: 24,
    },

    cardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    card: {
        flex: 1,
        // backgroundColor, borderColor removed - now inline
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    cardValue: {
        fontSize: 32,
        fontWeight: '700',
        // color removed - now inline
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: '500',
        // color removed - now inline
        textAlign: 'center',
    },
    cardHint: {
        fontSize: 11,
        marginTop: 6,
    },

    chartContainer: {
        marginTop: 12,
        // backgroundColor, borderColor removed - now inline
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
    },

    chartHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color removed - now inline
    },

    segment: {
        flexDirection: 'row',
        // backgroundColor removed - now inline
        borderRadius: 999,
        padding: 2,
    },
    segmentItem: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        // backgroundColor removed - now inline per item
    },
    segmentText: {
        fontSize: 12,
        fontWeight: '600',
        // color removed - now inline
    },

    weekSummaryRow: {
        marginTop: 14,
        marginBottom: 10,
    },
    weekSummaryText: {
        fontSize: 13,
        fontWeight: '600',
        // color removed - now inline
    },
    weekSummarySubtext: {
        fontSize: 12,
        // color removed - now inline
        marginTop: 4,
    },

    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        // color removed - now inline
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        // color removed - now inline
        textAlign: 'center',
    },

    chart: {
        height: 180,
        marginTop: 8,
    },
    barArea: {
        position: 'relative',
        height: BAR_AREA, // 150
        justifyContent: 'flex-end',
    },
    bars: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
    },
    goalOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 50,
        elevation: 50,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
    },
    barContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
    },
    barValue: {
        fontSize: 12,
        fontWeight: '600',
        // color removed - now inline
        marginBottom: 4,
    },
    bar: {
        width: 24,
        borderRadius: 4,
        // backgroundColor removed - now inline
    },
    barLabel: {
        fontSize: 10,
        // color removed - now inline
        marginTop: 8,
    },
});
