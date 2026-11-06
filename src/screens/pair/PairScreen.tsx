import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Alert,
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
    FadeOut,
    LayoutAnimationConfig,
    ReduceMotion,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { Icon } from '../../components/icons/Icon';
import { close as closeGlyph } from '../../components/icons/art/close';
import { Sticker } from '../../components/stickers/Sticker';
import { doroCelebrating } from '../../components/stickers/art/doroCelebrating';
import { pomoCelebrating } from '../../components/stickers/art/pomoCelebrating';
import { PressableScale } from '../../components/ui/PressableScale';
import { useWindowInsets } from '../../hooks/useWindowInsets';
import { t } from '../../i18n';
import { useAccountStore } from '../../server/account';
import { fetchHome, HOME_KEY, homeClient } from '../../server/home';
import { useTheme } from '../../theme/useTheme';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';
import { PoseSticker } from '../classic/PoseSticker';
import { ASPECT, DURATION, linePose } from '../welcome/choreography';
import { MorphArt, MorphCharacters, useMorphHaptic } from '../welcome/MorphStage';
import { CodeCells, DashedCell, cellScaleFor } from './CodeCells';
import {
    CODE_LENGTH,
    cleanCode,
    ensureCode,
    isOpen,
    markCelebrated,
    newCode,
    previewCode,
    redeemCode,
    saveName,
    signIn,
    wasCelebrated,
    type ProblemStatus,
} from './pairing';
import { Page, Spread } from './Spread';

const STORE_URL = 'https://apps.apple.com/app/id6757491918';
const STACK_FONT_SCALE = 1.6;
const POLL_MS = 10_000;
const COMPACT_HEIGHT = 500;
/** How the sheet divides a landscape iPhone: the body's share, then the actions'. */
const SIDE_MAIN = 6;
const SIDE_ACTIONS = 5;
const STICKER = 72;
const PILL_HEIGHT = 56;

/** On this frame of the welcome's timeline the pair have landed on the open spread, in their joyful pose. */
export const MORPH_START_MS = 2100;
/** The spread bumps and the sparkles burst as the pair become its faces: the one haptic. */
const MORPH_HAPTIC_MS = 3080;
/** The steps' crossfade: the morph holds still until the spread has faded under it. */
const CROSSFADE_MS = 200;

/** A person finishing a code has their finger on the keyboard as it falls, and Pair can land under it. */
const PAIR_GUARD_MS = 500;

// Opacity stays under Reduce Motion (DESIGN.md), and Reanimated would otherwise jump a fade to its end.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const STEP_IN = FadeIn.duration(CROSSFADE_MS).easing(EASE_OUT).reduceMotion(ReduceMotion.Never);
const STEP_OUT = FadeOut.duration(CROSSFADE_MS).easing(EASE_OUT).reduceMotion(ReduceMotion.Never);

type Step = 'pages' | 'confirm';
type CodeProblem = ProblemStatus | 'already_paired';

const problemText: Record<string, string> = {
    invalid: 'pair.error.invalid',
    expired: 'pair.error.expired',
    used: 'pair.error.used',
    own_code: 'pair.error.own',
    partner_paired: 'pair.error.partnerPaired',
    rate_limited: 'pair.error.rateLimited',
    offline: 'pair.error.offlineCode',
    session_ended: 'pair.error.signIn',
    failed: 'pair.error.failed',
    already_paired: 'pair.error.failed',
};

const announce = (text: string) => AccessibilityInfo.announceForAccessibility(text);

function spelled(code: string): string {
    return [...code].join(', ');
}

function Pill({ label, onPress, disabled, busy, haptic }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean; haptic?: boolean }) {
    const { tokens } = useTheme();
    return (
        <PressableScale
            onPress={disabled || busy ? () => {} : onPress}
            haptic={haptic}
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
 * steps swap in place with a crossfade: why and Apple's button; your code on your page and theirs on the facing
 * one; who it is, on the same two pages; then the spread becomes the Same Page mark. Reached by `React.lazy`
 * only, so a solo launch evaluates none of this.
 *
 * What it shows is derived, not synchronised:
 *   - no session, or one that has ended: Apple's button;
 *   - a couple in the snapshot: the morph, whichever phone got there first;
 *   - a person with no name yet: asking for one, because your partner would otherwise see nothing, and closing
 *     the sheet can't skip it, since Apple sends a name only once;
 *   - otherwise your code, or who it is.
 * While the sheet shows your code it checks every 10 s, so when your partner confirms, your phone moves on.
 *
 * Each step is a `body` and its `actions`. In portrait the actions are pinned at thumb height, as the contract
 * asks, except for the name step, whose keyboard would cover them. On a landscape iPhone they take the trailing side.
 */
export default function PairScreen() {
    const { tokens, isDark } = useTheme();
    const { width, height, fontScale } = useWindowDimensions();
    const insets = useWindowInsets();
    const reduced = useReducedMotion();
    const present = useAccountStore((s) => s.present);
    const sessionEnded = useAccountStore((s) => s.sessionEnded);
    const signedIn = present && !sessionEnded;

    const [step, setStep] = useState<Step>('pages');
    const [signingIn, setSigningIn] = useState(false);
    const [signInProblem, setSignInProblem] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState<string | null>(null);
    const [codeProblem, setCodeProblem] = useState<'offline' | 'failed' | null>(null);
    const [typed, setTyped] = useState('');
    const [typing, setTyping] = useState(false);
    const [checking, setChecking] = useState(false);
    const [typedProblem, setTypedProblem] = useState<CodeProblem | null>(null);
    const [lookAlike, setLookAlike] = useState(false);
    const [inviterName, setInviterName] = useState<string | null>(null);
    // Only the latest check may answer, and Pair redeems the code that was shown, not whatever is in the field.
    const latestCheck = useRef(0);
    const previewed = useRef<string | null>(null);
    const whoShownAt = useRef(0);
    // Someone arriving on the pages hears the code when it comes, not only the sheet's title.
    const codeToSpeak = useRef(false);

    const home = useQuery(
        {
            queryKey: HOME_KEY,
            queryFn: fetchHome,
            enabled: signedIn,
            refetchInterval: (query) => (step === 'pages' && !query.state.data?.couple ? POLL_MS : false),
        },
        homeClient,
    );
    const couple = home.data?.couple ?? null;
    const coupleId = couple?.id ?? null;
    const me = home.data?.me ?? null;
    const partnerName = home.data?.partner?.display_name ?? inviterName ?? t('pair.partnerFallback');
    const myName = me?.display_name ?? t('pair.you');
    // "Your code is already there": the last known one shows at once, and the server's answer corrects it.
    const known = home.data?.invite;
    const shownCode = code ?? (known && isOpen(known) ? known.code : null);

    // Signing in sets the account flag before the name is saved, so the step holds until signIn() has finished.
    let view: 'signin' | 'name' | 'morph' | Step;
    if (!signedIn || signingIn) view = 'signin';
    else if (couple) view = 'morph';
    else if (me && !me.display_name) view = 'name';
    else view = step;

    const stacked = fontScale >= STACK_FONT_SCALE;
    const sideBySide = height < COMPACT_HEIGHT;
    const pinned = !sideBySide && view !== 'name';
    const gutterLeft = sideBySide ? Math.max(insets.left, space.l) : space.l;
    const gutterRight = sideBySide ? Math.max(insets.right, space.l) : space.l;
    const column = width - gutterLeft - gutterRight;
    const mainWidth = sideBySide ? ((column - space.l) * SIDE_MAIN) / (SIDE_MAIN + SIDE_ACTIONS) : column;
    const cellScale = cellScaleFor(mainWidth, stacked);
    const boxW = Math.round((stacked ? 0.6 : 1) * Math.min(mainWidth, 420, sideBySide ? height * 0.6 : 420));
    const box = { w: boxW, h: Math.round(boxW * ASPECT) };

    // The welcome's timeline, held at the frame where the pair have landed on the open spread: who-it-is draws them
    // from it, so they don't move when the drawing takes over. It plays once per person: open this again once it
    // has played, and the mark is simply there, with no haptic.
    const [settledAtOpen] = useState(() => Boolean(couple) && wasCelebrated());
    const p = useSharedValue(settledAtOpen ? DURATION : MORPH_START_MS);
    const hapticArmed = useSharedValue(false);
    useMorphHaptic(p, MORPH_HAPTIC_MS, hapticArmed);
    const line = useAnimatedStyle(() => {
        const l = linePose(p.get());
        return { opacity: l.opacity, transform: [{ translateY: l.dy }] };
    });
    useEffect(() => {
        if (view !== 'morph' || !coupleId) return;
        const first = !wasCelebrated();
        if (first) markCelebrated(coupleId);
        hapticArmed.set(first);
        if (reduced || !first) p.set(DURATION);
        else p.set(withDelay(CROSSFADE_MS, withTiming(DURATION, { duration: DURATION - MORPH_START_MS, easing: Easing.linear })));
    }, [view, coupleId, reduced, p, hapticArmed]);

    // Each step's change is spoken (the brief §6). A sheet that opens on the morph has nothing else to say it.
    const spokenView = useRef<string | null>(view === 'morph' ? null : view);
    useEffect(() => {
        if (spokenView.current === view) return;
        spokenView.current = view;
        if (view === 'morph') announce(t('pair.samePage', { name: partnerName }));
        else if (view === 'confirm') announce(`${t('pair.confirm', { name: partnerName })}. ${t('pair.question')}`);
        else if (view === 'name') announce(t('pair.nameAsk'));
        else if (view === 'signin') announce(t('pair.why'));
        else if (shownCode) announce(t('pair.codeLabel', { spelled: spelled(shownCode) }));
        else {
            codeToSpeak.current = true;
            announce(t('pair.title'));
        }
    }, [view, partnerName, shownCode]);

    // Your code, once you're on the pages. A person who comes back to an open sheet keeps theirs.
    const loadCode = useRef(async () => {
        const result = await ensureCode();
        if ('code' in result) {
            setCode(result.code);
            setCodeProblem(null);
            if (codeToSpeak.current) announce(t('pair.codeLabel', { spelled: spelled(result.code) }));
            codeToSpeak.current = false;
        } else if (result.problem === 'offline' || result.problem === 'failed') {
            setCodeProblem(result.problem);
            announce(t(result.problem === 'offline' ? 'pair.error.offline' : 'pair.error.failed'));
        }
    });
    useEffect(() => {
        if (view === 'pages' && !code) void loadCode.current();
    }, [view, code]);

    const leave = () => {
        if (router.canGoBack()) router.back();
    };

    const onSignIn = async () => {
        setSigningIn(true);
        setSignInProblem(null);
        const result = await signIn();
        setSigningIn(false);
        if (result === 'cancelled') return;
        if (typeof result === 'object') {
            setTypedProblem(null);
            setCodeProblem(null);
            return;
        }
        const text = t(result === 'offline' ? 'pair.error.offline' : 'pair.error.signIn');
        setSignInProblem(text);
        announce(text);
    };

    const onSaveName = async () => {
        setBusy(true);
        setSignInProblem(null);
        const result = await saveName(name.trim());
        setBusy(false);
        if (result === 'ok') return;
        const text = t(result === 'offline' ? 'pair.error.offline' : 'pair.error.failed');
        setSignInProblem(text);
        announce(text);
    };

    const onTyped = async (raw: string) => {
        const { code: clean, lookAlike: dropped } = cleanCode(raw);
        setLookAlike(dropped);
        // A key that changes nothing doesn't check again, since a wrong code counts as a failed try. The exception
        // is a check that never got an answer.
        const unanswered = typedProblem === 'offline' || typedProblem === 'failed';
        if (clean === typed && !unanswered) return;
        setTyped(clean);
        setTypedProblem(null);
        latestCheck.current += 1;
        const check = latestCheck.current;
        if (clean.length < CODE_LENGTH) {
            setChecking(false);
            return;
        }
        setChecking(true);
        const result = await previewCode(clean);
        if (check !== latestCheck.current) return;
        setChecking(false);
        if ('problem' in result) {
            setTypedProblem(result.problem);
            announce(t(problemText[result.problem]));
            return;
        }
        previewed.current = clean;
        whoShownAt.current = Date.now();
        // A sheet that opened on a couple since gone is at the timeline's end, where Pomo & Doro aren't drawn.
        p.set(MORPH_START_MS);
        hapticArmed.set(false);
        // The field is about to unmount, and its blur wouldn't reach us.
        setTyping(false);
        setInviterName(result.inviterName);
        setStep('confirm');
    };

    const onPair = async () => {
        if (!previewed.current || Date.now() - whoShownAt.current < PAIR_GUARD_MS) return;
        setBusy(true);
        const result = await redeemCode(previewed.current);
        setBusy(false);
        if (result === 'ok') return;
        setTypedProblem(result.problem);
        setStep('pages');
        announce(t(problemText[result.problem]));
    };

    const onNotThem = () => {
        if (busy) return;
        latestCheck.current += 1;
        previewed.current = null;
        setTyped('');
        setInviterName(null);
        setStep('pages');
    };

    const onSend = () => {
        if (!shownCode) return;
        void Share.share({ message: t('pair.shareMessage', { code: shownCode, url: STORE_URL }) }).catch(() => {});
    };

    const makeNewCode = async () => {
        const result = await newCode();
        if ('code' in result) {
            setCode(result.code);
            setCodeProblem(null);
            announce(t('pair.codeLabel', { spelled: spelled(result.code) }));
        } else if (result.problem === 'offline' || result.problem === 'failed') {
            setCodeProblem(result.problem);
            announce(t(result.problem === 'offline' ? 'pair.error.offline' : 'pair.error.failed'));
        }
    };

    // Your partner may already hold the code you have, and a new one cancels it, so that's worth one question.
    const onNewCode = () => {
        if (!shownCode) {
            void makeNewCode();
            return;
        }
        Alert.alert(t('pair.newCodeAsk'), t('pair.newCodeWhy'), [
            { text: t('pair.keepCode'), style: 'cancel' },
            { text: t('pair.newCode'), onPress: () => void makeNewCode() },
        ]);
    };

    const head = (
        <View style={styles.head}>
            <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header" maxFontSizeMultiplier={1.6}>
                {t('pair.title')}
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
    );

    let body: ReactNode;
    let actions: ReactNode;
    if (view === 'morph') {
        body = (
            <>
                <MorphArt p={p} box={box} room={1} reduced={reduced} label={t('pair.art')} />
                <Animated.Text style={[styles.samePage, { color: tokens.ink }, reduced ? null : line]} maxFontSizeMultiplier={1.6}>
                    {t('pair.samePage', { name: partnerName })}
                </Animated.Text>
            </>
        );
        actions = <Pill label={t('pair.done')} onPress={leave} />;
    } else if (view === 'signin') {
        body = (
            <>
                <Spread
                    stacked={stacked}
                    left={
                        <View style={styles.pageInner}>
                            <Text style={[styles.who, { color: tokens.inkSoft }]}>{t('pair.you')}</Text>
                            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                                <PoseSticker who="pomo" pose="idle" width={STICKER} shadow={tokens.stickerShadow} />
                            </View>
                        </View>
                    }
                    right={
                        <View style={styles.pageInner}>
                            <Text style={[styles.who, { color: tokens.inkSoft }]}>{t('pair.partner')}</Text>
                            <DashedCell />
                        </View>
                    }
                />
                <Text style={[styles.why, { color: tokens.ink }]}>{t('pair.why')}</Text>
                {signingIn && <ActivityIndicator color={tokens.inkSoft} accessibilityLabel={t('pair.signingIn')} />}
                {signInProblem && <Text style={[styles.problem, { color: tokens.ink }]}>{signInProblem}</Text>}
            </>
        );
        actions = (
            <>
                {/* Apple's own button, never restyled (HIG sign-in-with-apple.md): black in light, white in dark. */}
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={28}
                    style={styles.apple}
                    onPress={signingIn ? () => {} : onSignIn}
                />
                <LinkButton label={t('pair.notNow')} onPress={leave} />
            </>
        );
    } else if (view === 'name') {
        body = (
            <Page>
                <Text style={[styles.question, { color: tokens.ink }]} accessibilityRole="header">
                    {t('pair.nameAsk')}
                </Text>
                <Text style={[styles.note, { color: tokens.inkSoft }]}>{t('pair.nameWhy')}</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    onSubmitEditing={() => {
                        if (name.trim().length > 0) void onSaveName();
                    }}
                    maxLength={60}
                    autoFocus
                    autoCapitalize="words"
                    textContentType="givenName"
                    returnKeyType="done"
                    accessibilityLabel={t('pair.nameAsk')}
                    placeholder={t('pair.namePlaceholder')}
                    placeholderTextColor={tokens.inkSoft}
                    style={[styles.nameField, { backgroundColor: tokens.page, borderColor: tokens.edge, color: tokens.ink }]}
                />
                {signInProblem && <Text style={[styles.problem, { color: tokens.ink }]}>{signInProblem}</Text>}
            </Page>
        );
        actions = <Pill label={t('pair.continue')} onPress={onSaveName} disabled={name.trim().length === 0} busy={busy} />;
    } else if (view === 'confirm') {
        const face = (art: typeof pomoCelebrating) => (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Sticker art={art} width={STICKER} shadow={tokens.stickerShadow} />
            </View>
        );
        body = (
            <>
                <View>
                    <Spread
                        stacked={stacked}
                        pageMinHeight={stacked ? undefined : box.h}
                        left={
                            <View style={styles.pageInner}>
                                <Text style={[styles.who, { color: tokens.inkSoft }]} numberOfLines={2}>{myName}</Text>
                                {stacked && face(pomoCelebrating)}
                            </View>
                        }
                        right={
                            <View style={styles.pageInner}>
                                <Text style={[styles.who, { color: tokens.inkSoft }]} numberOfLines={2}>{partnerName}</Text>
                                {stacked && face(doroCelebrating)}
                            </View>
                        }
                    />
                    {/* Where the morph starts them, so Pair moves nothing: they lean toward the spine. Stacked pages have no spine. */}
                    {!stacked && (
                        <View
                            style={[styles.morphStage, { width: box.w, height: box.h }]}
                            pointerEvents="none"
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        >
                            <MorphCharacters p={p} box={box} room={1} shadow={tokens.stickerShadow} />
                        </View>
                    )}
                </View>
                <Text style={[styles.question, styles.centered, { color: tokens.ink }]}>{t('pair.question')}</Text>
            </>
        );
        actions = (
            <>
                {/* The morph's soft tap is this press's one haptic. */}
                <Pill label={t('pair.confirm', { name: partnerName })} onPress={onPair} busy={busy} haptic={false} />
                <LinkButton label={t('pair.notThem')} onPress={onNotThem} />
            </>
        );
    } else {
        let codeProblemText: string | null = null;
        if (codeProblem) codeProblemText = t(codeProblem === 'offline' ? 'pair.error.offline' : 'pair.error.failed');
        const leftLabel = [
            myName,
            shownCode ? t('pair.codeLabel', { spelled: spelled(shownCode) }) : null,
            codeProblemText ?? (shownCode ? t('pair.lasts') : null),
        ].filter(Boolean).join('. ');

        let leftLine = <ActivityIndicator color={tokens.inkSoft} />;
        if (codeProblemText) leftLine = <Text style={[styles.pageProblem, { color: tokens.ink }]}>{codeProblemText}</Text>;
        else if (shownCode) leftLine = <Text style={[styles.mini, { color: tokens.inkSoft }]}>{t('pair.lasts')}</Text>;

        let rightLine = <Text style={[styles.mini, { color: tokens.inkSoft }]}>{t('pair.tapToType')}</Text>;
        if (checking) rightLine = <Text style={[styles.mini, { color: tokens.inkSoft }]}>{t('pair.checking')}</Text>;
        else if (typedProblem) rightLine = <Text style={[styles.pageProblem, { color: tokens.ink }]}>{t(problemText[typedProblem])}</Text>;
        else if (lookAlike) rightLine = <Text style={[styles.mini, { color: tokens.inkSoft }]}>{t('pair.lookAlike')}</Text>;

        body = (
            <Spread
                stacked={stacked}
                rightFlat={typing}
                left={
                    <View
                        style={styles.pageInner}
                        accessible
                        accessibilityLabel={leftLabel}
                        // Send my code is below the field on screen, so it's offered here too, right beside the code.
                        accessibilityActions={shownCode ? [{ name: 'send', label: t('pair.send') }] : undefined}
                        onAccessibilityAction={(event) => {
                            if (event.nativeEvent.actionName === 'send') onSend();
                        }}
                    >
                        <Text style={[styles.who, { color: tokens.inkSoft }]} numberOfLines={2}>{myName}</Text>
                        <CodeCells value={shownCode ?? ''} scale={cellScale} />
                        {leftLine}
                    </View>
                }
                right={
                    <View style={styles.pageInner}>
                        <Text style={[styles.who, { color: tokens.inkSoft }]} numberOfLines={2}>{t('pair.partner')}</Text>
                        <CodeCells value={typed} scale={cellScale} />
                        {rightLine}
                    </View>
                }
                rightOverlay={
                    // One real text field over the whole page: the keyboard, paste and VoiceOver all just work.
                    <TextInput
                        testID="pair-code-input"
                        value={typed}
                        onChangeText={onTyped}
                        onFocus={() => setTyping(true)}
                        onBlur={() => setTyping(false)}
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
                }
            />
        );
        actions = (
            <>
                <Pill label={t('pair.send')} onPress={onSend} disabled={!shownCode} />
                <LinkButton label={t('pair.newCode')} onPress={onNewCode} />
            </>
        );
    }

    const centred = view === 'morph';
    const actionsBlock = (
        <Animated.View
            key={`actions-${view}`}
            testID="pair-actions"
            entering={STEP_IN}
            exiting={STEP_OUT}
            style={[styles.actions, pinned && styles.actionsPinned, sideBySide && styles.sideActions]}
        >
            {actions}
        </Animated.View>
    );
    return (
        // The sheet's own rise is the first step's entrance, so that one doesn't fade as well.
        <LayoutAnimationConfig skipEntering>
            <View style={[styles.root, { backgroundColor: tokens.page }]}>
                <ScrollView
                    testID="pair-scroll"
                    style={styles.root}
                    contentContainerStyle={[styles.content, { paddingLeft: gutterLeft, paddingRight: gutterRight }]}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                    bounces={false}
                >
                    {head}
                    <View style={sideBySide ? styles.side : styles.column}>
                        <Animated.View
                            key={view}
                            entering={STEP_IN}
                            exiting={STEP_OUT}
                            style={[centred ? styles.center : styles.column, sideBySide && styles.sideMain]}
                        >
                            {body}
                        </Animated.View>
                        {!pinned && actionsBlock}
                    </View>
                </ScrollView>
                {pinned && <View style={[styles.pinned, { paddingBottom: Math.max(insets.bottom, space.l) }]}>{actionsBlock}</View>}
            </View>
        </LayoutAnimationConfig>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { paddingTop: space.m, paddingBottom: space.xl, gap: space.m },
    head: { minHeight: minTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: minTarget },
    title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
    closeCorner: { position: 'absolute', right: 0, top: 4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    column: { gap: space.m },
    center: { alignItems: 'center', gap: space.l },
    side: { flexDirection: 'row', gap: space.l, alignItems: 'flex-start' },
    sideMain: { flex: SIDE_MAIN },
    sideActions: { flex: SIDE_ACTIONS },
    actions: { gap: space.s },
    pinned: { paddingHorizontal: space.l, paddingTop: space.s },
    // Room for a pill and a link at every step, so Done sits where Pair was. It's on the block, not the padded
    // wrapper, whose minHeight would include the padding and let the block's height decide after all.
    actionsPinned: { minHeight: PILL_HEIGHT + space.s + minTarget },
    morphStage: { position: 'absolute', top: 0, alignSelf: 'center' },
    pageInner: { flex: 1, alignSelf: 'stretch', alignItems: 'center', gap: space.s },
    who: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    mini: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
    pageProblem: { fontSize: 13, lineHeight: 18, fontWeight: '500', textAlign: 'center' },
    why: { fontSize: 17, lineHeight: 23 },
    note: { fontSize: 13, lineHeight: 18 },
    problem: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
    question: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
    centered: { textAlign: 'center' },
    samePage: { fontSize: 17, lineHeight: 23, fontWeight: '600', textAlign: 'center' },
    apple: { height: 56, alignSelf: 'stretch' },
    pill: {
        minHeight: PILL_HEIGHT,
        alignSelf: 'stretch',
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.xl,
    },
    pillLabel: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
    link: { minHeight: minTarget, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
    linkLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    nameField: { minHeight: minTarget + 8, alignSelf: 'stretch', borderWidth: edgeWidth, borderRadius: radius.m, paddingHorizontal: space.l, fontSize: 17 },
    codeInput: { flex: 1, color: 'transparent', opacity: 0.02 },
});
