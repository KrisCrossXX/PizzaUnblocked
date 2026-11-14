// sw.js — per-site chunk stitcher for large game files.
// Game files >95MB are committed to git as <name>.part.NNN slices (chunks.json);
// >19MB files also live as .part.NNN slices on jsDelivr (games-manifest.json).
// This worker stitches either set into one response so loaders see whole files.
//
// jsDelivr parts are fetched straight from the CDN (CORS-open), so multi-hundred-MB
// payloads assemble without the Pages worker's ~30s stream cap.
//
// Fallback: if a same-origin request comes back non-OK, retry against the Pages
// mirror so the site keeps working when this mirror is missing files.
const FALLBACK_ORIGIN = 'https://pizza-tower-9iw.pages.dev';
const JSD = 'https://cdn.jsdelivr.net/gh/KrisCrossXX';
const GAME_REFS = {
    1: '4b0766e3d6ac240958143d748ab228fc9a4b5c0e',
    2: '4eeecdda4f164b3f30154c44752e22bfbcc9c15f',
    3: '6789892173b2720dce6999b065a6045fdeacceaf',
    4: '44fbdd8006a6074ea20d4e05a25fe39e50a9c77d',
    5: '724d238545e547f30a3ff7424c20a336c9389e52',
    6: '197260999e1fd089268975ee34efd42a8cda21ad',
};
const jdPart = (key, r, i) =>
    `${JSD}/pizza-games-${r}@${GAME_REFS[r]}/${key.split('/').map(encodeURIComponent).join('/')}.part.${String(i).padStart(3, '0')}`;

let manifestPromise, gamesPromise;
const manifest = () => manifestPromise ||=
    fetch('chunks.json').then(r => r.json()).catch(() => ({}));
const gamesManifest = () => gamesPromise ||=
    fetch('games-manifest.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

const MIME_FIX = { html: 'text/html', mjs: 'text/javascript', js: 'text/javascript', wasm: 'application/wasm', json: 'application/json', css: 'text/css', svg: 'image/svg+xml' };

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
    const ext = (url.pathname.match(/\.([a-z0-9]{1,10})$/i) || [])[1]?.toLowerCase();
    if (MIME_FIX[ext] && up.headers.get('content-type') === 'application/octet-stream') {
        const h = new Headers(up.headers);
        h.set('content-type', MIME_FIX[ext]);
        return new Response(request.method === 'HEAD' ? null : up.body, {
            status: up.status, statusText: up.statusText, headers: h,
        });
    }
    return up;
}

function stitch(partsFetcher, count, mime, size) {
    const stream = new ReadableStream({
        async start(ctrl) {
            try {
                for (let i = 0; i < count; i++) {
                    const r = await partsFetcher(i);
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
            'content-type': mime,
            'content-length': String(size),
            'cross-origin-resource-policy': 'same-origin',
            'cache-control': 'public, max-age=86400',
        },
    });
}

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;
    if (e.request.method !== 'GET' && e.request.method !== 'HEAD') return;
    e.respondWith((async () => {
        const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');

        // jsDelivr-sharded game payloads: stitched in-browser, no worker stream cap
        if (path.startsWith('games/')) {
            const gm = await gamesManifest();
            let key = path, info = gm[key];
            if (!info && (key.endsWith('/') || !/\.[a-z0-9]{1,10}$/i.test(key))) {
                const dk = key.replace(/\/?$/, '/index.html');
                if (gm[dk]) { key = dk; info = gm[dk]; }
            }
            if (info?.p) {
                return stitch(i => fetch(jdPart(key, info.r, i)), info.p,
                    info.m || 'application/octet-stream', info.s);
            }
            return passthrough(e.request, url);
        }

        const m = await manifest();
        const key = Object.keys(m).find(k => path === k || path.endsWith('/' + k));
        if (!key) return passthrough(e.request, url);
        const info = m[key];
        return stitch(i => fetchPart(key, i), info.parts, info.mime, info.size);
    })());
});
