(function () {
    const grid = document.getElementById('extraGrid');
    const empty = document.getElementById('extrasEmpty');
    const popup = document.getElementById('ptSoundtrackPopup');
    const playerFrame = document.getElementById('ptSoundtrackEmbed');
    const playerUrl = 'https://html-classic.itch.zone/html/15792341/index.html?v=1782598071';

    function openSoundtrack() {
        popup.hidden = false;
        if (!playerFrame.src || playerFrame.src === 'about:blank') playerFrame.src = playerUrl;
    }

    function stopSoundtrack() {
        playerFrame.src = 'about:blank';
        popup.hidden = true;
    }

    const category = item => /\blap\b|lapper|rando-laps/i.test(`${item.name} ${item.desc || ''}`) ? 'lap' : 'other';
    setupCatalogFilters(document.getElementById('extraSearch'), document.getElementById('extraFilters'), grid, empty, FANGAMES, category);
    grid.addEventListener('click', event => {
        if (event.target.closest('[data-card-action="pt-soundtrack"]')) openSoundtrack();
    });
    popup.querySelector('[data-close="ptSoundtrackPopup"]')?.addEventListener('click', stopSoundtrack);
    popup.addEventListener('mousedown', event => { if (event.target === popup) stopSoundtrack(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') stopSoundtrack(); });
})();
