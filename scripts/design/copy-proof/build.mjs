// Builds the owner's Turkish copy proof page from the repo's own strings, so the page shows
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
    { id: 'timer', title: 'Timer', phase: 'D1', ns: ['timer', 'controls', 'presets', 'modes', 'partner', 'spread', 'today', 'goal', 'loveNote'] },
    { id: 'welcome', title: 'Welcome', phase: 'D1', ns: ['welcome'] },
    { id: 'stats', title: 'Stats', phase: 'D2', ns: ['stats'] },
    { id: 'settings', title: 'Settings', phase: 'D2', ns: ['settings', 'updates'] },
    { id: 'notes-screen', title: 'Love notes screen', phase: 'D2', ns: ['notesScreen'] },
];

const covered = new Set(SECTIONS.flatMap((s) => s.ns));
const missing = Object.keys(tr).filter((k) => !covered.has(k));
if (missing.length) throw new Error('namespaces not placed: ' + missing.join(', '));

const sections = SECTIONS.map((s) => ({
    ...s,
    items: s.ns.flatMap((ns) => flat(en[ns], ns + '.')).map(([key, enText]) => {
        const trText = trMap.get(key);
        if (trText === undefined) throw new Error('no Turkish for ' + key);
        return { id: key, en: enText, tr: trText };
    }),
}));

const pad = (n) => String(n).padStart(2, '0');
const notes = DEFAULT_LOVE_NOTES.map((enText, i) => ({ n: pad(i + 1), en: enText, tr: DEFAULT_LOVE_NOTES_TR[i] }));
notes.push({ n: 'fallback', en: fallbackLoveNote('en'), tr: fallbackLoveNote('tr') });

const questions = [
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
