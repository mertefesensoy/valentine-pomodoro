"""Set text as outlines from Baloo 2, so no brand file carries live text or needs a font.

Contract
--------
* `set_text(text, size, weight=700)` shapes `text` with HarfBuzz from `fonts/Baloo2[wght].ttf`
  at `weight` (the variable font's wght axis, 400-800), and returns a `Run`:
  `d` (one SVG path, glyph outlines, origin at the left end of the baseline, y down),
  `width` (the advance width), and the font's `ascender`, `descender`, `x_height` and
  `cap_height`, all in the same units as `size` (the em size).
* No side effects. Deterministic: the same text, size and weight always give the same path.
* Shaping uses the font's own kerning and spacing; the `liga` feature is off, so "fi" never
  becomes a ligature that hides the dot on i (the C2 finding, ADR-0046).

Requires fontTools and uharfbuzz.
"""
import functools
import io
import os

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts", "Baloo2[wght].ttf")


class Run:
    def __init__(self, d, width, ascender, descender, x_height, cap_height, bounds):
        self.d, self.width = d, width
        self.ascender, self.descender = ascender, descender
        self.x_height, self.cap_height = x_height, cap_height
        self.bounds = bounds  # (xmin, ymin, xmax, ymax) of the ink, y down: ymin is the tallest letter's top


@functools.lru_cache(maxsize=None)
def _instance(weight):
    """A static instance of Baloo 2 at `weight`, as (fontTools font, HarfBuzz font, units per em)."""
    font = instancer.instantiateVariableFont(TTFont(FONT), {"wght": weight})
    buf = io.BytesIO()
    font.save(buf)
    hb_font = hb.Font(hb.Face(hb.Blob(buf.getvalue())))
    return font, hb_font, font["head"].unitsPerEm


def _fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def set_text(text, size, weight=700):
    font, hb_font, upem = _instance(weight)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb_font, buf, {"liga": False, "kern": True})
    glyph_set = font.getGlyphSet()
    order = font.getGlyphOrder()
    scale = size / upem
    parts, x = [], 0
    bounds_pen = BoundsPen(glyph_set)
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        if info.codepoint == 0:
            raise ValueError(f"Baloo 2 has no glyph for a character in {text!r}")
        name = order[info.codepoint]
        pen = SVGPathPen(glyph_set, ntos=_fmt)
        gx, gy = (x + pos.x_offset) * scale, -pos.y_offset * scale
        # Font units are y-up; SVG is y-down: flip y and scale into `size` units.
        transform = (scale, 0, 0, -scale, gx, gy)
        glyph_set[name].draw(TransformPen(pen, transform))
        glyph_set[name].draw(TransformPen(bounds_pen, transform))
        d = pen.getCommands()
        if d:
            parts.append(d)
        x += pos.x_advance
    os2 = font["OS/2"]
    return Run(" ".join(parts), x * scale,
               os2.sTypoAscender * scale, -os2.sTypoDescender * scale,
               os2.sxHeight * scale, os2.sCapHeight * scale,
               bounds_pen.bounds or (0, 0, 0, 0))
