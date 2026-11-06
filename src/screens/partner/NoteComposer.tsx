import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActionSheetIOS, ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePreventRemove } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { PressableScale } from '../../components/ui/PressableScale';
import { t } from '../../i18n';
import { NOTE_MAX_LENGTH } from '../../stores/notesStore';
import { useTheme } from '../../theme/useTheme';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';
import { ANNOUNCE_AT, COUNTDOWN_FROM, capText } from '../notes/NoteEditor';
import { sendNote } from './notes';

const PROBLEM: Record<string, string> = {
    rate_limited: 'partner.noteTooMany',
    offline: 'partner.noteOffline',
    failed: 'partner.noteFailed',
};

/**
 * Writing a note to your partner, swapped into their sheet in place (Phase 2 D3; HIG `sheets.md`: one sheet at a time).
 * The Notes editor's limit and countdown, and a swipe with text in it asks first. What's written stays on screen until
 * it's sent, whatever goes wrong.
 *
 *   in : `name`, for the field's label; `onCancel`, `onSent`; `onGone`, when the server says you're no longer paired.
 */
export function NoteComposer({ name, onCancel, onSent, onGone }: {
    name: string;
    onCancel: () => void;
    onSent: () => void;
    onGone: () => void;
}) {
    const { tokens } = useTheme();
    const [text, setText] = useState('');
    // One per note, kept across retries, so a retry after a lost answer can't send twice.
    const [clientId] = useState(() => Crypto.randomUUID());
    const [sending, setSending] = useState(false);
    const [problem, setProblem] = useState<string | null>(null);
    const left = NOTE_MAX_LENGTH - text.length;
    const body = text.trim();
    const canSend = body.length > 0;

    const announced = useRef<number | null>(null);
    useEffect(() => {
        const mark = ANNOUNCE_AT.find((m) => left <= m && (announced.current === null || m < announced.current));
        if (mark === undefined) return;
        announced.current = mark;
        AccessibilityInfo.announceForAccessibility(t('notesScreen.editor.left', { count: Math.max(left, 0) }));
    }, [left]);

    // As in the Notes editor: leaving on purpose lets the blocked removal through, and turns the hook's flag off in the
    // same handler, since `canSend` is stale until the next render.
    const leaving = useRef(false);
    const [exiting, setExiting] = useState(false);
    const leave = () => {
        leaving.current = true;
        setExiting(true);
    };
    const askDiscard = (discard: () => void) => {
        const options = [t('notesScreen.editor.discard'), t('notesScreen.editor.keep')];
        ActionSheetIOS.showActionSheetWithOptions(
            { title: t('notesScreen.editor.discardTitle'), options, destructiveButtonIndex: 0, cancelButtonIndex: 1 },
            (choice) => {
                if (choice === 0) discard();
            },
        );
    };
    usePreventRemove(canSend && !exiting, ({ repeat }) => {
        if (leaving.current) return repeat();
        askDiscard(() => {
            leave();
            repeat();
        });
    });

    const cancel = () => {
        if (!canSend) return onCancel();
        askDiscard(() => {
            leave();
            onCancel();
        });
    };

    const send = async () => {
        if (!canSend || sending) return;
        setSending(true);
        setProblem(null);
        const result = await sendNote(clientId, body);
        setSending(false);
        if (result === 'ok') {
            leave();
            onSent();
            return;
        }
        if (result === 'not_paired') {
            leave();
            onGone();
            return;
        }
        const line = t(PROBLEM[result]);
        setProblem(line);
        AccessibilityInfo.announceForAccessibility(line);
    };

    return (
        <View style={styles.column}>
            {/* A text input's boundary identifies a control: `edgeStrong`, 3:1 (palette.json). */}
            <View style={[styles.field, { backgroundColor: tokens.paper, borderColor: tokens.edgeStrong }]}>
                <TextInput
                    value={text}
                    onChangeText={(v) => setText(capText(v, NOTE_MAX_LENGTH))}
                    placeholder={t('partner.notePlaceholder')}
                    placeholderTextColor={tokens.inkSoft}
                    multiline
                    autoFocus
                    style={[styles.input, { color: tokens.ink }]}
                    selectionColor={tokens.primaryInk}
                    accessibilityLabel={t('partner.noteField', { name })}
                />
            </View>
            {left <= COUNTDOWN_FROM && (
                <Text style={[styles.counter, { color: left <= 0 ? tokens.primaryInk : tokens.inkSoft }]}>
                    {t('notesScreen.editor.left', { count: Math.max(left, 0) })}
                </Text>
            )}
            {problem && <Text style={[styles.problem, { color: tokens.ink }]}>{problem}</Text>}
            <PressableScale
                onPress={send}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSend, busy: sending }}
                style={[styles.pill, { backgroundColor: tokens.primary, opacity: canSend ? 1 : 0.5 }]}
            >
                {sending ? (
                    <ActivityIndicator color={tokens.onPrimary} />
                ) : (
                    <Text style={[styles.pillLabel, { color: tokens.onPrimary }]} maxFontSizeMultiplier={1.6}>
                        {t('partner.send')}
                    </Text>
                )}
            </PressableScale>
            <PressableScale onPress={cancel} haptic={false} accessibilityRole="button" style={styles.link}>
                <Text style={[styles.linkLabel, { color: tokens.primaryInk }]} maxFontSizeMultiplier={1.6}>
                    {t('notesScreen.editor.cancel')}
                </Text>
            </PressableScale>
        </View>
    );
}

const styles = StyleSheet.create({
    column: { gap: space.m },
    field: { borderRadius: radius.m, borderWidth: edgeWidth, padding: space.m },
    input: { fontSize: 17, lineHeight: 24, minHeight: 120, textAlignVertical: 'top' },
    counter: { fontSize: 13, paddingHorizontal: space.xs, textAlign: 'right', fontVariant: ['tabular-nums'] },
    problem: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
    pill: { minHeight: 56, alignSelf: 'stretch', borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
    pillLabel: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
    link: { minHeight: minTarget, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
    linkLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
