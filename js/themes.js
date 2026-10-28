// Full-screen background picker. Theme creation and the secondary theme tabs
// were removed; this mirrors the compact picker in Settings.
(() => {
    const grid = document.getElementById('themeOfficialGrid');
    const back = document.getElementById('themeBack');
    const open = document.getElementById('themeBrowseBtn');
    if (!grid || !back || !open) return;

    function render() {
        const activeName = localStorage.getItem('pu_theme');
        grid.replaceChildren();
        for (const theme of PU_THEMES) {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'theme-card';
            card.dataset.name = theme.name;
            card.setAttribute('aria-pressed', String(theme.name === activeName));
            if (theme.name === activeName) card.classList.add('sel');

            const image = document.createElement('img');
            image.className = `tprev ${theme.cls || ''}`;
            image.src = theme.bg;
            image.alt = '';
            const title = document.createElement('div');
            title.className = 'tname';
            title.textContent = theme.name;
            card.append(image, title);
            card.addEventListener('click', () => {
                window.applyPuTheme(theme);
                render();
            });
            grid.appendChild(card);
        }
    }

    open.addEventListener('click', () => {
        document.getElementById('popSettings').hidden = true;
        showPage('themes');
    });
    back.addEventListener('click', () => showPage('home'));
    render();
})();
