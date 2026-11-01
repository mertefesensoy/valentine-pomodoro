// D5's composition round (D5 record §3.4): three sketches of the tutorial's staging over the real
// Timer, one per dealt structure, built from the repo's own tokens and art. Each shows two frames:
// step 1 (hello and the presets, an opening on the presets row) and step 4 (on to Stats: the page
// dimmed, the native tab bar lit). Run: node scripts/design/tutorial-sketches/build.mjs
// It writes .impeccable/mocks/decision/tutorial-<id>.html (git-ignored until the round resolves).
import fs from 'node:fs';

const ROOT = new URL('../../../', import.meta.url);
const palette = JSON.parse(fs.readFileSync(new URL('src/theme/palette.json', ROOT), 'utf8'));
const find = (o) => { for (const [k, v] of Object.entries(o)) { if (k === 'strawberryMilk') return v; if (v && typeof v === 'object') { const r = find(v); if (r) return r; } } };
const c = find(palette).tokens;
const SCRIM = 'rgba(74, 44, 41, 0.45)'; // the proposed scrim token (T-5): cocoa at 45 %

// Baloo 2 and the pair's sticker art, lifted from D2's sketch so every sketch draws the same art.
const d2 = fs.readFileSync(new URL('art/review/d2-stats-postcard-stack.html', ROOT), 'utf8');
const fontFace = d2.match(/@font-face\{[^}]*\}/)[0];
const symbol = (id) => d2.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`))[0];
// The owner, round 1: "make pomo and doro much more bigger": the speaker in its celebrating pose, the
// listener in its idle one, both from the shipped art (art/out/illustration). New expressions and their
// animations come in D5's asset step.
const pose = (file) => {
    const svg = fs.readFileSync(new URL(`art/out/illustration/${file}.svg`, ROOT), 'utf8');
    return `<symbol id="${file}" viewBox="0 0 512 512">${svg.slice(svg.indexOf('</title>') + 8, svg.lastIndexOf('</svg>'))}</symbol>`;
};
const SYMBOLS = `<svg width="0" height="0" style="position:absolute">${symbol('pomo')}${symbol('doro')}${['pomo-celebrating', 'pomo-idle', 'doro-celebrating', 'doro-idle'].map(pose).join('')}</svg>`;
const sticker = (who, size, style = '') =>
    `<svg class="stk" width="${size}" height="${size}" style="${style}"><use href="#${who}"/></svg>`;

const W = 390;
const H = 844;
const TAB_TOP = 768;
const TAB_CENTERS = [64, 151, 239, 326];
const PRESETS = { x: 16, y: 532, w: 358, h: 86, r: 28 };

/** The real Timer, idle on 25/5, as the app draws it at 390 × 844 (positions from build 56's captures). */
function timer() {
    const seg = (label, on) => `<div class="seg${on ? ' on' : ''}">${label}</div>`;
    return `
<div class="t time">9:41</div>
<div class="t phase"><b>Focus</b><span> · session 1 of 4</span></div>
<svg class="abs" style="left:342px;top:58px" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c.ink}" stroke-width="2.2"><rect x="3" y="3" width="7.5" height="7.5" rx="3"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="3"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="3"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="3"/></svg>
<svg class="abs" style="left:0;top:0" width="${W}" height="400"><circle cx="195" cy="250" r="130" fill="none" stroke="${c.ringTrack}" stroke-width="15"/></svg>
<div class="t clock">25:00</div>
<div class="field strip">${sticker('pomo', 40, 'left:16px;top:16px')}${sticker('doro', 40, 'left:46px;top:16px')}<span>Pomo &amp; Doro are ready when you are</span></div>
<div class="t today">Today</div><div class="cell" style="left:170px"></div><div class="cell" style="left:206px"></div>
<div class="presets">${seg('25/5', true)}${seg('50/10')}${seg('90/20')}${seg('Custom')}</div>
<div class="t key">focus / break, in minutes</div>
<div class="pill primary">Start focus</div>
<div class="pill quiet">Skip</div>`;
}

/** The native tab bar: drawn last, so it's never dimmed (the layer lives inside the tab screen). */
function tabBar() {
    const items = ['Timer', 'Stats', 'Settings', 'Notes'];
    return `<div class="tabbar">${items.map((l, i) => `<div class="tab${i === 0 ? ' on' : ''}" style="left:${TAB_CENTERS[i] - 20 - 44}px"><i></i>${l}</div>`).join('')}</div>`;
}

/** The dim: the scrim token over the screen, with one rounded opening (or none). */
function dim(hole) {
    const cut = hole ? `<rect x="${hole.x}" y="${hole.y}" width="${hole.w}" height="${hole.h}" rx="${hole.r}" fill="black"/>` : '';
    return `<svg class="abs" style="left:0;top:0" width="${W}" height="${H}"><defs><mask id="m${hole ? 1 : 0}"><rect width="${W}" height="${H}" fill="white"/>${cut}</mask></defs><rect width="${W}" height="${H}" fill="${SCRIM}" mask="url(#m${hole ? 1 : 0})"/></svg>`;
}

const actions = `<div class="acts"><span class="skip">Skip tour</span><span class="next">Next</span></div>`;
const bubble = (who, text, style, tail = '') =>
    `<div class="bubble" style="${style}"><div class="who">${who}</div><p>${text}</p>${actions}${tail}</div>`;

// ── The three structures ───────────────────────────────────────────────────
const RIBBON = (d, ex, ey) =>
    `<svg class="abs" style="left:0;top:0" width="${W}" height="${H}" fill="none"><path d="${d}" stroke="${c.ringFocus}" stroke-width="18"/><path d="${d}" stroke="${c.primary}" stroke-width="15"/><path d="${d}" stroke="${c.ringFocus}" stroke-width="1" stroke-dasharray="3 5" opacity=".55"/><path d="M${ex - 9} ${ey} H${ex + 9} V${ey + 18} L${ex} ${ey + 10} L${ex - 9} ${ey + 18} Z" fill="${c.primary}" stroke="${c.ringFocus}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const TAPE = (x, y, rot, color) =>
    `<svg class="abs" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)" width="70" height="22"><defs><pattern id="p${color.slice(1)}" width="8" height="22" patternUnits="userSpaceOnUse"><rect width="8" height="22" fill="${color}" opacity=".85"/><rect width="4" height="22" fill="#fff" opacity=".35"/></pattern></defs><rect width="70" height="22" fill="url(#p${color.slice(1)})"/></svg>`;

const SPEAK = 190; // the speaker's sticker box, pt (its art fills about 77 % of the box)
const LISTEN = 140; // the listener's
const smallActs = `<div class="acts mini"><span class="skip">Skip tour</span><span class="next">Next</span></div>`;

const STRUCTURES = [
    {
        id: 'ribbon',
        title: 'The bookmark ribbon',
        kicker: 'THE ROLL',
        line: 'The diary’s strawberry ribbon, the one on the welcome’s closed diary, drops to whatever the pair are talking about and marks your place. They stand at its tip, big, taking turns; the bubble floats above them.',
        good: ['One continuous thread from the welcome through every step: the ribbon is the tour.', 'Its tip points without a separate arrow, at a control or down at the tab bar.', 'The pair stand right beside the opening, big enough to carry the moment.'],
        watch: ['The ribbon crosses the page, so each step needs a clear line to its target.', 'At AX sizes the ribbon shortens to a tab above the bottom panel (T-2).'],
        frames: [
            () => `${dim(PRESETS)}${RIBBON('M374 -5 C374 160 356 300 356 500', 356, 500)}${sticker('doro-idle', LISTEN, 'left:22px;top:368px')}${sticker('pomo-celebrating', SPEAK, 'left:170px;top:322px')}${bubble('Pomo', 'Hi, we’re Pomo &amp; Doro! First, pick how long you’d like to focus.', 'left:18px;top:128px;width:300px', '<b class="tail b" style="left:220px"></b>')}`,
            () => `${dim(null)}${RIBBON('M22 -5 C18 360 151 470 151 736', 151, 736)}${sticker('pomo-idle', LISTEN, 'left:6px;top:602px')}${sticker('doro-celebrating', SPEAK, 'left:172px;top:552px')}${bubble('Doro', 'Your week lives in Stats. Tap it below to see it.', 'left:30px;top:388px;width:330px', '<b class="tail b" style="left:244px"></b>')}`,
        ],
    },
    {
        id: 'washi',
        title: 'The washi-tape frame',
        kicker: '',
        line: 'The opening is taped into the diary like a keepsake, two strips at its corners, and the line is a paper note taped beside it, with the pair standing tall on its top edge.',
        good: ['The most stationery of the three: tape and a note are the diary’s own way of pointing.', 'The pair stand on the note like stickers on a page, large and close to what they say.', 'The tape strips make the opening read as “this one” without an arrow.'],
        watch: ['Tape and a tilted note are two more decorations around the one control (T-10).', 'At the tab step the note needs a drawn arrow, since tape can’t reach the native bar.'],
        frames: [
            () => `${dim(PRESETS)}${TAPE(2, 520, -32, c.primary)}${TAPE(318, 604, -32, c.success)}<div class="note" style="left:30px;top:338px;width:330px;transform:rotate(-1.5deg)"><div class="who">Pomo</div><p>Hi, we’re Pomo &amp; Doro! First, pick how long you’d like to focus.</p>${actions}</div>${TAPE(160, 328, 3, c.primary)}${sticker('pomo-celebrating', SPEAK, 'left:20px;top:168px')}${sticker('doro-idle', LISTEN, 'left:228px;top:214px')}`,
            () => `${dim(null)}<div class="note" style="left:24px;top:592px;width:300px;transform:rotate(1.5deg)"><div class="who">Doro</div><p>Your week lives in Stats. Tap it below to see it.</p>${actions}</div>${TAPE(10, 586, -24, c.success)}${sticker('pomo-idle', LISTEN, 'left:30px;top:470px')}${sticker('doro-celebrating', SPEAK, 'left:168px;top:424px')}<svg class="abs" style="left:118px;top:712px" width="60" height="54" fill="none" stroke="${c.paper}" stroke-width="2.6" stroke-linecap="round"><path d="M46 4 C42 24 36 36 32 48"/><path d="M23 39 L32 50 L40 39"/></svg>`,
        ],
    },
    {
        id: 'comic',
        title: 'The comic-strip duet',
        kicker: '',
        line: 'A tall two-panel strip: the speaker’s panel wide and lit, the listener’s narrow and quiet, swapping with each line. It docks at the top when the spotlight is low on the page, and above the tab bar when it points at a tab.',
        good: ['Turn-taking is unmistakable: one wide panel for whoever is talking.', 'The pair get the most room of the three, each framed in their own panel.', 'It converts most directly to the AX bottom panel (T-2).'],
        watch: ['A strip this tall can’t share the bottom with the presets, so it moves between top and bottom with the target.', 'The pair live in the strip, further from the control than in the other two.'],
        frames: [
            () => `${dim(PRESETS)}<div class="panels" style="top:96px;height:262px"><div class="panel wide"><div class="who">Pomo</div><p>Hi, we’re Pomo &amp; Doro! First, pick how long you’d like to focus.</p>${sticker('pomo-celebrating', 158, 'right:-6px;bottom:2px')}${smallActs}<b class="notch down" style="left:110px"></b></div><div class="panel narrow">${sticker('doro-idle', 112, 'left:-10px;bottom:10px;opacity:.92')}</div></div>`,
            () => `${dim(null)}<div class="panels" style="top:498px;height:262px"><div class="panel narrow">${sticker('pomo-idle', 112, 'left:-10px;bottom:10px;opacity:.92')}</div><div class="panel wide"><div class="who">Doro</div><p>Your week lives in Stats. Tap it below to see it.</p>${sticker('doro-celebrating', 158, 'right:-6px;bottom:2px')}${smallActs}</div><b class="notch down" style="left:${151 - 16 - 8}px"></b></div>`,
        ],
    },
];

const CSS = `${fontFace}
*{box-sizing:border-box;margin:0}
body{background:#EFE6E1;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif;color:${c.ink};padding:28px 16px 40px}
header{max-width:860px;margin:0 auto 18px}
.kick{font:600 11px/1 -apple-system,sans-serif;letter-spacing:.14em;color:${c.primaryInk};margin-bottom:8px;min-height:11px}
h1{font:600 30px/1.15 'Baloo 2',sans-serif;margin-bottom:8px}
header p{font-size:15px;line-height:1.45;color:${c.inkSoft};max-width:640px}
.frames{display:flex;gap:28px;justify-content:center;flex-wrap:wrap}
figure{display:flex;flex-direction:column;gap:8px;align-items:center}
figcaption{font:600 13px/1 -apple-system,sans-serif;color:${c.inkSoft}}
.phone{position:relative;width:${W}px;height:${H}px;background:${c.page};border-radius:44px;overflow:hidden;box-shadow:0 0 0 10px #2a1d22,0 18px 40px rgba(74,44,41,.25)}
.abs,.t,.stk{position:absolute}
.stk{filter:drop-shadow(1px 2px 1.5px ${c.stickerShadow})}
.time{left:30px;top:14px;font:600 16px/1 -apple-system,sans-serif}
.phase{left:24px;top:64px;font-size:17px}.phase b{font-weight:600}.phase span{color:${c.inkSoft}}
.clock{left:0;width:${W}px;top:212px;text-align:center;font:600 72px/1 'Baloo 2',sans-serif;font-variant-numeric:tabular-nums}
.field{position:absolute;background:${c.paper};border:1.5px solid ${c.edge};border-radius:22px}
.strip{left:24px;top:402px;width:342px;height:72px}.strip span{position:absolute;left:104px;top:16px;right:16px;font-size:15px;line-height:20px}
.today{left:112px;top:500px;font:600 13px/1 -apple-system,sans-serif;color:${c.inkSoft}}
.cell{position:absolute;top:490px;width:30px;height:30px;border-radius:50%;border:1.5px dashed ${c.edgeStrong}}
.presets{position:absolute;left:24px;top:540px;width:342px;height:48px;border-radius:24px;background:${c.field};border:1.5px solid ${c.edge};display:flex;padding:3px}
.seg{flex:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:${c.inkSoft};border-radius:20px}
.seg.on{background:${c.paper};border:1.5px solid ${c.edgeStrong};color:${c.ink}}
.key{left:0;width:${W}px;top:598px;text-align:center;font-size:13px;color:${c.inkSoft}}
.pill{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:28px;font-weight:600}
.primary{left:24px;top:630px;width:342px;height:56px;background:${c.primary};color:${c.onPrimary};font-size:18px}
.quiet{left:139px;top:698px;width:112px;height:44px;background:${c.paper};border:1.5px solid ${c.edge};font-size:16px}
.tabbar{position:absolute;left:20px;top:${TAB_TOP}px;width:350px;height:60px;border-radius:30px;background:rgba(255,253,251,.96);border:1.5px solid ${c.edge}}
.tab{position:absolute;top:8px;width:88px;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:600;color:${c.ink}}
.tab i{width:22px;height:22px;border-radius:7px;background:${c.ink};opacity:.85}
.tab.on{color:${c.primaryInk}}.tab.on i{background:${c.primaryInk}}
.bubble,.note,.panel{position:absolute;background:${c.paper};border:1.5px solid ${c.edge};border-radius:22px;padding:14px 16px 12px}
.note{border-radius:8px}
.who{font:600 12px/1 -apple-system,sans-serif;letter-spacing:.04em;color:${c.primaryInk};margin-bottom:6px}
.bubble p,.note p,.panel p{font-size:16px;line-height:22px}
.acts{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:14px;font-weight:600}
.skip{color:${c.inkSoft}}.next{background:${c.primary};color:${c.onPrimary};border-radius:16px;padding:7px 16px}
.tail{position:absolute;width:16px;height:16px;background:${c.paper};border:1.5px solid ${c.edge};transform:rotate(45deg)}
.tail.r{right:-9px;border-left:0;border-bottom:0}.tail.b{bottom:-9px;border-left:0;border-top:0}.tail.l{left:-9px;border-right:0;border-top:0}
.panels{position:absolute;left:16px;width:358px;display:flex;gap:8px}
.panel{position:relative;border-radius:14px;padding:12px 14px 10px}
.panel.wide{flex:1}.acts.mini{position:absolute;left:14px;bottom:12px;flex-direction:column;align-items:flex-start;gap:10px;margin:0}.panel.narrow{width:92px;background:${c.field}}
.notch{position:absolute;width:16px;height:16px;background:${c.paper};border:1.5px solid ${c.edge};transform:rotate(45deg)}
.notch.up{top:-9px;border-right:0;border-bottom:0}.notch.down{bottom:-9px;border-left:0;border-top:0}
ul{max-width:860px;margin:22px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:6px 28px;font-size:14px;line-height:1.45}
li{list-style:none}li b{display:block;font-size:12px;letter-spacing:.06em;color:${c.inkSoft};margin-bottom:4px}
@media(max-width:860px){.phone{transform:scale(.82);transform-origin:top center;margin-bottom:-150px}ul{grid-template-columns:1fr}}`;

fs.mkdirSync(new URL('.impeccable/mocks/decision/', ROOT), { recursive: true });
for (const s of STRUCTURES) {
    const frames = s.frames
        .map((f, i) => `<figure><figcaption>${i === 0 ? 'Step 1 · hello and the presets' : 'Step 4 · on to Stats'}</figcaption><div class="phone">${timer()}${f()}${tabBar()}</div></figure>`)
        .join('');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${s.title}</title><style>${CSS}</style></head><body>${SYMBOLS}
<header><div class="kick">${s.kicker}</div><h1>${s.title}</h1><p>${s.line}</p></header>
<div class="frames">${frames}</div>
<ul><li><b>WHAT IT DOES WELL</b>${s.good.map((g) => `<div>· ${g}</div>`).join('')}</li><li><b>WHAT TO WATCH</b>${s.watch.map((w) => `<div>· ${w}</div>`).join('')}</li></ul>
</body></html>`;
    fs.writeFileSync(new URL(`.impeccable/mocks/decision/tutorial-${s.id}.html`, ROOT), html);
    console.log(`tutorial-${s.id}.html`, html.length, 'B');
}
