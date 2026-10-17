// ---------- theme music (from js/music.js: bgm, bgmStarted, bgmWanted) ----------

// ---------- icon sfx ----------
const sfx = {};
function playSfx(name) {
    if (!sfx[name]) { sfx[name] = new Audio('assets/sfx/' + name + '.ogg'); sfx[name].preload = 'auto'; }
    const a = sfx[name];
    a.currentTime = 0;
    a.play().catch(() => {});
}
for (const el of document.querySelectorAll('[data-sfx]')) {
    const name = el.dataset.sfx;
    el.addEventListener('mouseenter', () => playSfx(name));
    el.addEventListener('click', () => playSfx(name));
}

// ---------- popups ----------
function openPop(id) { document.getElementById(id).hidden = false; }
function closePop(id) { document.getElementById(id).hidden = true; }
for (const b of document.querySelectorAll('[data-close]'))
    b.addEventListener('click', () => closePop(b.dataset.close));
for (const o of document.querySelectorAll('.overlay'))
    o.addEventListener('mousedown', (e) => { if (e.target === o) o.hidden = true; });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') for (const o of document.querySelectorAll('.overlay')) o.hidden = true;
});

document.getElementById('gearBtn').addEventListener('click', () => openPop('popSettings'));
document.getElementById('clBtn').addEventListener('click', () => { renderChangelog(); openPop('popChangelog'); });
const DISCORD_URL = 'https://discord.gg/Yv7Ms7KMnq';
// arrow icon = download the single-file site; pizza icon = discord
document.getElementById('dlBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = 'pizza-unblocked.html';
    a.download = 'pizza-unblocked.html';
    a.click();
});
const pizzaBtn = document.querySelector('.pizza-icon');
pizzaBtn.removeAttribute('onclick');
pizzaBtn.title = 'discord';
pizzaBtn.addEventListener('click', () => window.open(DISCORD_URL, '_blank'));

// ---------- changelog ----------
function renderChangelog() {
    const body = document.getElementById('clBody');
    body.innerHTML = '';
    for (const e of CHANGELOG) {
        const h = document.createElement('div');
        h.className = 'cl-head';
        h.innerHTML = `<span class="cl-title">${e.title}</span> <span class="cl-date">${e.date}</span>`;
        body.appendChild(h);
        for (const g of e.groups) {
            const lbl = document.createElement('div');
            lbl.className = 'cl-label';
            lbl.textContent = g.label;
            body.appendChild(lbl);
            const ul = document.createElement('ul');
            ul.className = 'cl-list';
            for (const it of g.items) {
                const li = document.createElement('li');
                li.textContent = it;
                ul.appendChild(li);
            }
            body.appendChild(ul);
        }
    }
}

// ---------- settings ----------
const audioBtn = document.getElementById('audioBtn');
const volSlider = document.getElementById('volSlider');
function syncAudioUi() {
    const on = localStorage.getItem('pu_audio') !== 'off';
    audioBtn.textContent = 'audio: ' + (on ? 'on' : 'off');
    audioBtn.classList.toggle('sel', on);
    volSlider.value = Math.round(bgm.volume * 100);
}
audioBtn.addEventListener('click', () => {
    const on = localStorage.getItem('pu_audio') !== 'off';
    localStorage.setItem('pu_audio', on ? 'off' : 'on');
    if (on) bgm.pause(); else { bgmStarted = true; bgm.play().catch(() => {}); }
    syncAudioUi();
});
volSlider.addEventListener('input', () => {
    bgm.volume = volSlider.value / 100;
    localStorage.setItem('pu_vol', volSlider.value);
});
syncAudioUi();

// tab cloak
const CLOAKS = {
    google: ['Google', 'https://www.google.com/favicon.ico'],
    canvas: ['Canvas', 'https://www.instructure.com/favicon.ico'],
    clever: ['Clever | Portal', 'https://clever.com/favicon.ico'],
    drive: ['My Drive - Google Drive', 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png'],
    classroom: ['Classes', 'https://ssl.gstatic.com/classroom/favicon.png'],
};
const cloakSel = document.getElementById('cloakSel');
function applyCloak(key) {
    const c = CLOAKS[key];
    document.title = c ? c[0] : 'Pizza Unblocked';
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = c ? c[1] : 'assets/pizza-icon.png';
}
cloakSel.value = localStorage.getItem('pu_cloak') || '';
cloakSel.addEventListener('change', () => {
    localStorage.setItem('pu_cloak', cloakSel.value);
    applyCloak(cloakSel.value);
});
applyCloak(cloakSel.value);

const onlineBtn = document.getElementById('onlineBtn');
onlineBtn.textContent = 'online counter: on';
onlineBtn.classList.add('sel');

const panicBtn = document.getElementById('panicBtn');
panicBtn.addEventListener('click', () => {
    const on = localStorage.getItem('pu_panic') === 'on';
    localStorage.setItem('pu_panic', on ? 'off' : 'on');
    panicBtn.textContent = 'panic button: ' + (on ? 'off' : 'on');
    panicBtn.classList.toggle('sel', !on);
});
panicBtn.textContent = 'panic button: ' + (localStorage.getItem('pu_panic') === 'on' ? 'on' : 'off');
panicBtn.classList.toggle('sel', localStorage.getItem('pu_panic') === 'on');
document.addEventListener('keydown', (e) => {
    if (e.key === '`' && localStorage.getItem('pu_panic') === 'on') location.href = 'https://www.google.com';
});

// ---------- tools ----------
document.getElementById('prankBtn').addEventListener('click', () => { openPop('popPrank'); initPrank(); });
const padBtn = document.getElementById('padBtn');
function syncPadUi() {
    const on = localStorage.getItem('pu_gamepad') !== 'off';
    const n = ('getGamepads' in navigator ? navigator.getGamepads() : []).filter(p => p && p.connected).length;
    padBtn.textContent = 'controller: ' + (on ? 'on' : 'off') + (n ? ` (${n} connected)` : '');
    padBtn.classList.toggle('sel', on);
}
padBtn.addEventListener('click', () => {
    const on = localStorage.getItem('pu_gamepad') !== 'off';
    localStorage.setItem('pu_gamepad', on ? 'off' : 'on');
    syncPadUi();
});
window.addEventListener('gamepadconnected', syncPadUi);
window.addEventListener('gamepaddisconnected', syncPadUi);
syncPadUi();

// ---------- themes ----------
// cls = filter class on .bgimg ('' = default look, 'theme-black' = off)
// song = optional override for the theme music track (defaults to theme.mp3)
const THEMES = [
    { name: 'the tower',   cls: '' },
    // song = optional override for the theme music (defaults to theme.mp3)
];
const bgimgEl = document.querySelector('.bgimg');
const themeGrid = document.getElementById('themeGrid');

function applyTheme(t) {
    bgimgEl.className = 'bgimg ' + (t.cls || '');
    const src = t.song || 'assets/theme.mp3';
    if (!bgm.src.endsWith(src)) {
        const wasPlaying = bgmStarted && !bgm.paused;
        bgm.src = src;
        if (wasPlaying) bgm.play().catch(() => {});
    }
    localStorage.setItem('pu_theme', t.name);
    for (const c of themeGrid.children) c.classList.toggle('sel', c.dataset.name === t.name);
}
for (const t of THEMES) {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.dataset.name = t.name;
    card.innerHTML = `<img class="tprev ${t.cls}" src="assets/bg.gif" alt=""><div class="tname">${t.name}</div>`;
    card.addEventListener('click', () => applyTheme(t));
    themeGrid.appendChild(card);
}
applyTheme(THEMES.find(t => t.name === localStorage.getItem('pu_theme')) || THEMES[0]);

// ---------- save manager (localStorage + IndexedDB, versioned backup) ----------
const BACKUP_FORMAT = 'pizza-unblocked-backup';
const BACKUP_VERSION = 2;
function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function unb64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer; }
async function encodeVal(v) {
    if (v instanceof Blob) return { __blob: b64(await v.arrayBuffer()), type: v.type };
    if (v instanceof ArrayBuffer) return { __ab: b64(v) };
    if (ArrayBuffer.isView(v)) return { __ta: b64(v.buffer), type: v.constructor.name };
    if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = await encodeVal(v[k]); return o; }
    return v;
}
function decodeVal(v) {
    if (v && typeof v === 'object') {
        if (v.__blob) return new Blob([unb64(v.__blob)], { type: v.type });
        if (v.__ab) return unb64(v.__ab);
        if (v.__ta) return new window[v.type](unb64(v.__ta));
        const o = {}; for (const k in v) o[k] = decodeVal(v[k]); return o;
    }
    return v;
}
function openDb(name) {
    return new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
function getAll(store) { return new Promise((res, rej) => { const r = store.getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function getAllKeys(store) { return new Promise((res, rej) => { const r = store.getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

// per-game save adapters — which storage keys/dbs belong to each port.
// gx/oprt saves persist under localStorage prefix pu_gs:<dir>:
const SAVE_ADAPTERS = [
    { dir: '*', label: 'site settings', match: k => k.startsWith('pu_') && !k.startsWith('pu_gs:') },
];
for (const g of [{ dir: 'pizzatower', name: 'pizza tower' },
    ...(typeof MODS !== 'undefined' ? MODS : []), ...(typeof FANGAMES !== 'undefined' ? FANGAMES : [])]) {
    SAVE_ADAPTERS.push({ dir: g.dir, label: g.name, match: k => k.startsWith('pu_gs:' + g.dir + ':') });
}

async function buildBackup(filter) {
    const dump = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exported: new Date().toISOString(), ls: {}, idb: {} };
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!filter || filter(k)) dump.ls[k] = localStorage.getItem(k);
    }
    if (indexedDB.databases) {
        for (const { name } of await indexedDB.databases()) {
            const db = await openDb(name);
            const stores = {};
            for (const sn of db.objectStoreNames) {
                const st = db.transaction(sn, 'readonly').objectStore(sn);
                const [vals, keys] = await Promise.all([getAll(st), getAllKeys(st)]);
                let list = vals.map((v, i) => ({ v, k: keys[i] }));
                if (filter && name === 'pu-replays') list = list.filter(e => e.v && e.v.game === filter.__game);
                stores[sn] = { vals: await Promise.all(list.map(e => encodeVal(e.v))), keys: list.map(e => String(e.k)) };
            }
            if (!filter || name === 'pu-prank' || name === 'pu-replays' || Object.values(stores).some(s => s.vals.length))
                dump.idb[name] = { version: db.version, stores };
            db.close();
        }
    }
    return dump;
}

function validateBackup(d) {
    if (!d || typeof d !== 'object') return 'not a json object';
    if (d.format) {
        if (d.format !== BACKUP_FORMAT) return 'wrong format: ' + d.format;
        if ((d.version || 0) > BACKUP_VERSION) return 'backup is from a newer version (v' + d.version + ')';
    }
    // legacy dumps (no format tag) still accepted if they carry ls/idb
    if (d.ls && typeof d.ls !== 'object') return 'corrupt ls section';
    if (d.idb && typeof d.idb !== 'object') return 'corrupt idb section';
    if (!d.ls && !d.idb) return 'no save data found in file';
    return null;
}

async function restoreBackup(dump) {
    let nLs = 0, nStores = 0, nRec = 0;
    if (dump.ls) {
        for (const k in dump.ls) { localStorage.setItem(k, dump.ls[k]); nLs++; }
    }
    if (dump.idb) {
        for (const name in dump.idb) {
            const { version, stores } = dump.idb[name];
            const req = indexedDB.open(name, version);
            req.onupgradeneeded = () => {
                const db = req.result;
                for (const sn in stores) if (!db.objectStoreNames.contains(sn)) db.createObjectStore(sn);
            };
            await new Promise((res) => {
                req.onsuccess = () => {
                    const db = req.result;
                    const t = db.transaction([...Object.keys(stores)], 'readwrite');
                    for (const sn in stores) {
                        const st = t.objectStore(sn);
                        const { vals, keys } = stores[sn];
                        nStores++;
                        for (let i = 0; i < vals.length; i++) {
                            nRec++;
                            try { st.put(decodeVal(vals[i]), keys[i]); } catch { st.put(decodeVal(vals[i])); }
                        }
                    }
                    t.oncomplete = () => { db.close(); res(); };
                    t.onerror = () => { db.close(); res(); };
                };
                req.onerror = () => res();
            });
        }
    }
    return { nLs, nStores, nRec };
}

function downloadJson(obj, name) {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

document.getElementById('exportBtn').addEventListener('click', async () => {
    downloadJson(await buildBackup(null), 'pizza-unblocked-backup.json');
});

document.getElementById('importBtn').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = async () => {
        let dump;
        try { dump = JSON.parse(await inp.files[0].text()); }
        catch { alert('import failed: not valid json'); return; }
        const err = validateBackup(dump);
        if (err) { alert('import failed: ' + err); return; }
        const { nLs, nStores, nRec } = await restoreBackup(dump);
        renderSaveGames();
        alert(`save imported — ${nLs} settings/save keys, ${nRec} records in ${nStores} stores`);
    };
    inp.click();
});

// per-game save view — shows which ports have detected save data
async function renderSaveGames() {
    const el = document.getElementById('saveGames');
    if (!el) return;
    el.innerHTML = '';
    for (const ad of SAVE_ADAPTERS) {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++)
            if (ad.match(localStorage.key(i))) count++;
        const row = document.createElement('div');
        row.className = 'sg-row';
        row.innerHTML = `<span>${ad.label}</span><span class="sg-count">${count ? count + ' keys' : 'no saves'}</span>`;
        if (count) {
            const b = document.createElement('button');
            b.className = 'sg-exp';
            b.textContent = 'export';
            b.onclick = async () => {
                const f = ad.match;
                f.__game = ad.dir;
                downloadJson(await buildBackup(f), `pu-save-${ad.dir}.json`);
            };
            row.appendChild(b);
        }
        el.appendChild(row);
    }
}
document.getElementById('gearBtn').addEventListener('click', renderSaveGames);

// ---------- crash log viewer ----------
function renderCrashLog() {
    const el = document.getElementById('crashLog');
    let log = [];
    try { log = JSON.parse(localStorage.getItem('pu_crashlog') || '[]'); } catch {}
    el.textContent = log.length
        ? log.map(e => `[${e.t}] ${e.page}\n  ${e.msg}${e.extra ? '\n  ' + e.extra : ''}`).join('\n\n')
        : 'no crashes logged';
}
document.getElementById('gearBtn').addEventListener('click', renderCrashLog);
document.getElementById('clearLogBtn').addEventListener('click', () => {
    localStorage.removeItem('pu_crashlog');
    renderCrashLog();
});
document.getElementById('copyLogBtn').addEventListener('click', () => {
    const t = document.getElementById('crashLog').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => {});
});
