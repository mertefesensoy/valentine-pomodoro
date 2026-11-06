import { useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { router } from 'expo-router';

import { ButtonRow, InfoRow, ListGroup } from '../../components/settings/SettingsList';
import { language, t } from '../../i18n';
import { useAccountStore } from '../../server/account';
import { useHome } from '../../server/home';
import { usePartnerGlance } from '../../server/partnerGlance';
import { saveName } from '../pair/pairing';
import { capText } from '../notes/NoteEditor';
import { deleteAccount, downloadMyData, unpairPartner, type DeleteResult } from './accountActions';

const LOCALE = language === 'tr' ? 'tr-TR' : 'en-US';
const NAME_MAX = 60;

const speak = (line: string) => AccessibilityInfo.announceForAccessibility(line);

function problemLine(result: Exclude<DeleteResult, 'ok' | 'cancelled'>): string {
    if (result === 'offline') return t('account.offline');
    if (result === 'session_ended') return t('account.sessionEnded');
    if (result === 'apple_failed') return t('account.appleFailed');
    return t('account.failed');
}

/**
 * Your partner, once paired (Phase 2 D4; the Settings brief's Phase 2 addition): their name, when you paired, and
 * Unpair, which asks first in a native alert that names what happens. Reached by `React.lazy` only.
 */
export function PartnerGroup() {
    const home = useHome();
    const glanceName = usePartnerGlance((s) => s.glance?.name ?? null);
    const sessionEnded = useAccountStore((s) => s.sessionEnded);
    const [problem, setProblem] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const known = home.data?.partner?.display_name ?? glanceName;
    const pairedAt = home.data?.couple?.paired_at;
    const date = pairedAt ? new Date(pairedAt).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) : null;

    const unpair = async () => {
        setProblem(null);
        setBusy(true);
        const result = await unpairPartner();
        setBusy(false);
        if (result === 'ok') {
            speak(t('account.unpaired'));
            return;
        }
        const line = problemLine(result);
        setProblem(line);
        speak(line);
    };
    const askUnpair = () => {
        Alert.alert(t('account.unpairTitle', { name: known ?? t('pair.partnerFallback') }), t('account.unpairMessage'), [
            { text: t('account.cancel'), style: 'cancel' },
            { text: t('account.unpair'), style: 'destructive', onPress: () => void unpair() },
        ]);
    };

    return (
        <ListGroup header={t('account.partnerHeader')} footer={problem ?? undefined}>
            <InfoRow label={known ?? t('pair.partner')} value={date ? t('account.paired', { date }) : ''} />
            {/* Unpairing needs a session. Signing in again is the way back to it, in the Account group below. */}
            {sessionEnded ? null : <ButtonRow label={t('account.unpair')} onPress={askUnpair} destructive disabled={busy} />}
        </ListGroup>
    );
}

/** Apple's button, with the words for someone coming back to their account, whatever they came for. */
const signInAgain = () => router.push({ pathname: '/pair', params: { returning: '1' } });

/**
 * Your account, whenever there is one, including after unpairing: your name, how you sign in, your data, and deleting
 * it all. Deleting asks first in a native alert saying what goes and what stays, then Apple confirms. With a session
 * that has ended, every action needs signing in first, so that's what these rows do. Reached by `React.lazy` only.
 */
export function AccountGroup() {
    const home = useHome();
    const sessionEnded = useAccountStore((s) => s.sessionEnded);
    const paired = usePartnerGlance((s) => s.glance !== null);
    const [problem, setProblem] = useState<string | null>(null);
    const [busy, setBusy] = useState<'asking' | 'delete' | 'download' | 'rename' | null>(null);
    const me = home.data?.me;
    const name = me?.display_name ?? '';
    // Only when it's known there's none: on a cold start with no cache, it simply isn't known yet.
    const nameValue = me && !me.display_name ? t('account.addName') : name;

    const fail = (result: Exclude<DeleteResult, 'ok' | 'cancelled'>) => {
        const line = problemLine(result);
        setProblem(line);
        speak(line);
    };

    const rename = () => {
        Alert.prompt(
            t('account.nameTitle'),
            t('account.nameMessage'),
            [
                { text: t('account.cancel'), style: 'cancel' },
                {
                    text: t('account.save'),
                    onPress: (value?: string) => {
                        const next = capText((value ?? '').trim(), NAME_MAX);
                        if (!next) return;
                        setBusy('rename');
                        setProblem(null);
                        void saveName(next).then((result) => {
                            setBusy(null);
                            if (result !== 'ok') fail(result === 'offline' ? 'offline' : 'failed');
                        });
                    },
                },
            ],
            'plain-text',
            name,
        );
    };

    const remove = async () => {
        setProblem(null);
        setBusy('asking');
        const result = await deleteAccount(() => {
            setBusy('delete');
            speak(t('account.deleting'));
        });
        setBusy(null);
        if (result === 'cancelled') return;
        // Settings says so too, at the top of the list, since this group is about to go with the account.
        if (result === 'ok') speak(t('account.deleted'));
        else fail(result);
    };
    const askDelete = () => {
        Alert.alert(t('account.deleteTitle'), t(paired ? 'account.deleteMessage' : 'account.deleteMessageSolo'), [
            { text: t('account.cancel'), style: 'cancel' },
            { text: t('account.delete'), style: 'destructive', onPress: () => void remove() },
        ]);
    };

    const download = async () => {
        setProblem(null);
        setBusy('download');
        const result = await downloadMyData();
        setBusy(null);
        if (result !== 'ok') fail(result);
    };

    if (sessionEnded) {
        return (
            <ListGroup header={t('account.header')} footer={t('account.sessionEndedFooter')}>
                <InfoRow label={t('account.name')} value={name} />
                <ButtonRow label={t('account.signInAgain')} onPress={signInAgain} />
                <ButtonRow label={t('account.delete')} onPress={signInAgain} destructive />
            </ListGroup>
        );
    }

    return (
        <ListGroup header={t('account.header')} footer={busy === 'delete' ? t('account.deleting') : problem ?? undefined}>
            <InfoRow
                label={t('account.name')}
                value={nameValue}
                onPress={rename}
                hint={t('account.nameHint')}
                disabled={busy !== null}
            />
            <InfoRow label={t('account.signIn')} value={t('account.signInValue')} />
            <ButtonRow label={t('account.download')} onPress={() => void download()} disabled={busy !== null} />
            <ButtonRow label={t('account.delete')} onPress={askDelete} destructive disabled={busy !== null} />
        </ListGroup>
    );
}
