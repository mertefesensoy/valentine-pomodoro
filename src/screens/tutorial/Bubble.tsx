import type { ComponentRef, ReactNode, Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Icon } from '../../components/icons/Icon';
import { sound } from '../../components/icons/art/sound';
import { soundOff } from '../../components/icons/art/soundOff';
import { PressableScale } from '../../components/ui/PressableScale';
import { t } from '../../i18n';
import type { ThemeTokens } from '../../theme/palette';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';

type Props = {
    tokens: ThemeTokens;
    name: string;
    /** The line as characters, and how many show (the write-on). */
    chars: readonly string[];
    shown: number;
    /** A tap on the line finishes it at once (brief §6). */
    onTapLine: () => void;
    /** Next (or Done, on a replay's last beat); absent on the invitation, which ends on Start focus. */
    next: { label: string; onPress: () => void } | null;
    /** Skip tour, or Not now on the invitation (T-3). */
    exit: { label: string; onPress: () => void };
    muted: boolean;
    onMute: () => void;
    /** The tail's x, under the speaker; null for the AX panel, which has none. */
    tailX: number | null;
    /** The AX panel (T-2): the badge beside the name, the line scrolling, the actions pinned. */
    panel: { maxLineHeight: number; badge: ReactNode } | null;
    lineRef?: Ref<ComponentRef<typeof View>>;
    onLayout?: (e: LayoutChangeEvent) => void;
};

/**
 * The speaker's bubble (the direction contract's OWN-WORLD): a `paper` field, radius 22, the crisp
 * `edge` stroke and no shadow (only stickers lift), the line in the system face at body size, and
 * a tail to whoever is speaking.
 *
 * - The line writes on: the rest of it is laid out but clear, so the bubble never grows as it
 *   writes, and Turkish's longer lines wrap from the first frame.
 * - VoiceOver (T-1): the line is one element, "Pomo: …", then Next, then Skip tour, then the mute.
 *   The tree runs in that order; the row draws them mute, Skip tour, then Next on the right.
 * - The text is never capped (T-2): at AX sizes the layer gives it the bottom panel instead.
 */
export function Bubble({ tokens, name, chars, shown, onTapLine, next, exit, muted, onMute, tailX, panel, lineRef, onLayout }: Props) {
    const line = chars.join('');
    const text = (
        <Text style={[styles.line, { color: tokens.ink }]}>
            {chars.slice(0, shown).join('')}
            <Text style={styles.clear}>{chars.slice(shown).join('')}</Text>
        </Text>
    );
    return (
        <View style={[styles.bubble, panel && styles.panel, { backgroundColor: tokens.paper, borderColor: tokens.edge }]} onLayout={onLayout}>
            <Pressable
                ref={lineRef}
                onPress={onTapLine}
                accessible
                accessibilityRole="text"
                accessibilityLabel={t('tour.says', { name, line })}
                style={styles.lineBlock}
            >
                <View style={styles.nameRow}>
                    {panel?.badge}
                    <Text style={[styles.name, { color: tokens.primaryInk }]}>{name}</Text>
                </View>
                {panel ? (
                    <ScrollView style={{ maxHeight: panel.maxLineHeight }} showsVerticalScrollIndicator>
                        {text}
                    </ScrollView>
                ) : (
                    text
                )}
            </Pressable>
            <View style={styles.actions}>
                {next && (
                    <PressableScale onPress={next.onPress} style={[styles.next, { backgroundColor: tokens.primary }]} testID="tour-next">
                        <Text style={[styles.nextLabel, { color: tokens.onPrimary }]}>{next.label}</Text>
                    </PressableScale>
                )}
                <View style={styles.spacer} />
                <View style={styles.quiet}>
                    <PressableScale onPress={exit.onPress} haptic={false} style={styles.exit} testID="tour-exit">
                        <Text style={[styles.exitLabel, { color: tokens.ink }]}>{exit.label}</Text>
                    </PressableScale>
                    <PressableScale
                        onPress={onMute}
                        accessibilityLabel={t(muted ? 'tour.unmute' : 'tour.mute')}
                        style={styles.mute}
                        testID="tour-mute"
                    >
                        <Icon glyph={muted ? soundOff : sound} size={22} color={tokens.inkSoft} />
                    </PressableScale>
                </View>
            </View>
            {tailX !== null && (
                <View
                    pointerEvents="none"
                    style={[styles.tail, { left: tailX - TAIL / 2, backgroundColor: tokens.paper, borderColor: tokens.edge }]}
                />
            )}
        </View>
    );
}

const TAIL = 16;

const styles = StyleSheet.create({
    bubble: {
        borderRadius: radius.l,
        borderWidth: edgeWidth,
        paddingHorizontal: space.l,
        paddingTop: space.m,
        paddingBottom: space.s,
        gap: space.xs,
    },
    panel: { paddingTop: space.l },
    lineBlock: { gap: space.xs },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
    name: { fontSize: 13, fontWeight: '600' },
    line: { fontSize: 17, lineHeight: 23 },
    clear: { color: 'transparent' },
    // The tree runs Next, Skip tour, mute (VoiceOver's order); row-reverse draws them the other way round.
    actions: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', minHeight: minTarget },
    spacer: { flex: 1 },
    quiet: { flexDirection: 'row-reverse', alignItems: 'center' },
    next: {
        minHeight: minTarget,
        borderRadius: radius.pill,
        paddingHorizontal: space.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextLabel: { fontSize: 16, fontWeight: '600' },
    exit: { minHeight: minTarget, justifyContent: 'center', paddingHorizontal: space.s },
    exitLabel: { fontSize: 15, fontWeight: '600' },
    mute: { width: minTarget, height: minTarget, alignItems: 'center', justifyContent: 'center' },
    // A paper square turned 45°, its two outer sides edged: it covers the bubble's edge where it joins.
    tail: {
        position: 'absolute',
        bottom: -TAIL / 2 - 1,
        width: TAIL,
        height: TAIL,
        borderRightWidth: edgeWidth,
        borderBottomWidth: edgeWidth,
        transform: [{ rotate: '45deg' }],
    },
});
