"""Build every Valentine Pomodoro brand file in VectorCraft, from exact geometry.

Usage (from the repository root):
    python brand/tools/build_brand.py              # writes brand/svg, png, pdf, eps, source, web, guide
    python brand/tools/build_brand.py --out DIR    # writes the same tree under DIR instead

Needs VectorCraft 0.18 or later (vectorcraft-cli on the default install path, or the
VECTORCRAFT_CLI environment variable), and Python with fontTools and uharfbuzz (wordmark.py).

Contract: the output is a pure function of the numbers in this file, art_geometry.py, the
font in fonts/ and the VectorCraft version. Each asset is drawn as an SVG source, run through
`vectorcraft-cli run` (strokes expanded to fills, File Info set, every format exported) in a
scratch folder, normalised so no build time survives in any file, and copied into place.
Two builds give the same bytes; check_brand.py --rebuild proves it.

The mark's geometry and Pomo & Doro live in art_geometry.py, the same code that drew the
app's art sources; colours come from src/theme/palette.json. Lockup proportions are in units
of the mark's height H (the 576-unit frame of the C5 identity sheet).
"""
import argparse
import base64
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import art_geometry as G  # noqa: E402
import wordmark as W  # noqa: E402

BRAND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLI = os.environ.get("VECTORCRAFT_CLI", r"C:\Program Files\VectorCraft\vectorcraft-cli.exe")

# The working name (owner, 2026-10-30). It feeds the wordmark, every file name and the File
# Info, so a rename is this one line and a rebuild.
NAME = "Valentine Pomodoro"
WORDMARK = NAME.lower()                      # the C5 lettering style: Baloo 2, lower case
PREFIX = WORDMARK.replace(" ", "-")
TAGLINE = "Study together, wherever you are."  # owner, 2026-10-30
WORD_WEIGHT, TAG_WEIGHT, LABEL_WEIGHT = 700, 500, 600
LICENCE_NOTE = f"{NAME} brand files. CC BY-ND 4.0, see LICENSE-BRAND.md."

L, D = G.L, G.D
WHITE = "#FFFFFF"

# The mark's four versions: the C5 set, with C5's names (the colour version amended by the owner
# on 2026-10-30: strawberry pages in a cocoa cover, record §10). The drawings and their titles are
# art_geometry.MARKS, the same strings as art/src/identity/mark-<v>.svg. `word` is the wordmark's
# colour in the lockups; `ground` is where the version is shown.
_USE = {"colour": ("the default, on light grounds", L["ink"], L["page"]),
        "reversed": ("on dark grounds", D["ink"], D["page"]),
        "single-cocoa": ("one ink, on light grounds", L["ink"], L["page"]),
        "single-white": ("one ink, on dark grounds", WHITE, D["page"])}
VERSIONS = {v: dict(title=G.MARKS[v][0], inner=G.MARKS[v][1], use=u, word=w, ground=g) for v, (u, w, g) in _USE.items()}
# The colours each version may paint (check_brand.py holds every SVG and EPS to these).
VERSION_COLOURS = {
    "colour": {L["ink"], L["primary"], L["stickerEdge"]},
    "reversed": {D["primary"], D["stickerEdge"], D["page"], D["ink"]},
    "single-cocoa": {L["ink"]},
    "single-white": {WHITE},
}

# Expected CMYK in the EPS exports, keyed by hex: VectorCraft 0.18's "Generic CMYK (SWOP-like)"
# conversion, read back from its EPS export (measured 2026-10-30 by this script's swatch run,
# which fails the build if a value moves). Approximations, unproofed; no Pantone references.
EPS_CMYK = {
    "#221726": (0.6520, 0.6921, 0.4018, 0.7176),   # midnight plum
    "#4A2C29": (0.2301, 0.5156, 0.4116, 0.7189),   # cocoa
    "#9ED39A": (0.4293, 0.0000, 0.5290, 0.0000),   # matcha
    "#B03158": (0.1737, 0.8577, 0.3692, 0.1631),   # deep strawberry
    "#BFE5B5": (0.2978, 0.0000, 0.4021, 0.0000),   # leaf
    "#C93A24": (0.1487, 0.8587, 1.0000, 0.0410),   # accent red
    "#F7A9BE": (0.0000, 0.4135, 0.0386, 0.0000),   # strawberry
    "#FFF3EE": (0.0000, 0.0568, 0.0436, 0.0000),   # night ink (the reversed wordmark)
    "#FFF6F1": (0.0000, 0.0415, 0.0388, 0.0000),   # milk
    "#FFFDFB": (0.0002, 0.0084, 0.0131, 0.0000),   # paper
    "#FFFFFF": (0.0000, 0.0000, 0.0000, 0.0000),   # white (the die-cut edge)
}

# The core colours of the C5 identity sheet, in its order: (name, hex, token).
SWATCHES = [
    ("Milk", L["page"], "page"), ("Paper", L["paper"], "paper"), ("Cocoa", L["ink"], "ink"),
    ("Strawberry", L["primary"], "primary"), ("Deep strawberry", L["primaryInk"], "primaryInk"),
    ("Accent red", L["accent"], "accent"), ("Leaf", L["success"], "success"),
    ("Matcha (Doro)", G.MATCHA, "art"), ("Midnight plum", D["page"], "page, dark"),
    ("Night strawberry", D["primary"], "primary, dark"),
]

# Mark frame (C5): 784 x 576 units around the mark, H = 576.
FW, H = G.FRAME[2], G.FRAME[3]
CLEAR_SPACE = 0.25          # X = H/4 on every side (C5)
MIN_SCREEN_PX, MIN_PRINT_MM = 24, 10   # the mark's minimum width (C5)

# Lockup proportions, in H. Letter height is the top of "l" above the baseline.
HORIZONTAL = dict(gap=0.24, letter=0.34)                  # one line, centred on the frame's middle
STACKED = dict(gap=0.14, letter=0.20, pitch=0.92)         # one line per word; pitch in ems
LOCKUP_MARK_PX = 160        # the mark's height in a lockup's 1x file (SVG, PDF, EPS and @1x PNG)

MARK_PNG = (64, 128, 256, 512, 1024)       # widths
CHARACTER_PNG = (256, 512, 1024)
POSES = list(G.POSES)


# ---------------------------------------------------------------- drawing helpers
def _n(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def svg_doc(w, h, inner, bg=None):
    b = f'<rect width="{_n(w)}" height="{_n(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{_n(w)}" height="{_n(h)}" '
            f'viewBox="0 0 {_n(w)} {_n(h)}">{b}{inner}</svg>\n')


def inner_of(svg_text):
    """The drawing inside a full SVG document, without the <svg> element and its <title>."""
    body = svg_text[svg_text.index(">") + 1:svg_text.rindex("</svg>")]
    return re.sub(r"<title>.*?</title>", "", body, count=1)


def mark_at(version, x, y, height):
    """The mark's frame placed with its top-left at (x, y), `height` tall."""
    k = height / H
    return (f'<g transform="translate({_n(x)} {_n(y)}) scale({k:.6g}) translate({-G.FRAME[0]} {-G.FRAME[1]})">'
            f'{VERSIONS[version]["inner"]}</g>')


def l_top_per_em():
    return -W.set_text("l", 1000, WORD_WEIGHT).bounds[1] / 1000


def text_path(text, size, fill, x, baseline, weight=LABEL_WEIGHT, anchor="start"):
    """One line of Baloo 2 as an outlined path, its advance starting at x (or centred on x, or
    ending at x), on the given baseline. Returns (svg, run)."""
    run = W.set_text(text, size, weight)
    if anchor == "middle":
        x -= run.width / 2
    elif anchor == "end":
        x -= run.width
    return f'<path transform="translate({_n(x)} {_n(baseline)})" fill="{fill}" d="{run.d}"/>', run


def word_path(text, size, fill, ink_left, baseline):
    """The wordmark, its ink (not its advance) starting at ink_left. Returns (svg, ink width)."""
    run = W.set_text(text, size, WORD_WEIGHT)
    x = ink_left - run.bounds[0]
    return (f'<path transform="translate({_n(x)} {_n(baseline)})" fill="{fill}" d="{run.d}"/>',
            run.bounds[2] - run.bounds[0])


# ---------------------------------------------------------------- lockups (in mark units, H = 576)
def horizontal(version):
    """Mark, then the wordmark on one line, its letter band centred on the frame's middle.
    Returns (inner svg, width, height) in mark units."""
    p, v = HORIZONTAL, VERSIONS[version]
    size = p["letter"] * H / l_top_per_em()
    baseline = H / 2 + p["letter"] * H / 2
    word, ink_w = word_path(WORDMARK, size, v["word"], FW + p["gap"] * H, baseline)
    return mark_at(version, 0, 0, H) + word, FW + p["gap"] * H + ink_w, H


def stacked(version):
    """The mark over the wordmark, one word per line, every line centred on one axis."""
    p, v = STACKED, VERSIONS[version]
    size = p["letter"] * H / l_top_per_em()
    lines = WORDMARK.split(" ")
    runs = [W.set_text(t, size, WORD_WEIGHT) for t in lines]
    width = max([FW] + [r.bounds[2] - r.bounds[0] for r in runs])
    out = mark_at(version, (width - FW) / 2, 0, H)
    baseline = H + p["gap"] * H + p["letter"] * H
    bottom = 0
    for t, r in zip(lines, runs):
        ink_w = r.bounds[2] - r.bounds[0]
        piece, _ = word_path(t, size, v["word"], (width - ink_w) / 2, baseline)
        out += piece
        bottom = baseline + r.bounds[3]
        baseline += p["pitch"] * size
    return out, width, max(bottom, H)


def at_px(inner, w, h, k):
    """A drawing in mark units, scaled by k into a document sized in whole pixels."""
    W_, H_ = math.ceil(w * k - 1e-6), math.ceil(h * k - 1e-6)
    return svg_doc(W_, H_, f'<g transform="scale({k:.6g})">{inner}</g>'), W_, H_


# ---------------------------------------------------------------- the guide figures
def board():
    """The brand board: one overview of the system, 1600 x 1000."""
    Wd, Hd, m = 1600, 1000, 64
    ink, soft = L["ink"], L["inkSoft"]
    out = ""
    # Top row: the mark, reversed, and the app icon, each on its own panel.
    panels = [(m, 560, L["paper"], "colour", "The mark", soft),
              (m + 584, 440, D["page"], "reversed", "Reversed, for dark grounds", D["inkSoft"])]
    for x, w, ground, version, caption, cap_col in panels:
        out += f'<rect x="{x}" y="{m}" width="{w}" height="440" rx="28" fill="{ground}"/>'
        mh = 250
        out += mark_at(version, x + (w - FW * mh / H) / 2, m + 70, mh)
        out += text_path(caption, 20, cap_col, x + 32, m + 440 - 32)[0]
    x = m + 584 + 440 + 24
    w = Wd - m - x
    out += f'<rect x="{x}" y="{m}" width="{w}" height="440" rx="28" fill="{L["field"]}"/>'
    s = 250
    ix, iy = x + (w - s) / 2, m + 64
    # The icon as the home screen shows it: the same tile and mark, with iOS's corner radius.
    out += (f'<rect x="{_n(ix)}" y="{iy}" width="{s}" height="{s}" rx="{_n(s * 0.2237)}" fill="{G.PRIMARY}"/>'
            f'<g transform="translate({_n(ix)} {iy}) scale({s / 1024:.6g})">{G.pages(G.INK, G.EDGE) + G.faces(G.PAGE)}</g>')
    out += text_path("The app icon", 20, soft, x + 32, m + 440 - 32)[0]
    # Middle row: the horizontal lockup and the tagline; Pomo & Doro on the right.
    inner, lw, lh = horizontal("colour")
    k = 96 / H
    out += f'<g transform="translate({m} 560) scale({k:.6g})">{inner}</g>'
    out += text_path(TAGLINE, 34, soft, m, 560 + 96 + 62, TAG_WEIGHT)[0]
    for i, ch in enumerate((G.POMO, G.DORO)):
        cs = 190
        out += f'<g transform="translate({Wd - m - 2 * cs - 10 + i * (cs + 10)} 528) scale({cs / 512:.6g})">{inner_of(G.character(ch, "idle"))}</g>'
    # Bottom row: the core colours.
    cw, gap, y = 136, 12.4, 772
    for i, (name, hex_, _) in enumerate(SWATCHES):
        cx = m + i * (cw + gap)
        out += f'<rect x="{_n(cx)}" y="{y}" width="{cw}" height="92" rx="16" fill="{hex_}" stroke="{L["edge"]}" stroke-width="2"/>'
        out += text_path(name, 17, ink, cx + 2, y + 122)[0]
        out += text_path(hex_, 15, soft, cx + 2, y + 144, 500)[0]
    out += text_path(f"{WORDMARK} · Baloo 2 Bold · Strawberry Milk and Midnight Plum", 15, soft, m, Hd - 34, 500)[0]
    out += text_path("CC BY-ND 4.0", 15, soft, Wd - m, Hd - 34, 500, anchor="end")[0]
    return svg_doc(Wd, Hd, out, L["page"])


def clear_space():
    """The mark's clear space (X = H/4 on every side) and its minimum size."""
    k = 0.75
    fw, fh = FW * k, H * k
    X = CLEAR_SPACE * fh
    ox, oy = 96 + X, 72 + X
    Wd = int(ox + fw + X + 96)
    guide, soft, ink = L["ringFocus"], L["inkSoft"], L["ink"]
    out = f'<rect x="{_n(ox - X)}" y="{_n(oy - X)}" width="{_n(fw + 2 * X)}" height="{_n(fh + 2 * X)}" fill="{L["primarySoft"]}"/>'
    out += f'<rect x="{_n(ox)}" y="{_n(oy)}" width="{_n(fw)}" height="{_n(fh)}" fill="{L["page"]}"/>'
    for sx, sy in ((ox - X, oy - X), (ox + fw, oy - X), (ox - X, oy + fh), (ox + fw, oy + fh)):
        out += f'<rect x="{_n(sx)}" y="{_n(sy)}" width="{_n(X)}" height="{_n(X)}" fill="none" stroke="{guide}" stroke-width="2"/>'
        out += text_path("X", 30, guide, sx + X / 2, sy + X / 2 + 11, anchor="middle")[0]
    out += (f'<rect x="{_n(ox - X)}" y="{_n(oy - X)}" width="{_n(fw + 2 * X)}" height="{_n(fh + 2 * X)}" fill="none" '
            f'stroke="{guide}" stroke-width="2" stroke-dasharray="10 8"/>')
    out += f'<rect x="{_n(ox)}" y="{_n(oy)}" width="{_n(fw)}" height="{_n(fh)}" fill="none" stroke="{guide}" stroke-width="1.5" stroke-dasharray="4 6"/>'
    out += mark_at("colour", ox, oy, fh)
    # H, measured on the right.
    hx = ox + fw + X + 28
    out += f'<path d="M{_n(hx)} {_n(oy)} V{_n(oy + fh)} M{_n(hx - 10)} {_n(oy)} H{_n(hx + 10)} M{_n(hx - 10)} {_n(oy + fh)} H{_n(hx + 10)}" stroke="{guide}" stroke-width="2" fill="none"/>'
    out += text_path("H", 26, guide, hx + 16, oy + fh / 2 + 9)[0]
    y = oy + fh + X + 70
    out += text_path("Clear space: X on every side, X = H / 4.", 24, ink, 96, y)[0]
    # Minimum size, drawn at the size it names, with the app icon beside it for anything smaller.
    y += 64
    out += text_path(f"Minimum: {MIN_SCREEN_PX} px wide on screen, {MIN_PRINT_MM} mm in print.", 24, ink, 96, y)[0]
    out += text_path("Smaller than that, the app icon carries the brand.", 20, soft, 96, y + 34, 500)[0]
    mw = MIN_SCREEN_PX
    out += mark_at("colour", 96, y + 62, mw * H / FW)
    out += f'<g transform="translate({96 + mw + 32} {y + 62}) scale({16 / 1024:.6g})">{inner_of(G.app_icon("light"))}</g>'
    out += text_path(f"{mw} px", 15, soft, 96, y + 62 + 40, 500)[0]
    out += text_path("16 px", 15, soft, 96 + mw + 32, y + 62 + 40, 500)[0]
    return svg_doc(Wd, int(y + 140), out, L["page"])


def construction():
    """The mark on its 1024 grid: the pages, the 5-degree tilt about the spine, the faces."""
    ox, oy = 72, 40
    guide, soft = L["ringFocus"], L["inkSoft"]
    grid = "".join(f'<path d="M{i} 0 V1024 M0 {i} H1024" stroke="{L["edge"]}" stroke-width="1.5"/>' for i in range(0, 1025, 64))
    frame = (f'<rect x="{G.FRAME[0]}" y="{G.FRAME[1]}" width="{FW}" height="{H}" fill="none" stroke="{guide}" '
             f'stroke-width="2.5" stroke-dasharray="12 10"/>')
    # Both fills first, then both outlines, so the pages' crossing at the spine stays visible.
    ghost = (f'<g transform="{G.ROT_L}"><path d="{G.LEFT}" fill="{L["field"]}"/></g>'
             f'<g transform="{G.ROT_R}"><path d="{G.RIGHT}" fill="{L["field"]}"/></g>'
             f'<g transform="{G.ROT_L}"><path d="{G.LEFT}" fill="none" stroke="{L["ink"]}" stroke-width="3"/></g>'
             f'<g transform="{G.ROT_R}"><path d="{G.RIGHT}" fill="none" stroke="{L["ink"]}" stroke-width="3"/></g>'
             + G.faces(L["ink"]))
    upright = (f'<path d="{G.LEFT}" fill="none" stroke="{guide}" stroke-width="2" stroke-dasharray="6 8"/>'
               f'<path d="{G.RIGHT}" fill="none" stroke="{guide}" stroke-width="2" stroke-dasharray="6 8"/>')
    eyes = (f'<g transform="{G.ROT_L}"><circle cx="350" cy="522" r="30" fill="none" stroke="{guide}" stroke-width="3"/>'
            f'<circle cx="434" cy="534" r="30" fill="none" stroke="{guide}" stroke-width="3"/></g>')
    pivots = "".join(f'<circle cx="{x}" cy="780" r="9" fill="{guide}"/>' for x in (494, 530))
    left, right, top = G.FRAME[0], G.FRAME[0] + FW, G.FRAME[1]
    labels = [
        (left, top - 18, f"frame {FW} × {H}, H = {H}", "start"),
        (right, top - 18, "dashed: the pages upright", "end"),
        (180, 470, "eyes r 30, smile 18 wide", "start"),
        (left, 884, "each page leans 5° in, about its foot at the spine (the dots)", "start"),
    ]
    text = "".join(text_path(t, 22, L["primaryInk"], x, y, anchor=a)[0] for x, y, t, a in labels)
    edge = text_path("die-cut edge: 28 outside each page (a stroke 56 wide)", 22, soft, left, 920)[0]
    inner = grid + frame + upright + ghost + eyes + pivots + text + edge
    return svg_doc(1024 + 2 * ox, 1024 + oy + 40, f'<g transform="translate({ox} {oy})">{inner}</g>', L["page"])


def palette_figure():
    """The core colours with their tokens, hex and the EPS CMYK."""
    cols, cw, chh, gx, gy, m = 5, 208, 120, 24, 150, 64
    out = ""
    for i, (name, hex_, token) in enumerate(SWATCHES):
        x = m + (i % cols) * (cw + gx)
        y = m + (i // cols) * (chh + gy)
        out += f'<rect x="{x}" y="{y}" width="{cw}" height="{chh}" rx="18" fill="{hex_}" stroke="{L["edge"]}" stroke-width="2"/>'
        out += text_path(name, 21, L["ink"], x + 2, y + chh + 32)[0]
        out += text_path(f"{hex_}  ·  {token}", 16, L["inkSoft"], x + 2, y + chh + 58, 500)[0]
        c = EPS_CMYK.get(hex_)
        if c:
            out += text_path("CMYK " + " ".join(str(round(v * 100)) for v in c), 16, L["inkSoft"], x + 2, y + chh + 82, 500)[0]
    w = 2 * m + cols * cw + (cols - 1) * gx
    h = m + 2 * (chh + gy) + 10
    return svg_doc(w, h, out, L["page"])


def characters_figure():
    """Pomo and Doro in their five poses, the poses' names under them."""
    tile, gap, m = 260, 24, 56
    out = ""
    for row, ch in enumerate((G.POMO, G.DORO)):
        y = m + row * (tile + 92)
        out += text_path("Pomo" if ch is G.POMO else "Doro", 26, L["ink"], m, y + 4)[0]
        for i, pose in enumerate(POSES):
            x = m + i * (tile + gap)
            out += f'<g transform="translate({x} {y + 14}) scale({tile / 512:.6g})">{inner_of(G.character(ch, pose))}</g>'
            out += text_path(pose, 18, L["inkSoft"], x + tile / 2, y + tile + 40, 500, anchor="middle")[0]
    return svg_doc(2 * m + 5 * tile + 4 * gap, m + 2 * (tile + 92) + 8, out, L["page"])


def social_card():
    """1280 x 640: the horizontal lockup and the tagline on milk."""
    inner, lw, lh = horizontal("colour")
    k = 940 / lw
    lx, ly = (1280 - lw * k) / 2, 214
    out = f'<g transform="translate({_n(lx)} {ly}) scale({k:.6g})">{inner}</g>'
    out += text_path(TAGLINE, 40, L["inkSoft"], 640, ly + lh * k + 92, TAG_WEIGHT, anchor="middle")[0]
    return svg_doc(1280, 640, out, L["page"])


# ---------------------------------------------------------------- the plan: every asset and file
def _png(rel, scale):
    return rel, dict(format="png", scale=scale)


SVG_OPTS = dict(format="svg", decimals=2, outlineText=True, minify=True, objectIds="minimal", metadata=False)
PDF_OPTS = dict(format="pdf", preserveEditing=False)
EPS_OPTS = dict(format="eps", previewFormat="none", thumbnails=False)


def plan():
    """Every asset as a dict: stem, svg (the source drawing), title, description, kind,
    version (for marks and lockups), size (the artboard in px) and outputs, a list of
    (path relative to brand/, VectorCraft export params), plus `source` for the .vectorcraft."""
    assets = []

    def add(stem, svg, title, desc, kind, outputs, source=True, version=None):
        m = re.search(r'width="([\d.]+)" height="([\d.]+)"', svg)
        a = dict(stem=stem, svg=svg, title=title, desc=desc, kind=kind, version=version,
                 size=(float(m.group(1)), float(m.group(2))), outputs=outputs,
                 source=f"source/{stem}.vectorcraft" if source else None)
        assets.append(a)

    for v, spec in VERSIONS.items():
        stem = f"{PREFIX}-mark-{v}"
        svg = G.identity_svg(spec["title"], spec["inner"])
        add(stem, svg, f"{NAME}: the Same Page mark, {v}", f"The Same Page mark, {v}: {spec['use']}.", "mark",
            [(f"svg/{stem}.svg", SVG_OPTS), (f"pdf/{stem}.pdf", PDF_OPTS), (f"eps/{stem}.eps", EPS_OPTS)]
            + [_png(f"png/{stem}-{px}.png", px / FW) for px in MARK_PNG], version=v)
    for form, fn in (("horizontal", horizontal), ("stacked", stacked)):
        for v, spec in VERSIONS.items():
            stem = f"{PREFIX}-{form}-{v}"
            inner, w, h = fn(v)
            svg, _, _ = at_px(inner, w, h, LOCKUP_MARK_PX / H)
            add(stem, svg, f"{NAME}, {form} lockup, {v}", f"The {form} lockup, {v}: {spec['use']}.", "lockup",
                [(f"svg/{stem}.svg", SVG_OPTS), (f"pdf/{stem}.pdf", PDF_OPTS), (f"eps/{stem}.eps", EPS_OPTS)]
                + [_png(f"png/{stem}{sfx}.png", s) for sfx, s in (("", 1), ("@2x", 2), ("@4x", 4))], version=v)
    for kind in ("light", "dark", "tinted"):
        stem = f"{PREFIX}-app-icon-{kind}"
        add(stem, G.app_icon(kind), f"{NAME} app icon, {kind}", f"The iOS app icon, {kind}: the mark on a full-bleed tile; iOS rounds the corners.",
            "app-icon", [(f"svg/{stem}.svg", SVG_OPTS), _png(f"png/{stem}-1024.png", 1)])
    for ch, nm in ((G.POMO, "pomo"), (G.DORO, "doro")):
        for pose in POSES + ["single-colour"]:
            stem = f"{nm}-{pose}"
            svg = G.character(ch, "idle", mono=G.INK) if pose == "single-colour" else G.character(ch, pose)
            add(stem, svg, f"{nm.capitalize()}, {pose.replace('-', ' ')}", f"{nm.capitalize()}, one of the two characters, {pose.replace('-', ' ')}.",
                "character", [(f"svg/{stem}.svg", SVG_OPTS)] + [_png(f"png/{stem}-{px}.png", px / 512) for px in CHARACTER_PNG])
    add("web-icon", G.app_icon("light"), f"{NAME}", "The app icon for the web: favicon, touch icon and avatar.", "web",
        [("web/favicon.svg", SVG_OPTS)]
        + [_png(f"web/favicon-{px}.png", px / 1024) for px in (16, 32, 48)]
        + [_png(f"web/app-icon-{px}.png", px / 1024) for px in (180, 192, 512)]
        + [_png(f"web/avatar-{px}.png", px / 1024) for px in (500, 1024)], source=False)
    add("social-card", social_card(), f"{NAME}", TAGLINE, "web",
        [("web/social-card.svg", SVG_OPTS), _png("web/social-card.png", 1)], source=False)
    for stem, fn, desc in (("brand-board", board, "The brand on one page."),
                           ("clear-space", clear_space, "The clear space and minimum size of the mark."),
                           ("construction", construction, "The mark's construction on its 1024 grid."),
                           ("palette", palette_figure, "The core colours, with tokens, hex and CMYK."),
                           ("characters", characters_figure, "Pomo and Doro in their five poses.")):
        outs = [(f"guide/{stem}.svg", SVG_OPTS), _png(f"guide/{stem}.png", 1)]
        if stem == "brand-board":
            outs.append((f"guide/{stem}.pdf", PDF_OPTS))
        add(stem, fn(), f"{NAME} brand guide: {stem.replace('-', ' ')}", desc, "guide", outs, source=False)
    return assets


def expected_files():
    files = []
    for a in plan():
        files += [rel for rel, _ in a["outputs"]]
        if a["source"]:
            files.append(a["source"])
    return sorted(files)


# ---------------------------------------------------------------- VectorCraft and normalisation
def vc_run(src, steps, steps_path):
    with open(steps_path, "w", encoding="utf8", newline="\n") as f:
        json.dump(steps, f, indent=1)
    out = subprocess.run([CLI, "run", "--in", src, "--commands", steps_path],
                         capture_output=True, text=True, encoding="utf8")
    if out.returncode != 0:
        raise RuntimeError(f"vectorcraft-cli failed on {src}:\n{out.stdout}\n{out.stderr}")
    results = [json.loads(line) for line in out.stdout.splitlines() if line.strip()]
    bad = [r for r in results if r.get("error") or (r.get("result") or {}).get("warnings")]
    if bad:
        raise RuntimeError(f"{src}: {json.dumps(bad)}")
    return results


FIXED_PDF_DATE = b"D:20261030000000Z"
FIXED_XMP_DATE = b"2026-10-30T00:00:00+00:00"
FIXED_EPS_DATE = b"(2026-10-30 00:00:00 UTC)"


def normalise(path):
    """Pin every build-time stamp VectorCraft writes to a constant of the same length, so offsets
    in PDF cross-reference tables stay valid. Touches nothing else."""
    b = open(path, "rb").read()
    if path.endswith(".png"):
        parts, i = [b[:8]], 8
        while i < len(b):
            n = int.from_bytes(b[i:i + 4], "big")
            chunk = b[i:i + 12 + n]
            if not (chunk[4:8] == b"tEXt" and chunk[8:21] == b"Creation Time"):
                parts.append(chunk)
            i += 12 + n
        b = b"".join(parts)
    elif path.endswith(".pdf"):
        b = re.sub(rb"D:\d{14}Z", FIXED_PDF_DATE, b)
        b = re.sub(rb"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00", FIXED_XMP_DATE, b)
        # The trailer's /ID pair and the XMP DocumentID and InstanceID are random per export; each
        # becomes one hash of the file with all four blanked, the same 24 base64 characters.
        ids = list(re.finditer(rb"/ID\s*\[\s*\(([A-Za-z0-9+/=]{24})\)\s*\(([A-Za-z0-9+/=]{24})\)\s*\]", b))
        if len(ids) != 1:
            raise RuntimeError(f"{path}: expected one /ID of 24 base64 characters, found {len(ids)}")
        spans = [ids[0].span(1), ids[0].span(2)]
        spans += [m.span(1) for m in re.finditer(rb"<xmpMM:(?:Document|Instance)ID>([A-Za-z0-9+/=]{24})</xmpMM:", b)]
        spans.sort()

        def fill(piece):
            out, last = [], 0
            for a, z in spans:
                out += [b[last:a], piece]
                last = z
            return b"".join(out + [b[last:]])
        digest = base64.b64encode(hashlib.sha256(fill(b"A" * 24)).digest()[:16])
        b = fill(digest)
    elif path.endswith(".eps"):
        b = re.sub(rb"\(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC\)", FIXED_EPS_DATE, b)
    elif path.endswith(".vectorcraft"):
        b = re.sub(rb'"(created|modified)": *\d+', rb'"\1": 0', b)
    open(path, "wb").write(b)


def build_asset(a, work):
    src = os.path.join(work, "src", a["stem"] + ".svg")
    with open(src, "w", encoding="utf8", newline="\n") as f:
        f.write(a["svg"])
    steps_path = os.path.join(work, "steps", a["stem"] + ".json")
    probe = vc_run(src, [{"command": "select.all", "params": {}}, {"command": "object.expand.info", "params": {}}], steps_path)
    info = next(r for r in probe if r.get("command") == "object.expand.info")["result"]
    w = lambda rel: os.path.join(work, "out", rel).replace("\\", "/")  # noqa: E731
    steps = [{"command": "file.info", "params": dict(title=a["title"], author=NAME, description=a["desc"],
                                                     copyrightStatus="copyrighted", copyrightNotice=LICENCE_NOTE)},
             {"command": "select.all", "params": {}}]
    # Strokes become filled outlines, so every renderer and the EPS paint only fills. VectorCraft
    # refuses an expand that changes nothing, so the step is there only when the probe finds work.
    if info.get("object") or info.get("fill") or info.get("stroke"):
        steps.append({"command": "object.expand", "params": {"object": True, "fill": True, "stroke": True}})
    steps.append({"command": "select.none", "params": {}})
    if a["source"]:
        steps.append({"command": "document.save", "params": {"path": w(a["source"]), "modified": 0, "compress": True}})
    for rel, opts in a["outputs"]:
        steps.append({"command": "document.export", "params": dict(path=w(rel), **opts)})
    vc_run(src, steps, steps_path)
    files = [rel for rel, _ in a["outputs"]] + ([a["source"]] if a["source"] else [])
    for rel in files:
        normalise(os.path.join(work, "out", rel))
    return files


def measure_cmyk(work):
    """Read back the CMYK VectorCraft's EPS export paints for each colour that EPS files or the
    palette figure use, in order, from a scratch EPS of one swatch per colour."""
    hexes = sorted({h for _, h, _ in SWATCHES} | set().union(*VERSION_COLOURS.values()))
    rects = "".join(f'<rect x="{i * 10}" y="0" width="8" height="8" fill="{h}"/>' for i, h in enumerate(hexes))
    src = os.path.join(work, "src", "swatches.svg")
    with open(src, "w", encoding="utf8", newline="\n") as f:
        f.write(svg_doc(10 * len(hexes), 8, rects))
    eps = os.path.join(work, "swatches.eps").replace("\\", "/")
    vc_run(src, [{"command": "document.export", "params": dict(path=eps, **EPS_OPTS)}], os.path.join(work, "steps", "swatches.json"))
    ks = eps_colours(open(eps, "rb").read())
    if len(ks) != len(hexes):
        raise RuntimeError(f"swatch EPS painted {len(ks)} colours for {len(hexes)} swatches")
    return dict(zip(hexes, ks))


def eps_colours(b):
    """Every CMYK `k` operator in an EPS body, in order, as tuples of floats (the prolog's
    procedure definitions are skipped: they start after %%BeginProlog and end at %%EndProlog)."""
    text = b.decode("latin-1")
    if "%%EndProlog" in text:
        text = text.split("%%EndProlog", 1)[1]
    text = text.split("%%Trailer", 1)[0]
    return [tuple(float(x) for x in m.groups()) for m in re.finditer(r"(?m)(?:^|\s)([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) k\b", text)]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=BRAND, help="where to write the tree (default: brand/)")
    ap.add_argument("--measure", action="store_true", help="print the EPS CMYK table and stop")
    ap.add_argument("--write-app-sources", action="store_true",
                    help="write the app's art sources (art/src) from art_geometry.app_sources() and stop")
    args = ap.parse_args(argv)
    if args.write_app_sources:
        repo = os.path.dirname(BRAND)
        for rel, text in G.app_sources().items():
            path = os.path.join(repo, rel)
            old = open(path, encoding="utf8", newline="").read() if os.path.exists(path) else None
            if old != text:
                with open(path, "w", encoding="utf8", newline="") as f:
                    f.write(text)
                print(f"wrote {rel}")
        return 0
    work = tempfile.mkdtemp(prefix="vp-brand-")
    try:
        for d in ("src", "steps", "out"):
            os.makedirs(os.path.join(work, d), exist_ok=True)
        measured = measure_cmyk(work)
        if args.measure:
            for h, c in measured.items():
                print(f'    "{h}": ({", ".join(f"{v:.4f}" for v in c)}),')
            return 0
        if measured != {h: EPS_CMYK.get(h) for h in measured}:
            moved = {h: c for h, c in measured.items() if EPS_CMYK.get(h) != c}
            raise RuntimeError(f"VectorCraft's CMYK conversion no longer matches EPS_CMYK: {moved}")
        assets = plan()
        for d in ("svg", "png", "pdf", "eps", "source", "web", "guide"):
            os.makedirs(os.path.join(work, "out", d), exist_ok=True)
        written = []
        for a in assets:
            written += build_asset(a, work)
            print(f"built {a['stem']}")
        if sorted(written) != expected_files():
            raise RuntimeError("the build wrote a different file set than expected_files()")
        for d in ("svg", "png", "pdf", "eps", "source", "web", "guide"):
            target = os.path.join(args.out, d)
            if os.path.isdir(target):
                shutil.rmtree(target)
            shutil.copytree(os.path.join(work, "out", d), target)
        print(f"{len(written)} files written to {args.out}")
        return 0
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
