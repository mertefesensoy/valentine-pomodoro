#!/usr/bin/env node
/**
 * The VectorCraft art pipeline (rehaul plan §5.4; Phase 1 C3; NFR-PERF-005).
 *
 *   node scripts/art/build.mjs [art/jobs/<job>.json …]   rebuild every asset of the jobs (default: all jobs)
 *   node scripts/art/build.mjs --check [jobs…]           rebuild in the work folder and compare, byte for byte,
 *                                                         with the committed exports; exit 1 on any difference
 *
 * For each asset in a job it writes art/steps/<id>.steps.json, the exact VectorCraft command
 * list, and runs it headless (`vectorcraft-cli run --in <src> --commands <steps>`) in a short
 * work folder (default C:/vp-art), because VectorCraft's exports fail past Windows' 260-character
 * path limit. Results are copied back into the repo:
 *
 *   art/vc/<id>.vectorcraft         the editable source of truth
 *   art/out/<kind>/<id>.svg         the shipped vector (2 decimals, outlined text, minified)
 *   art/out/<kind>/<id>-<px>.png    each raster size the job asks for
 *
 * Exports are deterministic (checked 2026-10-30: two runs, identical bytes), which is what makes
 * --check a reproducibility test. Environment: VECTORCRAFT_CLI (default the Windows install),
 * VP_ART_WORK (default C:/vp-art).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLI = process.env.VECTORCRAFT_CLI ?? 'C:/Program Files/VectorCraft/vectorcraft-cli.exe';
const WORK = (process.env.VP_ART_WORK ?? 'C:/vp-art').replace(/\\/g, '/');

const args = process.argv.slice(2);
const check = args.includes('--check');
let differences = 0;
const jobFiles = args.filter((a) => !a.startsWith('--'));
const jobs = (jobFiles.length ? jobFiles : fs.readdirSync(path.join(ROOT, 'art/jobs')).filter((f) => f.endsWith('.json')).map((f) => `art/jobs/${f}`))
    .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')) }));

/** The artboard's width in points, read from the source SVG's viewBox (PNG scale = px / width). */
function artboardWidth(svgText, src) {
    const m = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/.exec(svgText);
    if (!m) throw new Error(`${src}: the SVG needs a viewBox`);
    return Number(m[1]);
}

/** The repo-relative files one asset produces. */
function outputs(asset) {
    const kind = asset.kind;
    return {
        vc: `art/vc/${asset.id}.vectorcraft`,
        svg: `art/out/${kind}/${asset.id}.svg`,
        png: (asset.png ?? []).map((px) => ({ px, file: `art/out/${kind}/${asset.id}-${px}.png` })),
    };
}

/** The exact command list for one asset, with every path inside the work folder. */
function steps(asset, width, expandable) {
    const o = outputs(asset);
    const w = (rel) => `${WORK}/${rel}`;
    return [
        { command: 'select.all', params: {} },
        // Strokes become filled outlines and live shapes plain paths, so every renderer draws the same thing.
        // VectorCraft refuses an expand that changes nothing, so the step is there only when the probe finds work.
        ...(expandable ? [{ command: 'object.expand', params: { object: true, fill: true, stroke: true } }] : []),
        { command: 'document.save', params: { path: w(o.vc) } },
        { command: 'document.export', params: { path: w(o.svg), format: 'svg', decimals: 2, outlineText: true, minify: true, objectIds: 'minimal', metadata: false } },
        ...o.png.map(({ px, file }) => ({ command: 'document.export', params: { path: w(file), format: 'png', scale: px / width } })),
    ];
}

/**
 * VectorCraft stamps the build time into two places: a PNG `tEXt` chunk ("Creation Time") and the
 * native file's `created`/`modified` fields. Both are removed or pinned to 0 so a rebuild from the
 * same steps gives the same bytes; nothing else in the files is touched.
 */
function normalise(file) {
    const b = fs.readFileSync(file);
    if (file.endsWith('.png')) {
        const parts = [b.subarray(0, 8)];
        for (let i = 8; i < b.length;) {
            const n = b.readUInt32BE(i);
            const chunk = b.subarray(i, i + 12 + n);
            const isTime = chunk.toString('latin1', 4, 8) === 'tEXt' && chunk.toString('latin1', 8, 8 + 13) === 'Creation Time';
            if (!isTime) parts.push(chunk);
            i += 12 + n;
        }
        fs.writeFileSync(file, Buffer.concat(parts));
    } else if (file.endsWith('.vectorcraft')) {
        fs.writeFileSync(file, b.toString('utf8').replace(/"(created|modified)": \d+/g, '"$1": 0'));
    }
}

/** Runs a command list headless on a file in the work folder; returns one parsed result per step. */
function vc(srcWork, stepsWork) {
    const out = execFileSync(CLI, ['run', '--in', srcWork, '--commands', stepsWork], { encoding: 'utf8' });
    return out.trim().split('\n').map((l) => JSON.parse(l));
}

/** Whether object.expand would change anything in the source (object.expand.info). */
function probeExpandable(asset) {
    const probe = `${WORK}/art/steps/.probe.json`;
    fs.writeFileSync(probe, JSON.stringify([{ command: 'select.all', params: {} }, { command: 'object.expand.info', params: {} }]));
    const info = vc(`${WORK}/${asset.src}`, probe).find((r) => r.command === 'object.expand.info').result;
    fs.rmSync(probe);
    return Boolean(info.object || info.fill || info.stroke);
}

function run(asset) {
    const srcAbs = path.join(ROOT, asset.src);
    const svgText = fs.readFileSync(srcAbs, 'utf8');
    fs.mkdirSync(path.dirname(path.join(WORK, asset.src)), { recursive: true });
    fs.mkdirSync(path.join(WORK, 'art/steps'), { recursive: true });
    fs.copyFileSync(srcAbs, path.join(WORK, asset.src));
    const list = steps(asset, artboardWidth(svgText, asset.src), probeExpandable(asset));
    const stepsRel = `art/steps/${asset.id}.steps.json`;
    const stepsText = JSON.stringify(list, null, 1) + '\n';
    if (!check) fs.writeFileSync(path.join(ROOT, stepsRel), stepsText);
    else if (!fs.existsSync(path.join(ROOT, stepsRel)) || fs.readFileSync(path.join(ROOT, stepsRel), 'utf8') !== stepsText) {
        differences++;
        console.log(`✖ ${stepsRel} is not the command list this job produces`);
    }

    for (const rel of [asset.src, stepsRel, ...Object.values(outputs(asset)).flat().map((x) => x.file ?? x)]) {
        fs.mkdirSync(path.dirname(path.join(WORK, rel)), { recursive: true });
    }
    fs.copyFileSync(srcAbs, path.join(WORK, asset.src));
    fs.writeFileSync(path.join(WORK, stepsRel), stepsText);

    const out = execFileSync(CLI, ['run', '--in', `${WORK}/${asset.src}`, '--commands', `${WORK}/${stepsRel}`], { encoding: 'utf8' });
    const results = out.trim().split('\n').map((l) => JSON.parse(l));
    const failed = results.filter((r) => r.error || (r.result?.warnings ?? []).length);
    if (failed.length) throw new Error(`${asset.id}: ${JSON.stringify(failed)}`);
    return results;
}


for (const job of jobs) {
    for (const asset of job.assets) {
        run(asset);
        const o = outputs(asset);
        for (const rel of [o.vc, o.svg, ...o.png.map((p) => p.file)]) {
            normalise(path.join(WORK, rel));
            const built = fs.readFileSync(path.join(WORK, rel));
            const repo = path.join(ROOT, rel);
            if (check) {
                const same = fs.existsSync(repo) && Buffer.compare(built, fs.readFileSync(repo)) === 0;
                if (!same) { differences++; console.log(`✖ ${rel} differs from a clean rebuild`); }
            } else {
                fs.mkdirSync(path.dirname(repo), { recursive: true });
                fs.writeFileSync(repo, built);
            }
        }
        console.log(`${check ? '✔ checked' : '✔ built'} ${asset.id}`);
    }
}
if (check) {
    console.log(differences ? `✖ ${differences} file(s) differ` : '✔ every export matches a clean rebuild from its steps.json');
    process.exit(differences ? 1 : 0);
}
