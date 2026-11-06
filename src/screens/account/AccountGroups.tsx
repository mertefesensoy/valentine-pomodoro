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
import { deleteAccount, downloadMyData, unpairPartner, type ActionResult } from './accountActions';

const LOCALE = language === 'tr' ? 'tr-TR' : 'en-US';
const NAME_MAX = 60;

function problemLine(result: Exclude<ActionResult, 'ok'>): string {
    if (result === 'offline') return t('account.offline');
    if (result === 'session_ended') return t('account.sessionEnded');
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

    const name = home.data?.partner?.display_name ?? glanceName ?? t('pair.partner');
    const pairedAt = home.data?.couple?.paired_at;
    const date = pairedAt ? new Date(pairedAt).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) : null;

    const unpair = async () => {
        setProblem(null);
        const result = await unpairPartner();
        if (result === 'ok') return;
        const line = problemLine(result);
        setProblem(line);
        AccessibilityInfo.announceForAccessibility(line);
    };
    const askUnpair = () => {
        Alert.alert(t('account.unpairTitle', { name }), t('account.unpairMessage'), [
            { text: t('account.cancel'), style: 'cancel' },
            { text: t('account.unpair'), style: 'destructive', onPress: () => void unpair() },
        ]);
    };

    return (
        <ListGroup header={t('account.partnerHeader')} footer={problem ?? undefined}>
            <InfoRow label={name} value={date ? t('account.paired', { date }) : ''} />
            {/* Unpairing needs a session. Signing in again is the way back to it, from the row below. */}
            {sessionEnded ? null : <ButtonRow label={t('account.unpair')} onPress={askUnpair} destructive />}
        </ListGroup>
    );
}

/**
 * Your account, whenever there is one, including after unpairing: your name, how you sign in, your data, and deleting
 * it all. Deleting asks first in a native alert saying what goes and what stays, then Apple confirms. With a session
 * that has ended, every action would fail, so there's your name and the way to sign in again. Reached by `React.lazy`.
 */
export function AccountGroup() {
    const home = useHome();
    const sessionEnded = useAccountStore((s) => s.sessionEnded);
    const [problem, setProblem] = useState<string | null>(null);
    const name = home.data?.me?.display_name ?? '';

    const report = (result: ActionResult) => {
        if (result === 'ok') {
            setProblem(null);
            return;
        }
        const line = problemLine(result);
        setProblem(line);
        AccessibilityInfo.announceForAccessibility(line);
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
                        void saveName(next).then((result) => {
                            if (result === 'ok') setProblem(null);
                            else report(result === 'offline' ? 'offline' : 'failed');
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
        const result = await deleteAccount();
        // Once it's done this group is gone with the account, and Settings says so.
        if (result === 'cancelled' || result === 'ok') return;
        report(result);
    };
    const askDelete = () => {
        Alert.alert(t('account.deleteTitle'), t('account.deleteMessage'), [
            { text: t('account.cancel'), style: 'cancel' },
            { text: t('account.delete'), style: 'destructive', onPress: () => void remove() },
        ]);
    };

    if (sessionEnded) {
        return (
            <ListGroup header={t('account.header')} footer={t('account.sessionEndedFooter')}>
                <InfoRow label={t('account.name')} value={name} />
                <ButtonRow label={t('account.signInAgain')} onPress={() => router.push('/pair')} />
            </ListGroup>
        );
    }

    return (
        <ListGroup header={t('account.header')} footer={problem ?? undefined}>
            <InfoRow label={t('account.name')} value={name} onPress={rename} />
            <InfoRow label={t('account.signIn')} value={t('account.signInValue')} />
            <ButtonRow label={t('account.download')} onPress={() => void downloadMyData().then(report)} />
            <ButtonRow label={t('account.delete')} onPress={askDelete} destructive />
        </ListGroup>
    );
}
