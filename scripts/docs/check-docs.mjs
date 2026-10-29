#!/usr/bin/env node
/**
 * check-docs.mjs — the documentation checker (docs/process/DOCS.md §5–6).
 *
 *   node scripts/docs/check-docs.mjs          check only; exit 1 on any error
 *   node scripts/docs/check-docs.mjs --write  also regenerate backlinks + TRACEABILITY.md
 *
 * Contract
 *   in : every Markdown file in the repo except node_modules, .git, .claude, .expo,
 *        .reassure, dist; plus `covers:` comments in src/**\/*.{ts,tsx}.
 *   out: errors on stdout, exit code 0 (clean) or 1 (errors).
 *        With --write: rewrites the text between <!-- backlinks:start --> and
 *        <!-- backlinks:end --> in every doc that has both markers, and rewrites
 *        docs/testing/TRACEABILITY.md. Without --write, a stale block is an error.
 *   Errors:
 *     - relative link to a missing file, or #anchor to a missing heading/id
 *     - duplicate front-matter `id`
 *     - requirement ID cited (in docs or tests) but not defined in the SRS
 *     - test file named in an SRS `Verify` field that doesn't exist
 *     - stale generated block or TRACEABILITY.md (check mode only)
 *   No dependencies; Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WRITE = process.argv.includes('--write');
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', '.expo', '.reassure', 'dist', 'android', 'ios', 'coverage']);
const SRS_PATH = 'docs/srs/SRS.md';
const TRACE_PATH = 'docs/testing/TRACEABILITY.md';
const REQ_RE = /\b(?:FR|NFR)-[A-Z0-9]+-\d{3}\b|\bCON-\d{3}\b/g;
const START = '<!-- backlinks:start -->';
const END = '<!-- backlinks:end -->';
const GENERATED_BLOCK = /<!-- backlinks:start -->[\s\S]*?<!-- backlinks:end -->/g;

const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

// ── Files ────────────────────────────────────────────────────────────────────
function walk(dir, pred, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
            if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), pred, out);
        } else if (pred(e.name)) out.push(path.join(dir, e.name));
    }
    return out;
}
const mdFiles = walk(ROOT, (n) => n.endsWith('.md')).map(rel).sort();
const srcFiles = fs.existsSync(path.join(ROOT, 'src'))
    ? walk(path.join(ROOT, 'src'), (n) => /\.(ts|tsx)$/.test(n)).map(rel).sort()
    : [];
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// ── Markdown helpers ─────────────────────────────────────────────────────────
function frontMatter(text) {
    const m = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) return {};
    const fm = {};
    for (const line of m[1].split('\n')) {
        const kv = line.match(/^([A-Za-z_]+):\s*(.*?)\s*(?:#.*)?$/);
        if (!kv) continue;
        const v = kv[2];
        fm[kv[1]] = v.startsWith('[') ? v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean) : v;
    }
    return fm;
}
/** Text with fenced code, inline code and HTML comments blanked (same length). */
function proseOnly(text) {
    const blank = (s) => s.replace(/[^\n]/g, ' ');
    return text
        .replace(/^(```|~~~)[\s\S]*?^\1/gm, blank)
        .replace(/<!--[\s\S]*?-->/g, blank)
        .replace(/`[^`\n]*`/g, blank);
}
/** GitHub's heading slug (github-slugger): lowercase, drop punctuation, spaces → '-'. */
function slug(heading) {
    return heading
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[`*_]/g, (c) => (c === '_' ? '_' : ''))
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
        .replace(/ /g, '-');
}
function anchorsOf(text) {
    const seen = new Map();
    const set = new Set();
    // Headings keep their inline code (GitHub slugs `x` as x); only fences and comments are skipped.
    const noFences = text
        .replace(/^(```|~~~)[\s\S]*?^\1/gm, (s) => s.replace(/[^\n]/g, ' '))
        .replace(/<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, ' '));
    for (const line of noFences.split('\n')) {
        const h = line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
        if (h) {
            const base = slug(h[1]);
            const n = seen.get(base) ?? 0;
            seen.set(base, n + 1);
            set.add(n === 0 ? base : `${base}-${n}`);
        }
    }
    for (const m of text.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) set.add(m[1]);
    return set;
}
function titleOf(p, text, fm) {
    if (fm.title) return fm.title;
    const h1 = proseOnly(text).match(/^#\s+(.+)$/m);
    return h1 ? h1[1].replace(/[`*]/g, '').trim() : path.basename(p);
}
function idOf(p, fm) {
    if (fm.id) return fm.id;
    const base = path.basename(p, '.md');
    return p.startsWith('docs/implementations/') ? `IMPL-${base}` : base.toUpperCase();
}

// ── Pass 1: index every doc ──────────────────────────────────────────────────
const docs = new Map(); // path -> { text, fm, id, title, anchors }
const ids = new Map();
for (const p of mdFiles) {
    const text = read(p);
    const fm = frontMatter(text);
    const d = { text, fm, id: idOf(p, fm), title: titleOf(p, text, fm), anchors: anchorsOf(text) };
    docs.set(p, d);
    if (fm.id) {
        if (ids.has(fm.id)) err(p, `duplicate id ${fm.id} (also in ${ids.get(fm.id)})`);
        else ids.set(fm.id, p);
    }
}

// ── Pass 3: requirements ─────────────────────────────────────────────────────
const reqs = new Map(); // id -> fields
if (docs.has(SRS_PATH)) {
    const blocks = docs.get(SRS_PATH).text.split(/^(?=#{3,4} )/m);
    for (const b of blocks) {
        const h = b.match(/^#{3,4} ((?:FR|NFR)-[A-Z0-9]+-\d{3}|CON-\d{3})\s*\n/);
        if (!h) continue;
        const field = (name) => (b.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*([^·\\n]+)`)) || [])[1]?.trim() ?? '';
        const statement = field('Statement') || (b.split('\n')[1] || '').replace(/\*\*/g, '');
        const tests = [...b.matchAll(/`([^`]*(?:__tests__|\.test\.|\.perf-test\.)[^`]*)`/g)].map((x) => x[1]);
        for (const t of tests) if (!fs.existsSync(path.join(ROOT, t))) err(SRS_PATH, `${h[1]} names missing test ${t}`);
        reqs.set(h[1], {
            id: h[1],
            // Links inside a statement are SRS-relative; keep only their text in generated tables.
            title: (() => { const s = statement.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' '); return s.slice(0, 110) + (s.length > 110 ? '…' : ''); })(),
            pri: field('Pri') || '—',
            target: field('Target') || '—',
            status: h[1].startsWith('CON-') ? 'constraint' : (field('Status') || '—').split(/[\s(;]/)[0],
            verify: field('Verify'),
            tests: new Set(tests),
            docs: new Set(),
        });
    }
}
const checkCited = (file, text) => {
    for (const id of new Set(proseOnly(text).match(REQ_RE) || [])) {
        if (!reqs.has(id)) err(file, `cites undefined requirement ${id}`);
        else if (file !== SRS_PATH && file !== TRACE_PATH) reqs.get(id).docs.add(file);
    }
};
for (const [p, d] of docs) if (p !== TRACE_PATH) checkCited(p, d.text);
for (const p of srcFiles) {
    const text = read(p);
    for (const m of text.matchAll(/covers:\s*([A-Z0-9, -]+)/g)) {
        for (const id of m[1].match(REQ_RE) || []) {
            if (!reqs.has(id)) err(p, `covers undefined requirement ${id}`);
            else reqs.get(id).tests.add(p);
        }
    }
}

// ── Generated content ────────────────────────────────────────────────────────
const linkFrom = (fromPath, toPath) => path.relative(path.dirname(fromPath), toPath).split(path.sep).join('/');

function backlinksBlock(p) {
    const srcs = [...(inbound.get(p) || [])].sort();
    const lines = srcs.length
        ? srcs.map((s) => `- [${docs.get(s).title}](${linkFrom(p, s)})`)
        : ['_No other document links here yet._'];
    return `${START}\n${lines.join('\n')}\n${END}`;
}

function traceability() {
    const rows = [...reqs.values()];
    const by = (k) => rows.reduce((a, r) => ((a[r[k]] = (a[r[k]] || 0) + 1), a), {});
    const impl = rows.filter((r) => r.status === 'implemented');
    const mustImpl = impl.filter((r) => /^Must/.test(r.pri));
    const verified = (r) => r.tests.size > 0 || /\b[DI]\b/.test(r.verify);
    const gaps = mustImpl.filter((r) => r.tests.size === 0);
    const pct = (a, b) => (b ? Math.round((100 * a) / b) : 100);
    const fmt = (o) => Object.entries(o).sort().map(([k, v]) => `${k} ${v}`).join(' · ');
    const out = [
        '---',
        'id: TRACEABILITY',
        'title: Requirements traceability (generated)',
        'status: approved',
        'date: 2026-10-30',
        'owner: Mert Efe Şensoy',
        'related: [SRS, TEST-STRATEGY]',
        '---',
        '',
        '# Requirements traceability',
        '',
        '> **Generated by `node scripts/docs/check-docs.mjs --write`. Do not edit by hand.** Source: the requirement blocks in the [SRS](../srs/SRS.md), test files named in their `Verify` fields, `// covers:` comments in `src/`, and every document that cites an ID.',
        '',
        '## Summary',
        '',
        `- Requirements: **${rows.length}** (status: ${fmt(by('status'))})`,
        `- Implemented **Must** requirements with an automated test: **${mustImpl.length - gaps.length} / ${mustImpl.length}** (${pct(mustImpl.length - gaps.length, mustImpl.length)} %; target 100 % by v1.4.0, NFR-MAINT-002)`,
        `- Implemented requirements with any verification (test, device check or inspection): **${impl.filter(verified).length} / ${impl.length}**`,
        '',
        '## Implemented Must requirements without an automated test',
        '',
        ...(gaps.length ? gaps.map((r) => `- [${r.id}](../srs/SRS.md#${r.id.toLowerCase()}): ${r.title} (verify: ${r.verify || '—'})`) : ['_None._']),
        '',
        '## Matrix',
        '',
        '| ID | Requirement | Pri | Target | Status | Tests | Cited in |',
        '|----|-------------|-----|--------|--------|-------|----------|',
        ...rows.map((r) => {
            const tests = [...r.tests].sort().map((t) => `[${path.basename(t)}](${linkFrom(TRACE_PATH, t)})`).join('<br>') || '—';
            const cited = [...r.docs].sort().map((d) => `[${docs.get(d).id}](${linkFrom(TRACE_PATH, d)})`).join(', ') || '—';
            return `| [${r.id}](../srs/SRS.md#${r.id.toLowerCase()}) | ${r.title.replace(/\|/g, '\\|')} | ${r.pri.split(' ')[0]} | ${r.target.replace(/\|/g, '\\|')} | ${r.status} | ${tests} | ${cited} |`;
        }),
        '',
        '## Backlinks',
        START,
        END,
        '',
    ];
    return out.join('\n');
}

// TRACEABILITY first (it is itself a doc that may receive backlinks).
if (reqs.size) {
    const next = traceability();
    const cur = fs.existsSync(path.join(ROOT, TRACE_PATH)) ? read(TRACE_PATH) : '';
    const strip = (s) => s.replace(new RegExp(`${START}[\\s\\S]*?${END}`), `${START}\n${END}`);
    if (strip(cur) !== strip(next)) {
        if (WRITE) {
            fs.mkdirSync(path.dirname(path.join(ROOT, TRACE_PATH)), { recursive: true });
            fs.writeFileSync(path.join(ROOT, TRACE_PATH), next);
            if (!docs.has(TRACE_PATH)) docs.set(TRACE_PATH, { text: next, fm: frontMatter(next), id: 'TRACEABILITY', title: 'Requirements traceability (generated)', anchors: anchorsOf(next) });
            else docs.get(TRACE_PATH).text = next;
        } else err(TRACE_PATH, 'out of date: run node scripts/docs/check-docs.mjs --write');
    }
}

// ── Pass 2: links ────────────────────────────────────────────────────────────
const inbound = new Map(); // target path -> Set(source path)
const TEMPLATES = new Set(['docs/implementations/_TEMPLATE.md']); // placeholder links by design
for (const [p, d] of docs) {
    if (TEMPLATES.has(p)) continue;
    // Generated backlink blocks are excluded: they are made from these links, and counting
    // them as links would feed each run's output into the next (no fixed point).
    const prose = proseOnly(d.text.replace(GENERATED_BLOCK, (s) => s.replace(/[^\n]/g, ' ')));
    for (const m of prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
        const target = m[1];
        if (/^(https?:|mailto:|tel:)/.test(target)) continue;
        const [file, anchor] = target.split('#');
        const resolved = file ? rel(path.resolve(path.dirname(path.join(ROOT, p)), decodeURI(file))) : p;
        const abs = path.join(ROOT, resolved);
        if (file && !fs.existsSync(abs)) {
            err(p, `broken link → ${target}`);
            continue;
        }
        if (anchor && resolved.endsWith('.md')) {
            const td = docs.get(resolved);
            if (td && !td.anchors.has(decodeURIComponent(anchor))) err(p, `missing anchor → ${target}`);
        }
        if (resolved !== p && docs.has(resolved)) {
            if (!inbound.has(resolved)) inbound.set(resolved, new Set());
            inbound.get(resolved).add(p);
        }
    }
}

/** Same length as text, with fenced and inline code blanked but HTML comments kept,
 *  so a doc that *shows* the markers as an example isn't mistaken for a real block. */
function maskCode(text) {
    const blank = (s) => s.replace(/[^\n]/g, ' ');
    return text.replace(/^(```|~~~)[\s\S]*?^\1/gm, blank).replace(/`[^`\n]*`/g, blank);
}

let rewritten = 0;
for (const [p, d] of docs) {
    const masked = maskCode(d.text);
    const s = masked.lastIndexOf(START);
    const e = masked.lastIndexOf(END);
    if (s < 0 || e < s) continue;
    const next = d.text.slice(0, s) + backlinksBlock(p) + d.text.slice(e + END.length);
    if (next !== d.text) {
        if (WRITE) {
            fs.writeFileSync(path.join(ROOT, p), next);
            rewritten++;
        } else err(p, 'backlinks block out of date: run node scripts/docs/check-docs.mjs --write');
    }
}

// ── Report ───────────────────────────────────────────────────────────────────
const summary = `${docs.size} docs, ${reqs.size} requirements, ${errors.length} error(s)${WRITE ? `, ${rewritten} backlink block(s) rewritten` : ''}`;
if (errors.length) {
    console.log(errors.map((e) => `✖ ${e}`).join('\n'));
    console.log(`\n${summary}`);
    process.exit(1);
}
console.log(`✔ ${summary}`);
