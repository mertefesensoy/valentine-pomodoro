"""The geometry of the Same Page mark, the app icon and Pomo & Doro: the one source of truth.

Every function returns SVG text. The app's art sources (`art/src/app-icon/`, `art/src/identity/`,
`art/src/mascots/`) were drawn by exactly this code in Stage C; `check_brand.py` asserts they
still match byte for byte, so the brand kit and the app can't drift apart.

Colours come from `src/theme/palette.json` (the C1 tokens, ADR-0045), plus two art-only
swatches: MATCHA (Doro) and BLUSH (cheeks). No side effects.
"""
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = json.load(open(os.path.join(REPO, "src/theme/palette.json"), encoding="utf8"))["themes"]
L, D = P["strawberryMilk"]["tokens"], P["midnightPlum"]["tokens"]
INK, PAGE, PRIMARY, EDGE = L["ink"], L["page"], L["primary"], L["stickerEdge"]
MATCHA, BLUSH = "#9ED39A", "#EE7A9C"

# ------------------------------------------------------------------ the mark (Same Page)
# Drawn on a 1024 grid: two pages of one open diary, each tilted 5° toward the spine,
# each with a face. The pages' paths are the mark; everything else is placement.
LEFT = 'M494 386 C426 330 306 306 206 312 Q164 315 164 357 L164 666 Q164 708 206 706 C306 700 422 718 494 780 Z'
RIGHT = 'M530 386 C598 330 718 306 818 312 Q860 315 860 357 L860 666 Q860 708 818 706 C718 700 602 718 530 780 Z'
ROT_L, ROT_R = 'rotate(5 494 780)', 'rotate(-5 530 780)'
# The tight frame around the mark and its die-cut edge, in the same grid: x y w h.
FRAME = (120, 260, 784, 576)


def faces(e):
    return ('<g transform="rotate(5 494 780)"><circle cx="350" cy="522" r="30" fill="{e}"/><circle cx="434" cy="534" r="30" fill="{e}"/>'
            '<path d="M374 598 Q396 618 418 602" fill="none" stroke="{e}" stroke-width="18" stroke-linecap="round"/></g>'
            '<g transform="rotate(-5 530 780)"><circle cx="590" cy="534" r="30" fill="{e}"/><circle cx="674" cy="522" r="30" fill="{e}"/>'
            '<path d="M606 602 Q628 618 650 598" fill="none" stroke="{e}" stroke-width="18" stroke-linecap="round"/></g>').format(e=e)


def pages(fill, edge=None):
    out = ''
    if edge:
        out += (f'<g transform="rotate(5 494 780)"><path d="{LEFT}" fill="{edge}" stroke="{edge}" stroke-width="56" stroke-linejoin="round"/></g>'
                f'<g transform="rotate(-5 530 780)"><path d="{RIGHT}" fill="{edge}" stroke="{edge}" stroke-width="56" stroke-linejoin="round"/></g>'
                f'<rect x="480" y="560" width="64" height="200" fill="{edge}"/>')
    return out + (f'<g transform="rotate(5 494 780)"><path d="{LEFT}" fill="{fill}"/></g>'
                  f'<g transform="rotate(-5 530 780)"><path d="{RIGHT}" fill="{fill}"/></g>')


def svg1024(title, inner, bg=None):
    b = f'<rect width="1024" height="1024" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><title>{title}</title>{b}{inner}</svg>\n'


def app_icon(kind):
    """The iOS app icon (C3 gate 2): 'light', 'dark' or 'tinted'. Identical to art/src/app-icon/icon-<kind>.svg."""
    if kind == 'light':
        return svg1024('App icon, light: the Same Page mark as a cocoa sticker on strawberry', pages(INK, EDGE) + faces(PAGE), PRIMARY)
    if kind == 'dark':
        return svg1024('App icon, dark: strawberry pages with a milk edge on a plum night', pages(D['primary'], D['stickerEdge']) + faces(D['page']), D['page'])
    return svg1024('App icon, tinted: a grayscale mark on black for the system tint', pages('#FFFFFF') + faces('#000000'), '#000000')


def circle(cx, cy, r):
    return f'M{cx-r} {cy} a{r} {r} 0 1 0 {2*r} 0 a{r} {r} 0 1 0 {-2*r} 0 Z'


# Each smile is a stroke 18 wide; as a hole it needs its outline: the curve offset by 9 each way, round caps.
SMILE_L = 'M374 589 Q396 609 418 593 A9 9 0 0 1 418 611 Q396 627 374 607 A9 9 0 0 1 374 589 Z'
SMILE_R = 'M606 593 Q628 609 650 589 A9 9 0 0 1 650 607 Q628 627 606 611 A9 9 0 0 1 606 593 Z'
HOLES_L = circle(350, 522, 30) + ' ' + circle(434, 534, 30) + ' ' + SMILE_L
HOLES_R = circle(590, 534, 30) + ' ' + circle(674, 522, 30) + ' ' + SMILE_R


def sticker(fill, edge, eyes):
    """The mark in colour: pages, a die-cut edge, faces."""
    return (f'<g transform="{ROT_L}"><path d="{LEFT}" fill="{edge}" stroke="{edge}" stroke-width="56" stroke-linejoin="round"/></g>'
            f'<g transform="{ROT_R}"><path d="{RIGHT}" fill="{edge}" stroke="{edge}" stroke-width="56" stroke-linejoin="round"/></g>'
            f'<rect x="480" y="560" width="64" height="200" fill="{edge}"/>'
            f'<g transform="{ROT_L}"><path d="{LEFT}" fill="{fill}"/></g><g transform="{ROT_R}"><path d="{RIGHT}" fill="{fill}"/></g>'
            + faces(eyes))


def single(ink):
    """The mark in one ink: the faces are cut out (even-odd), so the ground shows through."""
    return (f'<g transform="{ROT_L}"><path fill="{ink}" fill-rule="evenodd" d="{LEFT} {HOLES_L}"/></g>'
            f'<g transform="{ROT_R}"><path fill="{ink}" fill-rule="evenodd" d="{RIGHT} {HOLES_R}"/></g>')


def identity_svg(title, inner):
    """The C5 tight artboard (784 × 576 around the mark). Identical to art/src/identity/mark-*.svg."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="784" height="576" viewBox="120 260 784 576"><title>{title}</title>'
            f'{inner}</svg>\n')


# The colour version since 2026-10-30 (the owner's choice C, brand-kit record §10): cocoa as the
# diary's cover around strawberry pages, not as the fill. The white edge is 50 outside each page
# (its band stays 28 wide, as on every version), the cocoa cover 22 outside; the blocks at the
# spine fill the gap between the pages' feet, so it shows as a cocoa spine. The wider outline
# (774 x 591.3 units) is scaled to the frame's height and centred in it: lockups, clear space
# and minimum sizes stay as they are.
COVER_EDGE, COVER = 100, 44
COVER_OUTLINE_CY, COVER_OUTLINE_H = 534.35, 591.3
COVER_FIT = f'translate(512 548) scale({576 / COVER_OUTLINE_H:.4f}) translate(-512 -{COVER_OUTLINE_CY})'


def sticker_cover(fill, cover, edge, eyes):
    """The mark with a cover: pages `fill` framed by `cover`, a die-cut `edge`, faces `eyes`."""
    return (f'<g transform="{COVER_FIT}">'
            f'<g transform="{ROT_L}"><path d="{LEFT}" fill="{edge}" stroke="{edge}" stroke-width="{COVER_EDGE}" stroke-linejoin="round"/></g>'
            f'<g transform="{ROT_R}"><path d="{RIGHT}" fill="{edge}" stroke="{edge}" stroke-width="{COVER_EDGE}" stroke-linejoin="round"/></g>'
            f'<rect x="470" y="560" width="84" height="236" fill="{edge}"/>'
            f'<g transform="{ROT_L}"><path d="{LEFT}" fill="{cover}" stroke="{cover}" stroke-width="{COVER}" stroke-linejoin="round"/></g>'
            f'<g transform="{ROT_R}"><path d="{RIGHT}" fill="{cover}" stroke="{cover}" stroke-width="{COVER}" stroke-linejoin="round"/></g>'
            f'<rect x="482" y="560" width="60" height="226" fill="{cover}"/>'
            f'<g transform="{ROT_L}"><path d="{LEFT}" fill="{fill}"/></g><g transform="{ROT_R}"><path d="{RIGHT}" fill="{fill}"/></g>'
            + faces(eyes) + '</g>')


# The four versions (C5, amended 2026-10-30): (title, drawing in the 1024 grid).
MARKS = {
    "colour": ("Same Page, colour: strawberry pages in a cocoa cover", sticker_cover(PRIMARY, INK, EDGE, INK)),
    "reversed": ("Same Page, reversed: strawberry pages for dark grounds", sticker(D["primary"], D["stickerEdge"], D["page"])),
    "single-cocoa": ("Same Page, single colour: cocoa, faces cut out", single(INK)),
    "single-white": ("Same Page, single colour: white, faces cut out", single("#FFFFFF")),
}


# There is no small mark: below the 24 px minimum the app icon carries the brand (C5), and
# pulling the pages apart to make one is on the sheet's "Never" list.


# ------------------------------------------------------------------ Pomo and Doro
POMO = dict(body='<circle cx="256" cy="282" r="176"/>', top=106, w=352, h=352, fill=PRIMARY, curl=True)
DORO = dict(body='<path d="M60 362 C60 212 150 134 256 134 C362 134 452 212 452 362 C452 426 392 456 256 456 C120 456 60 426 60 362 Z"/>',
            top=134, w=392, h=322, fill=MATCHA, curl=False)
CURL = {
    'up':   'M262 108 C258 72 286 56 306 70 C322 82 312 104 294 100',
    'tall': 'M262 108 C262 64 282 44 300 54 C316 64 308 86 292 84',
    'droop': 'M262 108 C268 84 300 80 312 96 C320 108 306 120 296 112',
}


def eyes(kind, cx, ey, gap, er, look=(0, 0)):
    out = []
    for dx in (-gap / 2, gap / 2):
        x, y = cx + dx + look[0], ey + look[1]
        if kind == 'open':
            out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{er:.1f}" ry="{er*1.25:.1f}" fill="{INK}"/>'
                       f'<circle cx="{x+er*0.35:.1f}" cy="{y-er*0.45:.1f}" r="{er*0.32:.1f}" fill="#FFFFFF"/>')
        elif kind == 'happy':   # closed, upward arcs
            out.append(f'<path d="M{x-er*1.3:.1f} {y+er*0.4:.1f} Q{x:.1f} {y-er*1.3:.1f} {x+er*1.3:.1f} {y+er*0.4:.1f}" fill="none" stroke="{INK}" stroke-width="{er*0.7:.1f}" stroke-linecap="round"/>')
        elif kind == 'sleepy':  # closed, downward arcs
            out.append(f'<path d="M{x-er*1.3:.1f} {y-er*0.2:.1f} Q{x:.1f} {y+er*1.2:.1f} {x+er*1.3:.1f} {y-er*0.2:.1f}" fill="none" stroke="{INK}" stroke-width="{er*0.7:.1f}" stroke-linecap="round"/>')
        elif kind == 'focus':   # calm, eyes lowered to the work: open ovals looking down, the shine low
            out.append(f'<ellipse cx="{x:.1f}" cy="{y+er*0.25:.1f}" rx="{er*0.95:.1f}" ry="{er*1.1:.1f}" fill="{INK}"/>'
                       f'<circle cx="{x+er*0.3:.1f}" cy="{y+er*0.65:.1f}" r="{er*0.28:.1f}" fill="#FFFFFF"/>')
        elif kind == 'star':    # celebrating: a big shine
            out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{er*1.1:.1f}" ry="{er*1.4:.1f}" fill="{INK}"/>'
                       f'<circle cx="{x+er*0.35:.1f}" cy="{y-er*0.5:.1f}" r="{er*0.45:.1f}" fill="#FFFFFF"/><circle cx="{x-er*0.4:.1f}" cy="{y+er*0.5:.1f}" r="{er*0.2:.1f}" fill="#FFFFFF"/>')
    return ''.join(out)


def mouth(kind, cx, my, width):
    if kind == 'smile':
        return f'<path d="M{cx-0.045*width:.1f} {my:.1f} Q{cx:.1f} {my+0.05*width:.1f} {cx+0.045*width:.1f} {my:.1f}" fill="none" stroke="{INK}" stroke-width="{0.022*width:.1f}" stroke-linecap="round"/>'
    if kind == 'flat':
        return f'<path d="M{cx-0.03*width:.1f} {my+0.01*width:.1f} L{cx+0.03*width:.1f} {my+0.01*width:.1f}" stroke="{INK}" stroke-width="{0.022*width:.1f}" stroke-linecap="round"/>'
    if kind == 'open':
        return f'<path d="M{cx-0.06*width:.1f} {my-0.005*width:.1f} Q{cx:.1f} {my+0.1*width:.1f} {cx+0.06*width:.1f} {my-0.005*width:.1f} Z" fill="{INK}"/><path d="M{cx-0.03*width:.1f} {my+0.035*width:.1f} Q{cx:.1f} {my+0.065*width:.1f} {cx+0.03*width:.1f} {my+0.035*width:.1f}" fill="#E06688"/>'
    if kind == 'o':
        return f'<ellipse cx="{cx:.1f}" cy="{my+0.015*width:.1f}" rx="{0.018*width:.1f}" ry="{0.022*width:.1f}" fill="{INK}"/>'


POSES = {
    #          eyes      mouth    curl    squash (sx, sy)  dy   extras
    'idle':   ('open',  'smile', 'up',   (1, 1),       0,   ''),
    'focusing': ('focus', 'smile', 'tall', (0.97, 1.03), -4,  'pencil'),
    'break':  ('happy', 'open',  'up',   (1.04, 0.96), 6,   'steam'),
    'celebrating': ('star', 'open', 'tall', (0.96, 1.05), -26, 'confetti'),
    'sleepy': ('sleepy', 'o',    'droop', (1.06, 0.93), 12, 'zz'),
}


def extras(kind, ch):
    if kind == 'pencil':   # a short pencil held in front, below the face
        return (f'<g transform="rotate(-30 330 420)"><rect x="300" y="404" width="96" height="24" rx="10" fill="{L["field"]}" stroke="{INK}" stroke-width="6"/>'
                f'<path d="M396 404 L424 416 L396 428 Z" fill="{INK}"/><rect x="292" y="404" width="16" height="24" rx="6" fill="{BLUSH}"/></g>')
    if kind == 'steam':    # a mug beside them on a break
        return (f'<g><rect x="380" y="380" width="70" height="66" rx="16" fill="{EDGE}" stroke="{INK}" stroke-width="6"/>'
                f'<path d="M450 398 Q478 400 476 418 Q474 436 450 434" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
                f'<path d="M402 366 Q392 350 404 336" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round" opacity="0.5"/>'
                f'<path d="M426 366 Q416 350 428 336" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round" opacity="0.5"/></g>')
    if kind == 'confetti':
        bits = [(80, 120, 18, BLUSH), (430, 96, -24, MATCHA), (60, 300, 32, L['ringFocus']), (450, 260, -12, PRIMARY), (120, 60, 50, MATCHA), (392, 40, 10, BLUSH)]
        return ''.join(f'<rect x="{x}" y="{y}" width="22" height="12" rx="4" fill="{c}" stroke="{EDGE}" stroke-width="3" transform="rotate({r} {x+11} {y+6})"/>' for x, y, r, c in bits)
    if kind == 'zz':
        return (f'<path d="M400 120 h34 l-34 38 h34" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>'
                f'<path d="M444 70 h22 l-22 25 h22" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>')
    return ''


def character(ch, pose, mono=None):
    """Pomo or Doro in a pose, on a 512 artboard. Identical to art/src/mascots/<name>-<pose>.svg."""
    eyes_k, mouth_k, curl_k, (sx, sy), dy, extra = POSES[pose]
    fill = mono or ch['fill']
    cx, top, wid, hei = 256, ch['top'], ch['w'], ch['h']
    # squash around the body's base, so feet stay on the ground (and celebrating lifts by dy)
    base = top + hei
    t = f'translate(0 {dy}) translate({cx} {base}) scale({sx} {sy}) translate({-cx} {-base})'
    edge = f'<g fill="{EDGE}" stroke="{EDGE}" stroke-width="40" stroke-linejoin="round">{ch["body"]}</g>'
    curl = ''
    if ch['curl']:
        edge += f'<path d="{CURL[curl_k]}" fill="none" stroke="{EDGE}" stroke-width="52" stroke-linecap="round"/>'
        curl = f'<path d="{CURL[curl_k]}" fill="none" stroke="{fill}" stroke-width="26" stroke-linecap="round"/>'
    ey = top + 0.52 * hei
    gap, er = 0.26 * wid, 0.035 * wid
    face = eyes(eyes_k if not mono else ('open' if eyes_k in ('open', 'star', 'focus') else eyes_k), cx, ey, gap, er,
                look=(0, 4) if eyes_k == 'focus' else (0, 0))
    if not mono:
        cyb = ey + 0.11 * hei
        for dxb in (-gap / 2 - 0.09 * wid, gap / 2 + 0.09 * wid):
            face += f'<ellipse cx="{cx+dxb:.1f}" cy="{cyb:.1f}" rx="{0.06*wid:.1f}" ry="{0.032*wid:.1f}" fill="{BLUSH}" opacity="0.55"/>'
    face += mouth(mouth_k, cx, ey + 0.085 * hei, wid)
    if mono:
        face = face.replace(INK, '#FFFFFF')
    inner = f'<g transform="{t}">{edge}<g fill="{fill}">{ch["body"]}</g>{curl}{face}</g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>{"Pomo" if ch is POMO else "Doro"}, {pose}{", single colour" if mono else ""}</title>'
            f'{inner}{extras(extra, ch) if not mono else ""}</svg>\n')


def app_sources():
    """Every app art source this module draws, by repository path: the C5 identity marks, the
    app icon, the splash marks and Pomo & Doro. check_brand.py holds the files to these strings,
    and build_brand.py --write-app-sources writes them."""
    out = {}
    for v, (title, inner) in MARKS.items():
        out[f"art/src/identity/mark-{v}.svg"] = identity_svg(title, inner)
    for k in ("light", "dark", "tinted"):
        out[f"art/src/app-icon/icon-{k}.svg"] = app_icon(k)
    # The splash: the mark alone on a transparent square; app.json supplies the page colour behind it.
    out["art/src/splash/splash-mark-light.svg"] = svg1024("Splash mark, light", MARKS["colour"][1])
    out["art/src/splash/splash-mark-dark.svg"] = svg1024("Splash mark, dark", pages(D["primary"], D["stickerEdge"]) + faces(D["page"]))
    for ch, nm in ((POMO, "pomo"), (DORO, "doro")):
        for pose in POSES:
            out[f"art/src/mascots/{nm}-{pose}.svg"] = character(ch, pose)
        out[f"art/src/mascots/{nm}-single-colour.svg"] = character(ch, "idle", mono=INK)
    return out
