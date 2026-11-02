"""
creative-check.py — checks the App Store creative assets against Apple's specifications and the owner's
answers (docs/implementations/2026-11-02-app-store-creative-assets.md §6).

    python -P scripts/art/creative-check.py             the fast checks; exit 1 on any failure
    python -P scripts/art/creative-check.py --rebuild   also re-render and re-encode both loops in the work
                                                        folder and compare them with the committed files
                                                        byte for byte (several minutes)

Fast checks:
  - each loop (ffprobe): H.264, yuv420p, its exact size, 30 fps, 5–30 s (the generator's N frames), BT.709
    primaries, transfer and matrix, no audio track (silent, the owner's choice); and decodable by the GPU
    decoders browsers and phones use: level 5.2 or below, within 4096 x 2304 (a 3840 x 2560 search loop is
    level 6.0, and a GPU decoder garbled it into streaks in the owner's browser);
  - the motion, decoded (the owner: "make sure they don't flick"): each loop is streamed from ffmpeg at a quarter
    of its width, and every frame's change from the one before is measured in a grid of 120-px tiles, the last
    frame into the first included, so the seam is judged like any other frame. A flick is a change above 1.0
    (of 255; the encoder's own noise stays below) and more than 4 times the larger change on either side: a
    pop, where smooth motion, or its start, always has a neighbour moving nearly as much. None may appear but
    the blinks (creative-sources.py's instants()), the Ring's digits included;
  - no words: every string the generator would set over the whole loop, in every composition, is the
    timer's digits (only 0-9 and ':'), so no word, price, URL or symbol can reach a frame;
  - the stills: exact sizes, PNG colour type 2 (no alpha).
"""
import argparse
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


C = load('creative_sources', 'creative-sources.py')
B = load('creative_build', 'creative-build.py')

# The shipped loops and stills: (file, composition, variant, width, height).
LOOPS = [(f'art/out/creative/creative-{c}.mp4', c, None, round(C.SIZES[c][0] * C.LOOP_SCALE[c]), round(C.SIZES[c][1] * C.LOOP_SCALE[c]))
         for c in ('header', 'search')]
STILLS = []  # filled from art/jobs/creative.json when it exists
failures = []


def fail(msg):
    failures.append(msg)
    print(f'✖ {msg}')


def ok(msg):
    print(f'✔ {msg}')


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def check_loop(rel, comp, w, h):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        return fail(f'{rel} is missing')
    p = probe(path)
    v = [s for s in p['streams'] if s['codec_type'] == 'video']
    a = [s for s in p['streams'] if s['codec_type'] == 'audio']
    if len(v) != 1:
        return fail(f'{rel}: {len(v)} video streams')
    s = v[0]
    want = {'codec_name': 'h264', 'width': w, 'height': h, 'pix_fmt': 'yuv420p', 'r_frame_rate': f'{C.FPS}/1',
            'color_primaries': 'bt709', 'color_transfer': 'bt709', 'color_space': 'bt709'}
    bad = {k: s.get(k) for k, x in want.items() if s.get(k) != x}
    frames = int(s.get('nb_frames', 0))
    seconds = float(p['format']['duration'])
    if bad:
        fail(f'{rel}: {bad} (want {want})')
    if frames != C.N:
        fail(f'{rel}: {frames} frames, want {C.N}')
    if not 5 <= seconds <= 30:
        fail(f'{rel}: {seconds:.2f} s, outside 5–30 s')
    if a:
        fail(f'{rel}: has an audio track; the loops are silent')
    gpu = int(s.get('level', 99)) <= 52 and w <= 4096 and h <= 2304
    if not gpu:
        fail(f'{rel}: level {s.get("level")} at {w}×{h}; GPU decoders take level 5.2 and 4096×2304 at most')
    if not bad and frames == C.N and 5 <= seconds <= 30 and not a and gpu:
        ok(f'{rel}: H.264 {w}×{h} level {int(s["level"]) / 10:g}, {C.FPS} fps, {frames} frames ({seconds:.2f} s), BT.709, silent')


def check_motion(rel, comp, w, h, width=960, tile=120):
    """Decodes a loop at `width` px and looks for flicks (see the module's docstring)."""
    import numpy as np
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        return
    hh = round(h * width / w / 2) * 2
    rows, cols = max(1, round(hh / tile)), max(1, round(width / tile))
    ys, xs = np.linspace(0, hh, rows + 1).astype(int)[:-1], np.linspace(0, width, cols + 1).astype(int)[:-1]
    area = np.add.reduceat(np.add.reduceat(np.ones((hh, width)), ys, axis=0), xs, axis=1) * 3
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={width}:{hh}:flags=area', '-f', 'rawvideo',
                            '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    size, first, prev, d = hh * width * 3, None, None, []
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        cur = np.frombuffer(buf, np.uint8).reshape(hh, width, 3).astype(np.int16)
        if prev is None:
            first = cur
        else:
            d.append(np.add.reduceat(np.add.reduceat(np.abs(cur - prev).sum(2), ys, axis=0), xs, axis=1) / area)
        prev = cur
    dec.wait()
    # d[k] is frame k's change from frame k-1; frame 0's is from the last frame, across the seam.
    d = np.array([np.add.reduceat(np.add.reduceat(np.abs(first - prev).sum(2), ys, axis=0), xs, axis=1) / area] + d)
    n = len(d)
    around = np.maximum(np.roll(d, 1, axis=0), np.roll(d, -1, axis=0))  # the larger change either side
    spikes = (d > 1.0) & (d > 4 * around)
    allowed = {(round(x * C.FPS) + e) % n for x in C.instants(comp) for e in (-1, 0, 1)}
    flicks = sorted({int(k) for k, _, _ in zip(*np.nonzero(spikes)) if k not in allowed})
    if flicks:
        fail(f'{rel}: sudden changes at {", ".join(f"{k / C.FPS:.2f} s" for k in flicks[:8])}')
    else:
        ok(f'{rel}: no flicks; across the seam the largest change is {d[0].max():.2f}, against {around[0].max():.2f} beside it')


def check_words():
    seen = set()
    real_baloo, real_inter = C.K.baloo, C.K.inter

    def spy_baloo(text, *a, **k):
        seen.add(text)
        return real_baloo(text, *a, **k)

    def spy_inter(text, *a, **k):
        seen.add(text or ''.join(r[0] for r in k.get('runs') or []))
        return real_inter(text, *a, **k)

    C.K.baloo, C.K.inter = spy_baloo, spy_inter
    try:
        for comp in ('header', 'search'):
            for k in range(0, C.N, 3):
                svg = C.frame_svg(comp, C.VARIANT, k / C.FPS)
                if '<text' in svg:
                    fail(f'{comp} frame {k}: a <text> element')
                    break
    finally:
        C.K.baloo, C.K.inter = real_baloo, real_inter
    words = sorted(x for x in seen if set(x) - set('0123456789:'))
    if words:
        fail(f'strings that are not the timer\'s digits: {words[:5]}')
    else:
        ok(f'no words: the only strings set are {len(seen)} timer readings (digits and a colon)')


def check_stills():
    job = os.path.join(ROOT, 'art/jobs/creative.json')
    if not os.path.exists(job):
        return
    import struct
    for asset in json.load(open(job, encoding='utf-8'))['assets']:
        for c in asset.get('crops', []):
            path = os.path.join(ROOT, f'art/out/{asset["kind"]}/{asset["id"]}-{c["name"]}.png')
            with open(path, 'rb') as fh:
                head = fh.read(33)
            w, h, _, ct = struct.unpack('>IIBB', head[16:26])
            want_w, want_h = (int(x) for x in c['name'].split('-')[-1].split('x'))
            if (w, h, ct) != (want_w, want_h, 2):
                fail(f'{os.path.relpath(path, ROOT)}: {w}×{h} colour type {ct}, want {want_w}×{want_h} type 2')
            else:
                ok(f'{os.path.relpath(path, ROOT)}: {w}×{h}, RGB, no alpha')


def rebuild():
    for rel, comp, _, _, _ in LOOPS:
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, 'loop.mp4')
            frames = f'{B.WORK}/creative/check-{comp}'
            B.render(comp, C.VARIANT, C.LOOP_SCALE[comp], frames)
            B.encode(f'{frames}/f%04d.png', out, C.FPS)
            same = open(out, 'rb').read() == open(os.path.join(ROOT, rel), 'rb').read()
            (ok if same else fail)(f'{rel} {"matches" if same else "differs from"} a clean rebuild')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser()
    ap.add_argument('--rebuild', action='store_true')
    a = ap.parse_args()
    for rel, comp, _, w, h in LOOPS:
        check_loop(rel, comp, w, h)
        check_motion(rel, comp, w, h)
    check_words()
    check_stills()
    if a.rebuild:
        rebuild()
    print(f'✖ {len(failures)} failure(s)' if failures else '✔ the creative assets pass every check')
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
