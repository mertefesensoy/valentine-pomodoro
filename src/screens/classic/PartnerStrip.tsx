import { StyleSheet, Text, View } from 'react-native';

import { Sticker } from '../../components/stickers/Sticker';
import { doroCelebrating } from '../../components/stickers/art/doroCelebrating';
import { doroIdle } from '../../components/stickers/art/doroIdle';
import { pomoCelebrating } from '../../components/stickers/art/pomoCelebrating';
import { PressableScale } from '../../components/ui/PressableScale';
import { formatNumber, t } from '../../i18n';
import { isGlanceStale, type PartnerGlance } from '../../server/partnerGlance';
import type { ThemeTokens } from '../../theme/palette';
import { edgeWidth, radius, space } from '../../theme/layout';

const DAY_STICKER = 22;
const MAX_STICKERS = 3;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function partnerName(glance: PartnerGlance): string {
    return glance.name ?? t('pair.partner');
}

export const minutesOf = (focusMs: number) => Math.round(focusMs / MINUTE_MS);

/**
 * "Updated 12 minutes ago", in whole units.
 *   in : `iso`, when their day was last reported; `now`, for tests.
 *   out: the line, or null with no report yet. A phone whose clock runs behind reads "just now". Pure.
 */
export function updatedText(iso: string | null, now: number = Date.now()): string | null {
    if (!iso) return null;
    const ago = now - new Date(iso).getTime();
    if (ago < MINUTE_MS) return t('partner.updatedNow');
    if (ago < HOUR_MS) return t('partner.updatedMinutes', { count: Math.floor(ago / MINUTE_MS) });
    if (ago < DAY_MS) return t('partner.updatedHours', { count: Math.floor(ago / HOUR_MS) });
    return t('partner.updatedDays', { count: Math.floor(ago / DAY_MS) });
}

type DayParts = { kind: 'day'; sessions: number; minutes: number } | { kind: 'stale'; line: string } | { kind: 'nothing' };

/** What the strip can honestly say about their day right now. Reads the clock; otherwise pure. */
function dayParts(glance: PartnerGlance, now: number = Date.now()): DayParts {
    const updated = updatedText(glance.updatedAt, now);
    if (isGlanceStale(glance, now) && updated) return { kind: 'stale', line: updated };
    const today = glance.today;
    if (!today || (today.sessions === 0 && today.focus_ms === 0)) return { kind: 'nothing' };
    return { kind: 'day', sessions: today.sessions, minutes: minutesOf(today.focus_ms) };
}

/** "Deniz, 3 sessions, 75 minutes today", what VoiceOver reads for the strip. */
export function partnerLabel(glance: PartnerGlance, now?: number): string {
    const name = partnerName(glance);
    const parts = dayParts(glance, now);
    if (parts.kind === 'stale') return t('partner.a11yStale', { name, updated: parts.line });
    if (parts.kind === 'nothing') return t('partner.a11yNothing', { name });
    return t('partner.a11yDay', {
        name,
        sessions: t('stats.sessions', { count: parts.sessions }),
        minutes: t('stats.minutes', { count: parts.minutes }),
    });
}

/**
 * Their day in a line: up to three stickers, then "+n", and "75 min today". Past this phone's midnight with no
 * refresh, when it was updated instead. No motion: the values just change when a refresh lands.
 */
export function PartnerDay({ glance, tokens, centered = false }: { glance: PartnerGlance; tokens: ThemeTokens; centered?: boolean }) {
    const parts = dayParts(glance);
    if (parts.kind !== 'day') {
        const line = parts.kind === 'stale' ? parts.line : t('partner.nothingYet');
        return <Text style={[styles.day, centered && styles.centeredText, { color: tokens.inkSoft }]}>{line}</Text>;
    }
    const shown = Math.min(parts.sessions, MAX_STICKERS);
    return (
        <View style={[styles.dayRow, centered && styles.centeredRow]}>
            {shown > 0 && (
                <View style={styles.stickers} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {Array.from({ length: shown }, (_, i) => (
                        <Sticker key={i} art={i % 2 ? doroCelebrating : pomoCelebrating} width={DAY_STICKER} shadow={tokens.stickerShadow} />
                    ))}
                    {parts.sessions > MAX_STICKERS && (
                        <View style={[styles.more, { backgroundColor: tokens.primarySoft }]}>
                            <Text style={[styles.moreText, { color: tokens.primaryInk }]} maxFontSizeMultiplier={1.3}>
                                {t('today.more', { count: parts.sessions - MAX_STICKERS })}
                            </Text>
                        </View>
                    )}
                </View>
            )}
            <Text style={[styles.day, { color: tokens.inkSoft }]}>
                {t('partner.minToday', { count: parts.minutes, n: formatNumber(parts.minutes) })}
            </Text>
        </View>
    );
}

/** A quiet line under the strip's content, for a partner who's gone or a session that has ended. */
export function PartnerNotice({ text, tokens, centered = false }: { text: string; tokens: ThemeTokens; centered?: boolean }) {
    return <Text style={[styles.notice, centered && styles.centeredText, { color: tokens.inkSoft }]}>{text}</Text>;
}

/**
 * The strip once you're paired (Phase 2 D2; the brief is `.impeccable/surfaces/app-partner-tsx.md`). It keeps the
 * solo strip's size and place, so nothing moves when you pair: one sticker, their name, and their day. The whole
 * strip is one button, which opens their day, or Apple's button when `notice` says a session has ended.
 */
export function PartnerStrip({ glance, notice, hint, onPress, tokens }: {
    glance: PartnerGlance;
    notice: string | null;
    /** What pressing it does, when it's their day. */
    hint?: string;
    onPress: () => void;
    tokens: ThemeTokens;
}) {
    return (
        <PressableScale
            onPress={onPress}
            haptic={false}
            accessibilityRole="button"
            accessibilityLabel={notice ? `${partnerLabel(glance)}. ${notice}` : partnerLabel(glance)}
            accessibilityHint={hint}
            style={[styles.strip, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}
        >
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Sticker art={doroIdle} width={44} shadow={tokens.stickerShadow} />
            </View>
            <View style={styles.text}>
                <Text style={[styles.name, { color: tokens.ink }]} numberOfLines={2}>
                    {partnerName(glance)}
                </Text>
                <PartnerDay glance={glance} tokens={tokens} />
                {notice && <PartnerNotice text={notice} tokens={tokens} />}
            </View>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    strip: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.m,
        minHeight: 72,
        paddingVertical: space.m,
        paddingHorizontal: space.l,
        borderRadius: radius.l,
        borderWidth: edgeWidth,
    },
    text: { flex: 1, gap: space.xs / 2 },
    name: { fontSize: 17, fontWeight: '600' },
    dayRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s },
    centeredRow: { justifyContent: 'center' },
    centeredText: { textAlign: 'center' },
    stickers: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    day: { fontSize: 14, lineHeight: 19 },
    more: { borderRadius: radius.s, paddingHorizontal: space.xs, paddingVertical: 1 },
    moreText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
    notice: { fontSize: 13, lineHeight: 18, marginTop: space.xs / 2 },
});
