"""
creative-build.py — renders the creative assets' loops frame by frame with VectorCraft and encodes them
(docs/implementations/2026-11-02-app-store-creative-assets.md).

    python -P scripts/art/creative-build.py <comp> <variant> [--scale S] [--out FILE]

The scale defaults to the shipped loop's (creative-sources.py's LOOP_SCALE).

Writes each frame's SVG (scripts/art/creative-sources.py's frame_svg at t = k / FPS, k = 0 … N-1) into the
work folder, renders them in batches in one VectorCraft run each (file.open, document.export, file.close),
deletes the SVGs, and encodes the PNG sequence with ffmpeg's libx264: yuv420p at FPS, BT.709 set on the
frames themselves (the default RGB to YUV matrix is BT.601, and the PNGs' sRGB chunk would set the
transfer), faststart, and one thread with bitexact flags so the same frames always give the same bytes.
Frame N would equal frame 0, so it is never rendered: the loop has no repeated frame at its seam.
Environment: VECTORCRAFT_CLI, VP_ART_WORK (default C:/vp-art), as scripts/art/build.mjs.
"""
import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('creative_sources', os.path.join(HERE, 'creative-sources.py'))
C = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(C)

CLI = os.environ.get('VECTORCRAFT_CLI', 'C:/Program Files/VectorCraft/vectorcraft-cli.exe')
WORK = os.environ.get('VP_ART_WORK', 'C:/vp-art').replace('\\', '/')
BATCH = 60


def encode(frames_pattern, out, fps):
    vf = 'scale=out_color_matrix=bt709:out_range=tv,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709'
    cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-framerate', str(fps), '-i', frames_pattern,
           '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-threads', '1', '-pix_fmt', 'yuv420p',
           '-r', str(fps), '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
           '-movflags', '+faststart', '-fflags', '+bitexact', '-flags:v', '+bitexact', '-map_metadata', '-1', '-an', out]
    subprocess.run(cmd, check=True)


def render(comp, variant, scale, frames_dir, only=None):
    os.makedirs(frames_dir, exist_ok=True)
    ks = list(range(C.N)) if only is None else only
    for b0 in range(0, len(ks), BATCH):
        chunk = ks[b0:b0 + BATCH]
        steps = []
        for k in chunk:
            svg = f'{frames_dir}/f{k:04d}.svg'
            with open(svg, 'w', encoding='utf-8', newline='') as fh:
                fh.write(C.frame_svg(comp, variant, k / C.FPS, scale))
            steps += [{'command': 'file.open', 'params': {'path': svg}},
                      {'command': 'document.export', 'params': {'path': f'{frames_dir}/f{k:04d}.png', 'format': 'png', 'scale': 1}},
                      {'command': 'file.close', 'params': {}}]
        steps_file = f'{frames_dir}/steps.json'
        with open(steps_file, 'w') as fh:
            json.dump(steps, fh)
        out = subprocess.run([CLI, 'run', '--commands', steps_file], capture_output=True, text=True, encoding='utf-8')
        if out.returncode:
            raise SystemExit(out.stderr)
        for line in out.stdout.strip().splitlines():
            r = json.loads(line)
            if r.get('error') or (r.get('result') or {}).get('warnings'):
                raise SystemExit(f'{comp} {variant}: {line}')
        for k in chunk:
            os.remove(f'{frames_dir}/f{k:04d}.svg')
        print(f'  frames {chunk[0]}–{chunk[-1]}', flush=True)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser()
    ap.add_argument('comp', choices=['header', 'search'])
    ap.add_argument('variant', choices=['stickers', 'diary', 'page'])
    ap.add_argument('--scale', type=float)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    a.scale = a.scale or C.LOOP_SCALE[a.comp]
    frames = f'{WORK}/creative/{a.comp}-{a.variant}-{a.scale:g}'
    shutil.rmtree(frames, ignore_errors=True)
    render(a.comp, a.variant, a.scale, frames)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    encode(f'{frames}/f%04d.png', a.out, C.FPS)
    print(f'✔ {a.out}')


if __name__ == '__main__':
    main()
