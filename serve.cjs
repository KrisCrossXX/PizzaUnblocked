const fs = require('fs'), p = require('path');
require('http').createServer((q, s) => {
    let f = p.join(process.cwd(), decodeURIComponent(q.url.split('?')[0]));
    if (/\/(mods|extras)\/?$/.test(q.url) || /^\/index\.html\//.test(q.url)) f = p.join(process.cwd(), 'index.html');
    if (f.endsWith(p.sep) || f.endsWith('/')) f = p.join(f, 'index.html');
    fs.readFile(f, (e, d) => {
        if (e) { s.writeHead(404); s.end(); return; }
        const t = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.json': 'application/json', '.wasm': 'application/wasm', '.bank': 'application/octet-stream', '.unx': 'application/octet-stream', '.win': 'application/octet-stream', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.txt': 'text/plain', '.def': 'text/plain' };
        s.writeHead(200, { 'Content-Type': t[p.extname(f)] || 'application/octet-stream' });
        s.end(d);
    });
}).listen(8932, () => console.log('up'));
