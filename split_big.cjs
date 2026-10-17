// split_big.cjs — splits every file >95MB under catalog game dirs into
// <name>.part.NNN chunks (<=85MB) that git can push, writes chunks.json manifest,
// and replaces oversized index.html entry pages with a service-worker bootstrap.
// Original non-html big files stay on disk (gitignored) so local play is unaffected.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const LIMIT = 95 * 1048576;
const PART = 85 * 1048576;

const src = fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8');
const dirs = [...new Set([...src.matchAll(/dir: '([^']+)'/g)].map(m => m[1]))];
dirs.push('pizzatower');

const MIME = { html: 'text/html; charset=utf-8', wasm: 'application/wasm', unx: 'application/octet-stream', data: 'application/octet-stream', pck: 'application/octet-stream' };
const big = [];
for (const d of dirs) {
    const g = path.join(root, 'games', d);
    if (!fs.existsSync(g)) continue;
    (function walk(p) {
        for (const f of fs.readdirSync(p, { withFileTypes: true })) {
            const fp = path.join(p, f.name);
            if (f.isDirectory()) walk(fp);
            else if (fs.statSync(fp).size > LIMIT) big.push(fp);
        }
    })(g);
}

const manifest = {};
const ignored = [];
const htmlBoot = `<!DOCTYPE html><meta charset="utf-8"><title>loading</title>
<script src="../../swreg.js"></script>
<script>
navigator.serviceWorker.ready.then(() => location.reload());
</script>
loading...`;

for (const fp of big) {
    const rel = path.relative(root, fp).replace(/\\/g, '/');
    const size = fs.statSync(fp).size;
    const isIndexHtml = path.basename(fp) === 'index.html';
    // html entry pages keep their real content under .real for local use too? — no:
    // committed index.html must be the bootstrap stub, real bytes live in parts only.
    const srcFile = fp;
    const fd = fs.openSync(srcFile, 'r');
    const parts = Math.ceil(size / PART);
    const buf = Buffer.allocUnsafe(PART);
    for (let i = 0; i < parts; i++) {
        const n = fs.readSync(fd, buf, 0, PART, i * PART);
        fs.writeFileSync(fp + '.part.' + String(i).padStart(3, '0'), buf.subarray(0, n));
    }
    fs.closeSync(fd);
    const ext = path.extname(fp).slice(1).toLowerCase();
    manifest[rel] = { parts, size, mime: MIME[ext] || 'application/octet-stream' };
    if (isIndexHtml) {
        fs.writeFileSync(fp, htmlBoot); // committed entry = sw bootstrap stub
    } else {
        ignored.push(rel); // original stays on disk for local play, git tracks only parts
    }
    console.log(`${(size / 1048576).toFixed(0)}M x${parts}  ${rel}${isIndexHtml ? '  [entry→stub]' : ''}`);
}
fs.writeFileSync(path.join(root, 'chunks.json'), JSON.stringify(manifest));
fs.writeFileSync(path.join(root, '.bigfiles'), ignored.join('\n') + '\n');
console.log(`\nchunks.json: ${Object.keys(manifest).length} files; ${ignored.length} originals gitignored`);
