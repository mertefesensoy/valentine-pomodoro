import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function StatsScreen() {
    const { stats } = useApp();
    const { isReady, today, totals, last7Days } = stats;

    if (!isReady) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.loadingText}>Loading stats…</Text>
            </SafeAreaView>
        );
    }

    const hasStats = totals.focusSessions > 0;
    const maxSessions = Math.max(...last7Days.map(([_, day]) => day.focusSessions), 1);

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
                        <Text style={styles.cardValue}>{today.focusMinutes}</Text>
                        <Text style={styles.cardLabel}>Today Minutes</Text>
                    </View>
                </View>

                <View style={styles.cardsRow}>
                    <View style={styles.card}>
                        <Text style={styles.cardValue}>{totals.focusSessions}</Text>
                        <Text style={styles.cardLabel}>All-Time Sessions</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardValue}>{totals.focusMinutes}</Text>
                        <Text style={styles.cardLabel}>All-Time Minutes</Text>
                    </View>
                </View>

                {/* Last 7 Days Chart */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Last 7 Days (Sessions)</Text>

                    {!hasStats ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No stats yet</Text>
                            <Text style={styles.emptySubtext}>Complete a focus session to see your progress!</Text>
                        </View>
                    ) : (
                        <View style={styles.chart}>
                            <View style={styles.bars}>
                                {last7Days.map(([dayKey, day]) => {
                                    const height = maxSessions === 0 ? 0 : (day.focusSessions / maxSessions) * 120;
                                    const isToday = dayKey === last7Days[last7Days.length - 1][0];

                                    return (
                                        <View key={dayKey} style={styles.barColumn}>
                                            <View style={styles.barContainer}>
                                                {day.focusSessions > 0 && (
                                                    <Text style={styles.barValue}>{day.focusSessions}</Text>
                                                )}
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        {
                                                            height: Math.max(height, 4), // Minimum height for visibility
                                                            backgroundColor: isToday ? '#E63946' : '#D4A5D9',
                                                        },
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.barLabel}>
                                                {new Date(dayKey).toLocaleDateString('en', { weekday: 'short' })}
                                            </Text>
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
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0',
    },
    scrollContent: {
        padding: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B6B6B',
        textAlign: 'center',
        marginTop: 24,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 24,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    card: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cardValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#E63946',
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B6B6B',
        textAlign: 'center',
    },
    chartContainer: {
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 20,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B6B6B',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B6B6B',
        textAlign: 'center',
    },
    chart: {
        height: 180,
    },
    bars: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
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
        color: '#2D2D2D',
        marginBottom: 4,
    },
    bar: {
        width: 24,
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 10,
        color: '#6B6B6B',
        marginTop: 8,
    },
});
