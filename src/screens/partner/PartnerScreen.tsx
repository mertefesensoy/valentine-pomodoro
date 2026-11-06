import { useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '../../components/icons/Icon';
import { close as closeGlyph } from '../../components/icons/art/close';
import { PressableScale } from '../../components/ui/PressableScale';
import { t } from '../../i18n';
import { useAccountStore } from '../../server/account';
import { takePartnerNote, usePartnerGlance } from '../../server/partnerGlance';
import { useLoveNoteSheet } from '../../stores/loveNoteSheetStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTheme } from '../../theme/useTheme';
import { useWindowInsets } from '../../hooks/useWindowInsets';
import { minTarget, space } from '../../theme/layout';
import { partnerName, updatedText } from '../classic/PartnerStrip';
import { useTourMoveOnClose } from '../tutorial/useTour';
import { ButtonRow, ListGroup } from '../../components/settings/SettingsList';
import { NoteComposer } from './NoteComposer';
import { PartnerCard } from './PartnerCard';

/** Before the card has measured itself, a guess that's right for a phone and close for an iPad's sheet. */
const MAX_SHEET_WIDTH = 500;

/**
 * Your partner's day (Phase 2 D2; the brief and contract are `.impeccable/surfaces/app-partner-tsx.md`). A form sheet
 * sized to its content: their name, today's postcard, and when it was last updated. It reads the same small summary
 * as the strip, so it opens at once with the last known values, whatever the network is doing: no spinner, and no
 * fetch of its own, since refreshes stay on the first frame and on returning to the app. Reached by `React.lazy` only.
 */
export default function PartnerScreen() {
    const { tokens } = useTheme();
    useTourMoveOnClose();
    const { width, fontScale } = useWindowDimensions();
    const insets = useWindowInsets();
    const leftGutter = Math.max(insets.left, space.l);
    const rightGutter = Math.max(insets.right, space.l);
    // An iPad's form sheet is far narrower than its window, so the card plans from what it measures.
    const [cardWidth, setCardWidth] = useState(Math.min(width, MAX_SHEET_WIDTH) - leftGutter - rightGutter);
    const glance = usePartnerGlance((s) => s.glance);
    const noteWaiting = usePartnerGlance((s) => s.notes.length > 0);
    const showLoveNotes = useSettingsStore((s) => s.settings.showLoveNotes);
    const sessionEnded = useAccountStore((s) => s.sessionEnded);
    const [writing, setWriting] = useState(false);
    const [sent, setSent] = useState(false);

    const leave = () => {
        if (router.canGoBack()) router.back();
    };

    // A refresh can find they've gone while this is open. There's nothing left to show, and the strip says why.
    useEffect(() => {
        if (!glance && router.canGoBack()) router.back();
    }, [glance]);

    if (!glance) return null;
    const updated = updatedText(glance.updatedAt);
    const nameInSentence = glance.name ?? t('pair.partnerFallback');

    // With Show love notes off, a note waits here instead of appearing by itself (the owner: "It waits on their card",
    // as the frame draws it). The sheet closes first, since one sheet shows at a time (HIG `sheets.md`).
    const openWaitingNote = () => {
        // A second tap before the sheet has gone would take the next note, and overwrite this one unseen.
        if (useLoveNoteSheet.getState().note !== null) return;
        const note = takePartnerNote();
        if (!note) return;
        useLoveNoteSheet.getState().open(note.body, nameInSentence);
        router.replace('/love-note');
    };
    const waitingRow = noteWaiting && !showLoveNotes ? (
        <ButtonRow label={t('partner.noteWaiting', { name: nameInSentence })} onPress={openWaitingNote} />
    ) : null;
    // With a session that has ended it could only fail, and this sheet can still be opened then, during a focus.
    const writeRow = sessionEnded ? null : (
        <ButtonRow
            label={t('partner.write', { name: nameInSentence })}
            onPress={() => {
                setSent(false);
                setWriting(true);
            }}
        />
    );
    const actionsFooter = sent ? t('partner.noteSent', { name: nameInSentence }) : writeRow ? t('partner.noteFooter') : undefined;

    return (
        // The library sizes a sheet's root scroll view to the whole sheet, so the sheet's paint reaches its bottom edge.
        <ScrollView style={{ backgroundColor: tokens.page }} contentContainerStyle={[styles.content, { paddingLeft: leftGutter, paddingRight: rightGutter }]}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
        >
            <View style={styles.head}>
                <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header">
                    {partnerName(glance)}
                </Text>
                {/* PressableScale styles its inner view, so the corner is held out here, or its target would be empty. */}
                <View style={styles.closeCorner}>
                    <PressableScale
                        onPress={leave}
                        haptic={false}
                        accessibilityRole="button"
                        accessibilityLabel={t('pair.close')}
                        style={[styles.closeBtn, { backgroundColor: tokens.field }]}
                    >
                        <Icon glyph={closeGlyph} size={20} color={tokens.inkSoft} />
                    </PressableScale>
                </View>
            </View>
            {writing ? (
                // In place, with no second sheet (HIG `sheets.md`). The sheet follows its content's height.
                <NoteComposer
                    name={nameInSentence}
                    onCancel={() => setWriting(false)}
                    onSent={() => {
                        setWriting(false);
                        setSent(true);
                        AccessibilityInfo.announceForAccessibility(t('partner.noteSent', { name: nameInSentence }));
                    }}
                    onGone={() => setWriting(false)}
                />
            ) : (
                <>
                    <View onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
                        <PartnerCard glance={glance} width={cardWidth} fontScale={fontScale} tokens={tokens} />
                    </View>
                    {updated && <Text style={[styles.updated, { color: tokens.inkSoft }]}>{updated}</Text>}
                    {(waitingRow || writeRow) && (
                        <ListGroup footer={actionsFooter}>
                            {waitingRow}
                            {writeRow}
                        </ListGroup>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { paddingTop: space.m, paddingBottom: space.l, gap: space.m },
    head: { minHeight: minTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: minTarget },
    title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
    closeCorner: { position: 'absolute', right: 0, top: 4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    updated: { fontSize: 13, lineHeight: 18 },
});
