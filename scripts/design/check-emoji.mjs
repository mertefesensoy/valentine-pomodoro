#!/usr/bin/env node
/**
 * The emoji check (NFR-UX-002; Stage D plan §3.3, D2): fails on any emoji code point in the app's
 * source under `src/` and `app/`, so no emoji or pictographic glyph ever stands in for an icon.
 * DESIGN.md: "Emoji belong only in push-notification copy and in text users write."
 *
 * Allowed, by file (`ALLOW`):
 *   - the default love notes, which are user text the app seeds (`defaults.ts`), and v1.3.1's frozen
 *     set, which existing installs keep (`legacyLoveNotes.ts`);
 *   - push-notification copy: `useNotifications.ts` (the session-end titles and bodies, Fly's
 *     landing included) and `notifications.ts` (the daily reminder).
 * Tests and fixtures are not app source and are skipped.
 *
 * Usage: node scripts/design/check-emoji.mjs   → prints each hit as file:line, exits 1 if any.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOTS = ['src', 'app'];
const SKIP_DIRS = new Set(['node_modules', '__tests__', '__fixtures__', '__mocks__']);
const ALLOW = new Set([
    'src/constants/defaults.ts',
    'src/constants/legacyLoveNotes.ts',
    'src/hooks/useNotifications.ts',
    'src/utils/notifications.ts',
]);
// Extended_Pictographic covers emoji and pictographs; the variation selector catches a text glyph
// forced to emoji presentation (♥ + U+FE0F).
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}]/u;

function scan(dir, hits) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) scan(full, hits);
            continue;
        }
        if (!/\.(tsx?|jsx?|json)$/.test(entry.name)) continue;
        const rel = path.relative(root, full).split(path.sep).join('/');
        if (ALLOW.has(rel)) continue;
        fs.readFileSync(full, 'utf8')
            .split(/\r?\n/)
            .forEach((line, i) => {
                if (EMOJI.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
            });
    }
    return hits;
}

export function findEmoji() {
    return ROOTS.flatMap((r) => scan(path.join(root, r), []));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const hits = findEmoji();
    if (hits.length) {
        console.error(`✖ ${hits.length} emoji in app source (NFR-UX-002):`);
        for (const hit of hits) console.error(`  ${hit}`);
        process.exit(1);
    }
    console.log('✔ no emoji in app source');
}
