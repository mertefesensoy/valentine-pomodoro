"""
store-iphone-sources.py: the sources of the iPhone App Store set for 1.5, the approved iPad set's five close-ups drawn
on iPhone (docs/implementations/2026-11-16-iphone-store-set.md).

    python -P scripts/art/store-iphone-sources.py            write art/src/store-iphone/*.svg and art/jobs/store-iphone.json
    python -P scripts/art/store-iphone-sources.py --check    regenerate in memory and compare; exit 1 on any difference

Contract
  in : scripts/art/store-ipad-sources.py, loaded as a module: the 1.5 screens (its Pad class), the composition and its
       self-checks (Layout, strip_svg), and the drafts the owner approved for the iPad set (the captions, Mert and
       Ekin, the note, the code); through it, store-sources.py's helpers, the tokens, strings and art.
  out: one SVG strip per language, five 1320 x 2868 panels with the 60-px gutter of the v1.4 iPhone set, each a
       caption and one window of the iPhone's screen (393 x 852 pt) as a die-cut page with Pomo & Doro whole on its
       top edge; and the job art/jobs/store-iphone.json, which scripts/art/build.mjs builds into art/out/store-iphone/,
       every panel at 1320 x 2868 (6.9") and 1206 x 2622 (6.3"). Nothing else is written.
  how: the iPhone's own geometry (record §3.2): the tab bar at the bottom; content-sized sheets floating 8.5 pt in from
       the sides and 9 pt above the bottom with the 34-pt safe area under their content; the pairing sheet's
       full-height detent edge to edge from 10 pt under the status bar. The self-checks are the iPad set's and must pass.
  needs: as store-ipad-sources.py. Run with -P.
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CHECK = '--check' in sys.argv
_spec = importlib.util.spec_from_file_location('store_ipad_sources', os.path.join(ROOT, 'scripts', 'art', 'store-ipad-sources.py'))
P = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(P)
S, f = P.S, P.S.f


class Phone(P.Pad):
    """The iPhone's screen (393 x 852 pt), with the iPhone's sheets (record §3.2)."""
    DEVICE = 'iphone'
    BOTTOM_INSET = 34          # the home indicator's safe area, under the pairing sheet's pinned actions
    SAFE_BOTTOM = 34           # what a content-sized sheet adds under its content
    FLOAT_SIDE, FLOAT_FOOT = 8.5, 9   # iOS 26's floating sheet, as the owner's device captures show it
    PAIR_TOP = 59 + 10         # the full-height detent: 10 pt under the status bar's inset (assumed; no capture)

    def sheet_width(self):
        return self.W - 2 * self.FLOAT_SIDE

    def sheet_frame(self, h, full):
        if full:
            return 0, self.PAIR_TOP, self.W, self.H - self.PAIR_TOP
        sh = h + self.SAFE_BOTTOM
        return self.FLOAT_SIDE, self.H - self.FLOAT_FOOT - sh, self.sheet_width(), sh

    def finish(self):
        """The home indicator, which the system draws over a sheet."""
        if P.REC.covers:
            self.add(f'<rect x="130" y="838" width="133" height="5" rx="2.5" fill="{self.t["ink"]}"/>')

    def note_lines(self, width):
        """The note's lines as iOS breaks text, greedily by word, measured by its width as VectorCraft draws it in Inter
        (NOTE_INK) rather than the per-character estimate, which is 31 pt wide of the English note and would break off
        "me."; a line the table doesn't hold falls back to the estimate."""
        ink = NOTE_INK[self.lang]
        lines, cur = [], ''
        for word in P.NOTE[self.lang].split(' '):
            trial = f'{cur} {word}'.strip()
            if cur and ink.get(trial, S.inter_width(trial, 20, 400)) > width:
                lines.append(cur)
                cur = word
            else:
                cur = trial
        return lines + [cur]


# The notes' ink widths at 20 pt in VectorCraft's Inter, each note's word-by-word prefixes and suffixes, measured by
# .impeccable/review/iphone/measure_inter.py (2026-11-16, after the owner's Turkish note). In the iPhone sheet's 328 pt,
# English is one line (308.2); Turkish breaks after "Akşam" (311.0), then "yemeği benden." (149.2).
NOTE_INK = {
    'en': {"So proud of you. Dinner's on me.": 308.2},
    'tr': {'Seninle gurur duyuyorum. Akşam': 311.0, 'Seninle gurur duyuyorum. Akşam yemeği': 385.8, 'yemeği benden.': 149.2},
}

# Each panel's window of the screen (pt, record §3.3) and who sits on its page. Panel 5's is exactly the note's sheet,
# with the sheet's own 38-pt corners: on iPhone the bottom sheet stops below the spread, and its top crosses the presets'
# labels, which read as cut in half in any window that shows the Timer above it. The sheet is its content, the 34-pt
# safe area, 9 pt above the screen's foot: 196 + 34 tall in English (one line), 224 + 34 in Turkish (two).
WINDOWS = [(12, 140, 369, 390), (0, 63, 393, 761), (12, 112, 369, 436), (2, 404, 389, 446),
           {'en': (8.5, 613, 376, 230), 'tr': (8.5, 585, 376, 258)}]
CORNERS = [22, 22, 22, 22, 38]
CAST = [
    [(('wave', 'wave-left'), 'pomo', -1, 330), (('wave', 'wave-right'), 'doro', 1, 320)],
    [(('look', 'look-right'), 'pomo', -1, 320), (('look', 'look-left'), 'doro', 1, 320)],
    [(('celebrating',), 'pomo', -1, 320), (('celebrating',), 'doro', 1, 320)],
    [(('break',), 'pomo', -1, 300), (('break',), 'doro', 1, 290)],
    [(('sleepy',), 'pomo', -1, 360), (('sleepy',), 'doro', 1, 360)],
]
PW, PH, G = 1320, 2868, 60
IPHONE = P.Layout('App Store screenshots, iPhone, {lang}: two pages, one diary (1.5)', (PW, PH), G,
                  960, 56, 1192, (136, 54, 1180, 300), WINDOWS, CAST, Phone, CORNERS)
SIZES = [(1320, 2868), (1206, 2622)]


def job():
    assets = []
    for lang in ('en', 'tr'):
        crops = []
        for i in range(P.N):
            for w, h in SIZES:
                s = w / PW
                rect_h = h / s
                crops.append({'name': f'{i + 1:02d}-{w}x{h}', 'rect': [i * (PW + G), round(-(rect_h - PH) / 2, 3), PW, round(rect_h, 3)], 'px': w})
        assets.append({'id': f'store-iphone15-{lang}', 'src': f'art/src/store-iphone/store-iphone15-{lang}.svg', 'kind': 'store-iphone',
                       'png': [round(IPHONE.SW / 5)], 'crops': crops})
    return {
        'about': "1.5's iPhone App Store screenshots, the couple's close-ups (docs/implementations/2026-11-16-iphone-store-set.md): "
                 'one strip per language, five panels side by side with the store\'s gutter, written by '
                 'scripts/art/store-iphone-sources.py. Each panel is a crop at 1320 x 2868 (6.9") and 1206 x 2622 (6.3"); '
                 'the whole strip also exports at a fifth of its width.',
        'assets': assets,
    }


def files(problems):
    out = {f'art/src/store-iphone/store-iphone15-{lang}.svg': P.strip_svg(lang, problems, IPHONE) for lang in ('en', 'tr')}
    out['art/jobs/store-iphone.json'] = json.dumps(job(), indent=1, ensure_ascii=False) + '\n'
    return out


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    problems = []
    written = files(problems)
    if problems:
        for p in problems:
            print(f'✖ {p}')
        print(f'✖ {len(problems)} self-check failure(s); nothing written')
        sys.exit(1)
    print('✔ self-checks: every mascot whole, in front and clear of the captions and key content; nothing cut by a window')
    differences = 0
    for rel, text in written.items():
        path = os.path.join(ROOT, rel)
        if CHECK:
            if not (os.path.exists(path) and open(path, encoding='utf-8', newline='').read() == text):
                differences += 1
                print(f'✖ {rel} is not what the generator writes')
        else:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(text)
            print(f'✔ wrote {rel}')
    if CHECK:
        print(f'✖ {differences} file(s) differ' if differences else '✔ every iPhone store source matches the generator')
        sys.exit(1 if differences else 0)


if __name__ == '__main__':
    main()
