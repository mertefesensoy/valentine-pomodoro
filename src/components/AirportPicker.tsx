import React, { useMemo, useState } from 'react';
import {
    View, Text, Pressable, Modal, FlatList,
    StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { ValentineSpec } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export interface Airport {
    iata: string;
    name: string;
    city: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    /** 1 = large international, 2 = medium regional, 3 = small local */
    tier?: number;
}

// Fixed row height for FlatList.getItemLayout (enables O(1) scroll position calculation)
// = paddingVertical(14×2) + airportCity line(~20) + marginTop(2) + airportName line(~17) + border(1)
const ITEM_HEIGHT = 68;

interface AirportPickerProps {
    label: string;
    airports: Airport[];
    selected: Airport | null;
    onSelect: (airport: Airport) => void;
}

export default function AirportPicker({ label, airports, selected, onSelect }: AirportPickerProps) {
    const { colors, isDark } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Tier-sorted master list: large airports appear first, then medium, then small.
    // Computed once per `airports` prop change (not on every keystroke).
    const sortedAirports = useMemo(() => {
        return [...airports].sort((a, b) => (a.tier ?? 2) - (b.tier ?? 2));
    }, [airports]);

    const filteredAirports = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return sortedAirports;
        return sortedAirports.filter(a =>
            a.iata.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.country.toLowerCase().includes(q)
        );
    }, [sortedAirports, searchQuery]);

    const handleSelect = (airport: Airport) => {
        onSelect(airport);
        setSearchQuery('');
        setModalVisible(false);
    };

    return (
        <>
            <View style={styles.wrapper}>
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                <Pressable
                    style={[styles.button, {
                        backgroundColor: colors.card,
                        borderColor: `${ValentineSpec.accentPrimary}50`,
                    }]}
                    onPress={() => setModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${label} airport`}
                >
                    {selected ? (
                        <>
                            <Text style={styles.iata}>{selected.iata}</Text>
                            <Text style={[styles.city, { color: colors.text }]}>{selected.city}</Text>
                        </>
                    ) : (
                        <Text style={[styles.placeholder, { color: `${colors.text}70` }]}>Select airport</Text>
                    )}
                    <Text style={styles.chevron}>›</Text>
                </Pressable>
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    <View style={[styles.modalHeader, {
                        backgroundColor: isDark ? colors.card : ValentineSpec.backgroundSecondary,
                        borderBottomColor: `${ValentineSpec.accentPrimary}30`,
                    }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select {label}</Text>
                        <Pressable onPress={() => { setSearchQuery(''); setModalVisible(false); }} style={styles.closeButton}>
                            <Text style={styles.closeText}>Done</Text>
                        </Pressable>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                        <TextInput
                            style={[styles.searchInput, {
                                backgroundColor: isDark
                                    ? colors.inputBg
                                    : `${ValentineSpec.backgroundSecondary}50`,
                                color: colors.text,
                                borderColor: `${ValentineSpec.accentPrimary}30`,
                            }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search airports…"
                            placeholderTextColor={`${colors.text}60`}
                            autoCorrect={false}
                            clearButtonMode="while-editing"
                        />
                    </View>

                    <FlatList
                        data={filteredAirports}
                        keyExtractor={(item) => item.iata}
                        contentContainerStyle={styles.list}
                        // O(1) scroll position — critical for 9,000+ items
                        getItemLayout={(_data, index) => ({
                            length: ITEM_HEIGHT,
                            offset: ITEM_HEIGHT * index,
                            index,
                        })}
                        initialNumToRender={20}
                        maxToRenderPerBatch={25}
                        windowSize={5}
                        removeClippedSubviews
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        renderItem={({ item }) => {
                            const isSelected = selected?.iata === item.iata;
                            return (
                                <Pressable
                                    style={[
                                        styles.airportRow,
                                        { borderBottomColor: `${ValentineSpec.accentPrimary}20` },
                                        isSelected && styles.airportRowSelected,
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <View style={[styles.iataTag, item.tier === 2 && styles.iataTagTier2, item.tier === 3 && styles.iataTagTier3]}>
                                        <Text style={styles.iataTagText}>{item.iata}</Text>
                                    </View>
                                    <View style={styles.airportInfo}>
                                        <Text style={[styles.airportCity, { color: colors.text }]}>{item.city}, {item.country}</Text>
                                        <Text style={[styles.airportName, { color: `${colors.text}80` }]} numberOfLines={1}>{item.name}</Text>
                                    </View>
                                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                </Pressable>
                            );
                        }}
                    />
                </SafeAreaView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    // color supplied inline (dark mode adaptive)
    label: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    // backgroundColor + borderColor supplied inline (dark mode adaptive)
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1.5,
    },
    iata: {
        fontSize: 18,
        fontWeight: '800',
        color: ValentineSpec.accentPrimary,
        marginRight: 6,
    },
    // color supplied inline (dark mode adaptive)
    city: {
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
    },
    // color supplied inline (dark mode adaptive)
    placeholder: {
        fontSize: 14,
        flex: 1,
    },
    chevron: {
        fontSize: 20,
        color: ValentineSpec.accentPrimary,
        fontWeight: '300',
    },
    // Modal — backgroundColor supplied inline (dark mode adaptive)
    modalContainer: {
        flex: 1,
    },
    // backgroundColor + borderBottomColor supplied inline (dark mode adaptive)
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    // color supplied inline (dark mode adaptive)
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    closeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    closeText: {
        fontSize: 16,
        color: ValentineSpec.accentPrimary,
        fontWeight: '600',
    },
    // backgroundColor supplied inline (dark mode adaptive)
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: ValentineSpec.accentPrimary + '20',
    },
    // backgroundColor + color + borderColor supplied inline (dark mode adaptive)
    searchInput: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        fontSize: 15,
        borderWidth: 1,
    },
    list: {
        paddingVertical: 8,
    },
    // borderBottomColor supplied inline (dark mode adaptive)
    airportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    airportRowSelected: {
        backgroundColor: ValentineSpec.accentPrimary + '12',
    },
    iataTag: {
        backgroundColor: ValentineSpec.accentPrimary,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 14,
        minWidth: 52,
        alignItems: 'center',
    },
    iataTagText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    airportInfo: {
        flex: 1,
    },
    // color supplied inline (dark mode adaptive)
    airportCity: {
        fontSize: 15,
        fontWeight: '600',
    },
    // color supplied inline (dark mode adaptive)
    airportName: {
        fontSize: 12,
        marginTop: 2,
    },
    checkmark: {
        fontSize: 16,
        color: ValentineSpec.accentPrimary,
        fontWeight: '700',
    },
    // Tier-based IATA tag colour: tier 1 = full pink, tier 2 = muted, tier 3 = faint
    iataTagTier2: {
        backgroundColor: ValentineSpec.accentPrimary + 'AA',
    },
    iataTagTier3: {
        backgroundColor: ValentineSpec.accentPrimary + '66',
    },
});
