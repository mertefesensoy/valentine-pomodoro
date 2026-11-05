import { useEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useQuery } from '@tanstack/react-query';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '../../components/ui/PressableScale';
import { t } from '../../i18n';
import { useAccountStore } from '../../server/account';
import { fetchHome, HOME_KEY, homeClient } from '../../server/home';
import { useTheme } from '../../theme/useTheme';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';
import { ASPECT, DURATION, linePose } from '../welcome/choreography';
import { MorphArt, useMorphHaptic } from '../welcome/MorphStage';
import { CodeCells } from './CodeCells';
import {
    CODE_LENGTH,
    cleanCode,
    ensureCode,
    markCelebrated,
    newCode,
    previewCode,
    redeemCode,
    saveName,
    signIn,
    wasCelebrated,
    type ProblemStatus,
} from './pairing';
import { Spread } from './Spread';

const STORE_URL = 'https://apps.apple.com/app/id6757491918';
const STACK_FONT_SCALE = 1.6;
const POLL_MS = 10_000;

/** On this frame of the welcome's timeline the pair have landed on the open spread, in their joyful pose. */
export const MORPH_START_MS = 2100;
/** The spread bumps and the sparkles burst as the pair become its faces: the one haptic. */
const MORPH_HAPTIC_MS = 3080;

type Step = 'signin' | 'name' | 'pages' | 'confirm';
type CodeProblem = ProblemStatus | 'already_paired';

const problemText: Record<string, string> = {
    invalid: 'pair.error.invalid',
    expired: 'pair.error.expired',
    used: 'pair.error.used',
    own_code: 'pair.error.own',
    partner_paired: 'pair.error.partnerPaired',
    rate_limited: 'pair.error.rateLimited',
    offline: 'pair.error.offline',
    session_ended: 'pair.error.signIn',
    failed: 'pair.error.failed',
    already_paired: 'pair.error.failed',
};

const announce = (text: string) => AccessibilityInfo.announceForAccessibility(text);

function spelled(code: string): string {
    return [...code].join(', ');
}

function Pill({ label, onPress, disabled, busy }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
    const { tokens } = useTheme();
    return (
        <PressableScale
            onPress={disabled || busy ? () => {} : onPress}
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(busy) }}
            style={[styles.pill, { backgroundColor: tokens.primary, opacity: disabled ? 0.5 : 1 }]}
        >
            {busy ? (
                <ActivityIndicator color={tokens.onPrimary} />
            ) : (
                <Text style={[styles.pillLabel, { color: tokens.onPrimary }]} maxFontSizeMultiplier={1.6}>
                    {label}
                </Text>
            )}
        </PressableScale>
    );
}

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
    const { tokens } = useTheme();
    return (
        <PressableScale onPress={onPress} accessibilityRole="button" haptic={false} style={styles.link}>
            <Text style={[styles.linkLabel, { color: tokens.primaryInk }]} maxFontSizeMultiplier={1.6}>
                {label}
            </Text>
        </PressableScale>
    );
}

/**
 * Pairing (Phase 2 D1; the brief and contract are `.impeccable/surfaces/app-pair-tsx.md`). One form sheet whose
 * steps swap in place: why and Apple's button; your code on your page and theirs on the facing one; who it is;
 * then the pair become the Same Page mark, on the same spread, with no cut. Reached by `React.lazy` only, so a
 * solo launch evaluates none of this.
 *
 * Which step it shows is derived, not synchronised: a couple in the snapshot always means the morph, whichever
 * phone got there first. While the sheet is open on your code, it checks every 10 s, so when your partner
 * confirms, your phone moves on by itself.
 */
export default function PairScreen() {
    const { tokens, isDark } = useTheme();
    const { width, height, fontScale } = useWindowDimensions();
    const reduced = useReducedMotion();
    const signedIn = useAccountStore((s) => s.present);

    const [step, setStep] = useState<Step>(signedIn ? 'pages' : 'signin');
    const [signInProblem, setSignInProblem] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState<string | null>(null);
    const [codeProblem, setCodeProblem] = useState<string | null>(null);
    const [typed, setTyped] = useState('');
    const [typedProblem, setTypedProblem] = useState<CodeProblem | null>(null);
    const [lookAlike, setLookAlike] = useState(false);
    const [inviterName, setInviterName] = useState<string | null>(null);

    const home = useQuery(
        {
            queryKey: HOME_KEY,
            queryFn: fetchHome,
            enabled: signedIn,
            refetchInterval: step === 'pages' ? POLL_MS : false,
        },
        homeClient,
    );
    const couple = home.data?.couple ?? null;
    const partnerName = home.data?.partner?.display_name ?? inviterName ?? t('pair.partnerFallback');
    const myName = home.data?.me?.display_name ?? t('pair.you');
    const view = couple ? 'morph' : step;

    const stacked = fontScale >= STACK_FONT_SCALE;
    const compactHeight = height < 500;
    const artScale = fontScale >= STACK_FONT_SCALE ? 0.6 : 1;
    const boxW = Math.round(artScale * Math.min(width * 0.78, 420, compactHeight ? height * 0.6 : 420));
    const box = { w: boxW, h: Math.round(boxW * ASPECT) };

    // The welcome's timeline, joined at the open spread. Pressing Pair simply lets it run on.
    const p = useSharedValue(reduced ? DURATION : MORPH_START_MS);
    useMorphHaptic(p, MORPH_HAPTIC_MS);
    const line = useAnimatedStyle(() => {
        const l = linePose(p.get());
        return { opacity: l.opacity, transform: [{ translateY: l.dy }] };
    });
    useEffect(() => {
        if (view !== 'morph' || !couple) return;
        if (!wasCelebrated(couple.id)) markCelebrated(couple.id);
        if (!reduced) p.set(withTiming(DURATION, { duration: DURATION - MORPH_START_MS, easing: Easing.linear }));
    }, [view, couple, reduced, p]);
    useEffect(() => {
        if (view === 'morph') announce(t('pair.samePage', { name: partnerName }));
    }, [view, partnerName]);

    // Your code, once you're on the pages. A person who comes back to an open sheet keeps theirs.
    const loadCode = useRef(async () => {
        const result = await ensureCode();
        if ('code' in result) {
            setCode(result.code);
            setCodeProblem(null);
        } else {
            setCodeProblem(result.problem);
        }
    });
    useEffect(() => {
        if (view === 'pages' && !code) void loadCode.current();
    }, [view, code]);

    const close = () => {
        if (router.canGoBack()) router.back();
    };

    const onSignIn = async () => {
        setBusy(true);
        setSignInProblem(null);
        const result = await signIn();
        setBusy(false);
        if (result === 'cancelled') return;
        if (result === 'offline' || result === 'failed') {
            const text = t(result === 'offline' ? 'pair.error.offline' : 'pair.error.signIn');
            setSignInProblem(text);
            announce(text);
            return;
        }
        setStep(result.needsName ? 'name' : 'pages');
    };

    const onSaveName = async () => {
        setBusy(true);
        const result = await saveName(name.trim());
        setBusy(false);
        if (result === 'ok') setStep('pages');
        else setSignInProblem(t(result === 'offline' ? 'pair.error.offline' : 'pair.error.failed'));
    };

    const onTyped = async (raw: string) => {
        const { code: clean, lookAlike: dropped } = cleanCode(raw);
        setTyped(clean);
        setLookAlike(dropped);
        setTypedProblem(null);
        if (clean.length < CODE_LENGTH) return;
        setBusy(true);
        const result = await previewCode(clean);
        setBusy(false);
        if ('problem' in result) {
            setTypedProblem(result.problem);
            announce(t(problemText[result.problem]));
            return;
        }
        setInviterName(result.inviterName);
        setStep('confirm');
    };

    const onPair = async () => {
        setBusy(true);
        const result = await redeemCode(typed);
        setBusy(false);
        if (result === 'ok') return;
        setTypedProblem(result.problem);
        setStep('pages');
        announce(t(problemText[result.problem]));
    };

    const onNotThem = () => {
        setTyped('');
        setInviterName(null);
        setStep('pages');
    };

    const onSend = () => {
        if (!code) return;
        void Share.share({ message: t('pair.shareMessage', { code, url: STORE_URL }) }).catch(() => {});
    };

    const onNewCode = async () => {
        const result = await newCode();
        if ('code' in result) {
            setCode(result.code);
            setCodeProblem(null);
            announce(t('pair.codeLabel', { spelled: spelled(result.code) }));
        } else {
            setCodeProblem(result.problem);
        }
    };

    const head = (
        <View style={styles.head}>
            <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header" maxFontSizeMultiplier={1.6}>
                {t('pair.title')}
            </Text>
            <PressableScale
                onPress={close}
                haptic={false}
                accessibilityRole="button"
                accessibilityLabel={t('pair.close')}
                style={[styles.closeBtn, { backgroundColor: tokens.field }]}
            >
                <Text style={[styles.closeGlyph, { color: tokens.inkSoft }]} allowFontScaling={false} accessibilityElementsHidden>
                    ×
                </Text>
            </PressableScale>
        </View>
    );

    const art = <MorphArt p={p} box={box} room={1} reduced={reduced} label={t('pair.art')} />;

    let body;
    if (view === 'morph') {
        body = (
            <View style={styles.center}>
                {art}
                <Animated.Text style={[styles.samePage, { color: tokens.ink }, reduced ? null : line]} maxFontSizeMultiplier={1.6}>
                    {t('pair.samePage', { name: partnerName })}
                </Animated.Text>
                <Pill label={t('pair.done')} onPress={close} />
            </View>
        );
    } else if (view === 'signin') {
        body = (
            <Animated.View entering={FadeIn.duration(200)} style={styles.column}>
                <Spread
                    stacked={stacked}
                    left={<Text style={[styles.who, { color: tokens.inkSoft }]}>{t('pair.you')}</Text>}
                    right={<Text style={[styles.who, { color: tokens.inkSoft }]}>{t('pair.partner')}</Text>}
                />
                <Text style={[styles.why, { color: tokens.ink }]}>{t('pair.why')}</Text>
                {signInProblem && <Text style={[styles.problem, { color: tokens.ink }]}>{signInProblem}</Text>}
                {/* Apple's own button, never restyled (HIG sign-in-with-apple.md): black in light, white in dark. */}
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={28}
                    style={styles.apple}
                    onPress={busy ? () => {} : onSignIn}
                />
                <LinkButton label={t('pair.notNow')} onPress={close} />
            </Animated.View>
        );
    } else if (view === 'name') {
        body = (
            <Animated.View entering={FadeIn.duration(200)} style={styles.column}>
                <Text style={[styles.question, { color: tokens.ink }]} accessibilityRole="header">
                    {t('pair.nameAsk')}
                </Text>
                <Text style={[styles.note, { color: tokens.inkSoft }]}>{t('pair.nameWhy')}</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    maxLength={60}
                    autoFocus
                    autoCapitalize="words"
                    textContentType="givenName"
                    returnKeyType="done"
                    accessibilityLabel={t('pair.nameAsk')}
                    placeholder={t('pair.namePlaceholder')}
                    placeholderTextColor={tokens.inkSoft}
                    style={[styles.nameField, { backgroundColor: tokens.paper, borderColor: tokens.edge, color: tokens.ink }]}
                />
                {signInProblem && <Text style={[styles.problem, { color: tokens.ink }]}>{signInProblem}</Text>}
                <Pill label={t('pair.continue')} onPress={onSaveName} disabled={name.trim().length === 0} busy={busy} />
            </Animated.View>
        );
    } else if (view === 'confirm') {
        body = (
            <Animated.View entering={FadeIn.duration(200)} style={styles.center}>
                {art}
                <View style={[styles.names, { width: box.w * 0.7 }]}>
                    <Text style={[styles.nameLabel, { color: tokens.ink }]} numberOfLines={2}>{myName}</Text>
                    <Text style={[styles.nameLabel, { color: tokens.ink }]} numberOfLines={2}>{partnerName}</Text>
                </View>
                <Text style={[styles.question, styles.centered, { color: tokens.ink }]}>{t('pair.question')}</Text>
                <Pill label={t('pair.confirm', { name: partnerName })} onPress={onPair} busy={busy} />
                <LinkButton label={t('pair.notThem')} onPress={onNotThem} />
            </Animated.View>
        );
    } else {
        const yourCode = code ?? '';
        body = (
            <Animated.View entering={FadeIn.duration(200)} style={styles.column}>
                <Spread
                    stacked={stacked}
                    left={
                        <View
                            style={styles.pageInner}
                            accessible
                            accessibilityLabel={code ? t('pair.codeLabel', { spelled: spelled(code) }) : t('pair.you')}
                        >
                            <Text style={[styles.who, { color: tokens.inkSoft }]} numberOfLines={1}>{myName}</Text>
                            <CodeCells value={yourCode} scale={stacked ? 1.2 : 1} />
                            <Text style={[styles.mini, { color: tokens.inkSoft }]}>{t('pair.lasts')}</Text>
                        </View>
                    }
                    right={
                        <View style={styles.pageInner}>
                            <Text style={[styles.who, { color: tokens.inkSoft }]} numberOfLines={1}>{t('pair.partner')}</Text>
                            <CodeCells value={typed} scale={stacked ? 1.2 : 1} />
                            <Text style={[styles.mini, { color: tokens.inkSoft }]}>{t('pair.tapToType')}</Text>
                            {/* One real text field over the page: the keyboard, paste and VoiceOver all just work. */}
                            <TextInput
                                testID="pair-code-input"
                                value={typed}
                                onChangeText={onTyped}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                spellCheck={false}
                                keyboardType="ascii-capable"
                                textContentType="oneTimeCode"
                                caretHidden
                                accessibilityLabel={t('pair.codeField')}
                                accessibilityValue={{ text: spelled(typed) }}
                                style={styles.codeInput}
                            />
                        </View>
                    }
                />
                {codeProblem && (
                    <Text style={[styles.problem, { color: tokens.ink }]}>
                        {t(codeProblem === 'offline' ? 'pair.error.offline' : 'pair.error.failed')}
                    </Text>
                )}
                {lookAlike && <Text style={[styles.note, { color: tokens.inkSoft }]}>{t('pair.lookAlike')}</Text>}
                {typedProblem && <Text style={[styles.problem, { color: tokens.ink }]}>{t(problemText[typedProblem])}</Text>}
                <Pill label={t('pair.send')} onPress={onSend} disabled={!code} busy={busy && typed.length === CODE_LENGTH} />
                <LinkButton label={t('pair.newCode')} onPress={onNewCode} />
            </Animated.View>
        );
    }

    return (
        <ScrollView
            style={{ backgroundColor: tokens.page }}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            bounces={false}
        >
            {head}
            {body}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: space.l, paddingTop: space.m, paddingBottom: space.xl, gap: space.m },
    head: { minHeight: minTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: minTarget },
    title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: 4,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeGlyph: { fontSize: 20, lineHeight: 22 },
    column: { gap: space.m },
    center: { alignItems: 'center', gap: space.l },
    pageInner: { flex: 1, alignSelf: 'stretch', alignItems: 'center', gap: space.s },
    who: { fontSize: 13, fontWeight: '600' },
    mini: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
    why: { fontSize: 17, lineHeight: 23 },
    note: { fontSize: 13, lineHeight: 18 },
    problem: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
    question: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
    centered: { textAlign: 'center' },
    samePage: { fontSize: 17, lineHeight: 23, fontWeight: '600', textAlign: 'center' },
    names: { flexDirection: 'row', justifyContent: 'space-between' },
    nameLabel: { fontSize: 15, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
    apple: { height: 56, alignSelf: 'stretch' },
    pill: {
        minHeight: 56,
        alignSelf: 'stretch',
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.xl,
    },
    pillLabel: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
    link: { minHeight: minTarget, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
    linkLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    nameField: { minHeight: minTarget + 8, borderWidth: edgeWidth, borderRadius: radius.m, paddingHorizontal: space.l, fontSize: 17 },
    codeInput: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, color: 'transparent', opacity: 0.02 },
});
