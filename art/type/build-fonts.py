"""
Phase 1 D1: build the two embedded Baloo 2 fonts (ADR-0046, NFR-I18N-001).

Turns the google/fonts variable Baloo 2 into the two static instances the app embeds through
the expo-font config plugin: Medium (wght 500, headings and sticker captions) and SemiBold
(wght 600, the timer), each subset to Latin + Turkish with the fi/fl ligatures removed, so a
Turkish i keeps its dot. Ships the OFL licence beside them.

    python -P art/type/build-fonts.py                    # build into assets/fonts/
    python -P art/type/build-fonts.py --check            # rebuild in a temp folder, compare byte for byte

Contract
  in : <fonts>/Baloo2[wght].ttf and <fonts>/Baloo2-OFL.txt (fetched from github.com/google/fonts,
       Stage C record §2.2). The font's SHA-256 must match its line in <fonts>/SHA256SUMS,
       or nothing is read and the script exits 1.
  out: <out>/Baloo2-Medium.ttf, <out>/Baloo2-SemiBold.ttf, <out>/OFL.txt.
  how: instance the variable font at wght 500 and 600 (named from its STAT table, so each file
       has its own PostScript name, which iOS resolves fontFamily by); subset to the code points
       below, keeping every layout feature except liga and every name record (the copyright
       and OFL notice stay inside each file, OFL §2); pin head.created and head.modified to
       the source's, so a rebuild is byte-identical.
  checks (each exits 1): all twelve Turkish letters are mapped; no GSUB ligature substitutes
       f+i or f+l; under tnum the ten digits share one advance width; the PostScript names
       are Baloo2-Medium and Baloo2-SemiBold.
Needs fontTools 4.61+. Run with -P, from outside the fonts folder: the fonts are data.
"""
import argparse, filecmp, hashlib, io, os, shutil, sys, tempfile
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
SOURCE = 'Baloo2[wght].ttf'
LICENCE = 'Baloo2-OFL.txt'
INSTANCES = {'Baloo2-Medium.ttf': (500, 'Baloo2-Medium'), 'Baloo2-SemiBold.ttf': (600, 'Baloo2-SemiBold')}

TURKISH = {0x130: 'İ', 0x131: 'ı', 0x11E: 'Ğ', 0x11F: 'ğ', 0x15E: 'Ş', 0x15F: 'ş',
           0xC7: 'Ç', 0xE7: 'ç', 0xD6: 'Ö', 0xF6: 'ö', 0xDC: 'Ü', 0xFC: 'ü'}
DIGITS = [0x30 + i for i in range(10)]
# The C2 specimen's set: Basic Latin, Latin-1, Latin Extended-A (every Turkish letter),
# general punctuation, ₺, ™.
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x2010, 0x2040)) + [0x20BA, 0x2122]


def fail(msg):
    print('✖ ' + msg)
    sys.exit(1)


def verify_source(fonts_dir):
    """The font's SHA-256 against its SHA256SUMS line ("<hex> *<name>"), before anything reads it."""
    path = os.path.join(fonts_dir, SOURCE)
    with open(os.path.join(fonts_dir, 'SHA256SUMS'), encoding='utf-8') as f:
        sums = {line.split()[1].lstrip('*'): line.split()[0] for line in f if line.strip()}
    if SOURCE not in sums:
        fail(f'{SOURCE} has no line in SHA256SUMS')
    with open(path, 'rb') as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    if digest != sums[SOURCE]:
        fail(f'{SOURCE} SHA-256 {digest} does not match SHA256SUMS {sums[SOURCE]}')
    return path, digest


def build_instance(source, wght):
    font = TTFont(source)
    stamps = (font['head'].created, font['head'].modified)
    font = instancer.instantiateVariableFont(font, {'wght': wght}, updateFontNames=True)
    opts = subset.Options()
    tags = {fr.FeatureTag for t in ('GSUB', 'GPOS') if t in font for fr in font[t].table.FeatureList.FeatureRecord}
    opts.layout_features = sorted(tags - {'liga'})
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(font)
    font['head'].created, font['head'].modified = stamps
    font.recalcTimestamp = False  # otherwise save() stamps head.modified with the build time
    buf = io.BytesIO()
    font.save(buf, reorderTables=True)
    return buf.getvalue()


def lookups_for(font, tag):
    g = font['GSUB'].table
    for fr in g.FeatureList.FeatureRecord:
        if tag is None or fr.FeatureTag == tag:
            for li in fr.Feature.LookupListIndex:
                lk = g.LookupList.Lookup[li]
                for st in lk.SubTable:
                    yield (st.ExtSubTable if lk.LookupType == 7 else st)


def check_instance(data, name, ps_expected):
    font = TTFont(io.BytesIO(data))
    cmap = font.getBestCmap()
    missing = [ch for cp, ch in TURKISH.items() if cp not in cmap]
    if missing:
        fail(f'{name}: Turkish letters missing: {" ".join(missing)}')
    f_glyph, i_glyph, l_glyph = cmap[ord('f')], cmap[ord('i')], cmap[ord('l')]
    for st in lookups_for(font, None):
        for first, ligs in getattr(st, 'ligatures', {}).items():
            if first == f_glyph and any(lg.Component[:1] in ([i_glyph], [l_glyph]) for lg in ligs):
                fail(f'{name}: a GSUB ligature still substitutes f+i or f+l')
    tnum = {}
    for st in lookups_for(font, 'tnum'):
        tnum.update(getattr(st, 'mapping', {}))
    widths = {font['hmtx'][tnum.get(cmap[d], cmap[d])][0] for d in DIGITS}
    if len(widths) != 1:
        fail(f'{name}: digits under tnum have {len(widths)} advance widths: {sorted(widths)}')
    ps = font['name'].getDebugName(6)
    if ps != ps_expected:
        fail(f'{name}: PostScript name {ps!r}, expected {ps_expected!r}')
    return {'digit width': widths.pop(), 'postscript': ps, 'family': font['name'].getDebugName(1),
            'weight class': font['OS/2'].usWeightClass, 'glyphs': len(font.getGlyphOrder())}


def build(fonts_dir, out_dir):
    source, digest = verify_source(fonts_dir)
    print(f'source {SOURCE} sha256 {digest[:12]}… ok')
    os.makedirs(out_dir, exist_ok=True)
    for name, (wght, ps) in INSTANCES.items():
        data = build_instance(source, wght)
        facts = check_instance(data, name, ps)
        with open(os.path.join(out_dir, name), 'wb') as f:
            f.write(data)
        print(f'✔ {name}: wght {wght}, {len(data):,} B, {facts["glyphs"]} glyphs, '
              f'PostScript {facts["postscript"]}, tabular digits {facts["digit width"]} units, no fi/fl ligature')
    shutil.copyfile(os.path.join(fonts_dir, LICENCE), os.path.join(out_dir, 'OFL.txt'))
    print('✔ OFL.txt')


def main():
    sys.stdout.reconfigure(encoding='utf-8')  # the Windows console defaults to cp1252, which has no ✔
    ap = argparse.ArgumentParser()
    ap.add_argument('--fonts', default='C:/vp/fonts')
    ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'fonts'))
    ap.add_argument('--check', action='store_true', help='rebuild in a temp folder and compare with --out')
    a = ap.parse_args()
    if not a.check:
        build(a.fonts, a.out)
        return
    with tempfile.TemporaryDirectory() as tmp:
        build(a.fonts, tmp)
        names = list(INSTANCES) + ['OFL.txt']
        diff = [n for n in names if not os.path.exists(os.path.join(a.out, n))
                or not filecmp.cmp(os.path.join(tmp, n), os.path.join(a.out, n), shallow=False)]
        if diff:
            fail('differs from the committed fonts: ' + ', '.join(diff))
        print(f'✔ check: {len(names)} files rebuilt byte for byte')


if __name__ == '__main__':
    main()
