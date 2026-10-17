/* Pizza Unblocked — replay recorder.
   Injected into game pages. Records the game canvas to webm via
   captureStream + MediaRecorder, stores replays in IndexedDB
   (db 'pu-replays', store 'replays'), plays them back in an overlay.
   Auto-hides when the page has no capturable canvas / no MediaRecorder
   ("compatible games" = any canvas game in a modern browser). */
(function () {
    if (window.__puReplay) return;
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream || !window.indexedDB) return;

    const GAME = location.pathname.split('/').filter(Boolean).slice(-2)[0] || 'unknown';
    const IDB_NAME = 'pu-replays', IDB_STORE = 'replays';

    function db() {
        return new Promise((res, rej) => {
            const r = indexedDB.open(IDB_NAME, 1);
            r.onupgradeneeded = () => r.result.createObjectStore(IDB_STORE, { autoIncrement: true });
            r.onsuccess = () => res(r.result);
            r.onerror = () => rej(r.error);
        });
    }
    async function saveReplay(rec) {
        const d = await db();
        return new Promise((res, rej) => {
            const tx = d.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).add(rec);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    }
    async function listReplays() {
        const d = await db();
        return new Promise((res, rej) => {
            const out = [];
            const cur = d.transaction(IDB_STORE).objectStore(IDB_STORE).openCursor();
            cur.onsuccess = () => {
                if (cur.result) {
                    if (cur.result.value.game === GAME) out.push({ key: cur.result.primaryKey, ...cur.result.value, blob: undefined, hasBlob: true });
                    cur.result.continue();
                } else res(out);
            };
            cur.onerror = () => rej(cur.error);
        });
    }
    async function getReplay(key) {
        const d = await db();
        return new Promise((res, rej) => {
            const r = d.transaction(IDB_STORE).objectStore(IDB_STORE).get(key);
            r.onsuccess = () => res(r.result);
            r.onerror = () => rej(r.error);
        });
    }
    async function delReplay(key) {
        const d = await db();
        return new Promise((res, rej) => {
            const tx = d.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).delete(key);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    }

    const css = document.createElement('style');
    css.textContent =
        '#pu-rec{position:fixed;top:8px;right:10px;z-index:99998;display:flex;gap:6px;font:13px monospace}' +
        '#pu-rec button{background:rgba(0,0,0,.75);color:#fff;border:1px solid #fff;font:inherit;' +
        'padding:4px 10px;cursor:pointer}' +
        '#pu-rec button:hover{border-color:#ffd75e;color:#ffd75e}' +
        '#pu-rec .pu-rec-on{color:#f44;border-color:#f44}' +
        '#pu-panel{position:fixed;top:44px;right:10px;z-index:99998;min-width:240px;max-height:60vh;' +
        'overflow-y:auto;background:rgba(0,0,0,.9);border:1px solid #fff;font:12px monospace;color:#fff;padding:8px}' +
        '#pu-panel .row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #333}' +
        '#pu-panel .row span{flex:1}' +
        '#pu-panel button{background:none;border:1px solid #fff;color:#fff;font:inherit;cursor:pointer;padding:1px 6px}' +
        '#pu-panel .empty{color:#888;padding:8px}' +
        '#pu-vid{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.92);display:grid;place-items:center}' +
        '#pu-vid video{max-width:96vw;max-height:92vh;background:#000}' +
        '#pu-vid .close{position:absolute;top:10px;right:14px;background:#000;border:1px solid #fff;' +
        'color:#fff;font:16px monospace;padding:4px 12px;cursor:pointer}';
    document.documentElement.appendChild(css);

    const bar = document.createElement('div');
    bar.id = 'pu-rec';
    bar.innerHTML = '<button id="pu-recBtn">rec</button><button id="pu-listBtn">replays</button>';
    bar.style.display = 'none';
    document.documentElement.appendChild(bar);

    const panel = document.createElement('div');
    panel.id = 'pu-panel';
    panel.hidden = true;
    document.documentElement.appendChild(panel);

    let canvas = null, rec = null, chunks = [], t0 = 0;

    async function refreshPanel() {
        const items = await listReplays();
        panel.innerHTML = '<div style="color:#ffd75e;margin-bottom:4px">replays — ' + GAME + '</div>';
        if (!items.length) panel.innerHTML += '<div class="empty">no replays yet</div>';
        for (const r of items.reverse()) {
            const row = document.createElement('div');
            row.className = 'row';
            const dt = new Date(r.t);
            row.innerHTML = `<span>${dt.toLocaleDateString()} ${dt.toLocaleTimeString()} · ${(r.dur / 1000).toFixed(0)}s · ${(r.size / 1048576).toFixed(1)}mb</span>`;
            const pb = document.createElement('button');
            pb.textContent = 'play';
            pb.onclick = () => play(r.key);
            const db2 = document.createElement('button');
            db2.textContent = 'x';
            db2.onclick = async () => { await delReplay(r.key); refreshPanel(); };
            row.appendChild(pb); row.appendChild(db2);
            panel.appendChild(row);
        }
    }

    async function play(key) {
        const r = await getReplay(key);
        if (!r || !r.blob) return;
        const ov = document.createElement('div');
        ov.id = 'pu-vid';
        const v = document.createElement('video');
        v.src = URL.createObjectURL(r.blob);
        v.controls = true; v.autoplay = true;
        const c = document.createElement('button');
        c.className = 'close'; c.textContent = 'close';
        const done = () => { URL.revokeObjectURL(v.src); ov.remove(); };
        c.onclick = done;
        v.onended = null;
        ov.appendChild(v); ov.appendChild(c);
        document.documentElement.appendChild(ov);
    }

    function pickMime() {
        for (const m of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'])
            if (MediaRecorder.isTypeSupported(m)) return m;
        return '';
    }

    const recBtn = bar.querySelector('#pu-recBtn');
    const listBtn = bar.querySelector('#pu-listBtn');
    recBtn.onclick = () => {
        if (rec) { stop(); return; }
        const mime = pickMime();
        if (!mime || !canvas) return;
        try {
            rec = new MediaRecorder(canvas.captureStream(60), { mimeType: mime, videoBitsPerSecond: 6000000 });
        } catch { rec = null; return; }
        chunks = []; t0 = Date.now();
        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = async () => {
            const blob = new Blob(chunks, { type: mime });
            chunks = [];
            try { await saveReplay({ game: GAME, t: t0, dur: Date.now() - t0, size: blob.size, blob }); } catch {}
            if (!panel.hidden) refreshPanel();
        };
        rec.start(1000);
        recBtn.textContent = 'stop';
        recBtn.classList.add('pu-rec-on');
    };
    function stop() {
        if (!rec) return;
        rec.stop(); rec = null;
        recBtn.textContent = 'rec';
        recBtn.classList.remove('pu-rec-on');
    }
    listBtn.onclick = () => { panel.hidden = !panel.hidden; if (!panel.hidden) refreshPanel(); };

    // wait for the game canvas to appear (engines create it async)
    let tries = 0;
    const iv = setInterval(() => {
        canvas = document.querySelector('canvas');
        if (canvas || ++tries > 120) {
            clearInterval(iv);
            if (canvas) bar.style.display = 'flex';
        }
    }, 1000);

    window.__puReplay = { start: () => recBtn.onclick(), stop, list: listReplays };
})();
