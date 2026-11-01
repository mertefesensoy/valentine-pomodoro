// tour-motion.js — the tour kit's motion, as the D5 review pages play it (Phase 1 D5 assets).
//
// A browser script, inlined by scripts/art/review-d5-poses.mjs and scripts/sound/review-d5-voices.mjs
// right after `const KIT = <art/src/tour/expressions.json>;`, beside an inline <svg> of <symbol>s:
// one per layer (id = the layer's id) and, for the die-cut edge and the hands, a shadow copy
// drawn in currentColor (id + '-s'). It defines window.TourMotion.
//
// It doubles as a reference for the tutorial's builder: a sticker's whole pose is a pure function
// of the clock and of its last change, so the same numbers (KIT.motion) drive one shared value per
// sticker on the UI thread. Under Reduce Motion every change is a swap: no squash, breath, blink,
// talking loop or gesture, and a held tilt or stretch applies at once.
(function () {
    const M = KIT.motion;
    const EXPR = Object.fromEntries(KIT.expressions.map((e) => [e.id, e]));
    const NS = 'http://www.w3.org/2000/svg';
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const smooth = (u) => u * u * (3 - 2 * u);
    const lerp = (a, b, u) => a + (b - a) * u;
    const inWindow = (p, [a, b]) => clamp((p - a) / (b - a), 0, 1);
    const hold = (e) => ({ rotate: e?.hold?.rotate ?? 0, sx: e?.hold?.sx ?? 1, sy: e?.hold?.sy ?? 1 });
    const rand = ([a, b]) => a + Math.random() * (b - a);
    const TALK_MOUTHS = ['talk-small', 'talk-wide', 'talk-round'];

    /** The change's height scale at progress p (0–1): smoothstep between M.change.keys. */
    function squash(p) {
        const k = M.change.keys;
        for (let i = 1; i < k.length; i++) {
            if (p <= k[i].at) return lerp(k[i - 1].sy, k[i].sy, smooth((p - k[i - 1].at) / (k[i].at - k[i - 1].at)));
        }
        return 1;
    }

    /** The wave's angle t ms into the gesture: 2.5 swings between −16° and +12°, then home. */
    function waveAngle(t) {
        const w = M.wave;
        const mid = (w.degrees[0] + w.degrees[1]) / 2;
        const amp = (w.degrees[1] - w.degrees[0]) / 2;
        const length = w.periodMs * w.cycles;
        if (t < 0) return 0;
        if (t < length) return mid - amp * Math.sin((2 * Math.PI * t) / w.periodMs);
        return lerp(mid, 0, smooth(clamp((t - length) / 160, 0, 1)));
    }

    /**
     * The write-on of `text` for `who`: when each character shows, and when each babble syllable
     * starts. One character every charMs; a pause after a comma, or after a stop that isn't the
     * last character; a syllable on the 1st letter and every k-th letter after it, the count
     * starting again after each pause. The last syllable is the line's end: 'up' for a question,
     * 'down' otherwise.
     */
    function writeOn(text, who) {
        const t = M.talk;
        const k = t.lettersPerSyllable[who];
        const chars = [];
        const syllables = [];
        let clock = 0;
        let letters = 0;
        [...text].forEach((c, i, all) => {
            chars.push(clock);
            if (/\p{L}/u.test(c)) {
                if (letters % k === 0) syllables.push({ t: clock, slot: k * t.charMs });
                letters++;
            }
            clock += t.charMs;
            if (/[,;:]/.test(c)) { clock += t.pauseMs.comma; letters = 0; }
            else if (/[.!?…]/.test(c) && i < all.length - 1) { clock += t.pauseMs.stop; letters = 0; }
        });
        if (syllables.length) syllables[syllables.length - 1].end = /\?\s*$/.test(text) ? 'up' : 'down';
        return { chars, syllables, length: clock };
    }

    let reduce = false;
    const stickers = new Set();

    function node(name, attrs, parent) {
        const n = document.createElementNS(NS, name);
        // A <use> of a symbol is sized to the whole viewport unless told otherwise: pin it to the artboard.
        if (name === 'use') { n.setAttribute('width', '512'); n.setAttribute('height', '512'); }
        for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
        if (parent) parent.appendChild(n);
        return n;
    }

    const eyesOf = (e, side) => (e.eyes === 'look' ? `look-${side}` : e.eyes);

    /**
     * One sticker, `px` points wide: the layers stacked in KIT.order inside one group that takes
     * the whole transform about the feet, with the lift drawn as the app's Sticker draws it (the
     * silhouette three times, 1 pt right and 2 pt down, 0, 1 and 2 pt wider). Two face slots let
     * the old face fade out while the new one fades in.
     */
    function create(who, px, opts = {}) {
        const svg = node('svg', { viewBox: '0 0 512 512', width: px, height: px, class: 'stk', 'aria-hidden': 'true', overflow: 'visible' });
        const unit = 512 / px;
        const whole = node('g', {}, svg);
        const lift = node('g', { class: 'lift', transform: `translate(${unit} ${2 * unit})` }, whole);
        const reach = (parent, href) => [0, 1, 2].map((r) => node('use', { href, class: 'sl', stroke: r ? 'currentColor' : 'none', 'stroke-width': r * 2 * unit, 'stroke-linejoin': 'round' }, parent));
        reach(lift, `#${who}-tour-body-cut-s`);
        const handLift = node('g', {}, lift);
        const handLiftUses = reach(handLift, '');
        node('use', { href: `#${who}-tour-body-cut` }, whole);
        const hand = node('g', {}, whole);
        const handUse = node('use', {}, hand);
        node('use', { href: `#${who}-tour-body-fill` }, whole);
        const slot = () => {
            const g = node('g', {}, whole);
            return { g, eyes: node('use', {}, g), mouth: node('use', {}, g) };
        };
        const s = {
            who, px, svg, whole, hand, handUse, handLift, handLiftUses,
            old: slot(), cur: slot(),
            expr: opts.expr ?? 'rest', side: opts.side ?? 'right', prev: null, prevSide: null,
            changedAt: -1e9, phase: Math.random() * 1e4, blinks: [], nextBlink: 0, talk: null,
            repeat: opts.repeat ?? 0, onScreen: true,
        };
        setFace(s.cur, s, EXPR[s.expr], s.side);
        s.old.g.style.display = 'none';
        stickers.add(s);
        return s;
    }

    function setFace(slot, s, e, side) {
        slot.eyes.setAttribute('href', `#${s.who}-tour-eyes-${eyesOf(e, side)}`);
        slot.mouth.setAttribute('href', `#${s.who}-tour-mouth-${e.mouth}`);
        slot.eyesBase = `#${s.who}-tour-eyes-${eyesOf(e, side)}`;
        slot.mouthBase = `#${s.who}-tour-mouth-${e.mouth}`;
    }

    /** Changes the expression: the current face moves to the old slot and the new one crosses in. */
    function set(s, id, { side, now = performance.now(), animate = true } = {}) {
        if (id === s.expr && (side ?? s.side) === s.side) return;
        s.prev = s.expr;
        s.prevSide = s.side;
        s.expr = id;
        if (side) s.side = side;
        s.changedAt = animate ? now : now - 1e6;
        s.old.eyes.setAttribute('href', s.cur.eyes.getAttribute('href'));
        s.old.mouth.setAttribute('href', s.cur.mouth.getAttribute('href'));
        setFace(s.cur, s, EXPR[id], s.side);
        s.blinks = [];
        s.nextBlink = 0;
        if (id !== 'talking') s.talk = null;
    }

    /** Starts the talking loop for a line; `mouths` (optional) gives each syllable's mouth. */
    function say(s, text, now = performance.now(), mouths) {
        const w = writeOn(text, s.who);
        let last = '';
        const shapes = w.syllables.map((syl, i) => {
            if (mouths?.[i]) return (last = mouths[i]);
            const pool = TALK_MOUTHS.filter((m) => m !== last);
            return (last = pool[Math.floor(Math.random() * pool.length)]);
        });
        s.talk = { start: now, syllables: w.syllables.map((syl, i) => ({ ...syl, mouth: shapes[i] })), length: w.length };
        return w;
    }

    function handState(s, e, now) {
        const since = now - s.changedAt;
        const p = reduce ? 1 : clamp(since / M.change.totalMs, 0, 1);
        const prevHand = EXPR[s.prev]?.hand;
        // The hand grows from its root (hidden in the fill) over the change, or shrinks back into it.
        if (e.hand) return { kind: e.hand, side: s.side, grow: reduce ? 1 : smooth(inWindow(p, M.change.faceIn)) };
        if (prevHand && p < 1) return { kind: prevHand, side: s.prevSide, grow: 1 - smooth(inWindow(p, M.change.faceOut)) };
        return null;
    }

    function pose(s, now) {
        const e = EXPR[s.expr];
        const [fx, fy] = KIT.feet[s.who];
        const since = now - s.changedAt;
        const p = reduce ? 1 : clamp(since / M.change.totalMs, 0, 1);
        const hp = reduce ? 1 : smooth(clamp(since / M.hold.ms, 0, 1));
        const h0 = hold(EXPR[s.prev]);
        const h1 = hold(e);
        const talking = !reduce && s.talk && now - s.talk.start < s.talk.length;
        const sc = reduce || p >= 1 ? 1 : squash(p);
        const amp = reduce ? 0 : M.breath.amplitude * (talking ? M.breath.talkingFactor : 1);
        const b = 1 + amp * Math.sin((2 * Math.PI * (now + s.phase)) / M.breath.periodMs[s.who]);
        const rot = lerp(h0.rotate, h1.rotate, hp);
        const sy = lerp(h0.sy, h1.sy, hp) * sc * b;
        const sx = lerp(h0.sx, h1.sx, hp) / (sc * b);
        s.whole.setAttribute('transform', `translate(${fx} ${fy}) rotate(${rot.toFixed(3)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-fx} ${-fy})`);

        // The face crossing in.
        if (p < 1) {
            s.old.g.style.display = '';
            s.old.g.style.opacity = String(1 - smooth(inWindow(p, M.change.faceOut)));
            s.cur.g.style.opacity = String(smooth(inWindow(p, M.change.faceIn)));
        } else {
            s.old.g.style.display = 'none';
            s.cur.g.style.opacity = '1';
        }

        // The blink: open-eyed faces only, never mid-change.
        let blinking = false;
        if (!reduce && e.blinks && p >= 1) {
            if (!s.nextBlink) s.nextBlink = now + rand(M.blink.intervalMs);
            if (now >= s.nextBlink) {
                const b0 = s.nextBlink;
                s.blinks = [[b0, b0 + M.blink.closedMs]];
                if (Math.random() < M.blink.doubleChance) {
                    const b1 = b0 + M.blink.closedMs + M.blink.doubleGapMs;
                    s.blinks.push([b1, b1 + M.blink.closedMs]);
                }
                s.nextBlink = s.blinks[s.blinks.length - 1][1] + rand(M.blink.intervalMs);
            }
            blinking = s.blinks.some(([a, z]) => now >= a && now < z);
        }
        const eyes = blinking ? `#${s.who}-tour-eyes-blink` : s.cur.eyesBase;
        if (s.cur.eyes.getAttribute('href') !== eyes) s.cur.eyes.setAttribute('href', eyes);

        // The talking mouth: each syllable's shape for the first part of its slot, the smile between.
        let mouth = s.cur.mouthBase;
        if (talking) {
            const t = now - s.talk.start;
            const syl = s.talk.syllables.find((x) => t >= x.t && t < x.t + x.slot * M.talk.openShare);
            mouth = syl ? `#${s.who}-tour-mouth-${syl.mouth}` : `#${s.who}-tour-mouth-smile`;
        }
        if (s.cur.mouth.getAttribute('href') !== mouth) s.cur.mouth.setAttribute('href', mouth);

        // The hand: grown from its root, then waving or nudging.
        const h = handState(s, e, now);
        if (!h) {
            s.hand.style.display = 'none';
            s.handLift.style.display = 'none';
        } else {
            const key = `${h.kind}-${h.side}`;
            const href = `#${s.who}-tour-hand-${key}`;
            if (s.handUse.getAttribute('href') !== href) {
                s.handUse.setAttribute('href', href);
                s.handLiftUses.forEach((u) => u.setAttribute('href', `${href}-s`));
            }
            const { pivot: [px, py], axis: [ax, ay] } = KIT.hands[s.who][key];
            let angle = 0;
            let nudge = 0;
            if (!reduce && h.kind === e.hand) {
                let g = since - M.change.totalMs;
                if (s.repeat && g > 0) g %= s.repeat;
                if (h.kind === 'wave') angle = waveAngle(g) * (h.side === 'left' ? -1 : 1);
                if (h.kind === 'point' && g >= 0 && g < M.point.nudgeMs) nudge = M.point.nudgeUnits * Math.sin((Math.PI * g) / M.point.nudgeMs);
            }
            const tf = `translate(${(px + ax * nudge).toFixed(2)} ${(py + ay * nudge).toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${h.grow.toFixed(3)}) translate(${-px} ${-py})`;
            s.hand.setAttribute('transform', tf);
            s.handLift.setAttribute('transform', tf);
            s.hand.style.display = '';
            s.handLift.style.display = '';
        }
    }

    let running = true;
    const listeners = new Set();
    function frame(now) {
        listeners.forEach((f) => f(now));
        for (const s of stickers) if (s.onScreen) pose(s, now);
        if (running) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const seen = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => entries.forEach((en) => { const s = [...stickers].find((x) => x.svg === en.target); if (s) s.onScreen = en.isIntersecting; }), { rootMargin: '120px' })
        : null;

    window.TourMotion = {
        create(who, px, opts) { const s = create(who, px, opts); if (seen) seen.observe(s.svg); return s; },
        set,
        say,
        writeOn,
        onFrame(f) { listeners.add(f); return () => listeners.delete(f); },
        get reduce() { return reduce; },
        set reduce(v) { reduce = v; for (const s of stickers) { s.changedAt = -1e9; s.talk = v ? null : s.talk; } },
    };
})();
