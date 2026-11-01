import { useEffect, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions, type AccessibilityActionEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
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
        /** `text` for a region (today's row, the week): read, not acted on (review C-1). */
        role: 'button' | 'adjustable' | 'text';
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
/** On the entrance the bubble arrives after the pair have landed. */
const BUBBLE_DELAY_MS = 420;
/** How long a beat waits for its opening's frame before it goes on with the whole page dimmed. */
const MEASURE_WAIT_MS = 600;
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const GLIDE_MS = 420;
const FADE_MS = 150;

/** The corner masks' drawn size: one quarter of a square less its circle, scaled to each radius. */
const CORNER = 64;
const CORNER_PATH = `M0 0 H${CORNER} A${CORNER} ${CORNER} 0 0 0 0 ${CORNER} Z`;
/** The bubble fades in over this long; the line waits for it (review M-2). */
const BUBBLE_FADE_MS = 220;

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
    const [hole, setHole] = useState<{ key: string; rect: Rect } | null>(null);
    // The dock didn't fit: the panel from then on.
    const [squeezed, setSqueezed] = useState(false);
    // Which beat the bubble's height was measured for: a new line's height comes a frame or two after
    // its beat starts, and placing from the old one would set off and retarget (row 6, second pass).
    const [bubbleFor, setBubbleFor] = useState('');
    const [bubbleWaited, setBubbleWaited] = useState('');
    // The beat whose opening has been waited for long enough (MEASURE_WAIT_MS).
    const [waited, setWaited] = useState<string | null>(null);
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
                    const bottomLimit = H - insets.bottom - (panel || squeezed ? bubbleH + 36 : 12);
                    const delta = r.y + r.h > bottomLimit ? r.y + r.h - bottomLimit : r.y < insets.top + 8 ? r.y - insets.top - 8 : 0;
                    if (delta !== 0 && scrollBy && scrolled.current !== beatKey) {
                        scrolled.current = beatKey;
                        scrollBy(delta);
                        timers.push(setTimeout(measure, 420));
                    }
                    setHole((prev) => (prev && prev.key === beatKey && sameRect(prev.rect, r) ? prev : { key: beatKey, rect: r }));
                });
            });
        };
        timers.push(setTimeout(measure, 30), setTimeout(measure, 260), setTimeout(measure, 700));
        return () => timers.forEach(clearTimeout);
        // `targets` is a fresh object each host render; the refs inside it are stable.
    }, [opening, beatKey, W, H, panel, squeezed, bubbleH]); // eslint-disable-line react-hooks/exhaustive-deps

    const context: LineContext = { audience, replay: !!run?.replay, goalOn, flyAvailable: isFlyModeAvailable(), weekEmpty };
    const line = beat ? beat.line(context) : null;
    const names = Object.fromEntries(Object.entries(line?.names ?? {}).map(([k, key]) => [k, t(key)]));
    const text = line ? t(line.key, names) : '';
    const speaker: Speaker = step?.speaker ?? 'pomo';
    // The line waits until its bubble is seen: after the entrance's landing and the bubble's fade,
    // and while a beat is pending (its opening or its bubble not yet measured), with the rest.
    const pendingNow =
        (!!opening && !(hole?.key === beatKey) && waited !== beatKey) || (bubbleFor !== beatKey && bubbleWaited !== beatKey);
    const [voiced, setVoiced] = useState(false);
    const speaking = useSpeaking(text, speaker, { instant: screenReader === true, hold: screenReader === null || !voiced || pendingNow, reduced, mouth, talking });

    // The pair and the bubble arrive once the opening is found, so they never start somewhere
    // else and slide; a control that can't be measured still gets its beat, the whole page dimmed.
    // Once arrived they stay for the layer's life, gliding from beat to beat.
    const [arrived, setArrived] = useState(false);
    // The last settled placement, held while a new opening is measured.
    const [held, setHeld] = useState<{ placement: ReturnType<typeof place>; lit: Rect | null; targetX: number; speaker: Speaker } | null>(null);
    const [heldKey, setHeldKey] = useState('');
    // Whether this layer plays the run's entrance, fixed when it mounts (the run marks it played).
    const [entrance] = useState(() => !useTourStore.getState().run?.introduced);
    useEffect(() => {
        if (!arrived) return;
        useTourStore.getState().markIntroduced();
        const id = setTimeout(() => setVoiced(true), (entrance && !reduced ? BUBBLE_DELAY_MS : 0) + BUBBLE_FADE_MS);
        return () => clearTimeout(id);
        // Once, on arrival: the entrance and Reduce Motion are read then.
    }, [arrived]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const id = setTimeout(() => setWaited(beatKey), MEASURE_WAIT_MS);
        // A line of the same height lays out with no event: after 120 ms the height is taken as known.
        const known = setTimeout(() => setBubbleWaited(beatKey), 120);
        return () => {
            clearTimeout(id);
            clearTimeout(known);
        };
    }, [beatKey]);

    // Each beat moves VoiceOver's focus to the bubble (iOS has no live regions), once the beat has
    // settled, so the line is read under its own speaker's name.
    useEffect(() => {
        if (!screenReader || pendingNow) return;
        const id = setTimeout(() => {
            if (lineRef.current) AccessibilityInfo.sendAccessibilityEvent(lineRef.current, 'focus');
        }, 150);
        return () => clearTimeout(id);
    }, [beatKey, screenReader, arrived, pendingNow]);

    if (!run || !beat || !step) return null;
    // This beat's opening, once measured; a lead has none, and the whole page dims.
    const lit = opening && hole?.key === beatKey ? hole.rect : null;
    // Until a new opening is found the pair, the bubble, the ribbon and the dim hold where they are,
    // so nothing sets off towards the last control (review M-6); a control that can't be measured
    // still gets its beat after MEASURE_WAIT_MS, the whole page dimmed.
    const pending = pendingNow;
    const ready = arrived || !(!!opening && !lit && waited !== beatKey);
    if (ready && !arrived) setArrived(true);

    const atBottom = insets.bottom >= 44;
    const tabX = tab ? tabCentre(W, insets, TAB_INDEX[tab], TAB_COUNT, atBottom) : null;
    const wide = W > H || Math.min(W, H) >= 600;
    // The dock, unless it can't fit even at half size: then the bottom panel, for good (review H-1).
    const asPanel = panel || squeezed;
    const fresh = place({
        W,
        H,
        insets,
        opening: lit,
        tab: tabX !== null ? { x: tabX, atBottom } : null,
        speaker,
        bubbleH,
        wide,
        panel: asPanel ? { h: bubbleH } : null,
    });
    if (fresh.overflow && !squeezed) setSqueezed(true);
    // The pair watch what's being shown: the opening's centre, or the tab.
    const targetX = lit ? lit.x + lit.w / 2 : (tabX ?? W / 2);
    const frame = { placement: fresh, lit, targetX, speaker };
    const frameKey = JSON.stringify(frame);
    if (!pending && heldKey !== frameKey) {
        setHeld(frame);
        setHeldKey(frameKey);
    }
    const shown = pending && held ? held : frame;
    const placement = shown.placement;
    const lookOf = (who: Speaker) => (shown.targetX < placement.feet[who].x ? 'left' : 'right');

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
            entering={FadeIn.duration(200).easing(EASE_OUT)}
            exiting={FadeOut.duration(200).easing(EASE_OUT)}
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none"
            accessibilityViewIsModal
            onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width !== W || height !== H) setSize({ W: width, H: height });
            }}
            testID="tour-layer"
        >
            <Scrim
                hole={shown.lit}
                radius={(spec?.radius ?? 0) + PAD}
                W={W}
                H={H}
                color={raised ? tokens.scrimStrong : tokens.scrim}
                outline={tokens.ringFocus}
                reduced={reduced}
                entrance={entrance}
            />
            <Ribbon curve={placement.ribbon} tokens={tokens} reduced={reduced} entrance={entrance} />
            {/* For VoiceOver, Voice Control and Switch Control alike (review H-2); it takes no touch,
                so a finger still reaches the real control through the hole. */}
            {lit && spec?.a11y && <Opening rect={lit} a11y={spec.a11y} />}
            {ready &&
                !asPanel &&
                (['doro', 'pomo'] as const).map((who) => (
                    <TourCharacter
                        key={who}
                        who={who}
                        role={who === shown.speaker ? 'speaker' : 'listener'}
                        pose={who === shown.speaker ? (pending ? 'listen' : beat.face) : 'listen'}
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
            <BubbleDock x={placement.bubble.x} y={placement.bubble.y} w={placement.bubble.w} reduced={reduced} delay={entrance ? BUBBLE_DELAY_MS : 0}>
                <Bubble
                    tokens={tokens}
                    name={t(`tour.${shown.speaker}`)}
                    speaker={shown.speaker}
                    chars={Array.from(text)}
                    shown={speaking.shown}
                    onTapLine={speaking.finish}
                    next={next}
                    exit={exit}
                    muted={muted}
                    onMute={() => useTourStore.getState().toggleMute()}
                    tailX={asPanel ? null : placement.tailX}
                    reduced={reduced}
                    panel={asPanel ? { maxLineHeight: H * 0.3, badge: <Sticker art={BADGE[shown.speaker]} width={36} shadow={tokens.stickerShadow} /> } : null}
                    lineRef={lineRef}
                    onLayout={(e) => {
                        const h = Math.round(e.nativeEvent.layout.height);
                        if (Math.abs(h - bubbleH) > 1) setBubbleH(h);
                        if (bubbleFor !== beatKey) setBubbleFor(beatKey);
                    }}
                />
            </BubbleDock>
            )}
        </Animated.View>
    );
}

/**
 * The bubble's place: it glides with the dock on the sheet curve and fades in once. Under Reduce
 * Motion a real move dips out and back in on the opening's 150 + 150 ms, moving while hidden, so it
 * never stands at the next control while the last one is lit (review H-6, M-14).
 */
function BubbleDock({ x, y, w, reduced, delay, children }: { x: number; y: number; w: number; reduced: boolean; delay: number; children: ReactNode }) {
    const reducedRef = useRef(reduced);
    useEffect(() => {
        reducedRef.current = reduced;
    }, [reduced]);
    const px = useSharedValue(x);
    const py = useSharedValue(y);
    const shown = useSharedValue(0);
    const dip = useSharedValue(1);
    const was = useRef<{ x: number; y: number } | null>(null);
    useEffect(() => {
        const prev = was.current;
        was.current = { x, y };
        if (!prev) {
            px.set(x);
            py.set(y);
            // On the entrance, after the pair have landed: the bubble is the last to arrive.
            shown.set(withDelay(reducedRef.current ? 0 : delay, withTiming(1, { duration: BUBBLE_FADE_MS, easing: EASE_OUT })));
            return;
        }
        if (!reducedRef.current) {
            px.set(withTiming(x, { duration: GLIDE_MS, easing: EASE_SHEET }));
            py.set(withTiming(y, { duration: GLIDE_MS, easing: EASE_SHEET }));
            return;
        }
        if (Math.hypot(x - prev.x, y - prev.y) < 24) {
            px.set(x);
            py.set(y);
            return;
        }
        const jump = (v: number) => withDelay(FADE_MS, withTiming(v, { duration: 0 }));
        px.set(jump(x));
        py.set(jump(y));
        dip.set(withSequence(withTiming(0, { duration: FADE_MS, easing: EASE_OUT }), withTiming(1, { duration: FADE_MS, easing: EASE_OUT })));
        // The entrance's delay is read once, at the first placement.
    }, [x, y, px, py, shown, dip]); // eslint-disable-line react-hooks/exhaustive-deps
    const style = useAnimatedStyle(() => ({
        opacity: shown.get() * dip.get(),
        transform: [{ translateX: px.get() }, { translateY: py.get() + (reduced ? 0 : 6 * (1 - shown.get())) }],
    }));
    return <Animated.View style={[styles.dock, { width: w }, style]}>{children}</Animated.View>;
}

/**
 * The dim: four panels around the opening, which take every touch, with nothing over the hole;
 * four corner masks that round it; and the opening's own 2 pt `ringFocus` outline, so the lit
 * control reads however little the dim sets the page back (the owner, review F-1: Midnight Plum's
 * dim moves a dark control only about 1.2:1).
 *
 * - The panels are full-size solid views placed and sized by translate and scale, and the corners
 *   one static quarter shape scaled to the radius, so a glide is transforms only (review M-3, M-4).
 *   The outline is the one frame animated: a border can't scale without thickening, and it's a
 *   single childless, absolutely placed view, which re-lays out nothing else.
 * - The opening glides to the next control on the sheet curve. Under Reduce Motion a cover closes
 *   the old opening and the new one opens, the outline fading with it (brief §5).
 * - A lead has no opening: the hole closes about its own centre (M-9) and the whole page dims.
 */
function Scrim({
    hole,
    radius,
    W,
    H,
    color,
    outline,
    reduced,
    entrance,
}: {
    hole: Rect | null;
    radius: number;
    W: number;
    H: number;
    color: string;
    outline: string;
    reduced: boolean;
    entrance: boolean;
}) {
    const reducedRef = useRef(reduced);
    useEffect(() => {
        reducedRef.current = reduced;
    }, [reduced]);
    const last = useRef<Rect>({ x: W / 2, y: H / 2, w: 0, h: 0 });
    const r = hole ? Math.min(radius, hole.w / 2, hole.h / 2) : 0;
    const start = hole ?? { x: W / 2, y: H / 2, w: 0, h: 0 };
    const x = useSharedValue(start.x);
    const y = useSharedValue(start.y);
    const w = useSharedValue(hole ? hole.w : 0);
    const h = useSharedValue(hole ? hole.h : 0);
    const rr = useSharedValue(r);
    const cover = useSharedValue(0);
    const had = useRef(false);

    const key = hole ? `${hole.x},${hole.y},${hole.w},${hole.h},${r}` : 'none';
    useEffect(() => {
        const opening = hole !== null;
        // With no opening, the last one closes about its own centre.
        const prev = last.current;
        const target = hole ?? { x: prev.x + prev.w / 2, y: prev.y + prev.h / 2, w: 0, h: 0 };
        if (hole) last.current = hole;
        const set = (v: Rect, radius: number) => {
            x.set(v.x);
            y.set(v.y);
            w.set(v.w);
            h.set(v.h);
            rr.set(radius);
        };
        if (reducedRef.current) {
            if (had.current) {
                // Close the old opening, move while closed, open the new one.
                cover.set(withSequence(withTiming(1, { duration: FADE_MS, easing: EASE_OUT }), withTiming(0, { duration: FADE_MS, easing: EASE_OUT })));
                const jump = (v: number) => withDelay(FADE_MS, withTiming(v, { duration: 0 }));
                x.set(jump(target.x));
                y.set(jump(target.y));
                w.set(jump(target.w));
                h.set(jump(target.h));
                rr.set(jump(r));
            } else {
                set(target, r);
            }
        } else {
            const first = opening && !had.current;
            if (first && !entrance) {
                // A later screen: the opening is simply there as the layer fades in.
                set(target, r);
                had.current = opening;
                return;
            }
            if (first) {
                // The run's first opening grows from its own centre.
                set({ x: target.x + target.w / 2, y: target.y + target.h / 2, w: 0, h: 0 }, 0);
            }
            const to = (v: number) => withTiming(v, { duration: first ? 300 : GLIDE_MS, easing: first ? EASE_OUT : EASE_SHEET });
            x.set(to(target.x));
            y.set(to(target.y));
            w.set(to(target.w));
            h.set(to(target.h));
            rr.set(to(r));
        }
        had.current = opening;
        // `key` stands for the opening's numbers.
    }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

    // Full-size panels, placed and sized by transforms from their top-left corners.
    const top = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() - H }] }));
    const bottom = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() + h.get() }] }));
    const side = (left: boolean) => {
        'worklet';
        return {
            transform: [
                { translateX: left ? x.get() - W : x.get() + w.get() },
                { translateY: y.get() },
                { scaleY: Math.max(h.get() / H, 0.0001) },
            ],
        };
    };
    const left = useAnimatedStyle(() => side(true));
    const right = useAnimatedStyle(() => side(false));
    // The corners: one quarter shape, mirrored onto each corner and scaled to the radius.
    const corner = (cx: 0 | 1, cy: 0 | 1) => {
        'worklet';
        const R = Math.max(0, Math.min(rr.get(), w.get() / 2, h.get() / 2));
        const k = Math.max(R / CORNER, 0.0001);
        return {
            transform: [
                { translateX: x.get() + cx * w.get() },
                { translateY: y.get() + cy * h.get() },
                { scaleX: cx ? -k : k },
                { scaleY: cy ? -k : k },
            ],
        };
    };
    const tl = useAnimatedStyle(() => corner(0, 0));
    const tr = useAnimatedStyle(() => corner(1, 0));
    const bl = useAnimatedStyle(() => corner(0, 1));
    const br = useAnimatedStyle(() => corner(1, 1));
    const ring = useAnimatedStyle(() => {
        const Wd = w.get();
        const Ht = h.get();
        return {
            left: x.get(),
            top: y.get(),
            width: Wd,
            height: Ht,
            borderRadius: Math.max(0, Math.min(rr.get(), Wd / 2, Ht / 2)),
            // Gone once the hole has closed to nothing, and through Reduce Motion's crossfade.
            opacity: Wd > 4 && Ht > 4 ? 1 - cover.get() : 0,
        };
    });
    const coverStyle = useAnimatedStyle(() => ({
        left: x.get(),
        top: y.get(),
        width: w.get(),
        height: h.get(),
        borderRadius: rr.get(),
        opacity: cover.get(),
    }));
    const block = () => true;
    return (
        <>
            {[top, bottom, left, right].map((s, i) => (
                <Animated.View
                    key={i}
                    style={[styles.panel, { width: W, height: H, backgroundColor: color }, s]}
                    onStartShouldSetResponder={block}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    testID="tour-scrim"
                />
            ))}
            {[tl, tr, bl, br].map((s, i) => (
                <Animated.View key={`c${i}`} style={[styles.corner, s]} pointerEvents="none">
                    <Svg width={CORNER} height={CORNER}>
                        <Path d={CORNER_PATH} fill={color} />
                    </Svg>
                </Animated.View>
            ))}
            {reduced && <Animated.View style={[styles.cut, { backgroundColor: color }, coverStyle]} pointerEvents="none" />}
            <Animated.View style={[styles.cut, styles.ring, { borderColor: outline }, ring]} pointerEvents="none" testID="tour-outline" />
        </>
    );
}

/**
 * The opening as the control itself, with its label and role, acting as it (T-1), for every assistive
 * client: VoiceOver, Voice Control ("Tap Start focus") and Switch Control. It takes no touch, so a
 * finger reaches the real control under it. A region's opening is read only.
 */
export function Opening({ rect, a11y }: { rect: Rect; a11y: NonNullable<TourTargetSpec['a11y']> }) {
    const actions =
        a11y.role === 'adjustable'
            ? [{ name: 'increment' as const }, { name: 'decrement' as const }]
            : a11y.role === 'button'
              ? [{ name: 'activate' as const }]
              : undefined;
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
            pointerEvents="none"
            testID="tour-opening"
        />
    );
}

const styles = StyleSheet.create({
    panel: { position: 'absolute', left: 0, top: 0, transformOrigin: '0% 0%' },
    corner: { position: 'absolute', left: 0, top: 0, width: CORNER, height: CORNER, transformOrigin: '0% 0%' },
    cut: { position: 'absolute' },
    ring: { borderWidth: 2 },
    dock: { position: 'absolute', left: 0, top: 0 },
    opening: { position: 'absolute' },
});
