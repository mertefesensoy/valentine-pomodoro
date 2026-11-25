// Draws Android's small notification icon from the brand's white mark (the Android closed-test plan, Stage 1).
//
// Android draws a notification's small icon from its alpha channel only, in the status bar and the shade. With no
// icon set, expo-notifications uses the app icon, whose opaque square becomes a solid grey blob. This renders
// brand/svg/valentine-pomodoro-mark-single-white.svg, white on transparent, centred in a 96 x 96 square with a
// 4 px margin (Android's 24 dp icon with its 1 dp padding, at xxxhdpi). The expo-notifications config plugin
// scales it to every density at prebuild.
//
// Usage: node scripts/design/android-notification-icon.mjs [path-to-chrome]
// Writes assets/images/notification-icon.png. Needs Chrome or Edge (headless), and checks the result with
// jimp-compact: every pixel is white, at some alpha, and the mark isn't empty.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Jimp from 'jimp-compact';

const SIZE = 96;
const MARGIN = 4;
const root = resolve(import.meta.dirname, '..', '..');
const chrome = process.argv[2] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const svg = readFileSync(join(root, 'brand/svg/valentine-pomodoro-mark-single-white.svg'), 'utf8');
const out = join(root, 'assets/images/notification-icon.png');

const dir = mkdtempSync(join(tmpdir(), 'vp-notif-icon-'));
const html = join(dir, 'icon.html');
const box = SIZE - MARGIN * 2;
writeFileSync(
    html,
    `<!doctype html><html><head><style>html,body{margin:0;background:transparent}` +
        `div{width:${SIZE}px;height:${SIZE}px;display:flex;align-items:center;justify-content:center}` +
        `svg{width:${box}px;height:${box}px}</style></head><body><div>${svg}</div></body></html>`,
);
execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${SIZE},${SIZE}`,
    '--default-background-color=00000000',
    `--screenshot=${out}`,
    pathToFileURL(html).href,
]);

const image = await Jimp.read(out);
if (image.bitmap.width !== SIZE || image.bitmap.height !== SIZE) throw new Error(`expected ${SIZE}x${SIZE}, got ${image.bitmap.width}x${image.bitmap.height}`);
let inked = 0;
let notWhite = 0;
image.scan(0, 0, SIZE, SIZE, (x, y, i) => {
    const [r, g, b, a] = image.bitmap.data.subarray(i, i + 4);
    if (a > 0) inked++;
    if (a > 16 && (r < 235 || g < 235 || b < 235)) notWhite++;
});
if (inked < SIZE * SIZE * 0.15) throw new Error(`the mark covers only ${inked} pixels`);
if (notWhite > 0) throw new Error(`${notWhite} visible pixels aren't white`);
console.log(`wrote ${out}: ${inked} of ${SIZE * SIZE} pixels inked, all white`);
