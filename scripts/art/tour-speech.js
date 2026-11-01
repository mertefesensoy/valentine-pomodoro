// tour-speech.js — how a line is spoken in the tutorial: when it writes on, where its babble
// syllables fall, and which of the speaker's syllables play (Phase 1 D5 assets).
//
// A plain script with no dependencies, so one copy serves everyone: both D5 review pages inline it
// (it defines window.TourSpeech), and scripts/sound/build.mjs runs it in a node:vm context to render
// the sample lines it levels the voices by. The tutorial's builder ports these rules as they are.
//
// writeOn(text, talk, who) → { chars, syllables, length }
//   One character every talk.charMs, with a pause after a comma, or after a stop that isn't the
//   last character. A syllable starts at each syllable of the text: the first letter of each run
//   of consonants and vowels inside a word ("Po|mo", "a|round"), unless it comes less than
//   talk.minGapMs[who] after the last one, which merges it. Each syllable carries its vowel's class
//   (a; e for e, i and y; o for o and u, Turkish ı, ö and ü included) and its slot, the time to the
//   next syllable. The last is the line's end: 'up' for a question, 'down' otherwise.
// pick(syllables, voice, key) → one entry of `voice` per syllable
//   The body syllable with the syllable's vowel class, high or low by a gentle fall across the
//   line (0.7 → 0.3) plus a seeded jitter of ±0.3, never the same one twice running; the line-end
//   syllable last. Seeded by `key` (FNV-1a into mulberry32), so a line always speaks the same way.
// MOUTH: the tour kit's mouth layer for each vowel class.
(function (root) {
    const CLASS = {};
    for (const c of 'aâàáä') CLASS[c] = 'a';
    for (const c of 'eéèêëiıîíïy') CLASS[c] = 'e';
    for (const c of 'oöóôòuüûúù') CLASS[c] = 'o';
    const MOUTH = { a: 'talk-wide', e: 'talk-small', o: 'talk-round' };
    const letter = (c) => /\p{L}/u.test(c);
    const vowel = (c) => CLASS[c.toLocaleLowerCase('tr')] !== undefined || CLASS[c.toLowerCase()] !== undefined;
    const classOf = (c) => CLASS[c.toLocaleLowerCase('tr')] ?? CLASS[c.toLowerCase()];

    function writeOn(text, talk, who) {
        const chars = [];
        const all = [...text];
        let clock = 0;
        all.forEach((c, i) => {
            chars.push(clock);
            clock += talk.charMs;
            if (/[,;:]/.test(c)) clock += talk.pauseMs.comma;
            else if (/[.!?…]/.test(c) && i < all.length - 1) clock += talk.pauseMs.stop;
        });
        const gap = talk.minGapMs[who];
        const syllables = [];
        let inWord = false;
        let chunk = 0;
        let sawVowel = false;
        all.forEach((c, i) => {
            if (!letter(c) && !/['’]/.test(c)) { inWord = false; return; }
            if (!letter(c)) return;
            if (!inWord) { inWord = true; chunk = i; sawVowel = false; }
            if (vowel(c)) {
                if (!sawVowel) {
                    const t = chars[chunk];
                    if (!syllables.length || t - syllables[syllables.length - 1].t >= gap) syllables.push({ t, cls: classOf(c) });
                    sawVowel = true;
                }
            } else if (sawVowel) {
                chunk = i;
                sawVowel = false;
            }
        });
        syllables.forEach((s, i) => { s.slot = Math.min(240, (syllables[i + 1]?.t ?? s.t + gap) - s.t); });
        if (syllables.length) syllables[syllables.length - 1].end = /\?\s*$/.test(text) ? 'up' : 'down';
        return { chars, syllables, length: clock };
    }

    function hash(s) {
        let h = 0x811c9dc5;
        for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
        return h;
    }
    function rng(seed) {
        let a = seed >>> 0;
        return () => {
            a = (a + 0x6d2b79f5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function pick(syllables, voice, key) {
        const r = rng(hash(key));
        const body = voice.filter((s) => !s.role);
        const n = syllables.length;
        let last = null;
        return syllables.map((syl, i) => {
            if (i === n - 1) return voice.find((s) => s.role === syl.end);
            const p = 0.7 - 0.4 * (n > 2 ? i / (n - 2) : 0) + (r() - 0.5) * 0.6;
            const level = p >= 0.5 ? 'high' : 'low';
            let s = body.find((b) => b.vowel === syl.cls && b.level === level);
            if (s === last) s = body.find((b) => b.vowel === syl.cls && b.level !== level);
            return (last = s);
        });
    }

    root.TourSpeech = { writeOn, pick, MOUTH };
})(typeof window !== 'undefined' ? window : globalThis);
