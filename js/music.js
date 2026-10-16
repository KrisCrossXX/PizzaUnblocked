// Shared site music — plays on every site page (not game pages),
// resumes its position so it feels continuous when navigating.
const bgm = new Audio('assets/theme.mp3');
bgm.loop = true;
bgm.volume = localStorage.getItem('pu_vol') != null ? +localStorage.getItem('pu_vol') / 100 : 1;
const bgmWanted = localStorage.getItem('pu_audio') !== 'off';
const bgmPos = +localStorage.getItem('pu_pos') || 0;
let bgmStarted = false;

function kickBgm() {
    if (!bgmStarted && bgmWanted) {
        bgmStarted = true;
        try { bgm.currentTime = bgmPos; } catch {}
        bgm.play().catch(() => {});
    }
    document.removeEventListener('click', kickBgm);
    document.removeEventListener('keydown', kickBgm);
}
document.addEventListener('click', kickBgm);
document.addEventListener('keydown', kickBgm);

// keep position saved so the next page picks up where this one left off
setInterval(() => { if (bgmStarted) localStorage.setItem('pu_pos', bgm.currentTime); }, 2000);
window.addEventListener('beforeunload', () => {
    if (bgmStarted) localStorage.setItem('pu_pos', bgm.currentTime);
});
