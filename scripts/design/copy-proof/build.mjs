// Builds the owner's copy proof page from the repo's own strings, so the page shows
// exactly what the next build carries (D2 record §3.14). Run: node scripts/design/copy-proof/build.mjs.
// It writes art/review/copy-proof.html, published as the private artifact
// https://claude.ai/artifact/TmachCPtjwYoFfYpPbVuvp (republish with that url to keep it and its marks).
import fs from 'node:fs';
import { DEFAULT_LOVE_NOTES, DEFAULT_LOVE_NOTES_TR, fallbackLoveNote } from '../../../src/constants/defaults.ts';

const ROOT = new URL('../../../src/i18n/', import.meta.url);
const en = JSON.parse(fs.readFileSync(new URL('en.json', ROOT), 'utf8'));
const tr = JSON.parse(fs.readFileSync(new URL('tr.json', ROOT), 'utf8'));

const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [[p + k, v]]));
const trMap = new Map(flat(tr));

// Sections in the order a person meets them, each with the step that wrote it.
const SECTIONS = [
    { id: 'tabs', title: 'Tab bar', phase: 'D1', ns: ['tabs'] },
    { id: 'timer', title: 'Timer', phase: 'D1', ns: ['timer', 'controls', 'presets', 'modes', 'spread', 'today', 'goal', 'loveNote'] },
    {
        id: 'pair',
        title: 'Pairing',
        phase: 'Phase 2 D1',
        ns: ['pair'],
        about: 'The sheet you reach from the Timer’s strip or from Settings: why an account, your code and theirs, who it is, and the pages closing. VoiceOver reads pair.art, pair.codeField and pair.codeLabel, and they’re never shown.',
    },
    {
        id: 'partner',
        title: 'Your partner',
        phase: 'Phase 2 D2 and D3',
        ns: ['partner'],
        about: 'The strip on the Timer, your partner’s day, and writing them a note. VoiceOver reads the strings with a11y in their names, and they’re never shown.',
    },
    { id: 'welcome', title: 'Welcome', phase: 'D1', ns: ['welcome'] },
    // The tour follows the welcome (D5): Pomo & Doro's lines, the bubble's words and the replay row.
    { id: 'tour', title: 'The tour: Pomo & Doro show you around', phase: 'D5', ns: ['tour'] },
    { id: 'stats', title: 'Stats', phase: 'D2', ns: ['stats'] },
    { id: 'settings', title: 'Settings', phase: 'D2', ns: ['settings', 'updates'] },
    {
        id: 'account',
        title: 'Account',
        phase: 'Phase 2 D4',
        ns: ['account'],
        about: 'In Settings, once you have an account. The unpair and delete messages appear in an iPhone alert.',
    },
    { id: 'notes-screen', title: 'Love notes screen', phase: 'D2', ns: ['notesScreen'] },
    { id: 'fly', title: 'Fly', phase: 'D3', ns: ['fly', 'airportPicker'] },
    { id: 'notifications', title: 'Notifications', phase: 'D3', ns: ['notifications'] },
    { id: 'not-found', title: 'A page that doesn’t exist', phase: 'D3', ns: ['notFound'] },
];

const covered = new Set(SECTIONS.flatMap((s) => s.ns));
const missing = Object.keys(tr).filter((k) => !covered.has(k));
if (missing.length) throw new Error('namespaces not placed: ' + missing.join(', '));

// What to look at on a particular string, where the string alone doesn't say.
const NOTES = {
    'pair.why': 'D1 lost the sentence saying the timer works without an account, so I put it back. It’s the first thing someone reads before signing in.',
    'pair.returnWhy': 'Shown only when a sign-in has ended, which is rare. The same page, with this line in place of the one about accounts.',
    'partner.readyShort': 'On the strip beside “Pair with your partner”, where the full “ready when you are” line doesn’t fit.',
    'partner.signInAgain': 'On the strip, when your sign-in has ended and your partner’s day can’t refresh.',
    'partner.noteFooter': 'If your partner has Show love notes off, a note waits on your card on their phone and doesn’t appear after a focus. This line leaves that out to stay short.',
    'account.paired': 'English reads “Paired Nov 5” and Turkish “5 Kas tarihinde eşleşildi”, which is how the app writes dates everywhere. The design brief had “5 Nov”.',
    'account.unpaired': 'One line at the top of Settings, straight after you unpair. It goes the next time the app starts.',
    'tour.pair.here': 'The Turkish speaks to the two of you (eşleşin, paylaşın), since pairing takes two. The rest of the tour says “sen”. Tell me if the singular reads better.',
    'tour.v15.pair': 'Plural for the same reason as the line above.',
    'tour.v15.notes': 'Plural for the same reason (yazın).',
    'tour.pair.paired': 'In Turkish nothing before “onun” says who it is, but the strip with your partner’s name is lit right beside the line. “Partnerinin” would break the tour’s 10-letter rule.',
};
for (const key of Object.keys(NOTES)) {
    if (!trMap.has(key)) throw new Error('a note for a string that does not exist: ' + key);
}

const sections = SECTIONS.map((s) => ({
    ...s,
    items: s.ns.flatMap((ns) => flat(en[ns], ns + '.')).map(([key, enText]) => {
        const trText = trMap.get(key);
        if (trText === undefined) throw new Error('no Turkish for ' + key);
        return { id: key, en: enText, tr: trText, ...(NOTES[key] ? { note: NOTES[key] } : {}) };
    }),
}));

const pad = (n) => String(n).padStart(2, '0');
const notes = DEFAULT_LOVE_NOTES.map((enText, i) => ({ n: pad(i + 1), en: enText, tr: DEFAULT_LOVE_NOTES_TR[i] }));
notes.push({ n: 'fallback', en: fallbackLoveNote('en'), tr: fallbackLoveNote('tr') });

const questions = [
    {
        id: 'q-pair-wait',
        title: 'After you send your code',
        body: 'You send your code and the pairing sheet stays open. It moves on by itself about 10 seconds after your partner types the code. Nothing on the sheet said so.',
        choices: [
            'Add a line under the code once it’s sent: “This page moves on when they type it.”',
            'Leave it as it is: the code and “Lasts 24 hours” are enough',
        ],
    },
    {
        id: 'q-stats-tab',
        title: 'The Stats tab and its title',
        body: 'The tab says “İstatistik” and the screen’s title says “İstatistikler”. In English both say “Stats”.',
        choices: ['Keep them as they are', 'Both “İstatistikler”', 'Both “İstatistik”'],
    },
    {
        id: 'q-notes-tab',
        title: 'The Notes tab and its title',
        body: 'The tab says “Notlar” and the screen’s title says “Aşk notları”. In English: “Notes” and “Love notes”.',
        choices: ['Keep them as they are', 'Both “Aşk notları”', 'Both “Notlar”'],
    },
];

const data = { sections, notes, questions, built: new Date().toISOString().slice(0, 10) };
const total = sections.reduce((n, s) => n + s.items.length, 0) + notes.length * 2;
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const template = fs.readFileSync(new URL('./template.html', import.meta.url), 'utf8');
const html = template.replace('__DATA__', json).replace(/__TOTAL__/g, String(total));
fs.writeFileSync(new URL('../../../art/review/copy-proof.html', import.meta.url), html);
console.log(`strings ${total - notes.length * 2}, notes ${notes.length} pairs, total ${total}`);
