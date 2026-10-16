// Minimal static server for Pizza Unblocked — no dependencies.
// Usage: node server.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT || 8000);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain; charset=utf-8',
    '.ico': 'image/x-icon',
    '.win': 'application/octet-stream',
    '.bank': 'application/octet-stream',
    '.def': 'application/octet-stream',
};

http.createServer((req, res) => {
    let urlPath;
    try {
        urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch {
        res.writeHead(400); res.end('bad request'); return;
    }
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const file = path.normalize(path.join(ROOT, urlPath));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }

    // Godot web exports need SharedArrayBuffer → cross-origin isolation headers
    const coi = urlPath.startsWith('/games/jwvl/') || urlPath === '/games/jwvl';
    const headers = {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
    };
    if (coi) {
        headers['Cross-Origin-Opener-Policy'] = 'same-origin';
        headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    }

    fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { res.writeHead(404); res.end('not found'); return; }
        headers['Content-Length'] = st.size;
        res.writeHead(200, headers);
        fs.createReadStream(file).pipe(res);
    });
}).listen(PORT, () => console.log(`Pizza Unblocked → http://localhost:${PORT}`));
