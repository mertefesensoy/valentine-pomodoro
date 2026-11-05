// Phase 2 A3's composition round: three sketches of the pairing sheet, one per dealt structure, and
// the screens the owner's discovery answers already fixed, built from the repo's own tokens and art.
// Run: node scripts/design/pairing-sketches/build.mjs [out.html]
// It writes .impeccable/mocks/decision/pairing.html (git-ignored) unless given another path. The page
// is single-theme on purpose: it shows the diary in Strawberry Milk, and the contract covers both.
import fs from 'node:fs';

const ROOT = new URL('../../../', import.meta.url);
const palette = JSON.parse(fs.readFileSync(new URL('src/theme/palette.json', ROOT), 'utf8'));
const find = (o) => { for (const [k, v] of Object.entries(o)) { if (k === 'strawberryMilk') return v; if (v && typeof v === 'object') { const r = find(v); if (r) return r; } } return null; };
const c = find(palette).tokens;

const d2 = fs.readFileSync(new URL('art/review/d2-stats-postcard-stack.html', ROOT), 'utf8');
const fontFace = d2.match(/@font-face\{[^}]*\}/)[0];
const pose = (file) => {
    const svg = fs.readFileSync(new URL(`art/out/illustration/${file}.svg`, ROOT), 'utf8');
    return `<symbol id="${file}" viewBox="0 0 512 512" overflow="visible">${svg.slice(svg.indexOf('</title>') + 8, svg.lastIndexOf('</svg>'))}</symbol>`;
};
const SYMBOLS = `<svg width="0" height="0" style="position:absolute">${['pomo-celebrating', 'pomo-idle', 'doro-celebrating', 'doro-idle'].map(pose).join('')}</svg>`;
const sticker = (who, size, style = '') =>
    `<svg class="stk" width="${size}" height="${size}" style="overflow:visible;${style}"><use href="#${who}"/></svg>`;

const ME = 'Ece';
const PARTNER = 'Deniz';
const CODE = 'K7MP2Q';

// ── Small parts ─────────────────────────────────────────────────────────────────────────────────
const appleButton = `<div class="apple">Continue with Apple</div>`;
const close = `<div class="close" aria-hidden="true">×</div>`;
const grabberless = (title) => `<div class="sheethead"><b>${title}</b>${close}</div>`;
const cells = (text, { size = 40, dashed = 0, gap = 6, active = -1 } = {}) => {
    const chars = [...text].map((ch, i) => `<i class="cc${i === active ? ' act' : ''}" style="width:${size}px;height:${Math.round(size * 1.2)}px;font-size:${Math.round(size * 0.58)}px">${ch}</i>`);
    for (let i = 0; i < dashed; i++) chars.push(`<i class="cc dash${text.length + i === active ? ' act' : ''}" style="width:${size}px;height:${Math.round(size * 1.2)}px"></i>`);
    return `<div class="cells" style="gap:${gap}px">${chars.join('')}</div>`;
};
const twoRows = (text, opts) => {
    const a = text.slice(0, 3);
    const b = text.slice(3, 6);
    const missA = 3 - a.length;
    const missB = 3 - b.length;
    return `<div class="tworows">${cells(a, { ...opts, dashed: missA })}${cells(b, { ...opts, dashed: missB, active: -1 })}</div>`;
};
const keyboard = `<div class="kbd"><div class="kr">QWERTYUIOP</div><div class="kr">ASDFGHJKL</div><div class="kr">ZXCVBNM</div><div class="kr sp">space · return</div></div>`;
const sheet = (body, { top = 54, tint = c.page } = {}) => `<div class="sheet" style="top:${top}px;background:${tint}">${body}</div>`;
const phone = (caption, inner) => `<figure><div class="scale"><div class="phone">${inner}</div></div><figcaption>${caption}</figcaption></figure>`;

// A form sheet over the dimmed Timer, as the app presents it.
const flow = (caption, inner) => phone(caption, `<div class="dimback" style="background:#B9A5A0"></div>${inner}`);

const stripSolo = `<div class="field strip">${sticker('pomo-idle', 40, 'left:14px;top:14px')}${sticker('doro-idle', 40, 'left:44px;top:14px')}<span class="l1">Pomo &amp; Doro are ready when you are</span><span class="l2">Pair with your partner</span></div>`;
const miniSticker = (who) => sticker(who, 22, 'position:static');
const stripPaired = `<div class="field strip paired">${sticker('doro-idle', 44, 'left:14px;top:14px')}<span class="l1"><b>${PARTNER}</b></span><span class="row">${miniSticker('pomo-celebrating')}${miniSticker('doro-celebrating')}${miniSticker('pomo-celebrating')}<em>75 min today</em></span></div>`;

const timerBackdrop = (strip, cta = 'Start focus') => `
<div class="t time">9:41</div>
<div class="t phase"><b>Focus</b><span> · session 1 of 4</span></div>
<svg class="abs" style="left:0;top:0" width="390" height="400"><circle cx="195" cy="250" r="130" fill="none" stroke="${c.ringTrack}" stroke-width="15"/></svg>
<div class="t clock">25:00</div>
${strip}
<div class="t today">Today</div><div class="cell" style="left:170px"></div><div class="cell" style="left:206px"></div>
<div class="presets"><div class="seg on">25/5</div><div class="seg">50/10</div><div class="seg">90/20</div><div class="seg">Custom</div></div>
<div class="pill primary" style="left:24px;right:24px;top:616px;position:absolute">${cta}</div>
<div class="pill quiet" style="left:139px;top:686px;position:absolute">Skip</div>
<div class="tabbar"><span class="on">Timer</span><span>Stats</span><span>Settings</span><span>Notes</span></div>`;

// ── The fixed frames, from the owner's answers ──────────────────────────────────────────────────
const FIXED = [
    phone('Timer, solo and idle. The line leaves as soon as a session starts.', timerBackdrop(stripSolo)),
    phone('Timer, paired: their name, today’s stickers and minutes.', timerBackdrop(stripPaired)),
    phone('Their day, opened from the strip.', `${timerBackdrop(stripPaired)}<div class="dimback"></div>${sheet(`${grabberless(PARTNER)}
        <div class="pad">
          <div class="post">
            <div class="date">Thursday, 5 November</div>
            <div class="celllist">${sticker('pomo-celebrating', 40, 'position:static')}${sticker('doro-celebrating', 40, 'position:static')}${sticker('pomo-celebrating', 40, 'position:static')}<i class="dc"></i></div>
            <div class="sum">3 sessions · 75 min · goal 100 min</div>
          </div>
          <div class="fresh">Updated 12 minutes ago</div>
          <div class="group"><div class="rowa">Write ${PARTNER} a note</div></div>
          <div class="groupfoot">It appears after their next focus.</div>
        </div>`, { top: 260 })}`),
    phone('A note waiting, when Show love notes is off.', `${timerBackdrop(stripPaired)}<div class="dimback"></div>${sheet(`${grabberless(PARTNER)}
        <div class="pad">
          <div class="post">
            <div class="date">Thursday, 5 November</div>
            <div class="empty">Nothing yet today</div>
          </div>
          <div class="fresh">Updated 2 hours ago</div>
          <div class="group"><div class="rowa">A note from ${PARTNER} is waiting</div><div class="hair"></div><div class="rowa">Write ${PARTNER} a note</div></div>
        </div>`, { top: 300 })}`),
    phone('Settings: your partner, your account, and the timings switch.', `
        <div class="t time">9:41</div>
        <div class="tabtitle">Settings</div>
        <div class="setlist">
          <div class="ghead">Your partner</div>
          <div class="group"><div class="rowk"><span>${PARTNER}</span><em>Paired 5 Nov</em></div><div class="hair"></div><div class="rowd">Unpair</div></div>
          <div class="ghead">Account</div>
          <div class="group"><div class="rowk"><span>Name</span><em>${ME}</em></div><div class="hair"></div><div class="rowk"><span>Sign-in</span><em>Using Sign in with Apple</em></div><div class="hair"></div><div class="rowa">Download my data</div><div class="hair"></div><div class="rowd">Delete account</div></div>
          <div class="ghead">Privacy</div>
          <div class="group"><div class="rowk"><span>Share start-up timings</span><i class="sw"></i></div></div>
          <div class="gfoot">Sends how long the app took to open, your iPhone model, iOS version and app build. Nothing that identifies you.</div>
        </div>
        <div class="tabbar"><span>Timer</span><span>Stats</span><span class="on">Settings</span><span>Notes</span></div>`),
];

// ── The three dealt structures ──────────────────────────────────────────────────────────────────
const WHY = 'To pair, you each need an account. It keeps only your name and what you choose to share. The timer works without it.';

const spread = (left, right) => `<div class="spread"><div class="page lp">${left}</div><div class="page rp">${right}</div></div>`;

const STRUCTURES = [
    {
        id: 'pages',
        kicker: 'THE ROLL',
        title: 'Facing pages',
        line: 'The sheet is the diary’s own open spread, so the flow is the same two pages the Timer’s Facing Pages layout already draws. Your code sits on your page, and the space for theirs sits on the facing page: both routes are visible at once, with no “invite or join” question first. Confirming closes the two pages into the Same Page mark, so the signature morph is where the flow was always heading.',
        good: ['No choice to get wrong: whoever got the code just types on the right page.', 'It leads straight into the morph, with nothing to swap.', 'It reuses the Facing Pages layout people already know.'],
        watch: ['Each page is about 175 pt wide, so the code runs in two rows of three.', 'At AX sizes the pages stack, as Facing Pages already does.'],
        frames: [
            flow('1 · Why, then Apple’s own button', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                ${spread(`<div class="who">You</div>${sticker('pomo-idle', 72, 'position:static')}`, `<div class="who">Your partner</div><i class="dc big"></i>`)}
                <p class="why">${WHY}</p>${appleButton}<div class="link">Not now</div></div>`)),
            flow('2 · Your code on your page, theirs on the facing one', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                ${spread(`<div class="who">You</div>${twoRows(CODE, { size: 40 })}<div class="mini">Lasts 24 hours</div>`, `<div class="who">Your partner</div>${twoRows('', { size: 40 })}<div class="mini">Tap to type their code</div>`)}
                <div class="pill primary">Send my code</div><div class="link">Make a new code</div></div>`)),
            flow('3 · Typing their code: the other page lifts', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                ${spread(`<div class="who">You</div>${twoRows(CODE, { size: 40 })}`, `<div class="who">Your partner</div>${twoRows('H4T', { size: 40 })}`)}
                </div>${keyboard}`)),
            flow('4 · Who it is, before anything happens', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                ${spread(`<div class="who">${ME}</div>${sticker('pomo-celebrating', 72, 'position:static')}`, `<div class="who">${PARTNER}</div>${sticker('doro-celebrating', 72, 'position:static')}`)}
                <p class="why center">Share your day and write notes to each other?</p><div class="pill primary">Pair with ${PARTNER}</div><div class="link">That’s not them</div></div>`)),
        ],
    },
    {
        id: 'list',
        kicker: '',
        title: 'One grouped list',
        line: 'The iOS Settings way: the sheet is an inset grouped list, your code one group and theirs the next, with the native alert for the confirmation. Nothing to learn, and the fewest new parts to build. The morph then plays full-screen, on its own, after the alert.',
        good: ['The fastest to read and the cheapest to build.', 'It works at every text size with the list parts that already handle Turkish at AX5.', 'The system alert is the most trustworthy place to confirm a person.'],
        watch: ['It has the least feeling of the three, for the moment the whole version exists for.', 'The morph arrives from nowhere, after an alert.'],
        frames: [
            flow('1 · Why, then Apple’s own button', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                <div class="pairhead">${sticker('pomo-idle', 64, 'position:static')}${sticker('doro-idle', 64, 'position:static;margin-left:-16px')}</div>
                <p class="why center">${WHY}</p>${appleButton}<div class="link">Not now</div></div>`)),
            flow('2 · Your code, then theirs', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                <div class="ghead">Your code</div>
                <div class="group"><div class="rowcode">${CODE}</div><div class="hair"></div><div class="rowa">Send my code</div><div class="hair"></div><div class="rowa">Make a new code</div></div>
                <div class="gfoot">Lasts 24 hours. Your partner types it into their phone.</div>
                <div class="ghead">Their code</div>
                <div class="group"><div class="rowk"><span class="ph">Type their code</span></div></div>
                <div class="gfoot">You’ll see who it is before you pair.</div></div>`)),
            flow('3 · Typing their code', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                <div class="ghead">Their code</div>
                <div class="group"><div class="rowcode">H4T<u>|</u></div></div>
                <div class="gfoot">You’ll see who it is before you pair.</div></div>${keyboard}`)),
            flow('4 · Who it is: the system’s alert', `${sheet(`${grabberless('Pair with your partner')}<div class="pad">
                <div class="ghead">Their code</div>
                <div class="group"><div class="rowcode">H4TW9B</div></div></div>`)}<div class="dimback" style="top:0"></div>
                <div class="alert"><b>Pair with ${PARTNER}?</b><p>You’ll share your day and can write notes to each other.</p><div class="abtn"><span>Not now</span><span class="def">Pair</span></div></div>`),
        ],
    },
    {
        id: 'postcard',
        kicker: '',
        title: 'The postcard',
        line: 'Your code is a postcard you send, the same paper as Stats’ postcards, tilted the same 0.6°. It’s written to your partner and signed with your name. Getting one, you fill its six cells, and it turns over to show who it’s from. For a long-distance couple, it says what’s happening: you’re writing to someone far away.',
        good: ['The warmest of the three, and the most about these two people.', 'Showing who it’s from is the card’s natural reveal, not a separate step.', 'One press of the stamp can be this screen’s one delight, the sticker placement.'],
        watch: ['“Send” and “I got one” are two separate paths, so one question comes first.', 'A postcard is a new object here, though made of known parts. It adds a bit more to draw and test.'],
        frames: [
            flow('1 · Why, then Apple’s own button', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                <div class="card tilt"><div class="stamp">${sticker('pomo-idle', 44, 'position:static')}${sticker('doro-idle', 44, 'position:static;margin-left:-12px')}</div><div class="lines"><i></i><i></i><i></i></div></div>
                <p class="why center">${WHY}</p>${appleButton}<div class="link">Not now</div></div>`)),
            flow('2 · A postcard to send', sheet(`${grabberless('Pair with your partner')}<div class="pad">
                <div class="card tilt"><div class="stamp">${sticker('pomo-celebrating', 44, 'position:static')}${sticker('doro-celebrating', 44, 'position:static;margin-left:-12px')}</div>
                  <div class="to">To my partner,</div><div class="body">Pair with me on the diary.</div>${cells(CODE, { size: 38, gap: 5 })}<div class="from">${ME} · lasts 24 hours</div></div>
                <div class="pill primary">Send my postcard</div><div class="link">I got a postcard</div></div>`)),
            flow('3 · One you got: six cells to fill', sheet(`${grabberless('I got a postcard')}<div class="pad">
                <div class="card tilt alt"><div class="to">Type the code on it</div>${cells('H4T', { size: 38, gap: 5, dashed: 3 })}</div></div>${keyboard}`)),
            flow('4 · It turns over: who it’s from', sheet(`${grabberless('I got a postcard')}<div class="pad">
                <div class="card tilt alt"><div class="stamp">${sticker('doro-celebrating', 44, 'position:static')}</div>
                  <div class="to">From ${PARTNER}</div><div class="body">Share your day and write notes to each other?</div></div>
                <div class="pill primary">Pair with ${PARTNER}</div><div class="link">That’s not them</div></div>`)),
        ],
    },
];

const DECLINED = [
    ['The split-flap board', 'Lost on both counts: a rail concourse’s board is a costume on a diary.', 'Kept: one fixed cell per character, so a code never shifts as it’s typed.'],
    ['The vertical feed', 'Lost: one thing per screen fits a feed, and there’s no next item here.', 'Kept: one job on each screen of the flow.'],
    ['The timetable, the reference page, the transit map, Metro tiles', 'Lost on both counts: each brings a world of its own to a screen that has one.', ''],
];

const SUMMARY = `<section>
  <div class="kick">FOR YOUR APPROVAL</div>
  <h2>The brief and the contract, in plain words</h2>
  <p>You chose Facing pages. This is what I’d build from it. The full text is in the repo, in the two surface briefs.</p>
  <div class="summary">
    <div><h3>The pairing sheet</h3><ul>
      <li>Your code on your page, theirs on the facing page, so <b>nobody has to choose “invite” or “join”</b>.</li>
      <li>Apple’s own button, after one sentence saying why. Cancelling loses nothing, and you can leave at any step.</li>
      <li>Type or paste their code; at six characters it <b>checks by itself and shows who it is</b>. Nothing happens until you press Pair.</li>
      <li>Mistakes show on the page, kindly, never in an alert: wrong code, expired, your own, too many tries, offline.</li>
      <li>Pressing Pair <b>closes the two pages into the logo</b>: once per person, skippable, a fade under Reduce Motion. Then “You and Deniz are on the same page.”</li>
    </ul></div>
    <div><h3>Your partner’s day</h3><ul>
      <li>The strip under the ring keeps its size and place, so <b>nothing moves when you pair</b>.</li>
      <li>It shows the last known values and when they updated, and <b>never waits on the network</b>. No row for today says “Nothing yet today”, never yesterday’s.</li>
      <li>No comparison, no “behind”, no red anywhere on it.</li>
      <li>A note appears once, after your next focus, in the love-note sheet you know. With Show love notes off, it waits on their card.</li>
      <li>If they unpair or delete their account, one quiet line on the strip tells you. Your own stats never change.</li>
    </ul></div>
    <div><h3>Settings</h3><ul>
      <li><b>Your partner:</b> Pair, or their name and Unpair.</li>
      <li><b>Account:</b> your name, “Using Sign in with Apple”, Download my data, Delete account. <b>No sign-out</b> in 1.5.0, since there’s nowhere else to sign in to.</li>
      <li><b>Privacy:</b> the start-up timings switch. Reset settings leaves it alone.</li>
    </ul></div>
    <div><h3>What Apple’s guidelines changed</h3><ul>
      <li>Apple’s button and Send my code <b>stay on screen at the largest text size</b>, even in Turkish.</li>
      <li>Writing a note <b>swaps inside its sheet</b>, because Apple says one sheet at a time.</li>
      <li>The whole strip is one button, so it’s easy to hit.</li>
      <li>VoiceOver spells the code out and hears every step and error.</li>
      <li>Rated Good, with nothing Critical. All nine findings are in the record.</li>
    </ul></div>
    <div><h3>Two small additions to the design rules</h3><ul>
      <li>The morph is a <b>third once-only exception</b> to the “one bounce” rule, after the welcome and the tour.</li>
      <li>The code uses the <b>system font</b> in fixed cells, not Baloo 2, whose uses stay as they are.</li>
    </ul></div>
  </div>
</section>`;

const CSS = `${fontFace}
:root{--ground:#EFE6E1;--ink:${c.ink};--soft:${c.inkSoft};--accent:${c.primaryInk};color-scheme:light}
*{box-sizing:border-box;margin:0}
body{background:var(--ground);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif;padding-block:28px 56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:44px}
section{min-width:0}
h1{font:600 34px/1.15 'Baloo 2',-apple-system,sans-serif;margin-bottom:8px;text-wrap:balance}
h2{font:600 26px/1.2 'Baloo 2',-apple-system,sans-serif;margin-bottom:6px;text-wrap:balance}
.lede{font-size:16px;line-height:1.5;color:var(--soft);max-width:68ch}
.kick{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--accent);margin-bottom:6px;min-height:13px}
section>p{font-size:15px;line-height:1.5;color:var(--soft);max-width:72ch}
.frames{display:flex;gap:18px;overflow-x:auto;padding:16px 4px 14px;margin-top:6px;scroll-snap-type:x proximity}
figure{flex:none;width:257px;display:flex;flex-direction:column;gap:10px;scroll-snap-align:start}
figcaption{font-size:13px;line-height:1.35;font-weight:600;color:var(--soft)}
.scale{width:257px;height:556px}
.phone{position:relative;width:390px;height:844px;background:${c.page};border-radius:44px;overflow:hidden;box-shadow:0 0 0 9px #2a1d22;transform:scale(.659);transform-origin:top left;margin-left:6px;margin-top:6px}
.notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px 28px;margin-top:6px;font-size:14px;line-height:1.45}
.notes h3{font-size:13px;margin-bottom:4px}
.notes ul{padding-left:18px;color:var(--soft);display:grid;gap:4px}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px 32px;margin-top:10px;font-size:15px;line-height:1.5}
.summary h3{font-size:14px;margin-bottom:4px}
.summary ul{padding-left:18px;display:grid;gap:5px;color:var(--soft)}
.summary ul b{color:var(--ink);font-weight:600}
.declined{display:grid;gap:8px;font-size:14px;line-height:1.45;color:var(--soft)}
.declined b{color:var(--ink);font-weight:600}
.abs,.t,.stk{position:absolute}
.stk{filter:drop-shadow(1px 2px 1.5px ${c.stickerShadow})}
.time{left:30px;top:16px;font:600 16px/1 -apple-system,sans-serif;color:${c.ink}}
.phase{left:24px;top:64px;font-size:17px;color:${c.ink}}.phase b{font-weight:600}.phase span{color:${c.inkSoft}}
.clock{left:0;width:390px;top:212px;text-align:center;font:600 72px/1 'Baloo 2',sans-serif;font-variant-numeric:tabular-nums;color:${c.ink}}
.field{position:absolute;background:${c.paper};border:1.5px solid ${c.edge};border-radius:22px}
.strip{left:24px;top:402px;width:342px;height:72px;color:${c.ink}}
.strip .l1{position:absolute;left:96px;top:13px;right:12px;font-size:14px;line-height:19px;white-space:nowrap;overflow:hidden}
.strip .l2{position:absolute;left:96px;top:36px;font-size:15px;line-height:20px;font-weight:600;color:${c.primaryInk}}
.strip.paired .l1{left:70px;font-size:17px}.strip.paired .row{position:absolute;left:70px;top:38px;display:flex;align-items:center;gap:2px}
.strip.paired em{font-style:normal;font-size:14px;color:${c.inkSoft};margin-left:8px}
.today{left:112px;top:500px;font:600 13px/1 -apple-system,sans-serif;color:${c.inkSoft}}
.cell{position:absolute;top:490px;width:30px;height:30px;border-radius:50%;border:1.5px dashed ${c.edgeStrong}}
.presets{position:absolute;left:24px;top:540px;width:342px;height:48px;border-radius:24px;background:${c.field};border:1.5px solid ${c.edge};display:flex;padding:3px}
.seg{flex:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:${c.inkSoft};border-radius:20px}
.seg.on{background:${c.paper};color:${c.ink};border:1.5px solid ${c.edgeStrong}}
.pill{display:flex;align-items:center;justify-content:center;border-radius:999px;font-weight:600}
.pill.primary{background:${c.primary};color:${c.onPrimary};height:56px;font-size:18px}
.pill.quiet{background:${c.paper};color:${c.ink};border:1.5px solid ${c.edge};height:44px;width:112px;font-size:16px}
.tabbar{position:absolute;left:0;right:0;bottom:0;height:80px;background:${c.paper};border-top:1px solid ${c.edge};display:flex;justify-content:space-around;padding-top:14px;font-size:11px;color:${c.inkSoft}}
.tabbar .on{color:${c.primaryInk};font-weight:600}
.dimback{position:absolute;inset:0;background:${c.scrim}}
.sheet{position:absolute;left:0;right:0;bottom:0;border-radius:22px 22px 0 0;display:flex;flex-direction:column;color:${c.ink}}
.sheethead{height:56px;display:flex;align-items:center;justify-content:center;position:relative;font-size:17px}.sheethead b{font-weight:600}
.close{position:absolute;right:12px;top:10px;width:36px;height:36px;border-radius:50%;background:${c.field};display:flex;align-items:center;justify-content:center;font-size:20px;color:${c.inkSoft}}
.pad{padding:8px 16px 0;display:flex;flex-direction:column;gap:14px}
.why{font-size:17px;line-height:23px;color:${c.ink}}.why.center{text-align:center}
.apple{height:56px;border-radius:999px;background:#000;color:#fff;font-size:18px;font-weight:600;display:flex;align-items:center;justify-content:center}
.link{height:44px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;color:${c.primaryInk}}
.spread{display:flex;gap:8px}
.page{flex:1;background:${c.paper};border:1.5px solid ${c.edge};min-height:230px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;gap:10px}
.page.lp{border-radius:22px 8px 8px 22px;transform:rotate(-1deg);transform-origin:bottom right}
.page.rp{border-radius:8px 22px 22px 8px;transform:rotate(1deg);transform-origin:bottom left}
.who{font-size:13px;font-weight:600;color:${c.inkSoft}}
.mini{font-size:13px;line-height:18px;color:${c.inkSoft};text-align:center}
.dc{display:inline-block;width:40px;height:40px;border-radius:50%;border:1.5px dashed ${c.edgeStrong}}
.dc.big{width:72px;height:72px}
.tworows{display:grid;gap:6px;justify-items:center}
.cells{display:flex;justify-content:center}
.cc{display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:600;font-variant-numeric:tabular-nums;background:${c.page};border:1.5px solid ${c.edge};border-radius:8px;color:${c.ink}}
.cc.dash{background:transparent;border:1.5px dashed ${c.edgeStrong}}
.kbd{position:absolute;left:0;right:0;bottom:0;height:291px;background:#D1D4DB;padding:12px 6px;display:grid;gap:12px;align-content:start;font-size:21px;color:#111}
.kr{display:flex;justify-content:center;letter-spacing:13px}.kr.sp{letter-spacing:0;font-size:15px;color:#555}
.pairhead{display:flex;justify-content:center;padding-top:6px}
.ghead{font-size:13px;font-weight:600;color:${c.inkSoft};padding:0 16px;margin-bottom:-8px}
.gfoot{font-size:13px;line-height:18px;color:${c.inkSoft};padding:0 16px;margin-top:-6px}
.groupfoot{font-size:13px;line-height:18px;color:${c.inkSoft};padding:0 16px;margin-top:-8px}
.group{background:${c.paper};border:1.5px solid ${c.edge};border-radius:14px}
.hair{height:1px;background:${c.edge};margin-left:16px}
.rowa,.rowd,.rowk{min-height:44px;padding:0 16px;display:flex;align-items:center;font-size:17px}
.rowa{color:${c.primaryInk}}.rowd{color:${c.dangerInk}}
.rowk{justify-content:space-between}.rowk em{font-style:normal;color:${c.inkSoft}}.rowk .ph{color:${c.inkSoft}}
.rowcode{height:64px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:600;letter-spacing:6px;font-variant-numeric:tabular-nums}
.rowcode u{text-decoration:none;font-weight:400;color:${c.primaryInk}}
.sw{width:51px;height:31px;border-radius:999px;background:${c.primary};position:relative;display:block}.sw::after{content:'';position:absolute;right:2px;top:2px;width:27px;height:27px;border-radius:50%;background:#fff}
.alert{position:absolute;left:55px;top:330px;width:280px;background:#F5F0EE;border-radius:18px;text-align:center;padding-top:18px;font-size:15px;line-height:20px;color:#000}
.alert b{font-size:17px;display:block;margin-bottom:4px}.alert p{padding:0 16px 16px}
.abtn{display:flex;border-top:1px solid #cfc8c5;height:44px;align-items:center;color:#0a60d0}.abtn span{flex:1}.abtn .def{font-weight:600;border-left:1px solid #cfc8c5;line-height:44px}
.card{background:${c.paper};border:1.5px solid ${c.edge};border-radius:22px;padding:18px 16px;display:flex;flex-direction:column;gap:12px;position:relative;min-height:200px}
.tilt{transform:rotate(-.6deg)}.tilt.alt{transform:rotate(.6deg)}
.stamp{position:absolute;right:12px;top:10px;display:flex;padding:6px;border:1.5px dashed ${c.edgeStrong};border-radius:8px}
.lines{display:grid;gap:18px;padding-top:52px}.lines i{height:1.5px;background:${c.edge};display:block}
.to{font-size:17px;font-weight:600;padding-right:90px}
.body{font-size:15px;line-height:20px;color:${c.inkSoft};padding-right:90px;min-height:40px}
.from{font-size:13px;color:${c.inkSoft}}
.post{background:${c.paper};border:1.5px solid ${c.edge};border-radius:22px;padding:12px 16px;display:grid;gap:10px}
.date{font-size:13px;font-weight:600;color:${c.inkSoft}}
.celllist{display:flex;gap:2px;align-items:center}
.sum{font-size:15px;color:${c.ink};font-variant-numeric:tabular-nums}
.empty{font-size:17px;color:${c.inkSoft};padding:8px 0}
.fresh{font-size:13px;color:${c.inkSoft};padding:0 16px;margin-top:-6px}
.tabtitle{position:absolute;left:24px;top:52px;font:600 34px/42px 'Baloo 2',sans-serif}
.setlist{position:absolute;left:16px;right:16px;top:102px;display:grid;gap:14px}
`;

const page = `<title>Pairing Compositions</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${CSS}</style>
${SYMBOLS}
<main>
<header>
  <h1>Pairing, partner’s day and account: the sketches</h1>
  <p class="lede">For Valentine Pomodoro 1.5.0. These are composition sketches at a phone’s size, in Strawberry Milk, built from the app’s real colours and art. The words are drafts; Turkish and final copy go through your copy proof. Scroll each row sideways. Example names: ${ME} and ${PARTNER}.</p>
</header>
<section>
  <div class="kick">FIXED BY YOUR ANSWERS</div>
  <h2>What doesn’t change, whichever flow you pick</h2>
  <p>You chose the Timer’s strip while idle plus Settings, name and stickers on the strip once paired, and a note that waits on their card when Show love notes is off. These frames show that. Tell me if any is wrong.</p>
  <div class="frames">${FIXED.join('')}</div>
</section>
${SUMMARY}
${STRUCTURES.map((s) => `<section>
  <div class="kick">${s.kicker || '&nbsp;'}</div>
  <h2>${s.title}</h2>
  <p>${s.line}</p>
  <div class="frames">${s.frames.join('')}</div>
  <div class="notes"><div><h3>What it gets right</h3><ul>${s.good.map((x) => `<li>${x}</li>`).join('')}</ul></div><div><h3>What to watch</h3><ul>${s.watch.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>
</section>`).join('')}
<section>
  <div class="kick">ALSO DEALT, AND SET ASIDE</div>
  <div class="declined">${DECLINED.map(([a, b, k]) => `<p><b>${a}.</b> ${b} ${k}</p>`).join('')}</div>
</section>
</main>`;

const out = process.argv[2] ? process.argv[2] : new URL('.impeccable/mocks/decision/pairing.html', ROOT);
if (!process.argv[2]) fs.mkdirSync(new URL('.impeccable/mocks/decision/', ROOT), { recursive: true });
fs.writeFileSync(out, page);
console.log('wrote', String(out), page.length, 'bytes');
