"""
store-sources.py — the sources of the v1.4 App Store screenshots, "Morning to night"
(docs/implementations/2026-11-01-app-store-screenshots.md; the direction contract is in
.impeccable/surfaces/scripts-art-store-sources-py.md).

    python -P scripts/art/store-sources.py            write art/src/store/*.svg and art/jobs/store.json
    python -P scripts/art/store-sources.py --check    regenerate in memory and compare; exit 1 on any difference

Contract
  in : the constants below; the shipped tokens (src/theme/palette.json) and strings
       (src/i18n/en.json, tr.json, the default love notes' text copied below); the committed
       Baloo 2 subset (assets/fonts/Baloo2-SemiBold.ttf, Baloo2-Medium.ttf); the shipped art
       (art/out/illustration/*.svg: the poses and the tour kit; art/out/icon/*.svg; the Same
       Page mark, art/out/logo/mark-single-cocoa.svg).
  out: one SVG source per strip (iPhone and iPad, English and Turkish): five screenshot panels
       side by side on one artboard, with the store's gutter between them, so the art runs on
       across every seam. The job art/jobs/store.json builds each strip with scripts/art/build.mjs
       and exports every panel as a crop at each App Store size (iPhone 1320 x 2868 and
       1206 x 2622, iPad 2064 x 2752).
  how: Baloo 2 is shaped with HarfBuzz (kerning, Turkish letters, tabular figures for timers)
       and written as outlines, so the build needs no installed font. The system face (SF Pro in
       the app) is set as live text in Inter, which VectorCraft bundles in the app's three
       weights. Stickers carry the app's lift (Sticker.tsx): the art's paths again in the theme's
       sticker shadow, offset 1 right and 2 down and softened by three layers each a point wider.
       Every id is a counter, every number is rounded to 2 decimals, so the output is a pure
       function of the inputs and --check is byte-exact.
  needs: uharfbuzz 0.57 and fontTools 4.61 (other versions may shape differently). Run with -P.
"""
import argparse
import json
import math
import os
import re
import sys

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CHECK = '--check' in sys.argv


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


PALETTE = json.loads(read('src/theme/palette.json'))['themes']
LIGHT = PALETTE['strawberryMilk']['tokens']
DARK = PALETTE['midnightPlum']['tokens']
I18N = {'en': json.loads(read('src/i18n/en.json')), 'tr': json.loads(read('src/i18n/tr.json'))}

# ---------------------------------------------------------------------------------------------
# The copy. Captions are the owner's confirmed brief (record §3.1), with their line breaks set by hand
# (a name pair never splits); everything inside a screen is the app's own string, looked up by key.

CAPTIONS = {
    'en': [
        ('Meet|Pomo & Doro', 'The two little faces of your timer'),
        ('A sticker for|every focus', "Each one lands on today's page,|toward your goal"),
        ('Your week,|as postcards', 'With your daily goal and love streak'),
        ('A love note after|each focus', 'Write your own, too'),
        ('Focus your way', 'Ring or Facing pages, day or night,|or fly over the map'),
    ],
    'tr': [
        ("Pomo ile Doro'yla|tanış", 'Zamanlayıcının iki küçük yüzü'),
        ('Her odağa|bir çıkartma', 'Bugünün sayfasına yapışır,|hedefini doldurur'),
        ('Haftan|kartpostallarda', 'Günlük hedefin ve aşk serinle'),
        ('Her odaktan sonra|bir aşk notu', 'Kendi notlarını da yaz'),
        ('Kendi düzeninde|odaklan', 'Halka ya da Karşılıklı sayfalar,|gündüz ya da gece; istersen haritada uç'),
    ],
}

# The love note in panel 4: DEFAULT_LOVE_NOTES[18] and DEFAULT_LOVE_NOTES_TR[18] (src/constants/defaults.ts).
NOTE = {'en': 'Tiny victories, endless love.', 'tr': 'Küçük zaferler, sonsuz sevgi.'}

# The week in panel 3, synthetic and consistent: a 100-minute goal is four 25-minute sessions, so it
# was reached on Thursday, Friday and Saturday (a 3-day love streak); 21 sessions in all.
WEEK = [2, 0, 3, 4, 4, 5]
TODAY_DONE = 3
GOAL_SESSIONS = 4
GOAL_MIN = 100
WEEK_DAYS = {
    'en': ['Mon 26', 'Tue 27', 'Wed 28', 'Thu 29', 'Fri 30', 'Sat 31'],
    'tr': ['Pzt 26', 'Sal 27', 'Çar 28', 'Per 29', 'Cum 30', 'Cmt 31'],
}  # toLocaleDateString(en-US | tr-TR, { weekday: 'short' }) + day, for 26–31 October 2026
TODAY_DATE = {'en': 'Sunday, November 1', 'tr': '1 Kasım Pazar'}
STREAK, BEST = 3, 5

# The day, panel by panel: the status bar's time, and the hour's theme.
HOURS = [(8, 30), (10, 45), (13, 20), (18, 5), (22, 40)]


def clock(lang, h, m, status=False):
    """A time as each locale shows it: 'h:mm' in the status bar, 'h:mm AM' in en-US text, 'HH:MM' in tr-TR."""
    if lang == 'tr':
        return f'{h:02d}:{m:02d}'
    h12 = h % 12 or 12
    return f'{h12}:{m:02d}' if status else f'{h12}:{m:02d} {"AM" if h < 12 else "PM"}'


def tr_(lang, key, **kw):
    """An i18n string by dotted key, with {{placeholders}} filled."""
    node = I18N[lang]
    for part in key.split('.'):
        node = node[part]
    for k, v in kw.items():
        node = node.replace('{{' + k + '}}', str(v))
    return node


# ---------------------------------------------------------------------------------------------
# Numbers and ids

def f(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


class Ids:
    def __init__(self, prefix):
        self.prefix, self.n = prefix, 0

    def __call__(self):
        self.n += 1
        return f'{self.prefix}{self.n}'


def esc(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


# ---------------------------------------------------------------------------------------------
# Type: Baloo 2 outlined by HarfBuzz; Inter as live text for VectorCraft

_FONTS = {}


def _font(weight):
    if weight not in _FONTS:
        path = os.path.join(ROOT, 'assets', 'fonts', f'Baloo2-{weight}.ttf')
        face = hb.Face(hb.Blob.from_file_path(path))
        tt = TTFont(path)
        _FONTS[weight] = (hb.Font(face), face.upem, tt.getGlyphOrder(), tt.getGlyphSet())
    return _FONTS[weight]


_SHAPED = {}


def shape(text, size, weight='SemiBold', lang='en', tnum=False):
    """Outline `text` at `size`; returns (path data with the baseline's start at 0, 0; advance width)."""
    key = (text, size, weight, lang, tnum)
    if key not in _SHAPED:
        font, upem, order, glyphs = _font(weight)
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        buf.language = lang
        hb.shape(font, buf, {'tnum': True} if tnum else {})
        s = size / upem
        pen = SVGPathPen(glyphs, ntos=f)
        x = 0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            glyphs[order[info.codepoint]].draw(TransformPen(pen, (s, 0, 0, -s, x + pos.x_offset * s, -pos.y_offset * s)))
            x += pos.x_advance * s
        _SHAPED[key] = (pen.getCommands(), x)
    return _SHAPED[key]


def baloo(text, x, y, size, fill, anchor='start', weight='SemiBold', lang='en', tnum=False):
    d, w = shape(text, size, weight, lang, tnum)
    x -= {'start': 0, 'middle': w / 2, 'end': w}[anchor]
    return f'<path transform="translate({f(x)} {f(y)})" fill="{fill}" d="{d}"/>'


def baloo_width(text, size, weight='SemiBold', lang='en'):
    return shape(text, size, weight, lang)[1]


def wrap_baloo(text, size, max_w, weight='SemiBold', lang='en'):
    """Greedy word wrap by measured width; a word never breaks."""
    lines, cur = [], ''
    for word in text.split(' '):
        trial = f'{cur} {word}'.strip()
        if cur and baloo_width(trial, size, weight, lang) > max_w:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    return lines + [cur]


INTER_W = {400: 0.53, 500: 0.55, 600: 0.57}  # Inter's mean advance per em, for the few centred rows only


def inter_width(text, size, weight):
    return len(text) * size * INTER_W[weight]


def wrap_inter(text, size, weight, max_w):
    lines, cur = [], ''
    for word in text.split(' '):
        trial = f'{cur} {word}'.strip()
        if cur and inter_width(trial, size, weight) > max_w:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    return lines + [cur]


def inter(text, x, y, size, fill, weight=400, anchor='start', runs=None):
    """System-face text as live Inter. `runs` [(text, fill, weight)] sets one line in several styles."""
    head = f'<text x="{f(x)}" y="{f(y)}" font-family="Inter" font-size="{f(size)}" font-weight="{weight}" fill="{fill}"'
    if anchor != 'start':
        head += f' text-anchor="{anchor}"'
    if runs:
        body = ''.join(f'<tspan fill="{c}" font-weight="{w}">{esc(t)}</tspan>' for t, c, w in runs)
        return f'{head}>{body}</text>'
    return f'{head}>{esc(text)}</text>'


# ---------------------------------------------------------------------------------------------
# The shipped art, as flat path lists

_ART = {}
PATH_RE = re.compile(r'<path ([^>]*?)/>')
ATTR_RE = re.compile(r'([a-z-]+)="([^"]*)"')


def art(rel):
    """[(d, fill, evenodd, opacity)] of a flat SVG from the pipeline's exports (no transforms in them)."""
    if rel not in _ART:
        out = []
        for m in PATH_RE.finditer(read(rel)):
            a = dict(ATTR_RE.findall(m.group(1)))
            out.append((a['d'], a.get('fill', '#000000'), a.get('fill-rule') == 'evenodd', a.get('opacity')))
        _ART[rel] = out
    return _ART[rel]


def pose(who, name):
    return art(f'art/out/illustration/{who}-{name}.svg')


KIT = json.loads(read('art/src/tour/expressions.json'))
NUM_RE = re.compile(r'-?\d+(?:\.\d+)?')


def move_path(d, fn):
    """Path data with every point mapped by fn(x, y); the layers use only absolute M, L, C and Z."""
    tokens = re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?', d)
    out, i = [], 0
    while i < len(tokens):
        t = tokens[i]
        if t in 'MLCZ':
            out.append(t)
            i += 1
        else:
            x, y = fn(float(t), float(tokens[i + 1]))
            out.append(f'{f(x)} {f(y)}')
            i += 2
    return ' '.join(out)


def tour(who, eyes, mouth, hand=None, raise_hand=0):
    """A tour-kit expression, stacked as expressions.json orders it: body-cut, hand, body-fill, eyes, mouth.
    `raise_hand` holds a wave up and out: the hand turned that many degrees away from the head about its
    pivot (expressions.json), and pushed a little along its axis, so at store size it reads as a hand, not an ear."""
    out = []
    for layer in ['body-cut'] + ([f'hand-{hand}'] if hand else []) + ['body-fill', f'eyes-{eyes}', f'mouth-{mouth}']:
        paths = art(f'art/out/illustration/{who}-tour-{layer}.svg')
        if layer.startswith('hand-') and raise_hand:
            (px_, py_), (ax, ay) = KIT['hands'][who][hand]['pivot'], KIT['hands'][who][hand]['axis']
            a = math.radians(-raise_hand if 'left' in hand else raise_hand)
            push = 14

            def fn(x, y, a=a, px_=px_, py_=py_, ax=ax, ay=ay):
                dx, dy = x - px_, y - py_
                return (px_ + dx * math.cos(a) - dy * math.sin(a) + ax * push,
                        py_ + dx * math.sin(a) + dy * math.cos(a) + ay * push)
            paths = [(move_path(d, fn), c, e, o) for d, c, e, o in paths]
        out.extend(paths)
    return out


def night_marks(paths, colour):
    """The sleepy pose's Zz (cocoa marks above the head, top right of the artboard) in a colour that
    reads on the night's plum; the face's cocoa stays."""
    def is_mark(d):
        nums = [float(n) for n in NUM_RE.findall(d)]
        return min(nums[0::2]) > 380 and max(nums[1::2]) < 170
    return [(d, colour if c.lower() == '#4a2c29' and is_mark(d) else c, e, o) for d, c, e, o in paths]


# The break pose's mug and its steam sit on the die-cut edge with no edge of their own; in the scene,
# where the sticker is large, a white die-cut plate goes under them, so the whole sticker is one cut.
MUG_CUT = [('M384 366 H473 Q491 366 491 384 V442 Q491 460 473 460 H384 Q366 460 366 442 V384 Q366 366 384 366 Z', '#FFFFFF', False, None),
           ('M396 322 H427 Q443 322 443 338 V372 Q443 388 427 388 H396 Q380 388 380 372 V338 Q380 322 396 322 Z', '#FFFFFF', False, None)]


def feet(paths):
    """The lowest point of a sticker's art (its die-cut edge's foot), in artboard units."""
    return max(float(y) for d, *_ in paths for y in NUM_RE.findall(d)[1::2])


def icon(name):
    return art(f'art/out/icon/icon-{name}.svg')


def paths_svg(paths, recolour=None, fill=None):
    out = []
    for d, c, evenodd, opacity in paths:
        c = fill or (recolour or {}).get(c.lower(), c)
        attrs = f' fill-rule="evenodd"' if evenodd else ''
        if opacity:
            attrs += f' opacity="{opacity}"'
        out.append(f'<path d="{d}" fill="{c}"{attrs}/>')
    return ''.join(out)


def split_alpha(colour):
    return ('#' + colour[1:7], int(colour[7:9], 16) / 255) if len(colour) == 9 else (colour, 1.0)


def sticker(paths, cx, cy, size, shadow=None, point=None, rotate=0, scale=1, edge=None, box=512):
    """A sticker `size` wide, centred at cx, cy. `point` is the size of one of the app's points here
    (a screen's scale, or size / 48 for the stickers standing in the scene); the lift follows Sticker.tsx."""
    s = size / box * scale
    unit = (point or size / 48) / s  # artboard units per point
    recolour = {'#ffffff': edge} if edge else None
    out = [f'<g transform="translate({f(cx)} {f(cy)}) rotate({f(rotate)}) scale({f(s)}) translate({-box / 2} {-box / 2})">']
    if shadow:
        colour, alpha = split_alpha(shadow)
        layer = 1 - (1 - alpha) ** (1 / 3)
        # A sticker inside a screen lifts by its die-cut silhouette alone (the white paths enclose the
        # rest): the same shadow at a few points' size, and a third of the paths in the source.
        lifted = [p for p in paths if p[1].lower() == '#ffffff'] if point else paths
        out.append(f'<g transform="translate({f(unit)} {f(2 * unit)})">')
        for reach in (0, 1, 2):
            stroke = f' stroke="{colour}" stroke-width="{f(reach * 2 * unit)}" stroke-linejoin="round"' if reach else ''
            out.append(f'<g opacity="{f(layer)}">')
            for d, _, evenodd, _ in lifted:
                rule = ' fill-rule="evenodd"' if evenodd else ''
                out.append(f'<path d="{d}" fill="{colour}"{stroke}{rule}/>')
            out.append('</g>')
        out.append('</g>')
    out.append(paths_svg(paths, recolour))
    out.append('</g>')
    return ''.join(out)


def glyph(name, cx, cy, size, colour):
    """A 24-pt icon from the app's set, `size` points, one ink."""
    s = size / 24
    return f'<g transform="translate({f(cx - size / 2)} {f(cy - size / 2)}) scale({f(s)})">{paths_svg(icon(name), fill=colour)}</g>'


# ---------------------------------------------------------------------------------------------
# Screens, in the app's points. A screen is drawn for one device, theme and language.

class Screen:
    def __init__(self, device, t, lang, hour):
        self.device, self.t, self.lang, self.hour = device, t, lang, hour
        self.W, self.H = DEVICES[device]['screen']
        self.pad = (min(self.W, 560) - 2 * 24)  # Classic's column: min(width, 560) less 24 a side
        self.x0 = (self.W - self.pad) / 2
        self.tabs_top = device == 'ipad'  # iPadOS draws the tab bar at the top (D5 contract)
        self.top = 74 if self.tabs_top else 59  # content starts under the status bar (and iPad's tab bar)
        self.bottom = self.H - (20 if self.tabs_top else 82)  # above the home indicator, or the iPhone's tab bar
        self.out = []

    def s(self, key, **kw):
        return tr_(self.lang, key, **kw)

    def add(self, *parts):
        self.out.extend(parts)

    # -- chrome ---------------------------------------------------------------------------------
    def status_bar(self):
        t = self.t
        h, m = self.hour
        if self.device == 'iphone':
            self.add(inter(clock(self.lang, h, m, status=True), 62, 37, 17, t['ink'], 600, 'middle'))
            for i in range(4):
                self.add(f'<rect x="{283 + i * 5}" y="{32 - 3 - i * 2}" width="3.4" height="{4 + i * 2}" rx="1" fill="{t["ink"]}"/>')
            self.add(f'<path d="M309 27.2 a9.5 9.5 0 0 1 13.4 0 l-1.6 1.7 a7.2 7.2 0 0 0 -10.2 0 Z M311.9 30.2 a5.4 5.4 0 0 1 7.6 0 l-1.7 1.7 a3 3 0 0 0 -4.2 0 Z M314.6 33 l1.1 -1.1 1.1 1.1 -1.1 1.1 Z" fill="{t["ink"]}"/>')
            self.add(f'<rect x="333" y="25.5" width="25" height="12" rx="3.8" fill="none" stroke="{t["ink"]}" stroke-width="1" opacity="0.4"/>'
                     f'<rect x="359.2" y="29.5" width="1.6" height="4" rx="0.8" fill="{t["ink"]}" opacity="0.4"/>'
                     f'<rect x="335" y="27.5" width="21" height="8" rx="2.4" fill="{t["ink"]}"/>')
        else:
            day = {'en': 'Sun Nov 1', 'tr': '1 Kasım Paz'}[self.lang]
            self.add(inter(clock(self.lang, h, m, status=True) + '  ' + day, 24, 18, 13, t['ink'], 600))
            self.add(f'<rect x="{self.W - 50}" y="9" width="25" height="12" rx="3.8" fill="none" stroke="{t["ink"]}" stroke-width="1" opacity="0.4"/>'
                     f'<rect x="{self.W - 48}" y="11" width="21" height="8" rx="2.4" fill="{t["ink"]}"/>')

    def tab_bar(self, selected):
        t = self.t
        names = ['timer', 'stats', 'settings', 'notes']
        if self.tabs_top:  # iPadOS: a floating bar of labels at the top
            labels = [self.s(f'tabs.{n}') for n in names]
            widths = [inter_width(l, 15, 600) + 32 for l in labels]
            total = sum(widths) + 8
            x = (self.W - total) / 2
            self.add(f'<rect x="{f(x)}" y="28" width="{f(total)}" height="40" rx="20" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1"/>')
            x += 4
            for i, (label, w) in enumerate(zip(labels, widths)):
                if i == selected:
                    self.add(f'<rect x="{f(x)}" y="32" width="{f(w)}" height="32" rx="16" fill="{t["field"]}"/>')
                self.add(inter(label, x + w / 2, 53, 15, t['primaryInk'] if i == selected else t['ink'], 600, 'middle'))
                x += w
            return
        self.add(f'<rect x="21" y="770" width="351" height="60" rx="30" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1"/>')
        xs = [72.5, 155, 237.5, 320]
        self.add(f'<rect x="{xs[selected] - 47}" y="773.5" width="94" height="53" rx="26.5" fill="{t["field"]}"/>')
        for i, (x, name) in enumerate(zip(xs, names)):
            c = t['primaryInk'] if i == selected else t['ink']
            self.add(glyph(f'{name}-fill', x, 792, 25, c))
            self.add(inter(self.s(f'tabs.{name}'), x, 819, 10.5, c, 600, 'middle'))
        self.add(f'<rect x="130" y="838" width="133" height="5" rx="2.5" fill="{t["ink"]}"/>')

    def home_indicator(self):
        if self.device == 'ipad':
            self.add(f'<rect x="{self.W / 2 - 160}" y="{self.H - 13}" width="320" height="5" rx="2.5" fill="{self.t["ink"]}"/>')

    def top_row(self, phase, n, total=4):
        t = self.t
        y = self.top + 8 + 22
        line = self.s('timer.phaseLine', phase=self.s(f'timer.phase.{phase}'), n=n, total=total)
        head, _, rest = line.partition(' · ')
        self.add(inter('', self.x0, y + 6, 17, t['ink'], 600, runs=[(head, t['ink'], 600), (' · ' + rest, t['inkSoft'], 600)]))
        self.add(glyph('modes', self.x0 + self.pad - 22, y, 24, t['ink']))  # in its 44-pt target at the trailing edge
        return y + 22

    # -- pieces -----------------------------------------------------------------------------------
    def pill(self, label, y, primary=True, w=None, cx=None):
        t = self.t
        cx = self.W / 2 if cx is None else cx
        if primary:
            w = w or self.pad
            self.add(f'<rect x="{f(cx - w / 2)}" y="{f(y)}" width="{f(w)}" height="56" rx="28" fill="{t["primary"]}"/>')
            self.add(inter(label, cx, y + 34.5, 18, t['onPrimary'], 600, 'middle'))
        else:
            w = w or max(112, inter_width(label, 16, 600) + 48)
            self.add(f'<rect x="{f(cx - w / 2)}" y="{f(y + 0.75)}" width="{f(w)}" height="42.5" rx="21.25" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
            self.add(inter(label, cx, y + 27.5, 16, t['ink'], 600, 'middle'))

    def segmented(self, labels, selected, x, y, w, h=51):
        t = self.t
        self.add(f'<rect x="{f(x + 0.75)}" y="{f(y + 0.75)}" width="{f(w - 1.5)}" height="{f(h - 1.5)}" rx="{f((h - 1.5) / 2)}" fill="{t["field"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        seg = (w - 6) / len(labels)
        sx = x + 3 + selected * seg
        self.add(f'<rect x="{f(sx + 0.75)}" y="{f(y + 3.75)}" width="{f(seg - 1.5)}" height="{f(h - 7.5)}" rx="{f((h - 7.5) / 2)}" fill="{t["paper"]}" stroke="{t["edgeStrong"]}" stroke-width="1.5"/>')
        for i, label in enumerate(labels):
            c = t['ink'] if i == selected else t['inkSoft']
            self.add(inter(label, x + 3 + seg * (i + 0.5), y + h / 2 + 5.5, 15, c, 600, 'middle'))

    def dashed(self, cx, cy, r):
        return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="none" stroke="{self.t["edgeStrong"]}" stroke-width="1.5" stroke-dasharray="4.2 4.2"/>'

    def pose_sticker(self, who, name, cx, cy, size, rotate=0, scale=1):
        return sticker(pose(who, name), cx, cy, size, self.t['stickerShadow'], point=1, rotate=rotate, scale=scale, edge=self.t['stickerEdge'])

    def today_row(self, cy, done, owed, landing=False, goal=False):
        """'Today', a sticker per finished focus (Pomo, Doro, …), dashed cells for what the goal still owes."""
        t = self.t
        label = self.s('today.label')
        lw = inter_width(label, 13, 600)
        cells = done + owed
        total = lw + 8 + cells * 34 + (26 if goal else 0)
        x = (self.W - total) / 2
        self.add(inter(label, x, cy + 4.5, 13, t['inkSoft'], 600))
        x += lw + 8
        for i in range(cells):
            cx = x + i * 34 + 17
            if i < done:
                who = 'pomo' if i % 2 == 0 else 'doro'
                if landing and i == done - 1:
                    self.burst(cx, cy)
                    self.add(self.pose_sticker(who, 'celebrating', cx, cy - 8, 28, rotate=-7, scale=1.18))
                else:
                    self.add(self.pose_sticker(who, 'celebrating', cx, cy, 28))
            else:
                self.add(self.dashed(cx, cy, 12.25))
        if goal:
            self.add(glyph('goal', x + cells * 34 + 13, cy, 18, t['successInk']))

    def burst(self, cx, cy):
        """The placement's paper bits (TodayStickers.tsx), frozen a third of the way into their 600 ms flight."""
        t = self.t
        colours = [t['primary'], t['success'], t['ink'], t['accent']]
        k = 0.42
        for i in range(12):
            angle = i / 12 * math.pi * 2 + (0.2 if i % 2 else -0.1)
            dist = 26 + (i % 3) * 8
            dx, dy = math.cos(angle) * dist * k * 1.6, (math.sin(angle) * dist - 6) * k * 1.6
            spin = (1 if i % 2 else -1) * (90 + i * 15) * k
            self.add(f'<rect x="-3" y="-4.5" width="6" height="9" rx="2" fill="{colours[i % 4]}" transform="translate({f(cx + dx)} {f(cy + dy)}) rotate({f(spin)}) scale(0.85)"/>')

    def partner_strip(self, y, state, pose_name):
        t = self.t
        x, w = self.x0, self.pad
        self.add(f'<rect x="{f(x + 0.75)}" y="{f(y + 0.75)}" width="{f(w - 1.5)}" height="70.5" rx="22" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(self.pose_sticker('doro', pose_name, x + 68, y + 37, 40))
        self.add(self.pose_sticker('pomo', pose_name, x + 36, y + 36, 40))
        lines = wrap_inter(self.s(f'partner.{state}'), 15, 500, w - 102 - 16)
        y0 = y + 36 + 5 - (len(lines) - 1) * 9.5
        for i, line in enumerate(lines):
            self.add(inter(line, x + 102, y0 + i * 19, 15, t['ink'], 500))

    def ring(self, cx, cy, size, frac, colour, timer, next_line=None):
        t = self.t
        stroke = size * 0.055
        r = (size - stroke) / 2
        self.add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="none" stroke="{t["ringTrack"]}" stroke-width="{f(stroke)}"/>')
        if frac > 0:
            a0 = -math.pi / 2
            a1 = a0 + 2 * math.pi * frac
            x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
            x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
            self.add(f'<path d="M{f(x0)} {f(y0)} A{f(r)} {f(r)} 0 {1 if frac > 0.5 else 0} 1 {f(x1)} {f(y1)}" fill="none" stroke="{colour}" stroke-width="{f(stroke)}" stroke-linecap="round"/>')
        size_t = size * 0.25
        if next_line:
            self.add(baloo(timer, cx, cy + size_t * 0.31 - 11, size_t, t['ink'], 'middle', lang=self.lang, tnum=True))
            self.add(inter(next_line, cx, cy + 60, 15, t['inkSoft'], 500, 'middle'))
        else:
            self.add(baloo(timer, cx, cy + size_t * 0.31, size_t, t['ink'], 'middle', lang=self.lang, tnum=True))

    def controls_idle(self, start_key, b):
        """Presets, their hint, the primary pill and Skip, anchored to the page's foot `b`."""
        t = self.t
        labels = ['25/5', '50/10', '90/20', self.s('presets.custom')]
        self.segmented(labels, 0, self.x0, b - 196, self.pad)
        self.add(inter(self.s('presets.key'), self.W / 2, b - 127, 15, t['inkSoft'], 500, 'middle'))
        self.pill(self.s(f'controls.{start_key}'), b - 113)
        self.pill(self.s('controls.skip'), b - 44, primary=False)

    # -- the five screens ---------------------------------------------------------------------------
    def frame(self):
        self.add(f'<rect width="{self.W}" height="{self.H}" fill="{self.t["page"]}"/>')
        self.status_bar()

    def ring_layout(self):
        """The Ring's vertical plan: the foot anchored above the tab bar, the ring centred in what's left."""
        b = self.bottom - 16
        top_row_bottom = self.top + 8 + 44
        partner_y = b - 336
        size = min(self.pad * 0.86 if self.device == 'iphone' else 340, 340, partner_y - 16 - (top_row_bottom + 16))
        if self.device == 'iphone':
            size = 275
        cy = (top_row_bottom + 16 + partner_y - 16) / 2
        return b, partner_y, cy, size

    def spread(self):
        """Panel 1: Facing pages, ready for the day's first focus."""
        t = self.t
        self.frame()
        self.top_row('focus', 1)
        b = self.bottom - 16
        pw = (self.pad - 8) / 2
        ph = 300 if self.device == 'iphone' else pw * 1.78
        slot_top, slot_bottom = self.top + 52 + 16, b - 231 - 17 - 16  # between the top row and today's row
        top = (slot_top + slot_bottom) / 2 - ph / 2
        left, right = self.x0, self.x0 + pw + 8
        for x, rot, hinge, rx_out in ((left, -1, left + pw, 'l'), (right, 1, right, 'r')):
            path = page_path(x, top, pw, ph, rx_out)
            self.add(f'<g transform="rotate({rot} {f(hinge)} {f(top + ph)})"><path d="{path}" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/></g>')
        st = min(0.34 * pw, 64)
        self.add(inter(self.s('spread.you'), left + pw / 2, top + 19, 13, t['inkSoft'], 600, 'middle'))
        self.add(inter(self.s('spread.doro'), right + pw / 2, top + 19, 13, t['inkSoft'], 600, 'middle'))
        self.add(self.pose_sticker('pomo', 'idle', left + pw / 2, top + 61, st))
        self.add(self.pose_sticker('doro', 'idle', right + pw / 2, top + 61, st))
        fw = 0.66 * self.pad
        fx, fy, fh = self.W / 2 - fw / 2, top + 99, 137
        self.add(f'<rect x="{f(fx - 4)}" y="{f(fy - 4)}" width="{f(fw + 8)}" height="{f(fh + 8)}" rx="26" fill="{t["page"]}"/>')
        self.add(f'<rect x="{f(fx + 0.75)}" y="{f(fy + 0.75)}" width="{f(fw - 1.5)}" height="{f(fh - 1.5)}" rx="22" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(baloo('25:00', self.W / 2, fy + 73, 56, t['ink'], 'middle', lang=self.lang, tnum=True))
        self.add(f'<rect x="{f(fx + 20)}" y="{f(fy + 112)}" width="{f(fw - 40)}" height="6" rx="3" fill="{t["ringTrack"]}"/>')
        # The pair's line on the right page's foot, under the timer's frame; a third line (Turkish) sets tighter.
        size, lead, pad = 15, 19, 26
        lines = wrap_inter(self.s('partner.ready'), size, 500, pw - 20)
        if len(lines) > 2:
            size, lead, pad = 14, 17, 10
            lines = wrap_inter(self.s('partner.ready'), size, 500, pw - 16)
        for i, line in enumerate(lines):
            self.add(inter(line, right + pw / 2, top + ph - pad - (len(lines) - 1 - i) * lead, size, t['ink'], 500, 'middle'))
        self.today_row(b - 231, 0, GOAL_SESSIONS)
        self.controls_idle('startFocus', b)
        self.tab_bar(0)
        self.home_indicator()

    def ring_landing(self):
        """Panel 2: the third focus just finished; its sticker (Pomo's) lands on today's row."""
        t = self.t
        self.frame()
        self.top_row('shortBreak', 3)
        b, partner_y, cy, size = self.ring_layout()
        self.ring(self.W / 2, cy, size, 0, t['ringBreak'], '05:00')
        self.partner_strip(partner_y, 'ready', 'idle')
        self.today_row(b - 231, 3, GOAL_SESSIONS - 3, landing=True)
        self.controls_idle('startBreak', b)
        self.tab_bar(0)
        self.home_indicator()

    def stats(self):
        """Panel 3: the week as postcards, today in front, then the goal and the love streak."""
        t = self.t
        self.frame()
        pad = min(self.W, 560) - 32
        x0 = (self.W - pad) / 2
        top = self.top
        self.add(baloo(self.s('stats.title'), x0 + 4, top + 33, 34, t['ink'], lang=self.lang))
        self.segmented([self.s('stats.metricSessions'), self.s('stats.metricMinutes')], 0, x0, top + 67, pad, 52)
        total = sum(WEEK) + TODAY_DONE
        goal_days = sum(1 for n in WEEK if n >= GOAL_SESSIONS)
        self.add(inter(self.s('stats.weekSessions_other', n=total) + ' · ' + self.s('stats.goalDays_other', count=goal_days), x0, top + 150, 15, t['ink'], 500))
        y = top + 168
        for i, (day, n) in enumerate(zip(WEEK_DAYS[self.lang], WEEK)):
            ey = y + i * 33
            rot = -0.6 if i % 2 == 0 else 0.6
            d = f'M{f(x0 + 8)} {f(ey + 44)} V{f(ey + 14)} Q{f(x0 + 8)} {f(ey)} {f(x0 + 22)} {f(ey)} H{f(x0 + pad - 22)} Q{f(x0 + pad - 8)} {f(ey)} {f(x0 + pad - 8)} {f(ey + 14)} V{f(ey + 44)}'
            self.add(f'<g transform="rotate({rot} {f(self.W / 2)} {f(ey + 22)})"><path d="{d} Z" fill="{t["paper"]}"/><path d="{d}" fill="none" stroke="{t["edge"]}" stroke-width="1.5"/>')
            self.add(inter(day, x0 + 22, ey + 22, 13, t['inkSoft'], 600))
            if n == 0:
                self.add(self.dashed(x0 + 94, ey + 17.5, 8.5))
            for k in range(min(n, 4)):
                self.add(self.pose_sticker('pomo' if k % 2 == 0 else 'doro', 'celebrating', x0 + 94 + k * 21, ey + 17, 18))
            if n > 4:
                self.add(f'<rect x="{f(x0 + 94 + 4 * 21 - 9)}" y="{f(ey + 9)}" width="22" height="16" rx="8" fill="{t["primarySoft"]}"/>'
                         + inter(self.s('today.more', count=n - 4), x0 + 94 + 4 * 21 + 2, ey + 21.5, 11, t['primaryInk'], 600, 'middle'))
            self.add(inter(str(n), x0 + pad - 42, ey + 22.5, 15, t['ink'], 600, 'end'))
            if n >= GOAL_SESSIONS:
                self.add(glyph('goal', x0 + pad - 24, ey + 17, 16, t['successInk']))
            self.add('</g>')
        cy = y + 6 * 33
        ch = 172
        self.add(f'<rect x="{f(x0 + 0.75)}" y="{f(cy + 0.75)}" width="{f(pad - 1.5)}" height="{ch - 1.5}" rx="22" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(inter(TODAY_DATE[self.lang], x0 + 18, cy + 27, 13, t['inkSoft'], 600))
        self.add(baloo(self.s('stats.today'), x0 + 18, cy + 56, 22, t['ink'], lang=self.lang))
        cell = min((pad - 36) / 7, 48)
        for k in range(GOAL_SESSIONS):
            ccx = x0 + 18 + cell * (k + 0.5)
            if k < TODAY_DONE:
                self.add(self.pose_sticker('pomo' if k % 2 == 0 else 'doro', 'celebrating', ccx, cy + 96, 40))
            else:
                self.add(self.dashed(ccx, cy + 96, 18.5))
        mins = TODAY_DONE * 25
        line = ' · '.join([self.s('stats.sessions_other', count=TODAY_DONE), self.s('stats.minutesShort_other', n=mins), self.s('stats.toGoal_other', n=GOAL_MIN - mins)])
        self.add(inter(line, x0 + 18, cy + 150, 15, t['ink'], 500))
        sy = cy + ch + 16
        half = pad / 2
        self.add(f'<rect x="{f(x0 + 0.75)}" y="{f(sy + 0.75)}" width="{f(pad - 1.5)}" height="74.5" rx="14" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(f'<rect x="{f(x0 + half - 0.75)}" y="{f(sy + 12)}" width="1.5" height="52" fill="{t["edge"]}"/>')
        for i, (ic, colour, title, value) in enumerate((
                ('goal', t['successInk'], self.s('stats.goalTitle_other', n=GOAL_MIN), self.s('stats.leftToday_other', n=GOAL_MIN - mins)),
                ('streak', t['primaryInk'], self.s('stats.streakTitle'), self.s('stats.streakValue_other', n=STREAK, best=BEST)))):
            hx = x0 + i * half
            self.add(glyph(ic, hx + 30, sy + 38, 22, colour))
            self.add(inter(title, hx + 52, sy + 34, 15, t['ink'], 600))
            self.add(inter(value, hx + 52, sy + 54, 13, t['inkSoft'], 500))
        self.tab_bar(1)
        self.home_indicator()

    def note(self):
        """Panel 4: the fourth focus is done (the goal is reached) and a love note rises."""
        t = self.t
        self.frame()
        self.top_row('longBreak', 4)
        b, partner_y, cy, size = self.ring_layout()
        self.ring(self.W / 2, cy, size, 0, t['ringBreak'], '15:00')
        self.partner_strip(partner_y, 'ready', 'idle')
        self.today_row(b - 231, GOAL_SESSIONS, 0, goal=True)
        self.controls_idle('startBreak', b)
        self.tab_bar(0)
        self.home_indicator()
        sw = min(self.W - 17, 560)
        sx = (self.W - sw) / 2
        # A form sheet: a bottom sheet on iPhone, a card centred on the screen on iPad (iPadOS's own). The
        # iPad card is tall enough to cover the timer whole (a half-covered timer reads as a fault), its
        # content centred in it, over a light dim.
        sh = 236 if self.device == 'iphone' else 420
        st = self.H - 9 - sh if self.device == 'iphone' else (self.H - sh) / 2
        if self.device == 'ipad':
            self.add(f'<rect width="{self.W}" height="{self.H}" fill="#000000" opacity="0.12"/>')
        self.add(f'<rect x="{f(sx)}" y="{f(st)}" width="{f(sw)}" height="{f(sh)}" rx="38" fill="{t["paper"]}"/>')
        st += 14 if self.device == 'iphone' else (sh - 200) / 2  # below the rounded top on iPhone; centred on iPad
        self.add(sticker(pose('pomo', 'celebrating'), sx + 46, st + 44, 44, t['stickerShadow'], point=1, edge=t['stickerEdge']))
        self.add(baloo(tr_(self.lang, 'loveNote.title'), sx + 78, st + 52, 22, t['ink'], lang=self.lang))
        self.add(inter(NOTE[self.lang], sx + 24, st + 106, 20, t['ink'], 400))
        self.pill(tr_(self.lang, 'loveNote.close'), st + 140, primary=False, w=152, cx=sx + sw / 2)

    def modes(self):
        """Panel 5, at night: the Ring in Midnight Plum and the Modes sheet over it."""
        t = self.t
        self.frame()
        self.top_row('focus', 1)
        b, partner_y, cy, size = self.ring_layout()
        self.ring(self.W / 2, cy, size, 0, t['ringFocus'], '25:00')
        self.partner_strip(partner_y, 'ready', 'idle')
        self.today_row(b - 231, GOAL_SESSIONS, 0, goal=True)
        self.controls_idle('startFocus', b)
        self.tab_bar(0)
        self.home_indicator()
        self.add(f'<rect width="{self.W}" height="{self.H}" fill="#000000" opacity="0.32"/>')
        sw = min(self.W - 17, 560)
        sx = (self.W - sw) / 2
        sh = 351
        st = self.H - 9 - sh if self.device == 'iphone' else (self.H - sh) / 2  # iPad: centred, as above
        self.add(f'<rect x="{f(sx)}" y="{f(st)}" width="{f(sw)}" height="{sh}" rx="38" fill="{t["page"]}"/>')
        cx0, cw = sx + 23.5, sw - 47
        self.add(inter(self.s('modes.title'), cx0, st + 50, 22, t['ink'], 600))
        ky = st + 64
        self.add(f'<rect x="{f(cx0 + 1)}" y="{f(ky + 1)}" width="{f(cw - 2)}" height="145" rx="20" fill="{t["primarySoft"]}" stroke="{t["primaryInk"]}" stroke-width="2"/>')
        mark = art('art/out/logo/mark-single-cocoa.svg')
        self.add(f'<g transform="translate({f(cx0 + 12)} {f(ky + 17)}) scale({f(44 / 784)})">{paths_svg(mark, fill=t["ink"])}</g>')
        self.add(inter(self.s('modes.classic'), cx0 + 67, ky + 40, 17, t['ink'], 600))
        self.add(glyph('check', cx0 + cw - 23, ky + 34, 24, t['primaryInk']))
        self.add(inter(self.s('modes.layout'), cx0 + 13, ky + 75, 15, t['inkSoft'], 500))
        self.segmented([self.s('modes.ring'), self.s('modes.spread')], 0, cx0 + 13, ky + 85, cw - 26)
        fy = ky + 164
        self.add(f'<rect x="{f(cx0 + 0.75)}" y="{f(fy + 0.75)}" width="{f(cw - 1.5)}" height="65.5" rx="20" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(f'<rect x="{f(cx0 + 13)}" y="{f(fy + 12)}" width="42" height="42" rx="11" fill="{t["primarySoft"]}"/>')
        self.add(glyph('fly', cx0 + 34, fy + 33, 24, t['primaryInk']))
        self.add(inter(self.s('modes.fly'), cx0 + 67, fy + 39, 17, t['ink'], 600))


def page_path(x, y, w, h, outer):
    """A Facing pages page: outer corners 22, spine corners 8."""
    lt, rt = (22, 8) if outer == 'l' else (8, 22)
    return (f'M{f(x + lt)} {f(y)} H{f(x + w - rt)} Q{f(x + w)} {f(y)} {f(x + w)} {f(y + rt)} V{f(y + h - rt)} '
            f'Q{f(x + w)} {f(y + h)} {f(x + w - rt)} {f(y + h)} H{f(x + lt)} Q{f(x)} {f(y + h)} {f(x)} {f(y + h - lt)} '
            f'V{f(y + lt)} Q{f(x)} {f(y)} {f(x + lt)} {f(y)} Z')


SCREENS = ['spread', 'ring_landing', 'stats', 'note', 'modes']


def screen_svg(device, panel, lang):
    t = DARK if panel == 4 else LIGHT
    sc = Screen(device, t, lang, HOURS[panel])
    getattr(sc, SCREENS[panel])()
    return ''.join(sc.out)


# ---------------------------------------------------------------------------------------------
# Devices: the drawn hardware around a screen, and the strip each set is cut from.

DEVICES = {
    'iphone': {
        'screen': (393, 852),
        'panel': (1320, 2868),
        'gutter': 60,
        'crops': [(1320, 2868), (1206, 2622)],
        'device_w': 900, 'device_y': 760, 'bezel': 0.0375, 'radius': 0.152,
        'caption': (136, 54, 1180, 300),  # headline px, sub px, max width, first baseline
        'hill': 2610,
    },
    'ipad': {
        'screen': (1032, 1376),
        'panel': (2064, 2752),
        'gutter': 92,
        'crops': [(2064, 2752)],
        # The iPad shows its phone column centred, so the device fills the panel's width and runs off its
        # foot: the column reads at 0.43 of the panel, and the hill covers the screen below today's row.
        'device_w': 1851, 'device_y': 650, 'bezel': 0.0205, 'radius': 0.026,
        'caption': (156, 62, 1860, 250),
        'hill': 2700,
    },
}

# Where everyone stands, panel by panel (x from the panel's left edge, in px). Every sticker stays whole
# inside its own panel (at least 24 px from a side, 70 px from the strip's last edge), and wherever one
# stands in front of a phone it covers a tab item completely or not at all, and never the selected tab:
# the positions below were set from the tab items' boxes (record §3.8).
CAST = {
    'iphone': {
        'device_x': [210, 330, 290, 290, 210],
        'stickers': [
            # panel, who, art, x, size
            (0, 'pomo', ('wave', 'wave-left'), 1010, 480),
            (1, 'doro', ('wave', 'wave-right'), 222, 460),
            (2, 'doro', ('excited',), 215, 380),
            (2, 'pomo', ('excited',), 1060, 380),
            (3, 'pomo', ('break',), 140, 260),
            (3, 'doro', ('break',), 340, 260),
            (4, 'pomo', ('sleepy',), 922, 270),
            (4, 'doro', ('sleepy',), 1137, 270),
        ],
        'callout': (1, 1160, 1905, 300),  # panel, x, y, size: today's landing sticker, breaking out of the screen
        'hill_end': (25, 60),  # the hill eases down under panel 5, so the sleepers lie below the Modes sheet's Fly row
    },
    'ipad': {
        'device_x': [106] * 5,
        'stickers': [
            (0, 'pomo', ('wave', 'wave-left'), 1720, 520),
            (1, 'doro', ('wave', 'wave-right'), 350, 500),
            (2, 'doro', ('excited',), 350, 440),
            (2, 'pomo', ('excited',), 1730, 440),
            (3, 'pomo', ('break',), 260, 300),
            (3, 'doro', ('break',), 460, 290),
            (4, 'pomo', ('sleepy',), 1650, 300),
            (4, 'doro', ('sleepy',), 1860, 300),
        ],
        'callout': (1, 1560, 2440, 300),
        'hill_end': (-20, 20),
    },
}


def device_svg(device, x, y, screen, ids):
    d = DEVICES[device]
    W, H = d['screen']
    w = d['device_w']
    bezel = w * d['bezel']
    sw = w - 2 * bezel
    s = sw / W
    sh = H * s
    h = sh + 2 * bezel
    r = w * d['radius']
    clip = ids()
    rim = w * 0.006
    out = [
        # The cocoa body, with a lighter edge so it holds against the night as well as the day.
        f'<rect x="{f(x - 2.5)}" y="{f(y - 2.5)}" width="{f(w + 5)}" height="{f(h + 5)}" rx="{f(r + 2.5)}" fill="#8A6A64"/>',
        f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="#3B2421"/>',
        f'<rect x="{f(x + rim)}" y="{f(y + rim)}" width="{f(w - 2 * rim)}" height="{f(h - 2 * rim)}" rx="{f(r - rim)}" fill="#120B0C"/>',
        f'<clipPath id="{clip}"><rect x="{f(x + bezel)}" y="{f(y + bezel)}" width="{f(sw)}" height="{f(sh)}" rx="{f(r - bezel)}"/></clipPath>',
        f'<g clip-path="url(#{clip})"><g transform="translate({f(x + bezel)} {f(y + bezel)}) scale({f(s)})">{screen}</g></g>',
    ]
    if device == 'iphone':
        out.append(f'<rect x="{f(x + w / 2 - 63 * s)}" y="{f(y + bezel + 11 * s)}" width="{f(126 * s)}" height="{f(37 * s)}" rx="{f(18.5 * s)}" fill="#0B0708"/>')
        for by, bh in ((0.205, 0.035), (0.265, 0.065), (0.345, 0.065)):  # action button and volume
            out.insert(0, f'<rect x="{f(x - 7)}" y="{f(y + h * by)}" width="12" height="{f(h * bh)}" rx="5" fill="#3B2421"/>')
        out.insert(0, f'<rect x="{f(x + w - 5)}" y="{f(y + h * 0.29)}" width="12" height="{f(h * 0.1)}" rx="5" fill="#3B2421"/>')
    else:
        out.append(f'<circle cx="{f(x + w / 2)}" cy="{f(y + bezel / 2)}" r="{f(bezel * 0.16)}" fill="#2A1D22"/>')
    return ''.join(out), h


# ---------------------------------------------------------------------------------------------
# The strip: one study day across five panels

TONES = [LIGHT['page'], LIGHT['primarySoft'], LIGHT['primary'], DARK['primarySoft'], DARK['page']]


def strip_svg(device, lang):
    d = DEVICES[device]
    PW, PH = d['panel']
    G = d['gutter']
    N = 5
    SW = N * PW + (N - 1) * G
    k = PW / 1320  # the iPhone strip is the reference; the iPad's art scales by its panel width
    ids = Ids('c')

    def px(i):
        return i * (PW + G)

    def seam(i):  # the middle of the gutter left of panel i
        return px(i) - G / 2

    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{SW}" height="{PH}" viewBox="0 0 {SW} {PH}">',
           f'<title>App Store screenshots, {device}, {lang}: Morning to night</title>']
    out.append(f'<rect x="-40" y="-40" width="{SW + 80}" height="{PH + 80}" fill="{TONES[0]}"/>')

    # The day's grounds: each new tone enters on a sweeping cut that crosses the seam.
    for i in range(1, N):
        sx = seam(i)
        a, b, c = (150, -140, 110) if i % 2 else (-120, 160, -90)
        top, mid, bot = sx + a * k, sx + b * k, sx + c * k
        path = (f'M{f(top)} -40 C{f(top)} {f(PH * 0.22)} {f(mid)} {f(PH * 0.3)} {f(mid)} {f(PH * 0.5)} '
                f'C{f(mid)} {f(PH * 0.7)} {f(bot)} {f(PH * 0.78)} {f(bot)} {f(PH + 40)} H{SW + 40} V-40 Z')
        out.append(f'<path d="{path}" fill="{TONES[i]}"/>')

    # The sky's paper: the morning sun, the afternoon sun, the sun setting at dusk, the moon and stars.
    # Each is cut paper with the white core of its cut edge showing, as the hill shows its edge.
    cut = f' stroke="{LIGHT["paper"]}" stroke-width="{f(6 * k)}"'
    out.append(f'<circle cx="{f(px(0) + 1150 * k)}" cy="{f(735 * k)}" r="{f(96 * k)}" fill="{LIGHT["primary"]}"{cut}/>')
    out.append(f'<circle cx="{f(px(2) + 1205 * k)}" cy="{f(1150 * k)}" r="{f(80 * k)}" fill="{LIGHT["page"]}" stroke="{LIGHT["primarySoft"]}" stroke-width="{f(6 * k)}"/>')
    out.append(f'<circle cx="{f(px(3) + 1150 * k)}" cy="{f(d["hill"] - 40 * k)}" r="{f(120 * k)}" fill="{LIGHT["primary"]}"{cut}/>')
    mx, my, mr = px(4) + 1215 * k, 1300 * k, 75 * k
    # The crescent: a paper moon, and the night's own paper cut over it (the ground there is plum page).
    out.append(f'<circle cx="{f(mx)}" cy="{f(my)}" r="{f(mr)}" fill="{LIGHT["page"]}" stroke="{DARK["edgeStrong"]}" stroke-width="{f(5 * k)}"/>')
    out.append(f'<circle cx="{f(mx + mr * 0.42)}" cy="{f(my - mr * 0.24)}" r="{f(mr * 0.84)}" fill="{TONES[4]}"/>')
    for sx_, sy_, sr in ((px(4) + 120 * k, 1060 * k, 9), (px(4) + 1240 * k, 1780 * k, 7), (px(3) + 1230 * k, 920 * k, 7), (px(4) + 95 * k, 1580 * k, 6)):
        out.append(f'<circle cx="{f(sx_)}" cy="{f(sy_)}" r="{f(sr * k)}" fill="{LIGHT["page"]}"/>')

    # A far hill behind the devices, in the well tone (plum well from dusk), so the ground has two layers of
    # paper where it shows between the phones.
    cast = CAST[device]
    fy = d['hill'] - 95 * k
    far = [(-40, fy + 20 * k), (seam(1) - 150 * k, fy - 25 * k), (seam(2) - 450 * k, fy + 15 * k), (seam(2) + 250 * k, fy - 30 * k),
           (seam(3) + 100 * k, fy + 10 * k), (seam(4) - 300 * k, fy - 20 * k), (SW + 40, fy + 30 * k)]
    far_d = f'M{f(far[0][0])} {f(far[0][1])}'
    for (x0, y0), (x1, y1) in zip(far, far[1:]):
        far_d += f' C{f((x0 + x1) / 2)} {f(y0)} {f((x0 + x1) / 2)} {f(y1)} {f(x1)} {f(y1)}'
    far_day, far_night = ids(), ids()
    out.append(f'<clipPath id="{far_day}"><rect x="-40" y="0" width="{f(seam(3) + 40)}" height="{PH + 40}"/></clipPath>')
    out.append(f'<clipPath id="{far_night}"><rect x="{f(seam(3))}" y="0" width="{f(SW - seam(3) + 40)}" height="{PH + 40}"/></clipPath>')
    for clip, t in ((far_day, LIGHT), (far_night, DARK)):
        out.append(f'<g clip-path="url(#{clip})"><path d="{far_d} V{PH + 40} H-40 Z" fill="{t["field"]}"/><path d="{far_d}" fill="none" stroke="{t["edge"]}" stroke-width="{f(6 * k)}"/></g>')

    # The devices, each with its panel's screen.
    for i in range(N):
        svg, _ = device_svg(device, px(i) + cast['device_x'][i], d['device_y'], screen_svg(device, i, lang), ids)
        out.append(svg)

    # The paper hill, with a crisp edge, running the whole strip; plum from dusk.
    hy = d['hill']
    e1, e2 = cast['hill_end']
    if device == 'iphone':
        pts = [(-40, hy), (seam(1) - 600 * k, hy - 40 * k), (seam(1) + 300 * k, hy + 10 * k), (seam(2) - 200 * k, hy - 30 * k),
               (seam(2) + 500 * k, hy + 20 * k), (seam(3) - 150 * k, hy - 20 * k), (seam(3) + 600 * k, hy + 15 * k),
               (seam(4) + 200 * k, hy + e1 * k), (SW + 40, hy + e2 * k)]
    else:
        # The iPad's screen runs under the hill, so across each device the hill is level at one line, below
        # today's row and above the presets: the row always shows whole, the presets never half.
        pts = [(-40, hy - 10)]
        for i in range(N):
            pts += [(px(i) + 430, hy - 50), (px(i) + PW - 430, hy - 50)]
            if i < N - 1:
                pts.append((seam(i + 1), hy - 5))
        pts.append((SW + 40, hy - 10))
    hill = f'M{f(pts[0][0])} {f(pts[0][1])}'
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        mx_ = (x0 + x1) / 2
        hill += f' C{f(mx_)} {f(y0)} {f(mx_)} {f(y1)} {f(x1)} {f(y1)}'
    dusk = seam(3)  # the hill turns plum inside the gutter, so neither panel shows the change
    night = ids()
    day = ids()
    out.append(f'<clipPath id="{day}"><rect x="-40" y="0" width="{f(dusk + 40)}" height="{PH + 40}"/></clipPath>')
    out.append(f'<clipPath id="{night}"><rect x="{f(dusk)}" y="0" width="{f(SW - dusk + 40)}" height="{PH + 40}"/></clipPath>')
    out.append(f'<g clip-path="url(#{day})"><path d="{hill} V{PH + 40} H-40 Z" fill="{LIGHT["paper"]}"/><path d="{hill}" fill="none" stroke="{LIGHT["edge"]}" stroke-width="{f(6 * k)}"/></g>')
    out.append(f'<g clip-path="url(#{night})"><path d="{hill} V{PH + 40} H-40 Z" fill="{DARK["paper"]}"/><path d="{hill}" fill="none" stroke="{DARK["edge"]}" stroke-width="{f(6 * k)}"/></g>')

    def hill_y(x):
        """The hill's height at x, from its segment (a smooth step between the two ends)."""
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if x0 <= x <= x1:
                u = (x - x0) / (x1 - x0)
                return y0 + (y1 - y0) * (3 * u * u - 2 * u * u * u)
        return hy

    def stand(paths, cx, size, shadow, edge=None, lift=0, rotate=0):
        """A sticker standing on the hill, the foot of its die-cut edge sunk a little into the paper
        (or `lift` of its size above it, mid-drop)."""
        top = hill_y(cx) + size * (0.03 - lift) - feet(paths) * size / 512
        return sticker(paths, cx, top + size / 2, size, shadow, edge=edge, rotate=rotate)

    def burst(cx, cy, size, x_max):
        """The placement's twelve paper bits (TodayStickers.tsx) at the scene's scale, around a sticker
        `size` wide: the same angles, colours and spins, spread to the sticker's edge. Only the bits flying
        out of the screen (rightward) are kept, so none lands on the screen's text, and none past x_max."""
        colours = [LIGHT['primary'], LIGHT['success'], LIGHT['ink'], LIGHT['accent']]
        bits = []
        for i in range(12):
            angle = i / 12 * math.pi * 2 + (0.2 if i % 2 else -0.1)
            dist = size * (0.62 + (i % 3) * 0.1)
            bx, by = cx + math.cos(angle) * dist, cy + math.sin(angle) * dist - size * 0.06
            if math.cos(angle) < -0.2 or bx > x_max:
                continue
            spin = (1 if i % 2 else -1) * (90 + i * 15) * 0.4
            bw, bh = size * 0.05, size * 0.075
            bits.append(f'<rect x="{f(-bw / 2)}" y="{f(-bh / 2)}" width="{f(bw)}" height="{f(bh)}" rx="{f(bw / 3)}" fill="{colours[i % 4]}" transform="translate({f(bx)} {f(by)}) rotate({f(spin)})"/>')
        return ''.join(bits)

    # Pomo & Doro through the day: waving hello astride the first seam, excited by the week, on a break
    # with their mugs at dusk, asleep at night. Panels 4 and 5 are night: plum lift, milk die-cut edge.
    for panel, who, look, x, size in cast['stickers']:
        if look[0] == 'wave':
            paths = tour(who, 'smile', 'grin', look[1], raise_hand=24)
        elif look[0] == 'excited':
            paths = tour(who, 'sparkle', 'grin')
        elif look[0] == 'break':
            paths = MUG_CUT + pose(who, 'break')
        else:
            paths = night_marks(pose(who, 'sleepy'), DARK['inkSoft'])
        night = panel >= 3
        out.append(stand(paths, px(panel) + x, size, (DARK if night else LIGHT)['stickerShadow'], DARK['stickerEdge'] if night else None))

    # Panel 2's proof: today's landing sticker (Pomo's, the third of the day) again at three times its
    # cell, breaking out of the screen beside today's row, mid-drop and tilted inside its paper bits.
    panel, x, y, size = cast['callout']
    out.append(burst(px(panel) + x, y, size, px(panel) + PW - 24 * k))
    out.append(sticker(pose('pomo', 'celebrating'), px(panel) + x, y, size, LIGHT['stickerShadow'], rotate=-8))

    # The captions: Baloo 2, centred, the headline for search results and the line under it for the page.
    head, sub, max_w, base = d['caption']
    for i, (h_text, s_text) in enumerate(CAPTIONS[lang]):
        night_panel = i >= 3
        ink = DARK['ink'] if night_panel else LIGHT['ink']
        soft = DARK['inkSoft'] if night_panel else (LIGHT['ink'] if i == 2 else LIGHT['inkSoft'])
        cx = px(i) + PW / 2
        lines = [l for part in h_text.split('|') for l in wrap_baloo(part, head, max_w, lang=lang)]
        for j, line in enumerate(lines):
            out.append(baloo(line, cx, base + j * head * 1.04, head, ink, 'middle', lang=lang))
        y = base + (len(lines) - 1) * head * 1.04 + sub * 1.75
        sub_lines = [l for part in s_text.split('|') for l in wrap_baloo(part, sub, max_w * 0.92, 'Medium', lang)]
        for j, line in enumerate(sub_lines):
            out.append(baloo(line, cx, y + j * sub * 1.3, sub, soft, 'middle', 'Medium', lang))

    out.append('</svg>')
    return ''.join(out) + '\n'


# ---------------------------------------------------------------------------------------------
# The job: each strip built once, every panel cropped at each App Store size

def job():
    assets = []
    for device in ('iphone', 'ipad'):
        d = DEVICES[device]
        PW, PH = d['panel']
        G = d['gutter']
        SW = 5 * PW + 4 * G
        for lang in ('en', 'tr'):
            crops = []
            for i in range(5):
                for w, h in d['crops']:
                    s = w / PW
                    rect_h = h / s
                    crops.append({'name': f'{i + 1:02d}-{w}x{h}', 'rect': [i * (PW + G), round(-(rect_h - PH) / 2, 3), PW, round(rect_h, 3)], 'px': w})
            assets.append({'id': f'store-{device}-{lang}', 'src': f'art/src/store/store-{device}-{lang}.svg', 'kind': 'store', 'png': [round(SW / 5)], 'crops': crops})
    return {
        'about': "v1.4's App Store screenshots, 'Morning to night' (docs/implementations/2026-11-01-app-store-screenshots.md): "
                 'one strip per device and language, five panels side by side with the store\'s gutter, written by '
                 'scripts/art/store-sources.py. Each panel is a crop at every size App Store Connect takes: iPhone '
                 '1320 x 2868 (6.9") and 1206 x 2622 (6.3"), iPad 2064 x 2752 (13"). The whole strip also exports at a fifth of its width for the preview page.',
        'assets': assets,
    }


def files():
    out = {}
    for device in ('iphone', 'ipad'):
        for lang in ('en', 'tr'):
            out[f'art/src/store/store-{device}-{lang}.svg'] = strip_svg(device, lang)
    out['art/jobs/store.json'] = json.dumps(job(), indent=1, ensure_ascii=False) + '\n'
    return out


def main():
    sys.stdout.reconfigure(encoding='utf-8')  # the ticks, on a Windows console too
    argparse.ArgumentParser(description=__doc__.split('\n')[1]).add_argument('--check', action='store_true')
    differences = 0
    for rel, text in files().items():
        path = os.path.join(ROOT, rel)
        if CHECK:
            same = os.path.exists(path) and open(path, encoding='utf-8', newline='').read() == text
            if not same:
                differences += 1
                print(f'✖ {rel} is not what the generator writes')
        else:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(text)
            print(f'✔ wrote {rel}')
    if CHECK:
        print(f'✖ {differences} file(s) differ' if differences else '✔ every store source matches the generator')
        sys.exit(1 if differences else 0)


if __name__ == '__main__':
    main()
