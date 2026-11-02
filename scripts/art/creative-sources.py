"""
creative-sources.py — the v1.4 App Store creative assets: a looping Header and Search Results video and
their stills (docs/implementations/2026-11-02-app-store-creative-assets.md).

The scene is the screenshots' "Morning to night" (scripts/art/store-sources.py, whose kit this imports):
cut-paper grounds in the theme's tokens, a paper hill, Pomo & Doro as die-cut stickers. It is a pure
function of the time t in one looping day (T seconds), drawn in two compositions at the same instant:
the header (21:9), Pomo & Doro's day; the search (3:2), the timer in use, wordless. Because every
motion is periodic in T, frame N = T * FPS is frame 0, and the loop has no seam.

    frame_svg(comp, variant, t, scale)    one frame's SVG (comp: header | search; variant: diary | stickers | page)

Rendering and encoding are scripts/art/creative-build.py's; checking is scripts/art/creative-check.py's.
Contract as store-sources.py's: in the tokens, the strings it never shows, the Baloo 2 subset (the timer's
digits only), the shipped art; out pure SVG text, every number rounded to 2 decimals.
"""
import importlib.util
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('store_sources', os.path.join(HERE, 'store-sources.py'))
K = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(K)

L, D, f = K.LIGHT, K.DARK, K.f
SIZES = {'header': (3840, 1646), 'search': (3840, 2560), 'universal': (5244, 2950)}
# Each loop's scale from SIZES (the frame it is drawn in) to the video. Apple takes search videos from 1920 x 1280
# to 3840 x 2560, but at 3840 x 2560 an H.264 frame is 38,400 macroblocks, past level 5.2's 36,864, so it must
# be level 6.0, and the GPU decoders browsers and phones use (4096 x 2304 at most) garble it. 3456 x 2304 is the
# largest 3:2 frame they all take (level 5.1), drawn at that size, not scaled. The stills keep SIZES: images
# have no such limit.
LOOP_SCALE = {'header': 1.0, 'search': 0.9}
VARIANT = 'stickers'  # the search composition the owner chose: "B: die-cut stickers"
# The poster frames, as frame numbers (one per video asset, set by the owner in Asset Library), and the stills
# made from them, so each still is exactly a frame of its loop: the header in the morning, the pair at work
# under the name (1.8 s); the search as the pair celebrate the third sticker, the Ring still at 00:00, the
# placement's bits just cleared (11.2 s).
POSTER_FRAME = {'header': 54, 'search': 336, 'universal': 336}
HEADER_LOCKUP_W, HEADER_LOCKUP_Y = 1150, 785  # the lockup on the header: its width and its centre's height
M = K.KIT['motion']

# ---------------------------------------------------------------------------------------------
# The day, in seconds. Four focus sessions, each a 25-minute focus shown as a time-lapse sweep of the
# Ring, then its sticker pressed onto today's row; the goal; night; today's page turning; the wake.

T, FPS = 20.0, 30
N = int(T * FPS)
SESSIONS = [(0.6, 3.4), (4.2, 7.0), (7.8, 10.6), (11.4, 14.2)]  # (sweep starts, sticker lands)
GOAL_AT = 14.6       # the goal flag joins today's row (four sessions, the day's goal)
TURN = (17.6, 18.6)  # today's page turns at night: the next morning's row is empty
WAVE_AT = 18.9       # the wake: a wave hello, 2.5 swings
DORO_LAG = 0.12      # Doro answers a beat after Pomo
# The pair's looks over the day: (time, look). The day wraps, so before the first change the last holds.
LOOKS = [(0.6, 'focus'), (3.52, 'excited'), (4.2, 'focus'), (7.12, 'excited'), (7.8, 'focus'),
         (10.72, 'excited'), (11.4, 'focus'), (14.32, 'excited'), (15.6, 'sleepy'), (18.8, 'wave'), (19.95, 'rest')]
# Blinks on open eyes (the kit's 110 ms, at fixed times so the loop is exact).
BLINKS = {'pomo': [0.25, 2.1, 5.5, 9.0, 12.6], 'doro': [2.7, 6.3, 9.9, 13.2]}
# The breath: the kit's 3.4 s and 4.1 s, rounded to divide the day (20 s / 6 and / 5) so the loop is exact.
BREATH = {'pomo': T / 6, 'doro': T / 5}
FEET = K.KIT['feet']


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def smooth(u):
    return u * u * (3 - 2 * u)


def window(p, a, b):
    return clamp((p - a) / (b - a))


def f4(v):
    """A moving scale or angle to four places. f's two would step a ±1.2 % breath in whole percents, a twitch."""
    s = f'{v:.4f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def mix(a, b, k):
    """Colour a blended k (0–1) of the way to b; '#RRGGBBAA' colours blend their alpha too."""
    (ca, aa), (cb, ab) = K.split_alpha(a), K.split_alpha(b)
    out = '#' + ''.join(f'{round(int(ca[i:i + 2], 16) * (1 - k) + int(cb[i:i + 2], 16) * k):02X}' for i in (1, 3, 5))
    return out + (f'{round(255 * (aa * (1 - k) + ab * k)):02X}' if len(a) == 9 or len(b) == 9 else '')


def squash(p):
    """The kit's change: the height scale at progress p of its 280 ms (smoothstep between the keys)."""
    k = M['change']['keys']
    for i in range(1, len(k)):
        if p <= k[i]['at']:
            u = (p - k[i - 1]['at']) / (k[i]['at'] - k[i - 1]['at'])
            return k[i - 1]['sy'] + (k[i]['sy'] - k[i - 1]['sy']) * smooth(u)
    return 1.0


def spring(t, duration=0.45, zeta=0.75):
    """The app's placement spring (450 ms, damping 0.75) as an underdamped oscillator settling in its duration."""
    if t <= 0:
        return 0.0
    zw = math.log(50) / duration
    w = zw / zeta
    wd = w * math.sqrt(1 - zeta * zeta)
    return 1 - math.exp(-zw * t) * (math.cos(wd * t) + zw / wd * math.sin(wd * t))


def wave_angle(t):
    """The kit's wave t s into it: 2.5 swings between -16 and +12 degrees about their middle, where the hand
    rests before and after, so it never jumps."""
    w = M['wave']
    mid, amp = sum(w['degrees']) / 2, (w['degrees'][1] - w['degrees'][0]) / 2
    length = w['periodMs'] / 1000 * w['cycles']
    if t < 0 or t >= length:
        return mid
    return mid - amp * math.sin(2 * math.pi * t / (w['periodMs'] / 1000))


def look_at(who, t):
    """(previous look, current look, seconds since the change) at t, wrapping round the day."""
    lag = DORO_LAG if who == 'doro' else 0
    changes = [(c + lag, look) for c, look in LOOKS]
    t = t % T
    past = [(c, look) for c, look in changes if c <= t]
    if past:
        c, cur = past[-1]
        prev = (past[-2] if len(past) > 1 else (changes[-1][0] - T, changes[-1][1]))[1]
        return prev, cur, t - c
    c, cur = changes[-1]
    return changes[-2][1], cur, t - (c - T)


def blinking(who, t):
    t = t % T
    return any(b <= t < b + M['blink']['closedMs'] / 1000 for b in BLINKS[who])


# ---------------------------------------------------------------------------------------------
# Pomo & Doro: one tour-kit body each, its face and accessories changing, moved smoothly
#
# Every look is built from the same tour-kit layers (body-cut, hand, body-fill, eyes, mouth), so a change
# never swaps the body: only the face crosses over (the kit's face-out and face-in windows) and accessories
# fade in or out. Nothing jumps between frames. The motion is continuous: the breath (deeper asleep), a
# gentle sway while they study, a hop on every sticker that lands, a stretch before the wave at dawn.

# The looks and their faces: (eyes, mouth). 'focus' looks toward the middle of the frame (Pomo right, Doro left).
FACES = {'rest': ('open', 'smile'), 'focus': (None, 'smile'), 'excited': ('sparkle', 'grin'),
         'sleepy': ('blink', 'smile'), 'wave': ('smile', 'grin')}
OPEN_EYES = {'open', 'look-left', 'look-right'}
HOP = 0.75        # a celebration hop's length (s): it ends as the next focus begins, so one squash hands to the next
# The kit's change (squash and face crossover) played over 450 ms, the app's placement spring, not its 280 ms:
# at 30 fps the kit's 8 % squash in 70 ms is two frames, a jolt on an 820-px character; the app runs at 120 Hz.
CHANGE = 0.45
SLEEP, WAKE = 15.6, 18.8


def _paths_where(paths, test):
    out = []
    for p in paths:
        n = [float(x) for x in K.NUM_RE.findall(p[0])]
        if test(min(n[0::2]), max(n[0::2]), min(n[1::2]), max(n[1::2])):
            out.append(p)
    return out


def pencil(who):
    """The focusing pose's pencil (its paths below and right of the face), on the kit's artboard."""
    return _paths_where(K.pose(who, 'focusing'), lambda x0, x1, y0, y1: x0 >= 285 and y0 >= 360)


def zz(who):
    """The sleepy pose's Zz (the cocoa marks above the head, top right), in night milk."""
    return [(d, D['inkSoft'], e, o) for d, c, e, o in _paths_where(K.pose(who, 'sleepy'), lambda x0, x1, y0, y1: x0 > 380 and y1 < 170)]


def eyes_for(who, look):
    eyes = FACES[look][0]
    return eyes or ('look-right' if who == 'pomo' else 'look-left')


def face(who, look, t):
    """The eyes and mouth layers of a look at t, blinking on open eyes at the fixed blink times."""
    eyes = eyes_for(who, look)
    if eyes in OPEN_EYES and blinking(who, t):
        eyes = 'blink'
    return (K.art(f'art/out/illustration/{who}-tour-eyes-{eyes}.svg') + K.art(f'art/out/illustration/{who}-tour-mouth-{FACES[look][1]}.svg'))






def presence(who, look, t, fade=0.2):
    """How present a look's accessory is at t (0–1): eased in after the look starts, out before it ends."""
    lag = DORO_LAG if who == 'doro' else 0
    changes = sorted(c + lag for c, _ in LOOKS)
    t = t % T
    best = 0.0
    for i, (c, l) in enumerate(LOOKS):
        if l != look:
            continue
        a = c + lag
        b = (LOOKS[(i + 1) % len(LOOKS)][0] + lag) + (T if i + 1 == len(LOOKS) else 0)
        for shift in (0, -T, T):
            u = t - shift
            if a <= u < b:
                best = max(best, smooth(clamp((u - a) / fade)) * smooth(clamp((b - u) / fade)))
    return best


def envelope(t, a, b, ramp=0.4):
    """1 between a and b (seconds, wrapping), easing in and out over `ramp`."""
    t = t % T
    best = 0.0
    for shift in (0, -T, T):
        u = t - shift
        best = max(best, smooth(clamp((u - a) / ramp)) * smooth(clamp((b - u) / ramp)))
    return best


# The hop's height scale over its length (0–1), eased between keys like the kit's change: an anticipation
# squash, a stretch on take-off, round in the air, a landing squash, a little rebound, rest.
HOP_KEYS = [(0, 1.0), (0.2, 0.95), (0.34, 1.04), (0.5, 1.0), (0.62, 1.0), (0.74, 0.96), (0.88, 1.006), (1, 1.0)]


def keyed(keys, u):
    for i in range(1, len(keys)):
        if u <= keys[i][0]:
            a, b = keys[i - 1], keys[i]
            return a[1] + (b[1] - a[1]) * smooth((u - a[0]) / (b[0] - a[0]))
    return keys[-1][1]


# How high each hops, in body sizes: Doro, the heavier blob, a little lower than Pomo so the pair never mirror.
# The day's last focus reaches the goal: a longer, higher hop with a hand up (the cheer), as its sticker lands.
HOP_RISE = {'pomo': 0.10, 'doro': 0.085}
GOAL_RISE = {'pomo': 0.13, 'doro': 0.11}
GOAL_HOP = 0.95
CHEER_DEG = 24  # the cheer's hand, held up at the kit's raise (the wave swings 8–36 about it)


def hop(who, t, size):
    """(rise in px, height scale, hopping, cheer 0–1) of the celebration hop after each sticker lands; smooth
    throughout. The cheer is how far the hand is up, in the goal's hop only."""
    lag = DORO_LAG if who == 'doro' else 0
    t = t % T
    for i, (_, land) in enumerate(SESSIONS):
        goal = i == len(SESSIONS) - 1
        u = (t - land - 0.05 - lag) / (GOAL_HOP if goal else HOP)
        if 0 <= u < 1:
            air = clamp((u - 0.26) / 0.44)
            rise = math.sin(math.pi * air) * (GOAL_RISE if goal else HOP_RISE)[who] * size
            cheer = smooth(clamp((u - 0.12) / 0.16)) * (1 - smooth(clamp((u - 0.7) / 0.18))) if goal else 0.0
            return rise, keyed(HOP_KEYS, u), True, cheer
    return 0.0, 1.0, False, 0.0


def stretch(who, t):
    """The waking stretch at dawn: tall for a moment before the wave."""
    lag = DORO_LAG if who == 'doro' else 0
    u = ((t % T) - WAKE - lag) / 0.5
    return 1 + 0.07 * math.sin(math.pi * u) if 0 <= u < 1 else 1.0


def lift_of(paths, shadow, unit):
    colour, alpha = K.split_alpha(shadow)
    layer = 1 - (1 - alpha) ** (1 / 3)
    out = [f'<g transform="translate({f(unit)} {f(2 * unit)})">']
    for reach in (0, 1, 2):
        stroke = f' stroke="{colour}" stroke-width="{f(reach * 2 * unit)}" stroke-linejoin="round"' if reach else ''
        out.append(f'<g opacity="{f(layer)}">')
        for d, _, evenodd, _ in paths:
            rule = ' fill-rule="evenodd"' if evenodd else ''
            out.append(f'<path d="{d}" fill="{colour}"{stroke}{rule}/>')
        out.append('</g>')
    out.append('</g>')
    return ''.join(out)


def character(who, t, cx, ground_y, size, night):
    """Pomo or Doro standing on ground_y at time t; `night` (0–1) is how far their edge and lift have taken the
    night's tokens."""
    prev, cur, since = look_at(who, t)
    p = clamp(since / CHANGE)
    rise, hop_sy, hopping, cheer = hop(who, t, size)
    # One squash at a time: the hop's when it hops, the waking stretch's when they wake, else the change's.
    sc = squash(p) if p < 1 and not hopping and cur != 'wave' else 1.0
    asleep = envelope(t, SLEEP, WAKE + 0.1)
    awake = 1 - asleep
    amp = M['breath']['amplitude'] * (1 + 1.2 * asleep)
    b = 1 + amp * math.sin(2 * math.pi * (t % T) / BREATH[who])
    relax = 1 - 0.05 * asleep
    sy = sc * b * hop_sy * relax * stretch(who, t)
    sx = 1 / sy
    sway = 1.6 * awake * presence(who, 'focus', t, 0.5) * math.sin(2 * math.pi * (t % T) / (T / 5) + (0 if who == 'pomo' else math.pi / 2))
    fx, fy = FEET[who]
    s = size / 512
    x0, y0 = cx - fx * s, ground_y + size * 0.03 - fy * s - rise
    shadow = mix(L['stickerShadow'], D['stickerShadow'], night)
    edge = {'#ffffff': mix(L['stickerEdge'], D['stickerEdge'], night)} if night > 0 else None
    unit = 512 / 48

    lag = DORO_LAG if who == 'doro' else 0
    hand = None
    if cur == 'wave' or (prev == 'wave' and p < 1):
        side = 'wave-left' if who == 'pomo' else 'wave-right'
        # Seconds since they woke, wrapping: Doro's lag carries the wave and the hand's going past the seam.
        dawn = ((t % T) - WAKE - lag) % T
        grow = smooth(clamp(dawn / 0.18)) * (1 - smooth(clamp((dawn - (LOOKS[-1][0] - 0.1 - WAKE)) / 0.15)))
        hand = _hand(who, side, 24 + wave_angle(dawn - (WAVE_AT - WAKE)), grow)
    elif cheer > 0.001:
        # The goal's cheer: the wave hand held high, with a little shake while they're in the air.
        side = 'wave-left' if who == 'pomo' else 'wave-right'
        hand = _hand(who, side, CHEER_DEG + 6 * math.sin(2 * math.pi * (t % T) / (M['wave']['periodMs'] / 1000)) * cheer, cheer)
    cut = K.art(f'art/out/illustration/{who}-tour-body-cut.svg')
    fill = K.art(f'art/out/illustration/{who}-tour-body-fill.svg')
    pen = presence(who, 'focus', t)
    zs = presence(who, 'sleepy', t, 0.4)

    out = [f'<g transform="translate({f(x0)} {f(y0)}) scale({f(s)}) translate({fx} {fy}) rotate({f4(sway)}) scale({f4(sx)} {f4(sy)}) translate({-fx} {-fy})">']
    silhouette = cut + (hand or [])
    out.append(lift_of(silhouette, shadow, unit))
    out.append(K.paths_svg(cut, edge))
    if hand:
        out.append(K.paths_svg(hand, edge))
    out.append(K.paths_svg(fill))
    if p < 1:
        a_out = 1 - smooth(window(p, *M['change']['faceOut']))
        a_in = smooth(window(p, *M['change']['faceIn']))
        out.append(f'<g opacity="{f(a_out)}">{K.paths_svg(face(who, prev, t))}</g>')
        out.append(f'<g opacity="{f(a_in)}">{K.paths_svg(face(who, cur, t))}</g>')
    else:
        out.append(K.paths_svg(face(who, cur, t)))
    if pen > 0.001:
        out.append(f'<g opacity="{f(pen)}">{lift_of(pencil(who), shadow, unit)}{K.paths_svg(pencil(who), edge)}</g>')
    if zs > 0.001:
        # The Zz drift up and out, again and again, while they sleep: each drift fades in and out, so none pops.
        u = ((t % T) - SLEEP) / 1.6 % 1.0
        out.append(f'<g opacity="{f(zs * smooth(clamp(u / 0.25)) * (1 - smooth(clamp((u - 0.6) / 0.4))))}" transform="translate({f(10 * u)} {f(-40 * u)})">{K.paths_svg(zz(who))}</g>')
    out.append('</g>')
    return ''.join(out)


def _hand(who, side, degrees, grow):
    """The tour kit's wave hand held `degrees` away from the head about its pivot, grown from its root: from
    nothing at grow 0, so it never pops in or out."""
    if grow <= 0.001:
        return []
    (px_, py_), (ax, ay) = K.KIT['hands'][who][side]['pivot'], K.KIT['hands'][who][side]['axis']
    a = math.radians(-degrees if 'left' in side else degrees)
    push = 14 * grow

    def fn(x, y):
        dx, dy = (x - px_) * grow, (y - py_) * grow
        return (px_ + dx * math.cos(a) - dy * math.sin(a) + ax * push, py_ + dx * math.sin(a) + dy * math.cos(a) + ay * push)
    return [(K.move_path(d, fn), c, e, o) for d, c, e, o in K.art(f'art/out/illustration/{who}-tour-hand-{side}.svg')]


def night_at(t):
    """How far into the night the pair's stickers are at t (0–1): their edge and lift take the night's tokens
    over half a second as the sleep begins, and give them back before the wake."""
    return envelope(t, 15.4, 18.9, 0.5)


# ---------------------------------------------------------------------------------------------
# The interface, wordless: the Ring and today's row in the app's geometry

HOLD = 0.65  # the finished Ring holds, full at 00:00, while the sticker presses on and its bits settle
FADE = 0.15  # then its arc fades as the next 25:00 comes in, ending as that focus starts (land + 0.8)
STEP, XF = 5, 0.15  # the readout counts down in 5-minute steps, each a 0.15-s crossfade: never a reading a frame
SEARCH_RING = (1040, 1180)  # the Ring in search: its centre's height and its diameter (px)


def search_sky(H):
    """Search's sky discs, (height, radius) in a frame H tall: a high band clear of the Ring (its top at 376)."""
    return 0.075 * H, 0.045 * H


def unsmooth(y):
    """The inverse of smooth on [0, 1]: where an eased sweep reaches y."""
    return 0.5 - math.sin(math.asin(1 - 2 * y) / 3)


def timer_state(t):
    """(arc 0-1, the arc's opacity, readings) at t, readings being [(text, opacity)], two while a step
    crossfades. Each session's 25 minutes is an eased sweep whose readout steps 25:00, 20:00 ... 00:00 as the
    arc passes each fifth; the finish holds while the sticker presses on, then fades as the next 25:00 comes in."""
    t = t % T
    for start, land in SESSIONS:
        if not start <= t < land + HOLD + FADE:
            continue
        span, n = land - start, 25 // STEP
        seq = [f'{25 - STEP * k:02d}:00' for k in range(n + 1)] + ['25:00']
        events = [(start + unsmooth(k / n) * span, XF) for k in range(1, n + 1)] + [(land + HOLD + FADE / 2, FADE)]
        readings = [(seq[sum(t >= at + w / 2 for at, w in events)], 1.0)]
        for i, (at, w) in enumerate(events):
            if at - w / 2 <= t < at + w / 2:
                u = smooth((t - at + w / 2) / w)
                readings = [(seq[i], 1 - u), (seq[i + 1], u)]
        if t < land:
            return smooth((t - start) / span), 1.0, readings
        return 1.0, 1 - smooth(clamp((t - land - HOLD) / FADE)), readings
    return 0.0, 1.0, [('25:00', 1.0)]


def instants(comp):
    """The scene's designed instant changes (s): the blinks shutting and opening. creative-check.py allows a
    sudden change nowhere else."""
    closed = M['blink']['closedMs'] / 1000
    return sorted(x for who in BLINKS for b in BLINKS[who] for x in (b, b + closed))


def ring(cx, cy, d, t, surface):
    """PhaseRing.tsx: a 5.5 % stroke on the ring track, the focus arc with round caps, the timer at 25 %. While a
    step crossfades, only the digits that change cross over: every reading is MM:00 in tabular figures, so a
    digit that stays (the 2 of 25 to 20, and ':00' always) stands still, drawn once, never dimming."""
    frac, opacity, readings = timer_state(t)
    stroke = d * 0.055
    r = (d - stroke) / 2
    out = [f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="none" stroke="{L["ringTrack"]}" stroke-width="{f(stroke)}"/>']
    if frac >= 0.9995 and opacity > 0.001:
        out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="none" stroke="{L["ringFocus"]}" stroke-width="{f(stroke)}" opacity="{f(opacity)}"/>')
    elif frac > 0.002:
        a0 = -math.pi / 2
        a1 = a0 + 2 * math.pi * frac
        out.append(f'<path d="M{f(cx + r * math.cos(a0))} {f(cy + r * math.sin(a0))} A{f(r)} {f(r)} 0 {1 if frac > 0.5 else 0} 1 {f(cx + r * math.cos(a1))} {f(cy + r * math.sin(a1))}" fill="none" stroke="{L["ringFocus"]}" stroke-width="{f(stroke)}" stroke-linecap="round"/>')
    size = d * 0.25
    y = cy + size * 0.31
    if len(readings) == 1:
        out.append(K.baloo(readings[0][0], cx, y, size, L['ink'], 'middle', tnum=True))
        return ''.join(out)
    # Tabular figures: each digit has one advance, so the two minute digits and ':00' have fixed slots.
    a = K.shape('0', size, 'SemiBold', 'en', True)[1]
    x0 = cx - K.shape('00:00', size, 'SemiBold', 'en', True)[1] / 2
    edges = [cx - d, x0 + a, x0 + 2 * a, cx + d]
    (was, u_was), (now, u_now) = readings
    for i in range(3):
        out.append(f'<clipPath id="d{i}"><rect x="{f(edges[i])}" y="{f(cy - d)}" width="{f(edges[i + 1] - edges[i])}" height="{f(2 * d)}"/></clipPath>')
        layers = [(now, 1.0)] if i == 2 or was[i] == now[i] else [(was, u_was), (now, u_now)]
        for text, op in layers:
            fade = f' opacity="{f(op)}"' if op < 1 else ''
            out.append(f'<g clip-path="url(#d{i})"{fade}>{K.baloo(text, cx, y, size, L["ink"], "middle", tnum=True)}</g>')
    return ''.join(out)


def bits(cx, cy, pt, p):
    """The placement's twelve paper bits (TodayStickers.tsx) p of the way through their 600 ms flight."""
    colours = [L['primary'], L['success'], L['ink'], L['accent']]
    e = 1 - (1 - p) ** 3
    out = []
    for i in range(12):
        angle = i / 12 * math.pi * 2 + (0.2 if i % 2 else -0.1)
        dist = 26 + (i % 3) * 8
        dx, dy = math.cos(angle) * dist * e * pt, (math.sin(angle) * dist - 6) * e * pt
        spin = (1 if i % 2 else -1) * (90 + i * 15) * e
        out.append(f'<rect x="{f(-3 * pt)}" y="{f(-4.5 * pt)}" width="{f(6 * pt)}" height="{f(9 * pt)}" rx="{f(2 * pt)}" fill="{colours[i % 4]}" opacity="{f(1 - p)}" transform="translate({f(cx + dx)} {f(cy + dy)}) rotate({f(spin)}) scale({f(1 - 0.4 * e)})"/>')
    return ''.join(out)


def today(cx, cy, pt, t, turn=True, goal_at=None):
    """Today's row without its label, in points of size pt: a sticker per finished focus, dashed cells owed,
    the goal once reached (a die-cut goal sticker at `goal_at`, px, or the app's small flag); the newest
    sticker pressed on with the app's placement; at night the page turns (a flip about the row's middle line)
    and the next morning's row is empty."""
    t = t % T
    cell = 34 * pt
    landed = [land for _, land in SESSIONS if land <= t]
    done = len(landed)
    flip = 1.0
    if TURN[0] <= t < TURN[1]:
        u = (t - TURN[0]) / (TURN[1] - TURN[0])
        flip = abs(math.cos(math.pi * smooth(u))) if turn else 1.0
        if u >= 0.5:
            done = 0
    elif t >= TURN[1]:
        done = 0
    goal = done == 4 and t >= GOAL_AT
    n = 4
    x0 = cx - n * cell / 2
    out = [f'<g transform="translate(0 {f(cy)}) scale(1 {f4(max(flip, 0.001))}) translate(0 {f(-cy)})">']
    for i in range(n):
        x = x0 + cell * (i + 0.5)
        who = 'pomo' if i % 2 == 0 else 'doro'
        if i < done:
            since = t - landed[i]
            if since < 0.6:
                out.append(bits(x, cy, pt, since / 0.6))
            k = spring(since)
            dy, sc, rot = -16 * pt * (1 - k), 1 + 0.35 * (1 - k), -10 * (1 - k)
            op = clamp(since / 0.12)
            # The placement moves the whole sticker, its lift too (TodayStickers.tsx's Animated.View), at four
            # places: the kit's sticker() rounds its scale to two, which would step the spring's settle.
            y = cy + dy
            out.append(f'<g opacity="{f(op)}" transform="translate({f(x)} {f(y)}) rotate({f4(rot)}) scale({f4(sc)}) translate({f(-x)} {f(-y)})">'
                       + K.sticker(K.pose(who, 'celebrating'), x, y, 28 * pt, L['stickerShadow'], point=pt) + '</g>')
        else:
            out.append(f'<circle cx="{f(x)}" cy="{f(cy)}" r="{f(12.25 * pt)}" fill="none" stroke="{L["edgeStrong"]}" stroke-width="{f(1.5 * pt)}" stroke-dasharray="{f(4.2 * pt)} {f(4.2 * pt)}"/>')
    if goal and goal_at:
        out.append(goal_sticker(*goal_at, pt, t))
    elif goal:
        g = smooth(clamp((t - GOAL_AT) / 0.25))
        gx = x0 + n * cell + 13 * pt
        s = 18 * pt / 24 * (0.6 + 0.4 * g)
        out.append(f'<g opacity="{f(g)}" transform="translate({f(gx - 12 * s)} {f(cy - 12 * s)}) scale({f(s)})">{K.paths_svg(K.icon("goal"), fill=L["successInk"])}</g>')
    out.append('</g>')
    return ''.join(out)


def goal_sticker(x, y, pt, t):
    """The day's goal, reached with its last focus: a round die-cut sticker carrying the app's goal flag, about a
    row sticker's size, slapped over the row's end with the placement move (TodayStickers.tsx's drop, scale and
    spring, and its twelve bits), landing at a jaunty 8 degrees."""
    since = (t % T) - GOAL_AT
    if since < 0:
        return ''
    k = spring(since)
    r, edge = 13 * pt, 2.2 * pt
    yy = y - 16 * pt * (1 - k)
    sc, rot = 1 + 0.35 * (1 - k), 8 - 18 * (1 - k)
    disc = f'<circle cx="{f(x)}" cy="{f(yy)}" r="{f(r + edge)}" fill="FILL"/>'
    s = 16 * pt / 24
    body = (_lift(disc, pt) + disc.replace('FILL', '#FFFFFF') + f'<circle cx="{f(x)}" cy="{f(yy)}" r="{f(r)}" fill="{L["success"]}"/>'
            + f'<g transform="translate({f(x - 12 * s)} {f(yy - 12 * s)}) scale({f(s)})">{K.paths_svg(K.icon("goal"), fill=L["successInk"])}</g>')
    out = bits(x, y, pt, since / 0.6) if since < 0.6 else ''
    return out + (f'<g opacity="{f(clamp(since / 0.12))}" transform="translate({f(x)} {f(yy)}) rotate({f4(rot)}) scale({f4(sc)}) '
                  f'translate({f(-x)} {f(-yy)})">{body}</g>')


# ---------------------------------------------------------------------------------------------
# The ground: the cut-paper day, five bands panning behind the pair, one band per hour

BAND = 1.25  # a band's width, in frame widths
EDGE_AT = 3.8  # the morning-to-noon edge crosses the frame's middle at 3.8 s; one edge every T / 5
# Each hour's cut, as (top, middle pull, bottom) offsets in frame widths: the screenshots' two sweeps alternating
# through the day, and the night coming in on a straight slash. Five, one per hour: alternating two by j mod 2
# would flip every cut at the seam, as five is odd.
LEANS = [(-0.03, 0.04, -0.025), (0.04, -0.035, 0.03), (-0.03, 0.04, -0.025), (0.04, -0.035, 0.03), (-0.04, 0.0, 0.04)]


# The brand lockup on the header (the owner: "Header only"): the horizontal lockup from the brand kit,
# copied unchanged from rehaul/v2 brand/svg (the choice-C drawing, 4471c22), colour by day, reversed at night.
LOCKUP = {'day': 'art/src/creative/brand-horizontal-colour.svg', 'night': 'art/src/creative/brand-horizontal-reversed.svg'}
LOCKUP_BOX = (1004, 160)  # its viewBox; the mark's frame is the full height, H


def lockup(cx, cy, width, night):
    """The horizontal lockup centred at cx, cy, `width` px wide (clear space H / 4 kept free by the layout)."""
    s = width / LOCKUP_BOX[0]
    paths = K.art(LOCKUP['night' if night else 'day'])
    return f'<g transform="translate({f(cx - width / 2)} {f(cy - LOCKUP_BOX[1] * s / 2)}) scale({f(s)})">{K.paths_svg(paths)}</g>'


def ground(W, H, t, hill_y, far_y, ids, over=None, sky_zone=None):
    """Bands j (tone j mod 5) side by side in the world, each with its own sky, far hill and near hill in its
    theme, and its own sun or moon; the world pans left one band every T / 5. Band edges are sweeping cuts.
    `over(night)` draws what each band carries on top in its own theme (the header's lockup), so the cut that
    brings the night recolours it as it passes. `sky_zone` (y, r) holds the sky's discs in a high band."""
    B = BAND * W
    s = B * (1 + ((t % T) - EDGE_AT) / (T / 5)) - W / 2
    tones = [L['page'], L['primarySoft'], L['primary'], D['primarySoft'], D['page']]
    out = []

    def edge_x(j, y):
        """Band j's left edge at height y: a sweeping cut, its lean set by the band's hour (j mod 5), so the
        world one day on (five bands) is the same world and the loop's seam doesn't move a cut."""
        a, b, c = LEANS[j % 5]
        u = y / H
        lean = a * (1 - u) ** 2 + b * 2 * u * (1 - u) + c * u * u
        return j * B - s + lean * W

    far = (f'M-60 {f(far_y + 30)} C{f(W * 0.25)} {f(far_y - 40)} {f(W * 0.45)} {f(far_y + 25)} {f(W * 0.62)} {f(far_y - 10)} '
           f'S{f(W * 0.9)} {f(far_y + 30)} {W + 60} {f(far_y - 20)} V{H + 60} H-60 Z')
    near = (f'M-60 {f(hill_y)} C{f(W * 0.3)} {f(hill_y - 50)} {f(W * 0.55)} {f(hill_y + 30)} {f(W * 0.75)} {f(hill_y - 15)} '
            f'S{f(W * 0.95)} {f(hill_y + 20)} {W + 60} {f(hill_y)} V{H + 60} H-60 Z')
    j0 = math.floor(s / B) - 1
    for j in range(j0, j0 + 4):
        ys = [-60 + (H + 120) * i / 24 for i in range(25)]  # the cut, sampled finely so it sweeps smoothly
        left = [edge_x(j, y) for y in ys]
        right = [edge_x(j + 1, y) + 6 for y in ys]  # overlaps the next band, drawn over it, so no hairline shows
        if right[12] < -200 or left[12] > W + 200:
            continue
        tone = j % 5
        th = L if tone < 3 else D
        clip = ids()
        region = f'M{f(left[0])} {f(ys[0])}' + ''.join(f' L{f(x)} {f(y)}' for x, y in zip(left[1:], ys[1:]))
        region += ''.join(f' L{f(x)} {f(y)}' for x, y in zip(reversed(right), reversed(ys))) + ' Z'
        out.append(f'<clipPath id="{clip}"><path d="{region}"/></clipPath><g clip-path="url(#{clip})">')
        out.append(f'<rect x="-60" y="-60" width="{W + 120}" height="{H + 120}" fill="{tones[tone]}"/>')
        out.append(sky(tone, j * B - s, B, W, H, hill_y, sky_zone))
        out.append(f'<path d="{far}" fill="{th["field"]}" stroke="{th["edge"]}" stroke-width="{f(W / 480)}"/>')
        out.append(f'<path d="{near}" fill="{th["paper"]}" stroke="{th["edge"]}" stroke-width="{f(W / 480)}"/>')
        if over:
            out.append(over(tone >= 3))
        out.append('</g>')
    return ''.join(out)


def sky(tone, x, B, W, H, hill_y, zone=None):
    """Each hour's paper sky: a strawberry morning sun, milk suns at noon and in the afternoon, a coral sun
    setting at dusk (the night's accent, a colour Pomo doesn't wear), the night's moon and stars; flat discs
    with a cut edge. With `zone` (y, r), as in search, every disc keeps to a high band clear of the Ring."""
    r = H * 0.075
    cut = W / 480
    zy, zr = zone or (None, r)
    ys = {0: H * 0.26, 1: H * 0.14, 2: H * 0.3, 3: hill_y - r * 0.4, 4: H * 0.2} if zone is None else dict.fromkeys(range(5), zy)
    if tone == 0:
        return f'<circle cx="{f(x + B * 0.62)}" cy="{f(ys[0])}" r="{f(zr)}" fill="{L["primary"]}" stroke="{L["paper"]}" stroke-width="{f(cut)}"/>'
    if tone == 1:
        return f'<circle cx="{f(x + B * 0.5)}" cy="{f(ys[1])}" r="{f(zr * 0.9)}" fill="{L["page"]}" stroke="{L["paper"]}" stroke-width="{f(cut)}"/>'
    if tone == 2:
        return f'<circle cx="{f(x + B * 0.4)}" cy="{f(ys[2])}" r="{f(zr)}" fill="{L["page"]}" stroke="{L["primarySoft"]}" stroke-width="{f(cut)}"/>'
    if tone == 3:
        return f'<circle cx="{f(x + B * 0.55)}" cy="{f(ys[3])}" r="{f(zr * (1.3 if zone is None else 1.1))}" fill="{D["accent"]}" stroke="{L["paper"]}" stroke-width="{f(cut)}"/>'
    mx, my, mr = x + B * 0.55, ys[4], zr * 0.85
    out = [f'<circle cx="{f(mx)}" cy="{f(my)}" r="{f(mr)}" fill="{L["page"]}" stroke="{D["edgeStrong"]}" stroke-width="{f(cut)}"/>',
           f'<circle cx="{f(mx + mr * 0.42)}" cy="{f(my - mr * 0.24)}" r="{f(mr * 0.84)}" fill="{D["page"]}"/>']
    for u, v, rr in ((0.18, 0.12, 0.10), (0.33, 0.3, 0.08), (0.78, 0.1, 0.09), (0.9, 0.34, 0.07)):
        sy = H * v if zone is None else zy * (0.6 + 2 * v)
        out.append(f'<circle cx="{f(x + B * u)}" cy="{f(sy)}" r="{f(r * rr)}" fill="{L["page"]}"/>')
    return ''.join(out)


# ---------------------------------------------------------------------------------------------
# The compositions

def die_cut_disc(cx, cy, r, edge, unit):
    shape = f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r + edge)}" fill="FILL"/>'
    return _lift(shape, unit) + f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r + edge)}" fill="#FFFFFF"/><circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{L["paper"]}"/>'


def die_cut_strip(x, y, w, h, edge, unit, flip_cy=None, flip=1.0):
    r = h / 2
    shape = f'<rect x="{f(x - edge)}" y="{f(y - edge)}" width="{f(w + 2 * edge)}" height="{f(h + 2 * edge)}" rx="{f(r + edge)}" fill="FILL"/>'
    body = _lift(shape, unit) + f'<rect x="{f(x - edge)}" y="{f(y - edge)}" width="{f(w + 2 * edge)}" height="{f(h + 2 * edge)}" rx="{f(r + edge)}" fill="#FFFFFF"/><rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{L["paper"]}"/>'
    if flip_cy is not None and flip < 1:
        return f'<g transform="translate(0 {f(flip_cy)}) scale(1 {f4(max(flip, 0.001))}) translate(0 {f(-flip_cy)})">{body}</g>'
    return body


def _lift(shape, unit):
    colour, alpha = K.split_alpha(L['stickerShadow'])
    layer = 1 - (1 - alpha) ** (1 / 3)
    out = [f'<g transform="translate({f(unit)} {f(2 * unit)})">']
    for reach in (0, 1, 2):
        stroke = f' stroke="{colour}" stroke-width="{f(reach * 2 * unit)}" stroke-linejoin="round"' if reach else ''
        out.append(f'<g opacity="{f(layer)}">{shape.replace("FILL", colour).replace("/>", stroke + "/>")}</g>')
    out.append('</g>')
    return ''.join(out)


def turn_flip(t):
    t = t % T
    if TURN[0] <= t < TURN[1]:
        return abs(math.cos(math.pi * smooth((t - TURN[0]) / (TURN[1] - TURN[0]))))
    return 1.0


def paper(x, y, w, h, r, stroke):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{L["paper"]}" stroke="{L["edge"]}" stroke-width="{f(stroke)}"/>'


def frame_svg(comp, variant, t, scale=1.0, with_ground=True):
    W, H = SIZES[comp]
    ids = K.Ids('k')
    night = night_at(t)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{f(W * scale)}" height="{f(H * scale)}" viewBox="0 0 {W} {H}">']
    if comp == 'header':
        # The iPhone shows the centre ~65 % of the header, with its back and share buttons over the top
        # corners (to about 40 % of the height) and the Dynamic Island at the top centre: the lockup sits
        # below the buttons at 47.7 % of the height (its top at 42 %), where Apple's examples set their titles,
        # and the pair stand under it, both inside the centre 60 %. The lockup's clear space (H / 4) stays free
        # even at the goal's hop, and the pair's lift ends above the frame's foot.
        hill_y, far_y = 1550, 1430
        o.append(ground(W, H, t, hill_y, far_y, ids, over=lambda night_band: lockup(W / 2, HEADER_LOCKUP_Y, HEADER_LOCKUP_W, night_band)))
        o.append(character('pomo', t, W / 2 - 370, hill_y + 10, 630, night))
        o.append(character('doro', t, W / 2 + 370, hill_y + 10, 630, night))
    else:
        hill_y, far_y = 2180, 2020
        if with_ground:
            o.append(ground(W, H, t, hill_y, far_y, ids, sky_zone=search_sky(H)))
        flip = turn_flip(t)
        if variant == 'stickers':
            cx, (cy, d) = W / 2, SEARCH_RING
            o.append(die_cut_disc(cx, cy, d / 2 + 40, 34, 11))
            o.append(ring(cx, cy, d, t, 'paper'))
            sw, sh, sy = 1240, 330, 1800
            o.append(die_cut_strip(cx - sw / 2, sy, sw, sh, 32, 11, sy + sh / 2, flip))
            # The goal sticker lands over the strip's right end, poking out of it, clear of the fourth cell.
            o.append(today(cx - 20, sy + sh / 2, 7.4, t, goal_at=(cx + sw / 2 - 10, sy + sh * 0.3)))
            o.append(character('pomo', t, 540, hill_y + 20, 820, night))
            o.append(character('doro', t, W - 540, hill_y + 20, 820, night))
        elif variant == 'diary':
            pw, ph = 1280, 1480
            top = hill_y - ph - 30
            o.append(f'<g transform="rotate(-2 {f(W / 2 - 12)} {f(hill_y)})">{paper(W / 2 - pw - 12, top, pw, ph, 70, 8)}</g>')
            rx = W / 2 + 12
            o.append(f'<g transform="rotate(2 {f(rx)} {f(hill_y)})"><g transform="translate({f(rx)} 0) scale({f(max(flip, 0.001))} 1) translate({f(-rx)} 0)">{paper(rx, top, pw, ph, 70, 8)}</g></g>')
            o.append(ring(W / 2 - pw / 2 - 12, top + ph / 2 - 20, 920, t, 'paper'))
            o.append(f'<g transform="translate({f(rx)} 0) scale({f(max(flip, 0.001))} 1) translate({f(-rx)} 0)">{today(rx + pw / 2, top + ph / 2 - 20, 7.0, t, turn=False)}</g>')
            o.append(character('pomo', t, 470, hill_y + 20, 640, night))
            o.append(character('doro', t, W - 470, hill_y + 20, 640, night))
        else:
            x, y, w, h = W / 2 - 900, 170, 1800, 2010
            o.append(paper(x, y, w, h, 120, 8))
            o.append(ring(W / 2, 900, 1150, t, 'paper'))
            o.append(today(W / 2, 1760, 7.4, t))
            o.append(character('pomo', t, 640, hill_y + 20, 760, night))
            o.append(character('doro', t, W - 640, hill_y + 20, 760, night))
    o.append('</svg>')
    return ''.join(o) + '\n'


def universal_svg(t):
    """The universal still (16:9, 5244 x 2950, both placements): the search's scene at the same instant, its
    ground run out to the wider frame and its timer moment scaled into the frame's middle, inside the centre
    84 % x 76 % that both the 21:9 and the 3:2 crops keep. Wordless, so it is safe in either placement."""
    W, H = SIZES['universal']
    sw, sh = SIZES['search']
    k = H / sh
    inner = frame_svg('search', VARIANT, t, with_ground=False)
    body = inner[inner.index('>') + 1:inner.rindex('</svg>')]
    ids = K.Ids('u')
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         '<title>App Store creative asset, universal still</title>', ground(W, H, t, 2180 * k, 2020 * k, ids, sky_zone=search_sky(H)),
         f'<g transform="translate({f((W - sw * k) / 2)} 0) scale({f(k)})">{body}</g>', '</svg>']
    return ''.join(o) + '\n'


def still_svg(comp):
    """A placement's still: its loop's poster frame (the universal: the search's, widened)."""
    if comp == 'universal':
        return universal_svg(POSTER_FRAME['universal'] / FPS)
    svg = frame_svg(comp, VARIANT, POSTER_FRAME[comp] / FPS)
    return svg.replace('>', f'><title>App Store creative asset, {comp} still</title>', 1)


def job():
    assets = []
    for comp in ('header', 'search', 'universal'):
        w, h = SIZES[comp]
        assets.append({'id': f'creative-{comp}', 'src': f'art/src/creative/creative-{comp}.svg', 'kind': 'creative',
                       'png': [], 'crops': [{'name': f'{w}x{h}', 'rect': [0, 0, w, h], 'px': w}]})
    return {'about': "v1.4's App Store creative assets' stills (docs/implementations/2026-11-02-app-store-creative-assets.md), "
                     'written by scripts/art/creative-sources.py: the header (21:9) and search (3:2) poster frames and the '
                     'universal 16:9 still. The loops are rendered and encoded by scripts/art/creative-build.py.',
            'assets': assets}


def files():
    import json
    out = {f'art/src/creative/creative-{c}.svg': still_svg(c) for c in ('header', 'search', 'universal')}
    out['art/jobs/creative.json'] = json.dumps(job(), indent=1) + '\n'
    return out


def main():
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    check = '--check' in sys.argv
    differences = 0
    for rel, text in files().items():
        path = os.path.join(K.ROOT, rel)
        if check:
            if not (os.path.exists(path) and open(path, encoding='utf-8', newline='').read() == text):
                differences += 1
                print(f'✖ {rel} is not what the generator writes')
        else:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(text)
            print(f'✔ wrote {rel}')
    if check:
        print(f'✖ {differences} file(s) differ' if differences else '✔ every creative source matches the generator')
        sys.exit(1 if differences else 0)


if __name__ == '__main__':
    main()
