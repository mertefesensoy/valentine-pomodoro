import { StyleSheet, Text, View } from 'react-native';

import { formatNumber, language, t } from '../../i18n';
import type { PartnerGlance } from '../../server/partnerGlance';
import type { ThemeTokens } from '../../theme/palette';
import { edgeWidth, radius, space } from '../../theme/layout';
import { minutesOf } from '../classic/PartnerStrip';
import { DashedCell, Stickers, dateOfKey, todayCellsPerRow } from '../stats/WeekStack';

const LOCALE = language === 'tr' ? 'tr-TR' : 'en-US';
const CELL = 40;
/** A session's length when they have none today to average from. */
const USUAL_SESSION_MIN = 25;

/**
 * How many dashed cells picture the way to their goal. Their session length isn't in the snapshot, so it's their
 * average today, or the usual 25 minutes. It's a picture of how far there is to go; the line carries the numbers.
 *   in : `sessions`, `minutes` and `goal` (minutes, or null with no goal).
 *   out: whole sessions still owed, at least 0. Pure.
 */
export function owedCells(sessions: number, minutes: number, goal: number | null): number {
    if (!goal || goal <= minutes) return 0;
    const average = sessions > 0 && minutes > 0 ? minutes / sessions : USUAL_SESSION_MIN;
    return Math.ceil((goal - minutes) / average);
}

/**
 * Their today, as a postcard in the paper of Stats' today, without its title, since the sheet names the person. It
 * draws from the summary alone, so it never waits on the network, and it carries its own date, so last known values
 * stay honest. Never a comparison, and nothing red.
 */
export function PartnerCard({ glance, width, tokens }: { glance: PartnerGlance; width: number; tokens: ThemeTokens }) {
    const today = glance.today;
    const paper = { backgroundColor: tokens.paper, borderColor: tokens.edge };
    if (!today || (today.sessions === 0 && today.focus_ms === 0)) {
        return (
            <View style={[styles.card, paper]}>
                <Text style={[styles.line, { color: tokens.ink }]}>{t('partner.nothingYet')}</Text>
            </View>
        );
    }

    const minutes = minutesOf(today.focus_ms);
    const goal = today.goal_minutes;
    const perRow = todayCellsPerRow(width, CELL);
    // One row of whole cells, as Stats' today: the stickers, with "+n" in the last cell once they pass the row, then
    // dashed cells for what's still owed, never wrapping a lone cell.
    const over = today.sessions > perRow;
    const shown = over ? perRow - 1 : today.sessions;
    const owed = today.goal_hit ? 0 : owedCells(today.sessions, minutes, goal);
    const dashed = Math.max(0, Math.min(owed, perRow - (over ? perRow : shown)));

    const date = dateOfKey(today.day_key).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    const lineParts = [
        t('stats.sessions', { count: today.sessions }),
        t('stats.minutesShort', { count: minutes, n: formatNumber(minutes) }),
    ];
    if (goal) lineParts.push(t('partner.goal', { n: formatNumber(goal) }));
    const line = lineParts.join(' · ');

    return (
        <View style={[styles.card, paper]} accessible accessibilityLabel={`${date}. ${line}`}>
            <Text style={[styles.date, { color: tokens.inkSoft }]}>{date}</Text>
            <View style={styles.row} testID="partner-cells">
                <Stickers count={today.sessions} size={CELL} max={shown} tokens={tokens} />
                {Array.from({ length: dashed }, (_, i) => (
                    <DashedCell key={i} size={CELL} tokens={tokens} />
                ))}
            </View>
            <Text style={[styles.line, { color: tokens.ink }]}>{line}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderWidth: edgeWidth, borderRadius: radius.l, paddingHorizontal: space.l, paddingVertical: space.m, gap: space.s },
    date: { fontSize: 13, fontWeight: '600' },
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s },
    line: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
});
