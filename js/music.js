// Shared site music — plays on every site page (not game pages),
// resumes its position so it feels continuous when navigating.

// Site themes: bg = background image, song = music track.
// cls = optional extra class on .bgimg.
const PU_THEMES = [
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

const bgm = new Audio(puTheme.song || '');
bgm.loop = true;
bgm.volume = localStorage.getItem('pu_vol') != null ? +localStorage.getItem('pu_vol') / 100 : 1;
let bgmWanted = localStorage.getItem('pu_audio') !== 'off';
const bgmPos = +localStorage.getItem('pu_pos') || 0;
let bgmStarted = false;
let activeMusicTheme = puTheme;
let soundCloudWidget = null;
let soundCloudReady = false;
let soundCloudPlaying = false;
let soundCloudPendingPlay = false;
let soundCloudTrack = '';

function ensureSoundCloudWidget(track) {
    if (soundCloudWidget) {
        if (track !== soundCloudTrack) {
            soundCloudTrack = track;
            soundCloudReady = false;
            soundCloudWidget.load(track, { auto_play: false, hide_related: true, show_comments: false, visual: false });
        }
        return;
    }
    soundCloudTrack = track;
    const frame = document.createElement('iframe');
    frame.title = 'Cafe theme music';
    frame.allow = 'autoplay';
    frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(track) + '&auto_play=false&hide_related=true&show_comments=false&visual=false';
    frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-2px;bottom:-2px;border:0;opacity:.01;pointer-events:none';
    document.body.appendChild(frame);

    const connect = () => {
        if (!window.SC || soundCloudWidget) return;
        soundCloudWidget = window.SC.Widget(frame);
        soundCloudWidget.bind(window.SC.Widget.Events.READY, () => {
            soundCloudReady = true;
            soundCloudWidget.setVolume(Math.round(bgm.volume * 100));
            const savedPosition = Number(localStorage.getItem('pu_pos') || 0);
            if (savedPosition > 0) soundCloudWidget.seekTo(savedPosition * 1000);
            if (soundCloudPendingPlay && bgmWanted && !document.body.dataset.gameOpen) soundCloudWidget.play();
        });
        soundCloudWidget.bind(window.SC.Widget.Events.PLAY, () => {
            soundCloudPlaying = true;
            bgmStarted = true;
            document.removeEventListener('click', kickBgm);
            document.removeEventListener('keydown', kickBgm);
        });
        soundCloudWidget.bind(window.SC.Widget.Events.PAUSE, () => { soundCloudPlaying = false; });
        soundCloudWidget.bind(window.SC.Widget.Events.FINISH, () => {
            if (soundCloudPendingPlay && bgmWanted && !document.body.dataset.gameOpen) soundCloudWidget.play();
        });
    };
    if (window.SC?.Widget) connect();
    else {
        const api = document.createElement('script');
        api.src = 'https://w.soundcloud.com/player/api.js';
        api.async = true;
        api.onload = connect;
        document.head.appendChild(api);
    }
}

function setPuMusic(theme, resume = false) {
    activeMusicTheme = theme;
    if (theme.soundcloud) {
        bgm.pause();
        bgm.removeAttribute('src');
        bgm.load();
        ensureSoundCloudWidget(theme.soundcloud);
        if (resume) playPuMusic();
    } else {
        if (soundCloudWidget) soundCloudWidget.pause();
        soundCloudPendingPlay = false;
        bgm.src = theme.song || PU_THEMES[0].song;
        bgm.currentTime = 0;
        if (resume) playPuMusic().catch(() => {});
    }
}
function playPuMusic() {
    if (activeMusicTheme.soundcloud) {
        soundCloudPendingPlay = true;
        if (soundCloudReady && !document.body.dataset.gameOpen) soundCloudWidget.play();
        return Promise.resolve();
    }
    return bgm.play();
}
function pausePuMusic() {
    if (activeMusicTheme.soundcloud) {
        soundCloudPendingPlay = false;
        if (soundCloudWidget) soundCloudWidget.pause();
    } else bgm.pause();
}
function setPuMusicVolume(volume) {
    bgm.volume = volume;
    if (soundCloudWidget && soundCloudReady) soundCloudWidget.setVolume(Math.round(volume * 100));
}
function setPuMusicEnabled(enabled) {
    bgmWanted = enabled;
    if (!enabled) return pausePuMusic();
    playPuMusic().then(() => { if (!activeMusicTheme.soundcloud) bgmStarted = true; }).catch(() => {});
}
window.setPuMusic = setPuMusic;
window.playPuMusic = playPuMusic;
window.pausePuMusic = pausePuMusic;
window.setPuMusicVolume = setPuMusicVolume;
window.setPuMusicEnabled = setPuMusicEnabled;
window.isPuSoundCloudMusic = () => Boolean(activeMusicTheme.soundcloud);
window.getPuMusicKey = () => activeMusicTheme.soundcloud || activeMusicTheme.song || '';

if (puTheme.soundcloud) ensureSoundCloudWidget(puTheme.soundcloud);

function kickBgm() {
    // dataset.gameOpen = a game is open in the overlay — never start over it
    if (bgmStarted || !bgmWanted || document.body.dataset.gameOpen) return;
    if (!activeMusicTheme.soundcloud) try { bgm.currentTime = bgmPos; } catch {}
    playPuMusic()
        .then(() => {
            if (!activeMusicTheme.soundcloud) bgmStarted = true;
            if (!activeMusicTheme.soundcloud || soundCloudPlaying) {
                document.removeEventListener('click', kickBgm);
                document.removeEventListener('keydown', kickBgm);
            }
        })
        .catch(() => {}); // autoplay blocked — wait for an interaction
}
document.addEventListener('click', kickBgm);
document.addEventListener('keydown', kickBgm);
kickBgm(); // try immediately — allowed once the site has been interacted with before

// keep position saved so the next page picks up where this one left off
setInterval(() => {
    if (!bgmStarted) return;
    if (activeMusicTheme.soundcloud && soundCloudWidget && soundCloudReady) {
        soundCloudWidget.getPosition(ms => localStorage.setItem('pu_pos', String(ms / 1000)));
    } else if (!activeMusicTheme.soundcloud) localStorage.setItem('pu_pos', bgm.currentTime);
}, 2000);
window.addEventListener('beforeunload', () => {
    if (bgmStarted && !activeMusicTheme.soundcloud) localStorage.setItem('pu_pos', bgm.currentTime);
});
