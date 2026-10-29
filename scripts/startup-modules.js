#!/usr/bin/env node
/**
 * Counts the modules a cold start evaluates, from a plain-JS Metro export.
 *
 * Hermes ships every module in one bundle, so "how many modules are in the
 * bundle" doesn't change when code is loaded lazily. What changes is how many
 * of them run before the first screen: the modules reachable from the entry
 * points through synchronous imports only. This script measures that.
 *
 * Usage (Phase 1 task B1; doc 2026-10-29-phase1-b1-lazy-fly-mode.md):
 *   npx expo export --platform ios --no-bytecode --no-minify --source-maps --output-dir <dir>
 *   node scripts/startup-modules.js <dir>/_expo/static/js/ios/index-<hash>.js [--list <out.txt>]
 *
 * Contract:
 *   input   a non-minified, non-bytecode Metro bundle and its .map next to it
 *   output  module totals on stdout; with --list, the source path of every
 *           eagerly reached module, one per line, sorted (for diffing two builds)
 *   effects none besides the optional list file
 *
 * How edges are classified, inside each `__d(factory, id, [deps])`:
 *   sync   require(_dependencyMap[i]), _$$_IMPORT_DEFAULT(...), _$$_IMPORT_ALL(...)
 *   async  _dependencyMap[i], _dependencyMap.paths  (the asyncRequire call that
 *          `import()` compiles to)
 * A sync require written inside a function body still counts as sync, so the
 * result is an upper bound on what a cold start evaluates. Expo's Metro config
 * has inlineRequires off, so ES imports are all top-level and the bound is close.
 */
const fs = require('fs');
// Metro writes a sectioned (index) source map; AnyMap flattens it.
const { AnyMap, originalPositionFor } = require('@jridgewell/trace-mapping');

const [bundlePath, flag, listPath] = process.argv.slice(2);
if (!bundlePath) {
    console.error('usage: node scripts/startup-modules.js <bundle.js> [--list <out.txt>]');
    process.exit(2);
}

const code = fs.readFileSync(bundlePath, 'utf8');
const lines = code.split('\n');

// Module boundaries: every module starts on a line beginning with `__d(`.
const starts = [];
lines.forEach((line, i) => {
    if (line.startsWith('__d(')) starts.push(i);
});
const firstRunLine = lines.findIndex((l) => l.startsWith('__r('));

// Unresolved optional dependencies appear as `null` in the deps array.
const TRAILER = /\},(\d+),\[([\d,null]*)\](?:,"[^"]*")?\);\s*$/;
const SYNC = /(?:\brequire|_\$\$_IMPORT_DEFAULT|_\$\$_IMPORT_ALL)\(_dependencyMap\[(\d+)\]/g;
const ASYNC = /_dependencyMap\[(\d+)\],\s*_dependencyMap\.paths/g;

const modules = new Map(); // id -> { startLine, endLine, sync: id[], async: id[] }
starts.forEach((start, k) => {
    const end = k + 1 < starts.length ? starts[k + 1] : firstRunLine;
    const text = lines.slice(start, end).join('\n');
    const trailer = text.match(TRAILER);
    if (!trailer) throw new Error(`no __d trailer for the module at line ${start + 1}`);
    const id = Number(trailer[1]);
    const deps = trailer[2] ? trailer[2].split(',').map((d) => (d === 'null' ? null : Number(d))) : [];
    const pick = (re) => [...text.matchAll(re)].map((m) => deps[Number(m[1])]).filter((d) => d !== null);
    modules.set(id, { startLine: start, endLine: end, sync: pick(SYNC), async: pick(ASYNC) });
});

const entries = lines.slice(firstRunLine).flatMap((l) => {
    const m = l.match(/^__r\((\d+)\);/);
    return m ? [Number(m[1])] : [];
});

function reach(followAsync) {
    const seen = new Set();
    const stack = [...entries];
    while (stack.length) {
        const id = stack.pop();
        if (seen.has(id)) continue;
        seen.add(id);
        const mod = modules.get(id);
        if (!mod) continue;
        stack.push(...mod.sync, ...(followAsync ? mod.async : []));
    }
    return seen;
}

const eager = reach(false);
const all = reach(true);
const asyncEdges = [...modules.values()].reduce((n, m) => n + m.async.length, 0);

console.log(`modules in bundle:              ${modules.size}`);
console.log(`entry points:                   ${entries.join(', ')}`);
console.log(`async import() edges:           ${asyncEdges}`);
console.log(`reachable (sync + async):       ${all.size}`);
console.log(`evaluated at cold start (sync): ${eager.size}`);
console.log(`deferred until an import():     ${all.size - eager.size}`);

if (flag === '--list' && listPath) {
    // Name each module by the source of the first mapped line in its factory.
    // Modules with no mapping at all (generated ones) keep their numeric id.
    const map = new AnyMap(fs.readFileSync(`${bundlePath}.map`, 'utf8'));
    const nameOf = (id) => {
        const { startLine, endLine } = modules.get(id);
        for (let line = startLine; line < endLine; line++) {
            const column = Math.max(0, lines[line].search(/\S/));
            const pos = originalPositionFor(map, { line: line + 1, column });
            if (pos.source) return pos.source.replace(/\\/g, '/').replace(/^.*?node_modules\//, 'node_modules/');
        }
        return `<module ${id}>`;
    };
    const names = [...eager].filter((id) => modules.has(id)).map(nameOf).sort();
    fs.writeFileSync(listPath, `${names.join('\n')}\n`);
    console.log(`eager module list:              ${listPath}`);
}
