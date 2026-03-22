import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppMode } from '../types';
import { useTheme } from '../theme/useTheme';

interface ModeSwitcherProps {
    activeMode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const MODES: { key: AppMode; label: string }[] = [
    { key: 'default', label: '⏱ Default' },
    { key: 'fly', label: '✈️ Fly' },
];

export default function ModeSwitcher({ activeMode, onModeChange }: ModeSwitcherProps) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.surfaceTint }]}>
            {MODES.map((mode) => {
                const isActive = activeMode === mode.key;
                return (
                    <Pressable
                        key={mode.key}
                        onPress={() => onModeChange(mode.key)}
                        style={[
                            styles.segment,
                            isActive && { backgroundColor: colors.accent },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={`Switch to ${mode.key} mode`}
                    >
                        <Text style={[
                            styles.label,
                            { color: isActive ? '#FFFFFF' : colors.textMuted },
                            isActive && styles.activeLabel,
                        ]}>
                            {mode.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 24,
        padding: 3,
        alignSelf: 'center',
        marginBottom: 12,
    },
    segment: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 21,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    activeLabel: {
        fontWeight: '700',
    },
});
