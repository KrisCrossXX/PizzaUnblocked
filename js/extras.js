(function () {
    const grid = document.getElementById('extraGrid');
    const empty = document.getElementById('extrasEmpty');
    const popup = document.getElementById('ptSoundtrackPopup');
    const playerFrame = document.getElementById('ptSoundtrackEmbed');
    const playerUrl = 'extras/ost-player/Pizza%20Unblocked%20Player/Pizza%20Unblocked.html';
    let resumeThemeMusic = false;

    function openSoundtrack() {
        resumeThemeMusic = Boolean(window.isPuMusicPlaying?.());
        document.body.dataset.ostOpen = '1';
        window.pausePuMusic?.();
        popup.hidden = false;
        if (!playerFrame.src || playerFrame.src === 'about:blank') playerFrame.src = playerUrl;
    }

    function stopSoundtrack() {
        playerFrame.src = 'about:blank';
        popup.hidden = true;
        delete document.body.dataset.ostOpen;
        if (resumeThemeMusic && localStorage.getItem('pu_audio') !== 'off') {
            window.playPuMusic?.().catch(() => {});
        }
        resumeThemeMusic = false;
    }

    const category = item => /\blap\b|lapper|rando-laps/i.test(`${item.name} ${item.desc || ''}`) ? 'lap' : 'other';
    setupCatalogFilters(document.getElementById('extraSearch'), document.getElementById('extraFilters'), grid, empty, FANGAMES, category);
    document.getElementById('ostBtn')?.addEventListener('click', openSoundtrack);
    popup.querySelector('[data-close="ptSoundtrackPopup"]')?.addEventListener('click', stopSoundtrack);
    popup.addEventListener('mousedown', event => { if (event.target === popup) stopSoundtrack(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') stopSoundtrack(); });
})();
