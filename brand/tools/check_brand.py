"""Check every Valentine Pomodoro brand file against the rules in brand/README.md.

Usage (from the repository root):
    python brand/tools/check_brand.py            # the files as they are
    python brand/tools/check_brand.py --rebuild  # also: a fresh build matches them byte for byte

Exits 1 on any failure and names each one. Checks every file, not a sample:

* the file set: exactly build_brand.expected_files(), nothing missing and nothing extra
* the drawings: the app's art sources (art/src: identity marks, app icon, splash marks, Pomo &
  Doro) are byte for byte what art_geometry.py draws, and so are the brand's, so they can't drift
* SVG: well-formed, a viewBox, a <title>; no <text>, <image>, <script>, <foreignObject>, <style>
  or external reference; a mark or lockup paints only its version's colours
* PNG: the size its export scale gives; RGBA for the transparent art, RGB for the tiles, the
  cards and the guide; no build time ("Creation Time") in any chunk
* EPS: paints only with CMYK `k`, only the values recorded in EPS_CMYK for its version's colours;
  no RGB or grey colour operators in the page; the build date pinned
* PDF: one page, the MediaBox of the artboard, the dates pinned
* source: gzip with no timestamp, and File Info dates 0
* contrast: every palette pair over its floor in both themes, the wordmark over 3:1 on its
  version's ground, the tagline over 4.5:1; and wcag.py agrees with src/theme/contrast.ts
"""
import argparse
import gzip
import os
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import art_geometry as G  # noqa: E402
import build_brand as B  # noqa: E402
from wcag import contrast  # noqa: E402

BRAND = B.BRAND
REPO = os.path.dirname(BRAND)
DIRS = ("svg", "png", "pdf", "eps", "source", "web", "guide")
SVG_NS = "{http://www.w3.org/2000/svg}"
TRANSPARENT_KINDS = {"mark", "lockup", "character"}
FORBIDDEN = {"text", "image", "script", "foreignObject", "style", "use", "a", "iframe"}
failures = []


def fail(msg):
    failures.append(msg)


def read(rel):
    return open(os.path.join(BRAND, rel), "rb").read()


def check_file_set():
    found = sorted(os.path.relpath(os.path.join(r, f), BRAND).replace("\\", "/")
                   for d in DIRS if os.path.isdir(os.path.join(BRAND, d))
                   for r, _, fs in os.walk(os.path.join(BRAND, d)) for f in fs)
    expected = B.expected_files()
    for rel in sorted(set(expected) - set(found)):
        fail(f"missing: {rel}")
    for rel in sorted(set(found) - set(expected)):
        fail(f"not part of the kit: {rel}")
    return set(found) & set(expected)


def check_sources_match_app(assets):
    """The app's art sources (art/src) are the strings art_geometry.app_sources() draws, and the
    brand's marks, app icons and characters are those same strings; any drift fails here.
    Returns how many app sources were compared."""
    sources = G.app_sources()
    for rel, text in sources.items():
        path = os.path.join(REPO, rel)
        if not os.path.exists(path):
            fail(f"{rel}: the app's source is missing")
        elif open(path, encoding="utf8", newline="").read() != text:
            fail(f"{rel}: differs from art_geometry.app_sources() (python brand/tools/build_brand.py --write-app-sources)")
    app = {f"{B.PREFIX}-mark-{v}": f"art/src/identity/mark-{v}.svg" for v in B.VERSIONS}
    app.update({f"{B.PREFIX}-app-icon-{k}": f"art/src/app-icon/icon-{k}.svg" for k in ("light", "dark", "tinted")})
    app.update({f"{nm}-{pose}": f"art/src/mascots/{nm}-{pose}.svg" for nm in ("pomo", "doro") for pose in B.POSES + ["single-colour"]})
    app["web-icon"] = "art/src/app-icon/icon-light.svg"
    by_stem = {a["stem"]: a for a in assets}
    for stem, rel in app.items():
        if by_stem[stem]["svg"] != sources[rel]:
            fail(f"{stem}: the brand's drawing differs from the app's {rel}")
    return len(sources)


def svg_colours(root):
    out = set()
    for el in root.iter():
        for attr in ("fill", "stroke", "stop-color"):
            v = el.get(attr)
            if v and v.startswith("#"):
                out.add(v.upper())
        for m in re.finditer(r"(?:fill|stroke|stop-color)\s*:\s*(#[0-9A-Fa-f]{6})", el.get("style") or ""):
            out.add(m.group(1).upper())
    return out


def check_svg(rel, asset):
    try:
        root = ET.fromstring(read(rel))
    except ET.ParseError as e:
        return fail(f"{rel}: not well-formed ({e})")
    if root.tag != SVG_NS + "svg" or not root.get("viewBox"):
        fail(f"{rel}: no <svg> root with a viewBox")
    title = root.find(SVG_NS + "title")
    if title is None or title.text != asset["title"]:
        fail(f"{rel}: the <title> is not {asset['title']!r}")
    for el in root.iter():
        tag = el.tag.replace(SVG_NS, "")
        if tag in FORBIDDEN:
            fail(f"{rel}: has a <{tag}> element")
        for k, v in el.attrib.items():
            if k.endswith("href") and not v.startswith("#"):
                fail(f"{rel}: refers outside itself ({v[:40]})")
    if asset["version"]:
        extra = svg_colours(root) - {c.upper() for c in B.VERSION_COLOURS[asset["version"]]}
        if extra:
            fail(f"{rel}: paints {sorted(extra)}, outside the {asset['version']} version's colours")


def png_chunks(b):
    i = 8
    while i < len(b):
        n = int.from_bytes(b[i:i + 4], "big")
        yield b[i + 4:i + 8], b[i + 8:i + 8 + n]
        i += 12 + n


def check_png(rel, asset, scale):
    b = read(rel)
    if b[:8] != b"\x89PNG\r\n\x1a\n":
        return fail(f"{rel}: not a PNG")
    w, h = int.from_bytes(b[16:20], "big"), int.from_bytes(b[20:24], "big")
    ew, eh = round(asset["size"][0] * scale), round(asset["size"][1] * scale)
    if (w, h) != (ew, eh):
        fail(f"{rel}: {w} x {h}, expected {ew} x {eh}")
    colour_type = b[25]
    want = 6 if asset["kind"] in TRANSPARENT_KINDS else 2
    if colour_type != want:
        fail(f"{rel}: colour type {colour_type}, expected {'RGBA' if want == 6 else 'RGB'}")
    for kind, data in png_chunks(b):
        if kind in (b"tEXt", b"iTXt", b"zTXt") and data.startswith(b"Creation Time"):
            fail(f"{rel}: carries its build time")


def check_eps(rel, asset):
    b = read(rel)
    text = b.decode("latin-1")
    if not text.startswith("%!PS-Adobe-3.0 EPSF-3.0"):
        fail(f"{rel}: not an EPS 3.0 file")
    m = re.search(r"%%CreationDate: (\(.*?\))", text)
    if not m or m.group(1).encode() != B.FIXED_EPS_DATE:
        fail(f"{rel}: the creation date is not pinned")
    allowed = {B.EPS_CMYK[h.upper()] for h in B.VERSION_COLOURS[asset["version"]]}
    used = B.eps_colours(b)
    if not used:
        fail(f"{rel}: paints no CMYK colour")
    for c in sorted(set(used) - allowed):
        fail(f"{rel}: paints CMYK {c}, not one of its version's recorded values")
    page = text.split("%%EndProlog", 1)[-1].split("%%Trailer", 1)[0]
    if re.search(r"(?m)(?:^|\s)[\d.]+ [\d.]+ [\d.]+ (?:rg|setrgbcolor)\b|(?:^|\s)[\d.]+ (?:g|setgray)\b", page):
        fail(f"{rel}: paints with an RGB or grey colour operator")


def check_pdf(rel, asset):
    b = read(rel)
    if not b.startswith(b"%PDF-"):
        return fail(f"{rel}: not a PDF")
    if len(re.findall(rb"/Type\s*/Page\b", b)) != 1:
        fail(f"{rel}: not exactly one page")
    m = re.search(rb"/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]", b)
    if not m or (float(m.group(1)), float(m.group(2))) != asset["size"]:
        fail(f"{rel}: the MediaBox is not the {asset['size'][0]:g} x {asset['size'][1]:g} artboard")
    dates = set(re.findall(rb"D:\d{14}Z", b))
    if dates != {B.FIXED_PDF_DATE}:
        fail(f"{rel}: dates not pinned ({sorted(dates)})")
    if set(re.findall(rb"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00", b)) - {B.FIXED_XMP_DATE}:
        fail(f"{rel}: an XMP date is not pinned")


def check_source(rel):
    b = read(rel)
    if b[:2] != b"\x1f\x8b" or b[4:8] != b"\0\0\0\0":
        fail(f"{rel}: not gzip with a zero timestamp")
        return
    body = gzip.decompress(b)
    dates = re.findall(rb'"(?:created|modified)": *([^,}]*)', body)
    if not dates or any(d.strip() != b"0" for d in dates):
        fail(f"{rel}: File Info dates are not 0 ({dates[:4]})")


def check_contrast():
    """Every palette pair in both themes, plus the brand's own pairs. Returns the brand pairs."""
    import json
    palette = json.load(open(os.path.join(REPO, "src/theme/palette.json"), encoding="utf8"))
    rows = []
    for theme in palette["themes"].values():
        for p in palette["pairs"]:
            fg, bg = theme["tokens"][p["fg"]], theme["tokens"][p["bg"]]
            r = contrast(fg, bg)
            rows.append((fg, bg))
            if r < p["min"]:
                fail(f"contrast: {p['fg']} on {p['bg']} in {theme['name']} is {r:.2f}, under {p['min']}")
    brand = []
    for v, spec in B.VERSIONS.items():
        brand.append((f"wordmark, {v}", spec["word"], spec["ground"], 3.0))
    brand.append(("tagline on milk", B.L["inkSoft"], B.L["page"], 4.5))
    for name, fg, bg, floor in brand:
        r = contrast(fg, bg)
        rows.append((fg, bg))
        if r < floor:
            fail(f"contrast: {name} is {r:.2f}, under {floor}")
    return rows, brand


def check_wcag_agrees(rows):
    """wcag.py and src/theme/contrast.ts compute the same ratio for every pair checked."""
    script = ("import { contrastRatio } from './src/theme/contrast.ts';"
              "const pairs = JSON.parse(process.argv[1]);"
              "console.log(JSON.stringify(pairs.map(([f, b]) => contrastRatio(f, b))));")
    import json
    out = subprocess.run(["node", "--experimental-strip-types", "--disable-warning=ExperimentalWarning",
                          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--input-type=module", "-e", script,
                          json.dumps(rows)], cwd=REPO, capture_output=True, text=True)
    if out.returncode != 0:
        return fail(f"contrast.ts could not run: {out.stderr.strip()[:200]}")
    for (fg, bg), ts in zip(rows, json.loads(out.stdout)):
        if abs(contrast(fg, bg) - ts) > 1e-9:
            fail(f"wcag.py gives {contrast(fg, bg)} for {fg} on {bg}; contrast.ts gives {ts}")


def check_rebuild():
    out = tempfile.mkdtemp(prefix="vp-brand-check-")
    r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_brand.py"), "--out", out],
                       capture_output=True, text=True)
    if r.returncode != 0:
        return fail(f"rebuild failed: {r.stderr.strip()[-400:]}")
    differ = [rel for rel in B.expected_files()
              if open(os.path.join(out, rel), "rb").read() != read(rel)]
    for rel in differ:
        fail(f"rebuild: {rel} differs")
    return len(B.expected_files()) - len(differ)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--rebuild", action="store_true", help="also build afresh and compare byte for byte")
    args = ap.parse_args(argv)
    assets = B.plan()
    present = check_file_set()
    n_app = check_sources_match_app(assets)
    counts = {}
    for a in assets:
        for rel, opts in a["outputs"]:
            if rel not in present:
                continue
            fmt = opts["format"]
            counts[fmt] = counts.get(fmt, 0) + 1
            if fmt == "svg":
                check_svg(rel, a)
            elif fmt == "png":
                check_png(rel, a, opts["scale"])
            elif fmt == "eps":
                check_eps(rel, a)
            elif fmt == "pdf":
                check_pdf(rel, a)
        if a["source"] and a["source"] in present:
            counts["source"] = counts.get("source", 0) + 1
            check_source(a["source"])
    rows, brand = check_contrast()
    check_wcag_agrees(rows)
    print(f"files: {len(present)} of {len(B.expected_files())} expected "
          + ", ".join(f"{n} {k}" for k, n in sorted(counts.items())))
    print(f"drawings identical to the app's art sources: {n_app}")
    for name, fg, bg, floor in brand:
        print(f"contrast {name}: {contrast(fg, bg):.2f} (floor {floor})")
    print(f"wcag.py and contrast.ts compared on {len(rows)} pairs")
    if args.rebuild:
        same = check_rebuild()
        print(f"rebuild: {same} of {len(B.expected_files())} files identical")
    for f in failures:
        print(f"FAIL {f}")
    print("FAILED" if failures else "OK: every check passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
