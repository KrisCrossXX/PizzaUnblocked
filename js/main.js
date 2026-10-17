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
// PU_THEMES comes from js/music.js — bg = background image, song = music track
const bgimgEl2 = document.querySelector('.bgimg');
const themeGrid = document.getElementById('themeGrid');

function applyTheme(t) {
    bgimgEl2.src = t.bg;
    bgimgEl2.className = 'bgimg ' + (t.cls || '');
    const src = t.song;
    if (!bgm.src.endsWith(src)) {
        const wasPlaying = bgmStarted && !bgm.paused;
        bgm.src = src;
        try { bgm.currentTime = 0; } catch {}
        localStorage.setItem('pu_pos', 0);
        if (wasPlaying) bgm.play().catch(() => {});
    }
    localStorage.setItem('pu_theme', t.name);
    for (const c of themeGrid.children) c.classList.toggle('sel', c.dataset.name === t.name);
}
for (const t of PU_THEMES) {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.dataset.name = t.name;
    card.innerHTML = `<img class="tprev ${t.cls || ''}" src="${t.bg}" alt=""><div class="tname">${t.name}</div>`;
    card.addEventListener('click', () => applyTheme(t));
    themeGrid.appendChild(card);
}
applyTheme(PU_THEMES.find(t => t.name === localStorage.getItem('pu_theme')) || PU_THEMES[0]);

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
