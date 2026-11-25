// Draws Google Play's feature graphic from the brand kit (the Android Play listing record, §3.5).
//
// Play requires one before a closed track can publish: 1024 x 500, JPEG or 24-bit PNG, with no transparency. This
// composes existing brand art only, with nothing redrawn: the horizontal colour logo on the left and Pomo & Doro,
// celebrating, on the right, on the Strawberry Milk page colour. It carries no words beyond the logo, so one graphic
// serves English and Turkish.
//
// It also writes Play's 512 x 512 store icon, scaled from the brand's 1024 px light app icon (a full-bleed square:
// Play rounds the corners itself).
//
// Usage: node scripts/design/play-feature-graphic.mjs [path-to-chrome]
// Writes art/out/store-play/feature-graphic.jpg and art/out/store-play/icon-512.png, and checks their sizes.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Jimp from 'jimp-compact';

const W = 1024;
const H = 500;
const root = resolve(import.meta.dirname, '..', '..');
const chrome = process.argv[2] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const palette = JSON.parse(readFileSync(join(root, 'src/theme/palette.json'), 'utf8')).themes.strawberryMilk.tokens;
const svg = (name) => readFileSync(join(root, 'brand/svg', name), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'vp-feature-'));
const html = join(dir, 'feature.html');
const png = join(dir, 'feature.png');
writeFileSync(
    html,
    `<!doctype html><html><head><style>
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:${palette.page}}
.logo{position:absolute;left:64px;top:50%;width:540px;transform:translateY(-50%)}
.logo svg{width:100%;height:auto;display:block}
.pair{position:absolute;right:40px;bottom:58px;width:400px;height:300px}
.pomo,.doro{position:absolute;width:250px;height:250px}
.pomo{left:0;bottom:0}
.doro{right:0;bottom:22px}
.pomo svg,.doro svg{width:100%;height:100%;display:block}
</style></head><body>
<div class="logo">${svg('valentine-pomodoro-horizontal-colour.svg')}</div>
<div class="pair"><div class="pomo">${svg('pomo-celebrating.svg')}</div><div class="doro">${svg('doro-celebrating.svg')}</div></div>
</body></html>`,
);
execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${W},${H}`,
    `--screenshot=${png}`,
    pathToFileURL(html).href,
]);

const outDir = join(root, 'art/out/store-play');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'feature-graphic.jpg');
const image = await Jimp.read(png);
if (image.bitmap.width !== W || image.bitmap.height !== H) throw new Error(`expected ${W}x${H}, got ${image.bitmap.width}x${image.bitmap.height}`);
// JPEG has no alpha channel, which is what Play asks for.
await image.quality(92).writeAsync(out);
console.log(`wrote ${out}`);

const icon = await Jimp.read(join(root, 'brand/png/valentine-pomodoro-app-icon-light-1024.png'));
const iconOut = join(outDir, 'icon-512.png');
await icon.resize(512, 512, Jimp.RESIZE_BICUBIC).writeAsync(iconOut);
console.log(`wrote ${iconOut}`);
