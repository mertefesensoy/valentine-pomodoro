"""
Phase 1 C2: the display-face specimen (NFR-I18N-001).

Audits each candidate face from its google/fonts file (Turkish coverage, tabular digits,
licence, sizes) and writes one self-contained HTML specimen that embeds exactly those files,
subset to Latin + Turkish, so what the owner sees is what was checked.

    python -P art/type/build-specimen.py --fonts C:/vp/fonts --out art/review/c2-type-specimen.html
    python -P art/type/build-specimen.py --fonts C:/vp/fonts --out <file> --fragment   # for the claude.ai page

Inputs (fetched from github.com/google/fonts/tree/main/ofl, see the Stage C record §2.2):
Fredoka[wdth,wght].ttf, Baloo2[wght].ttf, MPLUSRounded1c-Medium.ttf and -Bold.ttf, Nunito[wght].ttf.
Needs fontTools 4.61+ and brotli. Run with -P and from outside the fonts folder: the fonts are data.
"""
import argparse, base64, html, io, json, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

TURKISH = {0x130: 'İ', 0x131: 'ı', 0x11E: 'Ğ', 0x11F: 'ğ', 0x15E: 'Ş', 0x15F: 'ş',
           0xC7: 'Ç', 0xE7: 'ç', 0xD6: 'Ö', 0xF6: 'ö', 0xDC: 'Ü', 0xFC: 'ü'}
DIGITS = [0x30 + i for i in range(10)]
# Basic Latin, Latin-1, Latin Extended-A (every Turkish letter), general punctuation, ₺, ™.
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x2010, 0x2040)) + [0x20BA, 0x2122]

FACES = [
    {'id': 'fredoka', 'name': 'Fredoka', 'files': {600: 'Fredoka[wdth,wght].ttf', 500: 'Fredoka[wdth,wght].ttf'},
     'source': 'ofl/fredoka', 'candidate': 'owner',
     'note': 'Geometric and very round, with a big, open bowl. The friendliest of the four, and the closest to a children\'s app.'},
    {'id': 'baloo2', 'name': 'Baloo 2', 'files': {600: 'Baloo2[wght].ttf', 500: 'Baloo2[wght].ttf'},
     'source': 'ofl/baloo2', 'candidate': 'owner',
     'note': 'Chunky and bouncy, with soft, heavy joins. The most personality, and the loudest on a heading.'},
    {'id': 'mplus', 'name': 'M PLUS Rounded 1c', 'files': {600: 'MPLUSRounded1c-Bold.ttf', 500: 'MPLUSRounded1c-Medium.ttf'},
     'source': 'ofl/mplusrounded1c', 'candidate': 'owner',
     'note': 'A Japanese rounded gothic: calm, upright and grown-up, the face of the stationery aisle. Its Latin is plainer than the others.'},
    {'id': 'nunito', 'name': 'Nunito', 'files': {600: 'Nunito[wght].ttf', 500: 'Nunito[wght].ttf'},
     'source': 'ofl/nunito', 'candidate': 'stand-in',
     'note': 'A rounded humanist sans: soft but quiet, very legible at small sizes. Added as a stand-in because Fredoka fails two requirements.'},
]
WEIGHT_FOR = {'fredoka': {600: 600, 500: 500}, 'baloo2': {600: 600, 500: 500},
              'mplus': {600: 700, 500: 500}, 'nunito': {600: 800, 500: 700}}


def gsub_map(font, tag):
    """Single substitutions applied by one GSUB feature (e.g. tnum)."""
    if 'GSUB' not in font:
        return None
    g = font['GSUB'].table
    lookups = [i for fr in g.FeatureList.FeatureRecord if fr.FeatureTag == tag for i in fr.Feature.LookupListIndex]
    if not lookups:
        return None
    m = {}
    for li in lookups:
        lk = g.LookupList.Lookup[li]
        for st in lk.SubTable:
            st = st.ExtSubTable if lk.LookupType == 7 else st
            m.update(getattr(st, 'mapping', {}))
    return m


def has_turkish_locl(font):
    if 'GSUB' not in font:
        return False
    g = font['GSUB'].table
    trk = any(ls.LangSysTag == 'TRK ' for sr in g.ScriptList.ScriptRecord for ls in sr.Script.LangSysRecord)
    return trk and any(fr.FeatureTag == 'locl' for fr in g.FeatureList.FeatureRecord)


def static(path, wght):
    f = TTFont(path)
    if 'fvar' in f:
        loc = {'wght': wght}
        if any(a.axisTag == 'wdth' for a in f['fvar'].axes):
            loc['wdth'] = 100
        f = instancer.instantiateVariableFont(f, loc)
    return f


def subset_bytes(font, flavor=None):
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']          # keeps the copyright and the OFL notice inside the file
    opts.notdef_outline = True
    opts.flavor = flavor
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(font)
    font.flavor = flavor           # the Options flavor only applies through subset.save_font
    b = io.BytesIO()
    font.save(b)
    return b.getvalue()


def audit(face, fonts_dir):
    timer_file = os.path.join(fonts_dir, face['files'][600])
    w = WEIGHT_FOR[face['id']][600]
    raw = TTFont(timer_file)
    f = static(timer_file, w)
    cmap, hm = f.getBestCmap(), f['hmtx'].metrics
    digits = [cmap[d] for d in DIGITS]
    native = sorted({hm[g][0] for g in digits})
    tnum = gsub_map(f, 'tnum')
    tnum_w = sorted({hm[tnum.get(g, g)][0] for g in digits}) if tnum else None
    name = f['name']
    files = sorted({face['files'][k] for k in face['files']})
    return {
        'missing': [ch for cp, ch in TURKISH.items() if cp not in cmap],
        'digitsNative': native, 'tnum': tnum is not None, 'digitsTnum': tnum_w,
        'steady': len(native) == 1 or (tnum_w is not None and len(tnum_w) == 1),
        'steadyHow': 'native' if len(native) == 1 else ('tnum' if tnum_w and len(tnum_w) == 1 else 'none'),
        'trkLocl': has_turkish_locl(f),
        'licence': (name.getDebugName(13) or '').strip(), 'copyright': (name.getDebugName(0) or '').strip(),
        'version': (name.getDebugName(5) or '').strip(),
        'glyphs': len(raw.getGlyphOrder()), 'variable': 'fvar' in raw,
        'bytesFull': sum(os.path.getsize(os.path.join(fonts_dir, x)) for x in files),
        'filesFull': files,
        'timerWeight': w,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fonts', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--fragment', action='store_true', help='omit the document wrapper (claude.ai page)')
    ap.add_argument('--palette', default=os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'theme', 'palette.json'))
    a = ap.parse_args()

    pal = json.load(open(a.palette, encoding='utf8'))
    faces_css, data = [], []
    for face in FACES:
        r = audit(face, a.fonts)
        sizes = {}
        for role, w in WEIGHT_FOR[face['id']].items():
            f = static(os.path.join(a.fonts, face['files'][role]), w)
            woff2 = subset_bytes(f, 'woff2')
            sizes[w] = {'woff2': len(woff2),
                        'ttf': len(subset_bytes(static(os.path.join(a.fonts, face['files'][role]), w)))}
            faces_css.append(
                "@font-face{font-family:'%s C2';font-weight:%d;font-style:normal;"
                "src:url(data:font/woff2;base64,%s) format('woff2');}"
                % (face['name'], 600 if role == 600 else 500, base64.b64encode(woff2).decode()))
        r['subset'] = sizes
        data.append((face, r))
        print(face['name'], json.dumps({k: r[k] for k in ('missing', 'steadyHow', 'trkLocl', 'bytesFull')}, ensure_ascii=False),
              {w: s['ttf'] for w, s in sizes.items()}, file=sys.stderr)

    page = render(pal, faces_css, data, a.fragment)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    open(a.out, 'w', encoding='utf8').write(page)
    print('wrote', a.out, len(page), 'bytes', file=sys.stderr)


def kb(n):
    return f'{n / 1024:,.0f} KB' if n < 1024 * 1024 else f'{n / 1024 / 1024:,.1f} MB'


def chip(ok, text):
    return f'<span class="chip {"ok" if ok else "no"}"><b aria-hidden="true">{"✓" if ok else "✕"}</b>{html.escape(text)}</span>'


def render(pal, faces_css, data, fragment):
    sm, mp = pal['themes']['strawberryMilk']['tokens'], pal['themes']['midnightPlum']['tokens']
    keys = ['page', 'paper', 'field', 'edge', 'edgeStrong', 'ink', 'inkSoft', 'primary', 'onPrimary', 'primaryInk',
            'primarySoft', 'success', 'onSuccess', 'successInk', 'danger', 'onDanger', 'dangerInk', 'stickerEdge', 'stickerShadow', 'accent']
    tok = lambda t: ';'.join(f'--{k}:{t[k]}' for k in keys)

    sections = []
    for face, r in data:
        fam = f"'{face['name']} C2'"
        fallback = "'Courier New',monospace" if r['missing'] else 'system-ui,sans-serif'
        verdict = (not r['missing']) and r['steady']
        steady_txt = {'native': 'Steady digits (fixed-width by design)', 'tnum': 'Steady digits (with tabular figures)',
                      'none': 'Digits change width'}[r['steadyHow']]
        tr_txt = 'Full Turkish' if not r['missing'] else 'Missing ' + ' '.join(r['missing'])
        sub = r['subset']
        sub_txt = ' + '.join(kb(s['ttf']) for s in sub.values())
        digits_detail = (f"0–9 are all {r['digitsNative'][0]} units wide" if r['steadyHow'] == 'native'
                         else f"0–9 become {r['digitsTnum'][0]} units wide with tnum (default widths {r['digitsNative'][0]}–{r['digitsNative'][-1]})" if r['steadyHow'] == 'tnum'
                         else f"0–9 range from {r['digitsNative'][0]} to {r['digitsNative'][-1]} units, and there is no tnum feature")
        stack = ''.join(f'<span class="tick"><span>{t}</span></span>' for t in ('24:59', '11:11', '07:40', '00:01'))
        sections.append(f'''
<section class="face {'pass' if verdict else 'fail'}" style="--face:{fam},{fallback}" aria-labelledby="h-{face['id']}">
  <header class="facehead">
    <div>
      <p class="eyebrow">{'Your candidate' if face['candidate'] == 'owner' else 'Stand-in, added in C2'}</p>
      <h2 id="h-{face['id']}" class="inface">{html.escape(face['name'])}</h2>
      <p class="note">{html.escape(face['note'])}</p>
    </div>
    <div class="chips">{chip(not r['missing'], tr_txt)}{chip(r['steady'], steady_txt)}{chip(True, 'SIL OFL 1.1')}</div>
  </header>

  <div class="sheet">
    <div class="timerblock">
      <p class="label">The running timer · weight {r['timerWeight']}</p>
      <div class="timer inface" data-live>24:59</div>
      <p class="label">Four readings, one above the other. Equal bars mean the digits hold still.</p>
      <div class="stack inface">{stack}</div>
    </div>
    <div class="textblock">
      <p class="label">Turkish heading</p>
      <p class="h-tr inface" lang="tr">BUGÜN BİRLİKTE ÇALIŞIYORUZ</p>
      <p class="h-sub inface" lang="tr">Ilık bir öğle arası, şimdi odaklanma vakti</p>
      <p class="pairs inface" lang="tr">Iı İi Ğğ Şş Çç Öö Üü</p>
      <p class="label">“fi” as the font ships: in all four faces the fi ligature hides the dot on i, so the embedded subset drops it</p>
      <p class="fi inface">fikir · fiyat · ofis</p>
      <p class="label">English heading</p>
      <p class="h-en inface" lang="en">Focus together, wherever you are</p>
      <div class="stickers">
        <span class="sticker inface">4 sessions today</span>
        <span class="sticker inface tilt" lang="tr">Bugün 4 oturum</span>
      </div>
      {'<p class="warn">Letters set in a typewriter face are missing from ' + html.escape(face['name']) + ', so the phone would draw them from another font.</p>' if r['missing'] else ''}
    </div>
  </div>

  <dl class="facts">
    <div><dt>Turkish</dt><dd>{'All 12 letters (Ç Ğ İ Ö Ş Ü ç ğ ı ö ş ü)' if not r['missing'] else 'Missing ' + ' '.join(r['missing'])}{'; Turkish-aware i-forms (<code>locl</code>)' if r['trkLocl'] else '; no Turkish <code>locl</code>'}</dd></div>
    <div><dt>Digits</dt><dd>{digits_detail}</dd></div>
    <div><dt>Licence</dt><dd>SIL Open Font License 1.1, read from the font itself. {html.escape(r['copyright'])}. {html.escape(r['version'])}.</dd></div>
    <div><dt>Size</dt><dd>{kb(r['bytesFull'])} as published ({', '.join(r['filesFull'])}; {r['glyphs']:,} glyphs){'' if r['variable'] else ', per weight'}. Subset to Latin + Turkish, two static weights: {sub_txt}.</dd></div>
    <div><dt>Source</dt><dd><code>github.com/google/fonts/tree/main/{face['source']}</code></dd></div>
  </dl>
</section>''')

    body = f'''<title>Display face specimens</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one diary page per face, the timer on the left and the words on the right, stacking on a phone. Colours are the C1 tokens. */
{''.join(faces_css)}
:root {{ {tok(sm)}; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; --mono: ui-monospace, SFMono-Regular, Consolas, monospace; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ {tok(mp)}; color-scheme: dark; }} }}
:root[data-theme="dark"] {{ {tok(mp)}; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }}
.wrap {{ max-width: 1120px; margin: 0 auto; padding-block: 36px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 28px; }}
h1 {{ font-size: clamp(26px, 4vw, 34px); line-height: 1.15; margin: 0; text-wrap: balance; }}
.lede {{ color: var(--inkSoft); max-width: 68ch; margin: 8px 0 0; }}
.summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }}
.sumcard {{ background: var(--paper); border: 1px solid var(--edge); border-radius: 14px; padding: 12px 14px; display: grid; gap: 6px; min-width: 0; }}
.sumcard b {{ font-size: 18px; }}
.sumcard .chip {{ justify-self: start; }}
.face {{ background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 22px; display: grid; gap: 18px; min-width: 0; }}
.face.fail {{ border-style: dashed; }}
.facehead {{ display: flex; flex-wrap: wrap; gap: 14px 24px; justify-content: space-between; align-items: flex-start; }}
.facehead > div:first-child {{ min-width: 0; flex: 1 1 320px; }}
.eyebrow {{ margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--inkSoft); font-weight: 600; }}
.inface {{ font-family: var(--face); font-weight: 600; }}
h2.inface {{ font-size: clamp(30px, 5vw, 42px); line-height: 1.1; margin: 4px 0 6px; }}
.note {{ margin: 0; color: var(--inkSoft); max-width: 60ch; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; }}
.chip {{ display: inline-flex; gap: 6px; align-items: center; border-radius: 999px; padding: 5px 12px; font-weight: 600; font-size: 13px; }}
.chip.ok {{ background: var(--success); color: var(--onSuccess); }}
.chip.no {{ background: var(--danger); color: var(--onDanger); }}
.sheet {{ display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 24px; }}
@media (max-width: 760px) {{ .sheet {{ grid-template-columns: minmax(0, 1fr); }} }}
.timerblock, .textblock {{ background: var(--page); border: 1px solid var(--edge); border-radius: 14px; padding: 16px; min-width: 0; display: grid; gap: 8px; align-content: start; }}
.label {{ margin: 0; font-size: 12px; color: var(--inkSoft); }}
.timer {{ font-size: clamp(64px, 12vw, 104px); line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }}
.stack {{ display: grid; gap: 4px; justify-items: start; font-size: 34px; line-height: 1.1; font-variant-numeric: tabular-nums; }}
.tick span {{ background: var(--primarySoft); border-radius: 6px; padding: 0 2px; }}
.h-tr {{ font-size: clamp(22px, 3.4vw, 30px); line-height: 1.15; margin: 0; overflow-wrap: anywhere; }}
.h-sub {{ font-size: 22px; line-height: 1.2; margin: 0; font-weight: 500; }}
.pairs {{ font-size: 26px; margin: 0; letter-spacing: .04em; font-weight: 500; }}
.fi {{ font-size: 22px; margin: 0; font-weight: 500; }}
.h-en {{ font-size: 24px; line-height: 1.2; margin: 0; }}
.stickers {{ display: flex; flex-wrap: wrap; gap: 14px; padding: 6px 0 2px; }}
.sticker {{ background: var(--primary); color: var(--onPrimary); border: 4px solid var(--stickerEdge); border-radius: 18px; padding: 6px 14px; font-size: 18px; box-shadow: 1.5px 3px 4px var(--stickerShadow); }}
.sticker.tilt {{ transform: rotate(-3deg); background: var(--success); color: var(--onSuccess); }}
.warn {{ margin: 0; color: var(--dangerInk); font-weight: 600; }}
.facts {{ margin: 0; display: grid; gap: 8px; }}
.facts div {{ display: grid; grid-template-columns: 90px minmax(0, 1fr); gap: 12px; }}
.facts dt {{ color: var(--inkSoft); font-weight: 600; }}
.facts dd {{ margin: 0; min-width: 0; overflow-wrap: anywhere; }}
code {{ font: 13px var(--mono); }}
.pick {{ background: var(--primarySoft); border-radius: 22px; padding: 22px; display: grid; gap: 10px; }}
.pick h2 {{ margin: 0; font-size: 22px; }}
.pick p, .pick li {{ margin: 0; max-width: 72ch; }}
.pick ul {{ margin: 0; padding-left: 20px; display: grid; gap: 6px; }}
footer {{ color: var(--inkSoft); font-size: 13px; }}
@media (prefers-reduced-motion: reduce) {{ .sticker.tilt {{ transform: none; }} }}
</style>
<div class="wrap">
  <header>
    <h1>Display face specimens</h1>
    <p class="lede">Phase 1, C2. Each candidate sets the running timer, a Turkish heading with İ and ı, an English heading and two sticker captions, in the approved Strawberry Milk palette (Midnight Plum in dark mode). The facts under each face were read from the font files with fontTools, and the same files are embedded in this page.</p>
  </header>
  <div class="summary">{''.join(f"""<div class="sumcard"><b style="font-family:'{f['name']} C2',system-ui;font-weight:600">{html.escape(f['name'])}</b>{chip(not r['missing'], 'Turkish')}{chip(r['steady'], 'Steady digits')}<span class="label">{' + '.join(kb(s['ttf']) for s in r['subset'].values())} embedded</span></div>""" for f, r in data)}</div>
  <section class="pick" aria-labelledby="h-pick">
    <h2 id="h-pick">Recommendation: Baloo 2, embedded with D1</h2>
    <ul>
      <li><b>Of your three, it is the one that passes and has a voice.</b> Its captions and timer read like stickers, which is the Sticker Diary's signature. Keep it to the timer, screen titles and sticker captions; everything else stays in the system face, as DESIGN.md already says.</li>
      <li><b>Turkish:</b> all twelve letters, plus Turkish-aware i-forms. <b>Digits:</b> they hold still through tabular figures, one React Native prop (<code>fontVariant: ['tabular-nums']</code>), checked on the iPhone in D1's device check. <b>Size:</b> 58 KB per weight, subset to Latin and Turkish.</li>
      <li><b>M PLUS Rounded 1c</b> is the calm alternative: its digits are fixed-width with no prop at all, but its Latin is plainer, and its wide colon opens a gap in the timer.</li>
      <li><b>Nunito</b> passes too, but it is one of the most-used rounded faces in app and dashboard templates, so it would make the app look like many others.</li>
      <li><b>Fredoka</b> fails: it has no İ, Ğ, ğ, Ş or ş, and its digits change width as the timer counts.</li>
      <li><b>Whichever you pick,</b> the embedded subset drops the fi and fl ligatures, so a Turkish i always keeps its dot.</li>
    </ul>
  </section>
  {''.join(sections)}
  <footer>Generated by <code>art/type/build-specimen.py</code> from the google/fonts files and <code>src/theme/palette.json</code>. Each embedded font is a Latin + Turkish subset that keeps its own copyright and OFL notice. Timers use tabular figures (<code>font-variant-numeric: tabular-nums</code>, which is <code>fontVariant: ['tabular-nums']</code> in React Native).</footer>
</div>
<script>
(() => {{
  let s = 24 * 60 + 59;
  const els = document.querySelectorAll('[data-live]');
  const fmt = (n) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  setInterval(() => {{ s = s > 0 ? s - 1 : 24 * 60 + 59; els.forEach((e) => {{ e.textContent = fmt(s); }}); }}, 1000);
}})();
</script>
'''
    if fragment:
        return body
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>', 1) + '</body></html>\n'


if __name__ == '__main__':
    main()
