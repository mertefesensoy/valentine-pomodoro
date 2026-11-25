// Google Play's 16 KB page-size check, without the SDK's build-tools (the Android closed-test plan, Stage 2).
// Reads an APK or AAB (both are zips) and reports, for every 64-bit native library (arm64-v8a, x86_64), the
// smallest PT_LOAD alignment in its ELF program headers, which must be at least 16384, and whether a stored
// (uncompressed) entry starts on a 16 KB boundary in the zip. Exits 1 if any library is under 16 KB.
// Usage: node scripts/android/check-16k.mjs <apk-or-aab>
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const buf = readFileSync(process.argv[2]);
let eocd = -1;
for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
}
if (eocd < 0) throw new Error('no end of central directory');
const count = buf.readUInt16LE(eocd + 10);
let p = buf.readUInt32LE(eocd + 16);
const rows = [];
for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central header at ' + p);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    // An APK keeps them under lib/, an AAB under base/lib/ (or a feature module's own lib/).
    if (!/(^|\/)lib\/(arm64-v8a|x86_64)\/.+\.so$/.test(name)) continue;
    const dataStart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(dataStart, dataStart + csize);
    const elf = method === 0 ? raw : inflateRawSync(raw);
    // ELF64 little-endian: e_phoff at 0x20 (8 bytes), e_phentsize at 0x36, e_phnum at 0x38.
    const phoff = Number(elf.readBigUInt64LE(0x20));
    const phentsize = elf.readUInt16LE(0x36), phnum = elf.readUInt16LE(0x38);
    let minAlign = Infinity;
    for (let k = 0; k < phnum; k++) {
        const h = phoff + k * phentsize;
        if (elf.readUInt32LE(h) !== 1) continue; // PT_LOAD
        minAlign = Math.min(minAlign, Number(elf.readBigUInt64LE(h + 0x30)));
    }
    rows.push({ name, stored: method === 0, zipAligned16k: method === 0 ? dataStart % 16384 === 0 : null, minLoadAlign: minAlign });
}
const bad = rows.filter((r) => r.minLoadAlign < 16384);
for (const r of rows) console.log(`${r.minLoadAlign >= 16384 ? 'ok ' : 'BAD'} align=${r.minLoadAlign} stored=${r.stored} zip16k=${r.zipAligned16k} ${r.name}`);
console.log(`\n${rows.length} 64-bit libraries, ${bad.length} with a PT_LOAD alignment under 16 KB`);
if (rows.length === 0) throw new Error('no 64-bit native libraries found: is this an APK or AAB?');
if (bad.length > 0) process.exit(1);
