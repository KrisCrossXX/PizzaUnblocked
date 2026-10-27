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
const DISCORD_URL = 'https://discord.gg/T2ZHkW9sHU';
// arrow icon = single-file downloads; pizza icon = discord
document.getElementById('dlBtn').addEventListener('click', () => openPop('popSoon'));
// fetch->blob so the download works cross-origin (plain href+download is
// ignored cross-origin and would just navigate into the file)
async function downloadFile(name) {
    try {
        const r = await fetch(name, { cache: 'no-store' });
        if (!r.ok) throw 0;
        const b = await r.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch { /* host unreachable */ }
}
document.getElementById('dlHtml')?.addEventListener('click', () => downloadFile('single-file.html'));
document.getElementById('dlSvg')?.addEventListener('click', () => downloadFile('single-file.svg'));
const pizzaBtn = document.querySelector('.pizza-icon');
pizzaBtn.removeAttribute('onclick');
pizzaBtn.title = 'discord';
pizzaBtn.addEventListener('click', () => window.open(DISCORD_URL, '_blank'));

// Live count of visible browsers connected to the main site.
(() => {
    const badge = document.getElementById('viewerCount');
    if (!badge || !('WebSocket' in window)) return;
    const endpoint = 'wss://pizza-viewer-count.sm64noahm.workers.dev/ws';
    let socket, retryTimer, pingTimer;
    function disconnect() {
        clearTimeout(retryTimer);
        clearInterval(pingTimer);
        if (socket) { socket.onclose = null; socket.close(); socket = null; }
    }
    function connect() {
        disconnect();
        if (document.visibilityState !== 'visible') return;
        socket = new WebSocket(endpoint);
        socket.onmessage = event => {
            try {
                const count = Number(JSON.parse(event.data).viewers);
                if (Number.isInteger(count) && count >= 0) {
                    badge.textContent = `${count} viewing`;
                    badge.title = `${count} people currently viewing this site`;
                }
            } catch { /* ignore malformed updates */ }
        };
        socket.onopen = () => { pingTimer = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send('ping'), 25000); };
        socket.onclose = () => { clearInterval(pingTimer); if (document.visibilityState === 'visible') retryTimer = setTimeout(connect, 5000); };
        socket.onerror = () => socket?.close();
    }
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' ? connect() : disconnect());
    connect();
})();

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
const VIEW_TITLES = { home: 'Pizza Unblocked', mods: 'Mods — Pizza Unblocked', extras: 'Extras — Pizza Unblocked', library: 'Game Library — Pizza Unblocked', credits: 'Credits — Pizza Unblocked', themes: 'Themes — Pizza Unblocked' };
let curView = 'home';
function applyCloak(key) {
    const c = CLOAKS[key];
    document.title = c ? c[0] : VIEW_TITLES[curView];
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = c ? c[1] : 'assets/favicon-pizza-face.png';
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
    if (e.key === '`' && localStorage.getItem('pu_panic') === 'on') location.href = 'https://classroom.google.com';
});

// about:blank cloak — opens the whole site in a popup whose URL bar and
// history entry just say "about:blank"; everything runs inside an iframe.
document.getElementById('blankBtn').addEventListener('click', () => {
    const w = window.open('about:blank', '_blank');
    if (!w) return;
    const file = location.pathname.split('/').pop() || 'index.html';
    const src = new URL(file, appBase.href).href;
    w.document.write(`<!DOCTYPE html><html><head>
<title>Classes</title>
<link rel="icon" href="https://ssl.gstatic.com/classroom/favicon.png">
<style>html,body,iframe{height:100%;width:100%;margin:0;border:0;display:block}</style>
</head><body><iframe src="${src}"></iframe></body></html>`);
    w.document.close();
    location.replace('https://classroom.google.com'); // overwrite this tab's history entry
});

// blob cloak — same wrapper, but the popup's address bar shows an opaque
// blob: URL and the history entry can't be traced back to a real path.
// The popup has to finish loading BEFORE we leave: navigating away kills the
// document that owns the blob, which revokes the URL under the popup.
document.getElementById('blobBtn').addEventListener('click', () => {
    const file = location.pathname.split('/').pop() || 'index.html';
    const src = new URL(file, appBase.href).href;
    const html = `<!DOCTYPE html><html><head>
<title>Classes</title>
<link rel="icon" href="https://ssl.gstatic.com/classroom/favicon.png">
<style>html,body,iframe{height:100%;width:100%;margin:0;border:0;display:block}</style>
</head><body><iframe src="${src}"></iframe></body></html>`;
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const w = window.open(blobUrl, '_blank');
    if (!w) { URL.revokeObjectURL(blobUrl); return; }
    let left = false;
    const leave = () => {
        if (left) return;
        left = true;
        URL.revokeObjectURL(blobUrl);
        location.replace('https://classroom.google.com'); // overwrite this tab's history entry
    };
    w.onload = leave;
    setTimeout(leave, 4000); // never strand the tab if load doesn't fire
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

// Mobile controls are stored on the site origin, which game pages share.
const touchModeSel = document.getElementById('touchModeSel');
const touchLayoutSel = document.getElementById('touchLayoutSel');
if (touchModeSel) {
    const oldMode = localStorage.getItem('pu_touch');
    touchModeSel.value = localStorage.getItem('pu_touch_mode') || (oldMode === 'on' ? 'on' : oldMode === 'off' ? 'off' : 'auto');
    touchModeSel.addEventListener('change', () => localStorage.setItem('pu_touch_mode', touchModeSel.value));
}
if (touchLayoutSel) {
    touchLayoutSel.value = localStorage.getItem('pu_touch_layout') || 'joystick';
    touchLayoutSel.addEventListener('change', () => localStorage.setItem('pu_touch_layout', touchLayoutSel.value));
}

// ---------- themes ----------
// PU_THEMES comes from js/music.js — bg = background image, song = music track
const bgimgEl2 = document.querySelector('.bgimg');
const themeGrid = document.getElementById('themeGrid');

function applyTheme(t, track = true) {
    const isCustom = Boolean(t.custom);
    bgimgEl2.src = t.bg;
    bgimgEl2.className = 'bgimg ' + (t.cls || '');
    document.getElementById('pageHome').dataset.themeLayout = t.buttonLayout && t.buttonLayout !== 'default' ? t.buttonLayout : '';
    {
        const src = t.song || PU_THEMES.find(theme => theme.name === localStorage.getItem('pu_theme'))?.song || PU_THEMES[0].song;
        if (!bgm.src.endsWith(src)) {
            const wasPlaying = bgmStarted && !bgm.paused;
            bgm.src = src;
            try { bgm.currentTime = 0; } catch {}
            localStorage.setItem('pu_pos', 0);
            if (wasPlaying) bgm.play().catch(() => {});
        }
    }
    if (!isCustom) {
        localStorage.setItem('pu_theme', t.name);
        localStorage.removeItem('pu_theme_custom');
    } else {
        localStorage.setItem('pu_theme_custom', t.id);
        localStorage.removeItem('pu_theme');
    }
    const colors = t.colors || { bg: '#1e1a16', text: '#fff4e0', accent: '#ffd75e', muted: '#b8a89a' };
    document.documentElement.style.setProperty('--bg', colors.bg || '#1e1a16');
    document.documentElement.style.setProperty('--text', colors.text || '#fff4e0');
    document.documentElement.style.setProperty('--yellow', colors.accent || '#ffd75e');
    document.documentElement.style.setProperty('--muted', colors.muted || '#b8a89a');
    if (track) localStorage.setItem('pu_theme_applies', String(Number(localStorage.getItem('pu_theme_applies') || 0) + 1));
    for (const c of themeGrid.children) c.classList.toggle('sel', c.dataset.name === t.name);
}
window.applyPuTheme = applyTheme;
for (const t of PU_THEMES) {
    const card = document.createElement('div');
    card.className = 'theme-card';
    card.dataset.name = t.name;
    card.innerHTML = `<img class="tprev ${t.cls || ''}" src="${t.bg}" alt=""><div class="tname">${t.name}</div>`;
    card.addEventListener('click', () => applyTheme(t));
    themeGrid.appendChild(card);
}
let savedCustomTheme;
try { savedCustomTheme = JSON.parse(localStorage.getItem('pu_custom_themes') || '[]').find(t => t.id === localStorage.getItem('pu_theme_custom')); } catch {}
if (savedCustomTheme) applyTheme({ ...savedCustomTheme, custom: true }, false);
else applyTheme(PU_THEMES.find(t => t.name === localStorage.getItem('pu_theme')) || PU_THEMES[0], false);

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

// ---------- view router ----------
// home / mods / extras live in one document so the music never restarts.
// URLs look like index.html/mods — the server (or 404.html on static hosts)
// maps them back to index.html.
const VIEW_PAGES = { home: 'pageHome', mods: 'pageMods', extras: 'pageExtras', library: 'pageLibrary', credits: 'pageCredits', themes: 'pageThemes' };
// pushed paths like index.html/mods would break relative links (games/, assets/)
// — pin document.baseURI to the app directory so they always resolve correctly.
const appBase = document.createElement('base');
// Each deployed mirror serves its own shell, assets, and games.
// Single-file builds can still provide their own asset host through PU_HOST.
appBase.href = window.PU_HOST ? window.PU_HOST + '/'
    : location.protocol === 'file:'
        ? location.pathname.replace(/[^/]*$/, '')
        : location.origin + '/';
document.head.prepend(appBase);
function viewFromUrl() {
    const m = location.pathname.match(/\/(mods|extras|library|credits|themes)\/?$/)
        || location.hash.match(/^#\/?(mods|extras|library|credits|themes)$/);
    return m ? m[1] : 'home';
}
function pageUrl(name) {
    const path = location.pathname.replace(/\/(mods|extras|library|credits|themes)\/?$/, '');
    const m = path.match(/[^/]+\.html?$/i);
    return (m ? path.slice(0, m.index) : path.replace(/\/$/, '') + '/')
        + (m ? m[0] : 'index.html') + (name === 'home' ? '' : '/' + name);
}
function showPage(name, push = true) {
    curView = name in VIEW_PAGES ? name : 'home';
    const logo = document.querySelector('a.logo');
    if (logo) {
        logo.setAttribute('href', curView === 'credits' ? 'index.html' : 'credits.html');
        logo.setAttribute('aria-label', curView === 'credits' ? 'Pizza Unblocked — back to menu' : 'Pizza Unblocked — credits');
    }
    for (const v in VIEW_PAGES) document.getElementById(VIEW_PAGES[v]).hidden = v !== curView;
    document.body.dataset.view = curView;
    document.title = (CLOAKS[cloakSel.value] || [VIEW_TITLES[curView]])[0];
    try {
        if (push) history.pushState(null, '', pageUrl(curView));
        else history.replaceState(null, '', pageUrl(curView));
    } catch {
        if (push) location.hash = '/' + curView;
    }
    if (curView === 'home') window.renderHomeShelves?.();
    if (curView === 'library') window.renderLibraryPage?.();
}
// ---------- game overlay ----------
// game links open in an in-page iframe so the real host URL never hits the
// address bar or history — important for the shared single file. The iframe
// carries the host's origin, so its own service worker still stitches chunks
// and COI headers still apply inside it.
let gameOverlay = null;
function openGame(a) {
    // Keep game files on the same host as this copy of the site. Each mirror
    // must carry its own /games tree so a blocked proxy cannot break play.
    const href = a.getAttribute('href').replace(/^(?:mods|extras)\//, 'games/');
    const target = new URL(href, appBase.href);
    const url = target.href;
    const name = (a.querySelector('.cname') || {}).textContent || a.getAttribute('title') || 'game';
    recordGameLaunch(a);
    if (gameOverlay) gameOverlay.remove();
    gameOverlay = document.createElement('div');
    gameOverlay.id = 'gameOverlay';
    gameOverlay.innerHTML =
        '<button class="game-home" type="button" aria-label="Home — main menu">home</button>' +
        '<iframe allowfullscreen allow="autoplay; fullscreen; gamepad; cross-origin-isolated"></iframe>';
    gameOverlay.querySelector('iframe').title = name;
    gameOverlay.querySelector('iframe').src = url;
    gameOverlay.querySelector('.game-home').addEventListener('click', () => {
        closeGame();
        showPage('home', false);
    });
    document.body.appendChild(gameOverlay);
    // Keep Enter inside the game instead of reactivating its menu card.
    const gameFrame = gameOverlay.querySelector('iframe');
    gameFrame.focus();
    gameFrame.addEventListener('load', () => {
        if (gameOverlay && gameOverlay.contains(gameFrame) && document.activeElement === gameFrame) {
            gameFrame.contentWindow.focus();
        }
    });
    document.body.dataset.gameOpen = '1';
    // pause unconditionally — gating on bgmStarted misses the race where this
    // very click is the first gesture and kickBgm's play() is still in-flight
    gameOverlay._bgmWas = bgmWanted;
    bgm.pause();
    try { history.pushState({ game: 1 }, '', '#game'); } catch { location.hash = 'game'; }
}
function closeGame() {
    if (!gameOverlay) return;
    const wasMusic = gameOverlay._bgmWas;
    gameOverlay.remove();
    gameOverlay = null;
    delete document.body.dataset.gameOpen;
    if (wasMusic && bgmWanted) bgm.play().then(() => { bgmStarted = true; }).catch(() => {});
}
document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-card-action]');
    if (act && act.dataset.cardAction && act.dataset.cardAction.startsWith('open:')) {
        window.open(act.dataset.cardAction.slice(5), '_blank');
        return;
    }
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const view = href === 'mods.html' ? 'mods' : href === 'extras.html' ? 'extras' : href === 'index.html/library' ? 'library' : href === 'credits.html' ? 'credits' : href === 'index.html' ? 'home' : null;
    if (view) { e.preventDefault(); showPage(view); return; }
    if (/^(?:games|mods|extras)\//.test(href) || (a.classList.contains('card') && /^https?:/.test(href))) { e.preventDefault(); openGame(a); }
});
// file:// can't pushState, so openGame falls back to location.hash='game' —
// that hash nav fires popstate too; only close when we've actually left #game.
window.addEventListener('popstate', () => {
    if (gameOverlay && location.hash !== '#game') closeGame();
    showPage(viewFromUrl(), false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && gameOverlay) history.back(); });
showPage(viewFromUrl(), false);
