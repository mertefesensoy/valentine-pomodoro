#!/usr/bin/env node
/**
 * Asset budgets (NFR-PERF-005; rehaul plan §6.2): every shipped vector must stay inside its kind's
 * budget, reading KB as 1024 B (Stage C record §4.3).
 *
 *   node scripts/art/check-budgets.mjs     prints every asset's SVG size against its budget; exit 1 on any miss
 *
 * Kinds come from the jobs in art/jobs/: icon ≤ 2 KB, illustration and logo ≤ 30 KB, scene ≤ 120 KB.
 * PNG exports are previews and app-icon rasters, which the budget doesn't cover.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUDGET = { icon: 2 * 1024, illustration: 30 * 1024, logo: 30 * 1024, scene: 120 * 1024 };

let misses = 0;
let count = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'art/jobs')).filter((n) => n.endsWith('.json'))) {
    const job = JSON.parse(fs.readFileSync(path.join(ROOT, 'art/jobs', f), 'utf8'));
    for (const a of job.assets) {
        const budget = BUDGET[a.kind];
        if (budget === undefined) { misses++; console.log(`✖ ${a.id}: unknown kind "${a.kind}"`); continue; }
        const svg = path.join(ROOT, `art/out/${a.kind}/${a.id}.svg`);
        if (!fs.existsSync(svg)) { misses++; console.log(`✖ ${a.id}: not built (run node scripts/art/build.mjs)`); continue; }
        const size = fs.statSync(svg).size;
        count++;
        const ok = size <= budget;
        if (!ok) misses++;
        console.log(`${ok ? '✔' : '✖'} ${a.id.padEnd(36)} ${String(size).padStart(6)} B  ≤ ${budget} B  (${a.kind})`);
    }
}
console.log(`\n${misses ? '✖' : '✔'} ${count} assets checked, ${misses} over budget or missing`);
process.exit(misses ? 1 : 0);
