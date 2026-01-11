import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useApp } from '../context/AppContext';

type Metric = 'sessions' | 'minutes';

function parseLocalDateKey(dayKey: string) {
    // dayKey format: YYYY-MM-DD
    const [y, m, d] = dayKey.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1); // local time, avoids UTC parsing bugs
}

function formatNumber(n: number) {
    // Avoid "25.0"
    if (Number.isInteger(n)) return String(n);
    // keep 1 decimal for test configs like 0.1 min
    return n.toFixed(1).replace(/\.0$/, '');
}

export default function StatsScreen() {
    const { stats } = useApp();
    const { isReady, today, totals, last7Days } = stats;

    const [metric, setMetric] = useState<Metric>('minutes');

    if (!isReady) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.loadingText}>Loading stats…</Text>
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

    const maxValue = useMemo(() => {
        const values = last7Days.map(([, day]) =>
            metric === 'sessions' ? day.focusSessions : day.focusMinutes
        );
        return Math.max(...values, 1);
    }, [last7Days, metric]);

    const chartTitle = metric === 'sessions' ? 'Last 7 Days (Sessions)' : 'Last 7 Days (Minutes)';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.header}>Stats</Text>

                {/* Summary Cards */}
                <View style={styles.cardsRow}>
                    <View style={styles.card}>
                        <Text style={styles.cardValue}>{today.focusSessions}</Text>
                        <Text style={styles.cardLabel}>Today Sessions</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardValue}>{formatNumber(today.focusMinutes)}</Text>
                        <Text style={styles.cardLabel}>Today Minutes</Text>
                    </View>
                </View>

                <View style={styles.cardsRow}>
                    <View style={styles.card}>
                        <Text style={styles.cardValue}>{totals.focusSessions}</Text>
                        <Text style={styles.cardLabel}>All-Time Sessions</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardValue}>{formatNumber(totals.focusMinutes)}</Text>
                        <Text style={styles.cardLabel}>All-Time Minutes</Text>
                    </View>
                </View>

                {/* Last 7 Days Chart */}
                <View style={styles.chartContainer}>
                    <View style={styles.chartHeaderRow}>
                        <Text style={styles.chartTitle}>{chartTitle}</Text>

                        {/* Metric Toggle */}
                        <View style={styles.segment}>
                            <Pressable
                                onPress={() => setMetric('minutes')}
                                style={[styles.segmentItem, metric === 'minutes' && styles.segmentItemActive]}
                            >
                                <Text style={[styles.segmentText, metric === 'minutes' && styles.segmentTextActive]}>
                                    Minutes
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setMetric('sessions')}
                                style={[styles.segmentItem, metric === 'sessions' && styles.segmentItemActive]}
                            >
                                <Text style={[styles.segmentText, metric === 'sessions' && styles.segmentTextActive]}>
                                    Sessions
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Weekly rollups */}
                    <View style={styles.weekSummaryRow}>
                        <Text style={styles.weekSummaryText}>
                            This week: {weekTotals.focusSessions} sessions • {formatNumber(weekTotals.focusMinutes)} minutes
                        </Text>
                        <Text style={styles.weekSummarySubtext}>
                            Avg/day: {formatNumber(avgPerDay.focusMinutes)} min • {formatNumber(avgPerDay.focusSessions)} sessions
                        </Text>
                    </View>

                    {!hasStats ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No stats yet</Text>
                            <Text style={styles.emptySubtext}>Complete a focus session to see your progress.</Text>
                        </View>
                    ) : (
                        <View style={styles.chart}>
                            <View style={styles.bars}>
                                {last7Days.map(([dayKey, day], idx) => {
                                    const value = metric === 'sessions' ? day.focusSessions : day.focusMinutes;
                                    const height = (value / maxValue) * 120;

                                    const isToday = idx === last7Days.length - 1;
                                    const labelDate = parseLocalDateKey(dayKey);
                                    const weekday = labelDate.toLocaleDateString('en', { weekday: 'short' });

                                    return (
                                        <View key={dayKey} style={styles.barColumn}>
                                            <View style={styles.barContainer}>
                                                {value > 0 && (
                                                    <Text style={styles.barValue}>
                                                        {metric === 'sessions' ? value : formatNumber(value)}
                                                    </Text>
                                                )}
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        {
                                                            height: Math.max(height, 4),
                                                            backgroundColor: isToday ? '#E63946' : '#D4A5D9',
                                                        },
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.barLabel}>{weekday}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF8F0' },
    scrollContent: { padding: 16 },
    loadingText: { fontSize: 16, color: '#6B6B6B', textAlign: 'center', marginTop: 24 },

    header: { fontSize: 24, fontWeight: '600', color: '#2D2D2D', marginBottom: 24 },

    cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    card: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cardValue: { fontSize: 32, fontWeight: '700', color: '#E63946', marginBottom: 4 },
    cardLabel: { fontSize: 12, fontWeight: '500', color: '#6B6B6B', textAlign: 'center' },

    chartContainer: {
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },

    chartHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chartTitle: { fontSize: 16, fontWeight: '600', color: '#2D2D2D' },

    segment: {
        flexDirection: 'row',
        backgroundColor: '#FFE8EC',
        borderRadius: 999,
        padding: 2,
    },
    segmentItem: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    segmentItemActive: {
        backgroundColor: '#E63946',
    },
    segmentText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
    segmentTextActive: { color: '#FFF' },

    weekSummaryRow: { marginTop: 14, marginBottom: 10 },
    weekSummaryText: { fontSize: 13, fontWeight: '600', color: '#2D2D2D' },
    weekSummarySubtext: { fontSize: 12, color: '#6B6B6B', marginTop: 4 },

    emptyState: { paddingVertical: 40, alignItems: 'center' },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6B6B6B', marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: '#6B6B6B', textAlign: 'center' },

    chart: { height: 180, marginTop: 8 },
    bars: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
    },
    barColumn: { flex: 1, alignItems: 'center' },
    barContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
    barValue: { fontSize: 12, fontWeight: '600', color: '#2D2D2D', marginBottom: 4 },
    bar: { width: 24, borderRadius: 4 },
    barLabel: { fontSize: 10, color: '#6B6B6B', marginTop: 8 },
});
