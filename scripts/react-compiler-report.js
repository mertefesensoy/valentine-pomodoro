#!/usr/bin/env node
/**
 * react-compiler-report.js — what the React Compiler does to the app (Phase 1 B5).
 *
 *   node scripts/react-compiler-report.js            the per-file table
 *   node scripts/react-compiler-report.js --verbose  also each skipped function's reason
 *
 * Contract
 *   in : every .ts/.tsx/.js file under src/ except __tests__, __fixtures__ and
 *        __mocks__ (what Metro bundles from src/).
 *   how: each file is transformed twice with babel-preset-expo and the Babel
 *        caller Metro uses for an iOS release build (isDev false, Hermes): once
 *        with `supportsReactCompiler` (what app.json's experiments.reactCompiler
 *        turns on) and once without. The compiler's own logger reports each
 *        function it compiled or skipped; a skip names the reason.
 *   out: per file, the functions compiled, the functions skipped, and the
 *        number of worklets (functions the worklets plugin turned into UI-thread
 *        factories, counted by their `__workletHash`) with and without the
 *        compiler. Exit 1 if any file's worklet count differs: a worklet the
 *        compiler hid from the worklets plugin would throw on the UI thread on
 *        a phone, and Reanimated's Jest mock would not notice.
 *   Read-only; prints to stdout. Run from the repo root with dependencies installed.
 */
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose');
const SKIP_DIRS = new Set(['__tests__', '__fixtures__', '__mocks__']);

function sourceFiles(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) sourceFiles(p, out);
        } else if (/\.(tsx?|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
            out.push(p);
        }
    }
    return out;
}

function transform(file, compilerOn) {
    const events = [];
    const { code } = babel.transformFileSync(file, {
        cwd: ROOT,
        root: ROOT,
        filename: file,
        babelrc: false,
        configFile: false,
        presets: [[require.resolve('babel-preset-expo'), { 'react-compiler': { logger: { logEvent: (_f, e) => events.push(e) } } }]],
        caller: {
            name: 'metro',
            bundler: 'metro',
            platform: 'ios',
            engine: 'hermes',
            isDev: false,
            isServer: false,
            isNodeModule: false,
            supportsReactCompiler: compilerOn || undefined,
        },
    });
    return { events, worklets: (code.match(/__workletHash\s*=/g) || []).length };
}

const reasonOf = (e) => String(e.detail?.reason ?? e.detail?.options?.reason ?? e.reason ?? e.detail ?? '').split('\n')[0];

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
let compiledTotal = 0;
let skippedTotal = 0;
let workletMismatch = 0;
const rows = [];
for (const file of sourceFiles(path.join(ROOT, 'src'))) {
    const on = transform(file, true);
    const off = transform(file, false);
    const compiled = on.events.filter((e) => e.kind === 'CompileSuccess').map((e) => e.fnName || '(anonymous)');
    const skipped = on.events.filter((e) => e.kind === 'CompileError' || e.kind === 'CompileSkip' || e.kind === 'PipelineError');
    // One skipped function can log several errors; count the function once.
    const skippedFns = new Set(skipped.map((e) => e.fnLoc?.start?.index ?? e.fnLoc?.start?.line ?? reasonOf(e))).size;
    compiledTotal += compiled.length;
    skippedTotal += skippedFns;
    if (on.worklets !== off.worklets) workletMismatch++;
    if (!compiled.length && !skipped.length && !on.worklets && !off.worklets) continue;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    rows.push(
        `${rel}: compiled ${compiled.length ? compiled.join(', ') : '-'}; skipped ${skippedFns}; worklets ${on.worklets} (off: ${off.worklets})${on.worklets !== off.worklets ? '  <-- MISMATCH' : ''}`,
    );
    if (VERBOSE) {
        const reasons = new Map();
        for (const e of skipped) {
            const key = `line ${e.fnLoc?.start?.line ?? '?'}: ${reasonOf(e).slice(0, 140)}`;
            reasons.set(key, (reasons.get(key) ?? 0) + 1);
        }
        for (const [reason, n] of reasons) rows.push(`    ${reason}${n > 1 ? ` (x${n})` : ''}`);
    }
}
console.log(rows.join('\n'));
console.log(`\nfunctions compiled: ${compiledTotal}; functions skipped: ${skippedTotal}; files whose worklet count changes: ${workletMismatch}`);
process.exit(workletMismatch ? 1 : 0);
