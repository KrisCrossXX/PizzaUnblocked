// sw.js — per-site chunk stitcher for this mirror's large game files.
// Game files >95MB are committed to git as
// <name>.part.NNN slices (GitHub rejects >100MB pushes). This worker intercepts
// same-origin requests for the logical file and streams the parts back as one
// response, so game loaders never know the file was split.
//
// Fallback: if the Pages proxy worker is down (functions quota exhausted etc),
// any same-origin request that comes back non-OK is retried against the Bunny
// mirror, so the whole site — including game pages and parts — keeps working.
const FALLBACK_ORIGIN = 'https://pizzaunblocked.b-cdn.net';

let manifestPromise;
const manifest = () => manifestPromise ||=
    fetch('chunks.json').then(r => r.json()).catch(() => ({}));

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

async function fetchPart(key, i) {
    const name = key + '.part.' + String(i).padStart(3, '0');
    const r = await fetch(name);
    if (r.ok && r.body) return r;
    return fetch(`${FALLBACK_ORIGIN}/${name}`);
}

async function passthrough(request, url) {
    const r = await fetch(request);
    if (r.ok) return r;
    const up = await fetch(`${FALLBACK_ORIGIN}${url.pathname}${url.search}`, {
        method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    });
    // mirror COI headers onto fallback documents so games can still isolate
    if (request.mode === 'navigate' && up.ok) {
        const html = await up.text();
        return new Response(html, {
            status: up.status,
            headers: {
                'content-type': 'text/html;charset=UTF-8',
                'cross-origin-opener-policy': 'same-origin',
                'cross-origin-embedder-policy': 'credentialless',
            },
        });
    }
    return up;
}

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;
    if (e.request.method !== 'GET' && e.request.method !== 'HEAD') return;
    e.respondWith((async () => {
        const m = await manifest();
        const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        const key = Object.keys(m).find(k => path === k || path.endsWith('/' + k));
        if (!key) return passthrough(e.request, url);
        const info = m[key];
        const stream = new ReadableStream({
            async start(ctrl) {
                try {
                    for (let i = 0; i < info.parts; i++) {
                        const r = await fetchPart(key, i);
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
