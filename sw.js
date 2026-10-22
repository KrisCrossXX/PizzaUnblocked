// sw.js — per-site chunk stitcher for this mirror's large game files.
// Game files >95MB are committed to git as
// <name>.part.NNN slices (GitHub rejects >100MB pushes). This worker intercepts
// same-origin requests for the logical file and streams the parts back as one
// response, so game loaders never know the file was split.
let manifestPromise;
const manifest = () => manifestPromise ||=
    fetch('chunks.json').then(r => r.json()).catch(() => ({}));

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;
    e.respondWith((async () => {
        const m = await manifest();
        const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        const key = Object.keys(m).find(k => path === k || path.endsWith('/' + k));
        if (!key) return fetch(e.request); // not chunked — pass through
        const info = m[key];
        const stream = new ReadableStream({
            async start(ctrl) {
                try {
                    for (let i = 0; i < info.parts; i++) {
                        const r = await fetch(key + '.part.' + String(i).padStart(3, '0'));
                        if (!r.ok || !r.body) throw new Error('missing part ' + i);
                        const rd = r.body.getReader();
                        for (;;) {
                            const { done, value } = await rd.read();
                            if (done) break;
                            ctrl.enqueue(value);
                        }
                    }
                    ctrl.close();
                } catch (err) { ctrl.error(err); }
            },
        });
        return new Response(stream, {
            status: 200,
            headers: {
                'content-type': info.mime,
                'content-length': String(info.size),
                'cross-origin-resource-policy': 'same-origin',
                'cache-control': 'public, max-age=86400',
            },
        });
    })());
});
