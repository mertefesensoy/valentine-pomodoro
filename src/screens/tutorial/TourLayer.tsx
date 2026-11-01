import { useEffect, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions, type AccessibilityActionEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedProps,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Sticker } from '../../components/stickers/Sticker';
import { doroIdle } from '../../components/stickers/art/doroIdle';
import { pomoIdle } from '../../components/stickers/art/pomoIdle';
import { isFlyModeAvailable } from '../../constants/features';
import { t } from '../../i18n';
import { useStatsStore } from '../../stores/statsStore';
import { useUiStore } from '../../stores/uiStore';
import { useTheme } from '../../theme/useTheme';
import { diffDays, getTodayKey } from '../../utils/time';
import { loadBabble } from './babble';
import { Bubble } from './Bubble';
import { place, tabCentre, type Rect } from './placement';
import { Ribbon } from './Ribbon';
import { TourCharacter } from './TourCharacter';
import { currentBeat, currentStep, isLastBeat, useTourStore } from './tourStore';
import type { LineContext, Speaker, TourOpening, TourScreen, TourTab } from './tutorials';
import { useRaisedScrim, useScreenReader } from './useTour';
import { useSpeaking } from './useSpeaking';

/** What a host hands the layer for each of its openings. */
export type TourTargetSpec = {
    ref: RefObject<ComponentRef<typeof View> | null>;
    /** The control's own corner radius; the opening follows it, with breathing room. */
    radius: number;
    /**
     * With VoiceOver on, the opening is its own element with the control's label and role, and acts
     * as it (T-1), so Voice Control's "Tap Start focus" works too. Absent for a region (today's row,
     * the week), which the bubble describes.
     */
    a11y?: {
        label: string;
        role: 'button' | 'adjustable';
        value?: string;
        onActivate?: () => void;
        onIncrement?: () => void;
        onDecrement?: () => void;
    };
};

type Props = {
    screen: TourScreen;
    targets: Partial<Record<TourOpening, TourTargetSpec>>;
    /** Scrolls the host's page by dy points, to bring an opening clear of the bubble (T-2). */
    scrollBy?: (dy: number) => void;
};

/** The breathing room around an opening. */
const PAD = 6;
/** The AX switch (font scale 1.6, as Classic's): the bubble becomes a bottom panel (T-2). */
const PANEL_FONT_SCALE = 1.6;
/** Until the bubble lays out: a two-line bubble at the default text size. */
const BUBBLE_ESTIMATE = 128;
/** How long a beat waits for its opening's frame before it goes on with the whole page dimmed. */
const MEASURE_WAIT_MS = 600;
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const GLIDE_MS = 420;
const FADE_MS = 150;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TAB_ROUTE: Record<TourTab, '/' | '/stats' | '/notes'> = { index: '/', stats: '/stats', notes: '/notes' };
/** The bar's order (app/(tabs)/_layout.tsx): Timer, Stats, Settings, Notes. */
const TAB_INDEX: Record<TourTab, number> = { index: 0, stats: 1, notes: 3 };
const TAB_COUNT = 4;
const BADGE = { pomo: pomoIdle, doro: doroIdle } as const;

const sameRect = (a: Rect | null, b: Rect | null) =>
    a === b || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5);

/**
 * One screen's tour layer (Phase 1 D5; the direction contract, D5 record §3.7). The host mounts it,
 * lazily, last in its root view while the active beat is its own.
 *
 * - The scrim dims everything but the opening, which is lit and live: nothing covers the hole, so
 *   a tap there is the real control's. The native tab bar sits above the layer, always lit.
 * - The ribbon drapes to the opening (or to the tab a lead names); the pair stand beside its tip
 *   and the speaker's bubble floats above them.
 * - VoiceOver: the layer is modal; the bubble is one element, then Next and Skip tour; an opening
 *   that is a control is its own acting element; focus moves to the bubble at every beat.
 * - At AX sizes the bubble is a bottom panel, the pair a badge, the ribbon a short tab, and the page
 *   scrolls the opening clear of it.
 */
export default function TourLayer({ screen, targets, scrollBy }: Props) {
    const run = useTourStore((s) => s.run);
    const muted = useTourStore((s) => s.muted);
    const { tokens } = useTheme();
    const window = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const reduced = useReducedMotion();
    const screenReader = useScreenReader();
    const raised = useRaisedScrim();
    const audience = useUiStore((s) => s.welcomeAudience);
    const goalOn = useStatsStore((s) => s.goalMinutes > 0);
    const weekEmpty = useStatsStore((s) => {
        const today = getTodayKey();
        return !Object.entries(s.days).some(([key, day]) => day.focusSessions > 0 && diffDays(today, key) >= 0 && diffDays(today, key) < 7);
    });

    const [size, setSize] = useState({ W: window.width, H: window.height });
    const [bubbleH, setBubbleH] = useState(BUBBLE_ESTIMATE);
    const [hole, setHole] = useState<Rect | null>(null);
    const rootRef = useRef<ComponentRef<typeof View>>(null);
    const lineRef = useRef<ComponentRef<typeof View>>(null);
    const mouth = useSharedValue(0);
    const talking = useSharedValue(0);

    // The voices load with the layer, never on the cold-start path (brief §4); they're freed when the run ends.
    useEffect(() => loadBabble(), []);

    const beat = run ? currentBeat(run) : null;
    const step = run ? currentStep(run) : null;
    const beatKey = run ? `${run.tutorialId}:${run.steps[run.at]}:${run.beat}` : 'none';
    const opening = beat && 'opening' in beat.target ? beat.target.opening : null;
    const tab = beat && 'tab' in beat.target ? beat.target.tab : null;
    const panel = window.fontScale >= PANEL_FONT_SCALE;
    const { W, H } = size;

    // Where the opening is: the control's own layout, in this layer's frame, after layout settles,
    // and again once a scroll the tour asked for has landed.
    const scrolled = useRef<string | null>(null);
    useEffect(() => {
        if (!opening) return;
        const spec = targets[opening];
        const timers: ReturnType<typeof setTimeout>[] = [];
        const measure = () => {
            const node = spec?.ref.current;
            const root = rootRef.current;
            if (!node || !root) return;
            root.measureInWindow((rx, ry) => {
                node.measureInWindow((x, y, w, h) => {
                    if (!w || !h) return;
                    const r = { x: x - rx - PAD, y: y - ry - PAD, w: w + 2 * PAD, h: h + 2 * PAD };
                    // Bring it clear of the panel (AX) or the screen's edges, once per beat.
                    const bottomLimit = H - insets.bottom - (panel ? bubbleH + 36 : 12);
                    const delta = r.y + r.h > bottomLimit ? r.y + r.h - bottomLimit : r.y < insets.top + 8 ? r.y - insets.top - 8 : 0;
                    if (delta !== 0 && scrollBy && scrolled.current !== beatKey) {
                        scrolled.current = beatKey;
                        scrollBy(delta);
                        timers.push(setTimeout(measure, 420));
                    }
                    setHole((prev) => (sameRect(prev, r) ? prev : r));
                });
            });
        };
        timers.push(setTimeout(measure, 30), setTimeout(measure, 260), setTimeout(measure, 700));
        return () => timers.forEach(clearTimeout);
        // `targets` is a fresh object each host render; the refs inside it are stable.
    }, [opening, beatKey, W, H, panel, bubbleH]); // eslint-disable-line react-hooks/exhaustive-deps

    const context: LineContext = { audience, replay: !!run?.replay, goalOn, flyAvailable: isFlyModeAvailable(), weekEmpty };
    const line = beat ? beat.line(context) : null;
    const names = Object.fromEntries(Object.entries(line?.names ?? {}).map(([k, key]) => [k, t(key)]));
    const text = line ? t(line.key, names) : '';
    const speaker: Speaker = step?.speaker ?? 'pomo';
    const speaking = useSpeaking(text, speaker, { instant: screenReader === true, hold: screenReader === null, reduced, mouth, talking });

    // The pair and the bubble arrive once the opening is found, so they never start somewhere
    // else and slide; a control that can't be measured still gets its beat, the whole page dimmed.
    const [waited, setWaited] = useState<string | null>(null);
    // Once arrived they stay for the layer's life, gliding from beat to beat.
    const [arrived, setArrived] = useState(false);
    // Whether this layer plays the run's entrance, fixed when it mounts (the run marks it played).
    const [entrance] = useState(() => !useTourStore.getState().run?.introduced);
    useEffect(() => {
        if (arrived) useTourStore.getState().markIntroduced();
    }, [arrived]);
    useEffect(() => {
        const id = setTimeout(() => setWaited(beatKey), MEASURE_WAIT_MS);
        return () => clearTimeout(id);
    }, [beatKey]);

    // Each beat moves VoiceOver's focus to the bubble (iOS has no live regions).
    useEffect(() => {
        if (!screenReader) return;
        const id = setTimeout(() => {
            if (lineRef.current) AccessibilityInfo.sendAccessibilityEvent(lineRef.current, 'focus');
        }, 150);
        return () => clearTimeout(id);
    }, [beatKey, screenReader, arrived]);

    if (!run || !beat || !step) return null;
    // A lead has no opening: the whole page dims (a measured hole from the step before is ignored).
    const lit = opening ? hole : null;
    const ready = arrived || !opening || lit !== null || waited === beatKey;
    if (ready && !arrived) setArrived(true);

    const atBottom = insets.bottom >= 44;
    const tabX = tab ? tabCentre(W, insets, TAB_INDEX[tab], TAB_COUNT, atBottom) : null;
    const wide = W > H || Math.min(W, H) >= 600;
    const placement = place({
        W,
        H,
        insets,
        opening: lit,
        tab: tabX !== null ? { x: tabX, atBottom } : null,
        speaker,
        bubbleH,
        wide,
        panel: panel ? { h: bubbleH } : null,
    });
    // The pair watch what's being shown: the opening's centre, or the tab.
    const targetX = lit ? lit.x + lit.w / 2 : (tabX ?? W / 2);
    const lookOf = (who: Speaker) => (targetX < placement.feet[who].x ? 'left' : 'right');

    const last = isLastBeat(run);
    const invitation = step.id === 'invite' && run.beat === 'here';
    const finish = () => useTourStore.getState().finish();
    const next = invitation
        ? null
        : {
              label: last ? t('tour.done') : t('tour.next'),
              onPress: () => {
                  if (tab) router.navigate(TAB_ROUTE[tab]);
                  else if (last) finish();
                  else useTourStore.getState().next();
              },
          };
    const exit = { label: t(invitation ? 'tour.notNow' : 'tour.skip'), onPress: finish };
    const spec = opening ? targets[opening] : undefined;

    return (
        <Animated.View
            ref={rootRef}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none"
            accessibilityViewIsModal
            onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width !== W || height !== H) setSize({ W: width, H: height });
            }}
            testID="tour-layer"
        >
            <Scrim hole={lit} radius={(spec?.radius ?? 0) + PAD} W={W} H={H} color={raised ? tokens.scrimStrong : tokens.scrim} reduced={reduced} entrance={entrance} />
            <Ribbon curve={placement.ribbon} tokens={tokens} reduced={reduced} entrance={entrance} />
            {screenReader === true && lit && spec?.a11y && <Opening rect={lit} a11y={spec.a11y} />}
            {ready &&
                !panel &&
                (['doro', 'pomo'] as const).map((who) => (
                    <TourCharacter
                        key={who}
                        who={who}
                        role={who === speaker ? 'speaker' : 'listener'}
                        pose={who === speaker ? beat.face : 'listen'}
                        look={lookOf(who)}
                        feet={placement.feet[who]}
                        scale={placement.scale}
                        mouth={mouth}
                        talking={talking}
                        reduced={reduced}
                        shadow={tokens.stickerShadow}
                        arriveDelay={who === speaker ? 160 : 260}
                        entrance={entrance}
                    />
                ))}
            {ready && (
            <BubbleDock x={placement.bubble.x} y={placement.bubble.y} w={placement.bubble.w} reduced={reduced} delay={entrance ? 420 : 0}>
                <Bubble
                    tokens={tokens}
                    name={t(`tour.${speaker}`)}
                    chars={Array.from(text)}
                    shown={speaking.shown}
                    onTapLine={speaking.finish}
                    next={next}
                    exit={exit}
                    muted={muted}
                    onMute={() => useTourStore.getState().toggleMute()}
                    tailX={panel ? null : placement.tailX}
                    panel={panel ? { maxLineHeight: H * 0.3, badge: <Sticker art={BADGE[speaker]} width={36} shadow={tokens.stickerShadow} /> } : null}
                    lineRef={lineRef}
                    onLayout={(e) => {
                        const h = Math.round(e.nativeEvent.layout.height);
                        if (Math.abs(h - bubbleH) > 1) setBubbleH(h);
                    }}
                />
            </BubbleDock>
            )}
        </Animated.View>
    );
}

/** The bubble's place: it glides with the dock on the sheet curve, and fades in once (under Reduce Motion, only fades). */
function BubbleDock({ x, y, w, reduced, delay, children }: { x: number; y: number; w: number; reduced: boolean; delay: number; children: ReactNode }) {
    const px = useSharedValue(x);
    const py = useSharedValue(y);
    const shown = useSharedValue(0);
    const first = useRef(true);
    useEffect(() => {
        if (first.current || reduced) {
            px.set(x);
            py.set(y);
        } else {
            px.set(withTiming(x, { duration: GLIDE_MS, easing: EASE_SHEET }));
            py.set(withTiming(y, { duration: GLIDE_MS, easing: EASE_SHEET }));
        }
        if (first.current) {
            first.current = false;
            // On the entrance, after the pair have landed: the bubble is the last to arrive.
            shown.set(withDelay(reduced ? 0 : delay, withTiming(1, { duration: 220, easing: EASE_OUT })));
        }
    }, [x, y, px, py, shown, reduced, delay]);
    const style = useAnimatedStyle(() => ({
        opacity: shown.get(),
        transform: [{ translateX: px.get() }, { translateY: py.get() + (reduced ? 0 : 6 * (1 - shown.get())) }],
    }));
    return <Animated.View style={[styles.dock, { width: w }, style]}>{children}</Animated.View>;
}

/**
 * The dim: four panels around the opening, which take every touch, with nothing over the hole, and
 * one Svg that rounds the hole's corners (it takes none). The opening glides to the next control
 * on the sheet curve; under Reduce Motion a cover closes the old opening and the new one opens
 * (brief §5). With no opening (a lead), the hole closes and the whole page dims.
 */
function Scrim({
    hole,
    radius,
    W,
    H,
    color,
    reduced,
    entrance,
}: {
    hole: Rect | null;
    radius: number;
    W: number;
    H: number;
    color: string;
    reduced: boolean;
    entrance: boolean;
}) {
    const closed = { x: W / 2, y: H / 2, w: 0, h: 0 };
    const target = hole ?? closed;
    const r = hole ? Math.min(radius, hole.w / 2, hole.h / 2) : 0;
    const x = useSharedValue(target.x);
    const y = useSharedValue(target.y);
    const w = useSharedValue(target.w);
    const h = useSharedValue(target.h);
    const rr = useSharedValue(r);
    const cover = useSharedValue(0);
    const had = useRef(false);

    useEffect(() => {
        const opening = hole !== null;
        if (reduced) {
            if (had.current) {
                // Close the old opening, move while closed, open the new one.
                cover.set(withSequence(withTiming(1, { duration: FADE_MS }), withTiming(0, { duration: FADE_MS })));
                const jump = (v: number) => withDelay(FADE_MS, withTiming(v, { duration: 0 }));
                x.set(jump(target.x));
                y.set(jump(target.y));
                w.set(jump(target.w));
                h.set(jump(target.h));
                rr.set(jump(r));
            } else {
                x.set(target.x);
                y.set(target.y);
                w.set(target.w);
                h.set(target.h);
                rr.set(r);
            }
        } else {
            const first = opening && !had.current;
            if (first && !entrance) {
                // A later screen: the opening is simply there as the layer fades in.
                x.set(target.x);
                y.set(target.y);
                w.set(target.w);
                h.set(target.h);
                rr.set(r);
                had.current = opening;
                return;
            }
            if (first) {
                // The first opening grows from its own centre.
                x.set(target.x + target.w / 2);
                y.set(target.y + target.h / 2);
                w.set(0);
                h.set(0);
                rr.set(0);
            }
            const to = (v: number) => withTiming(v, { duration: first ? 300 : GLIDE_MS, easing: first ? EASE_OUT : EASE_SHEET });
            x.set(to(target.x));
            y.set(to(target.y));
            w.set(to(target.w));
            h.set(to(target.h));
            rr.set(to(r));
        }
        had.current = opening;
    }, [target.x, target.y, target.w, target.h, r, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

    // Childless, absolutely placed views: animating their frame re-lays out nothing else (animate-expo §4).
    const top = useAnimatedStyle(() => ({ left: 0, top: 0, width: W, height: Math.max(0, y.get()) }));
    const bottom = useAnimatedStyle(() => ({ left: 0, top: y.get() + h.get(), width: W, height: Math.max(0, H - y.get() - h.get()) }));
    const left = useAnimatedStyle(() => ({ left: 0, top: y.get(), width: Math.max(0, x.get()), height: h.get() }));
    const right = useAnimatedStyle(() => ({ left: x.get() + w.get(), top: y.get(), width: Math.max(0, W - x.get() - w.get()), height: h.get() }));
    const coverStyle = useAnimatedStyle(() => ({
        left: x.get(),
        top: y.get(),
        width: w.get(),
        height: h.get(),
        borderRadius: rr.get(),
        opacity: cover.get(),
    }));
    const corners = useAnimatedProps(() => {
        const X = x.get();
        const Y = y.get();
        const Wd = w.get();
        const Ht = h.get();
        const R = Math.max(0, Math.min(rr.get(), Wd / 2, Ht / 2));
        const rect = `M ${X} ${Y} H ${X + Wd} V ${Y + Ht} H ${X} Z`;
        const round =
            `M ${X + R} ${Y} H ${X + Wd - R} A ${R} ${R} 0 0 1 ${X + Wd} ${Y + R} V ${Y + Ht - R} ` +
            `A ${R} ${R} 0 0 1 ${X + Wd - R} ${Y + Ht} H ${X + R} A ${R} ${R} 0 0 1 ${X} ${Y + Ht - R} V ${Y + R} A ${R} ${R} 0 0 1 ${X + R} ${Y} Z`;
        return { d: `${rect} ${round}` };
    });
    const block = () => true;
    return (
        <>
            {[top, bottom, left, right].map((s, i) => (
                <Animated.View
                    key={i}
                    style={[styles.panel, { backgroundColor: color }, s]}
                    onStartShouldSetResponder={block}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    testID="tour-scrim"
                />
            ))}
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <AnimatedPath animatedProps={corners} fill={color} fillRule="evenodd" />
            </Svg>
            <Animated.View style={[styles.panel, { backgroundColor: color }, coverStyle]} pointerEvents="none" />
        </>
    );
}

/** With VoiceOver on: the opening as the control itself, with its label and role, acting as it (T-1). */
export function Opening({ rect, a11y }: { rect: Rect; a11y: NonNullable<TourTargetSpec['a11y']> }) {
    const actions =
        a11y.role === 'adjustable'
            ? [{ name: 'increment' as const }, { name: 'decrement' as const }]
            : [{ name: 'activate' as const }];
    const onAction = (e: AccessibilityActionEvent) => {
        if (e.nativeEvent.actionName === 'increment') a11y.onIncrement?.();
        else if (e.nativeEvent.actionName === 'decrement') a11y.onDecrement?.();
        else a11y.onActivate?.();
    };
    return (
        <View
            accessible
            accessibilityRole={a11y.role}
            accessibilityLabel={a11y.label}
            accessibilityValue={a11y.value ? { text: a11y.value } : undefined}
            accessibilityActions={actions}
            onAccessibilityAction={onAction}
            onAccessibilityTap={a11y.onActivate}
            style={[styles.opening, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}
            testID="tour-opening"
        />
    );
}

const styles = StyleSheet.create({
    panel: { position: 'absolute' },
    dock: { position: 'absolute', left: 0, top: 0 },
    opening: { position: 'absolute' },
});
