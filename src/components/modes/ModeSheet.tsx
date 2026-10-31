import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { css } from 'react-native-reanimated';

import { Icon } from '../icons/Icon';
import { check } from '../icons/art/check';
import { fly } from '../icons/art/fly';
import { PressableScale } from '../ui/PressableScale';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Sticker } from '../stickers/Sticker';
import { markColour } from '../stickers/art/markColour';
import { markReversed } from '../stickers/art/markReversed';
import { isFlyModeAvailable } from '../../constants/features';
import { classicLayoutOf, type ClassicLayout } from '../../constants/presets';
import { t } from '../../i18n';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { useTheme } from '../../theme/useTheme';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';

/**
 * The mode sheet (Classic brief §6): the modes as stickers, Classic with its layout choice
 * (The Ring or Facing Pages, the additive `classicLayout` setting), and Fly where it can open.
 * Garden, Room and Pet join in Phase 4. A native form sheet: a swipe down closes it.
 * Its root is a ScrollView, which `react-native-screens` sizes to the whole sheet, so the page
 * colour reaches the sheet's bottom edge (build 48, F2; `src/navigation/sheetOptions.ts`), and the
 * sheet scrolls when the largest text sizes make it taller than the screen.
 */
export function ModeSheet() {
    const { tokens, isDark } = useTheme();
    const activeMode = useUiStore((s) => s.activeMode);
    const setActiveMode = useUiStore((s) => s.setActiveMode);
    const layout = useSettingsStore((s) => classicLayoutOf(s.settings));
    const updateSettings = useSettingsStore((s) => s.updateSettings);

    const choose = (mode: 'default' | 'fly') => {
        setActiveMode(mode);
        if (router.canGoBack()) router.back();
    };

    const row = (selected: boolean) => [
        styles.row,
        { backgroundColor: selected ? tokens.primarySoft : tokens.paper, borderColor: selected ? tokens.primaryInk : tokens.edge },
    ];

    return (
        <ScrollView style={{ backgroundColor: tokens.page }} contentContainerStyle={styles.sheet} bounces={false}>
            <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header">
                {t('modes.title')}
            </Text>

            <View style={row(activeMode !== 'fly')}>
                <PressableScale
                    onPress={() => choose('default')}
                    accessibilityState={{ selected: activeMode !== 'fly' }}
                    style={styles.rowHead}
                >
                    <Sticker art={isDark ? markReversed : markColour} width={44} />
                    <Text style={[styles.rowLabel, { color: tokens.ink }]}>{t('modes.classic')}</Text>
                    {activeMode !== 'fly' && <Icon glyph={check} size={22} color={tokens.primaryInk} />}
                </PressableScale>
                <Text style={[styles.caption, { color: tokens.inkSoft }]}>{t('modes.layout')}</Text>
                <SegmentedControl<ClassicLayout>
                    segments={[
                        { value: 'ring', label: t('modes.ring'), accessibilityLabel: t('modes.ring') },
                        { value: 'spread', label: t('modes.spread'), accessibilityLabel: t('modes.spread') },
                    ]}
                    value={layout}
                    onChange={(classicLayout) => updateSettings({ classicLayout })}
                />
            </View>

            {isFlyModeAvailable() && (
                <View style={row(activeMode === 'fly')}>
                    <PressableScale
                        onPress={() => choose('fly')}
                        accessibilityState={{ selected: activeMode === 'fly' }}
                        style={styles.rowHead}
                    >
                        {/* The tile stays visible on the selected row, which is primarySoft too (finish review fix 8c). */}
                        <View
                            style={[
                                styles.flyBadge,
                                activeMode === 'fly'
                                    ? { backgroundColor: tokens.paper, borderColor: tokens.edge }
                                    : { backgroundColor: tokens.primarySoft, borderColor: 'transparent' },
                            ]}
                        >
                            <Icon glyph={fly} size={26} color={tokens.primaryInk} />
                        </View>
                        <Text style={[styles.rowLabel, { color: tokens.ink }]}>{t('modes.fly')}</Text>
                        {activeMode === 'fly' && <Icon glyph={check} size={22} color={tokens.primaryInk} />}
                    </PressableScale>
                </View>
            )}
        </ScrollView>
    );
}

const styles = css.create({
    sheet: { padding: space.xl, gap: space.l },
    // The system face: Baloo 2 is the timer's alone (brief §7; finish review fix 8b).
    title: { fontSize: 22, fontWeight: '700' },
    row: { borderRadius: radius.m, borderWidth: edgeWidth, padding: space.m, gap: space.s },
    rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: minTarget },
    rowLabel: { fontSize: 17, fontWeight: '600', flex: 1 },
    caption: { fontSize: 13, fontWeight: '500' },
    flyBadge: { width: 44, height: 44, borderRadius: radius.m, borderWidth: edgeWidth, alignItems: 'center', justifyContent: 'center' },
});
