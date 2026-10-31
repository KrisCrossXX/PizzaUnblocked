// Local development server. GameMaker ports need the same cross-origin
// isolation headers used by the deployed Cloudflare Worker.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 8765);
const mime = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.wasm': 'application/wasm',
    '.data': 'application/octet-stream', '.unx': 'application/octet-stream',
    '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf',
};

http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end('Bad URL'); return; }

    // Client-side clean routes share index.html.
    pathname = pathname.replace(/\/index\.html\/(?:mods|extras|library|credits|themes)\/?$/, '/index.html');
    let file = path.resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }

    fs.stat(file, (error, stat) => {
        if (!error && stat.isDirectory()) file = path.join(file, 'index.html');
        fs.stat(file, (fileError, fileStat) => {
            if (fileError || !fileStat.isFile()) { res.writeHead(404).end('Not found'); return; }
            const headers = {
                'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'credentialless',
                'Cache-Control': 'no-store',
                'Accept-Ranges': 'bytes',
            };
            const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
            if (range) {
                const start = range[1] ? Number(range[1]) : Math.max(0, fileStat.size - Number(range[2]));
                const end = range[2] && range[1] ? Math.min(fileStat.size - 1, Number(range[2])) : fileStat.size - 1;
                if (start > end || start >= fileStat.size) {
                    res.writeHead(416, { ...headers, 'Content-Range': `bytes */${fileStat.size}` }).end();
                    return;
                }
                res.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${fileStat.size}` });
                if (req.method === 'HEAD') res.end(); else fs.createReadStream(file, { start, end }).pipe(res);
                return;
            }
            res.writeHead(200, { ...headers, 'Content-Length': fileStat.size });
            if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
        });
    });
}).listen(port, '127.0.0.1', () => console.log(`Pizza Unblocked on http://127.0.0.1:${port}`));
