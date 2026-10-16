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
const DISCORD_URL = 'https://discord.gg/placeholder';
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
panicBtn.addEventListener('click', () => alert('panic button coming soon'));

// ---------- themes ----------
// cls = filter class on .bgimg ('' = default look, 'theme-black' = off)
// song = optional override for the theme music track (defaults to theme.mp3)
const THEMES = [
    { name: 'the tower',   cls: '' },
    { name: 'black',       cls: 'theme-black' },
    { name: 'the noise',   cls: 't-noise' },
    { name: 'vigilante',   cls: 't-vigilante' },
    { name: 'fake peppino', cls: 't-fakepep' },
    { name: 'midnight',    cls: 't-midnight' },
    { name: 'pizzaface',   cls: 't-pizzaface' },
    { name: 'halloween',   cls: 't-halloween' },
    { name: 'boiler city', cls: 't-boiler' },
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

// ---------- save export/import (localStorage + IndexedDB) ----------
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

document.getElementById('exportBtn').addEventListener('click', async () => {
    const dump = { ls: {}, idb: {} };
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        dump.ls[k] = localStorage.getItem(k);
    }
    if (indexedDB.databases) {
        for (const { name } of await indexedDB.databases()) {
            const db = await openDb(name);
            const stores = {};
            for (const sn of db.objectStoreNames) {
                const st = db.transaction(sn, 'readonly').objectStore(sn);
                const [vals, keys] = await Promise.all([getAll(st), getAllKeys(st)]);
                stores[sn] = { vals: await Promise.all(vals.map(encodeVal)), keys: keys.map(String) };
            }
            dump.idb[name] = { version: db.version, stores };
            db.close();
        }
    }
    const blob = new Blob([JSON.stringify(dump)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pizza-unblocked-save.json';
    a.click();
    URL.revokeObjectURL(a.href);
});

document.getElementById('importBtn').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = async () => {
        const dump = JSON.parse(await inp.files[0].text());
        localStorage.clear();
        for (const k in dump.ls) localStorage.setItem(k, dump.ls[k]);
        for (const name in dump.idb) {
            const { version, stores } = dump.idb[name];
            const req = indexedDB.open(name, version);
            req.onupgradeneeded = () => {
                const db = req.result;
                for (const sn in stores) if (!db.objectStoreNames.contains(sn)) db.createObjectStore(sn);
            };
            req.onsuccess = async () => {
                const db = req.result;
                for (const sn in stores) {
                    const st = db.transaction(sn, 'readwrite').objectStore(sn);
                    const { vals, keys } = stores[sn];
                    for (let i = 0; i < vals.length; i++) {
                        try { st.put(decodeVal(vals[i]), keys[i]); } catch { st.put(decodeVal(vals[i])); }
                    }
                }
                db.close();
            };
        }
        alert('save imported');
    };
    inp.click();
});
