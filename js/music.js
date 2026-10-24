// Shared site music — plays on every site page (not game pages),
// resumes its position so it feels continuous when navigating.

// Site themes: bg = background image, song = music track.
// cls = optional extra class on .bgimg.
const PU_THEMES = [
    { name: 'Halloween 2026', bg: 'assets/halloween.png', song: 'assets/theme-halloween.ogg', buttonLayout: 'center' },
    { name: 'the tower',      bg: 'assets/bg.gif',            song: 'assets/theme.mp3' },
    { name: 'oregano desert', bg: 'assets/bg-desert.webp',    song: 'assets/theme-desert.ogg' },
    { name: 'pizzaland',      bg: 'assets/bg-pizzaland.webp', song: 'assets/theme-funiculi.ogg' },
    { name: "what's with these pizza guys?", bg: 'assets/bg-pizzaguys.png', song: 'assets/theme-pizzaguys.mp3' },
];

const puTheme = PU_THEMES.find(t => t.name === localStorage.getItem('pu_theme')) || PU_THEMES[0];

// apply the theme's background on every page that loads this script
const bgimgEl = document.querySelector('.bgimg');
if (bgimgEl) {
    bgimgEl.src = puTheme.bg;
    bgimgEl.className = 'bgimg ' + (puTheme.cls || '');
}

const bgm = new Audio(puTheme.song);
bgm.loop = true;
bgm.volume = localStorage.getItem('pu_vol') != null ? +localStorage.getItem('pu_vol') / 100 : 1;
const bgmWanted = localStorage.getItem('pu_audio') !== 'off';
const bgmPos = +localStorage.getItem('pu_pos') || 0;
let bgmStarted = false;

function kickBgm() {
    // dataset.gameOpen = a game is open in the overlay — never start over it
    if (bgmStarted || !bgmWanted || document.body.dataset.gameOpen) return;
    try { bgm.currentTime = bgmPos; } catch {}
    bgm.play()
        .then(() => {
            bgmStarted = true;
            document.removeEventListener('click', kickBgm);
            document.removeEventListener('keydown', kickBgm);
        })
        .catch(() => {}); // autoplay blocked — wait for an interaction
}
document.addEventListener('click', kickBgm);
document.addEventListener('keydown', kickBgm);
kickBgm(); // try immediately — allowed once the site has been interacted with before

// keep position saved so the next page picks up where this one left off
setInterval(() => { if (bgmStarted) localStorage.setItem('pu_pos', bgm.currentTime); }, 2000);
window.addEventListener('beforeunload', () => {
    if (bgmStarted) localStorage.setItem('pu_pos', bgm.currentTime);
});
