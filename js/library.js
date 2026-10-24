// Unified library page plus the three personal game shelves on the home screen.
(() => {
    let activeFilter = 'all';
    const search = document.getElementById('librarySearch');
    const tagSelect = document.getElementById('libraryTag');
    const sortSelect = document.getElementById('librarySort');
    const grid = document.getElementById('libraryGrid');
    const empty = document.getElementById('libraryEmpty');

    function itemFor(key) {
        return LIBRARY_ITEMS.find(item => gameKey(item) === key);
    }

    function filterMatches(item) {
        if (activeFilter === 'favorites' && !favoriteKeys().has(gameKey(item))) return false;
        if (activeFilter !== 'all' && activeFilter !== 'favorites' && item.libraryType !== activeFilter) return false;
        const selectedTag = tagSelect?.value || 'all';
        if (selectedTag !== 'all' && !libraryTags(item).includes(selectedTag)) return false;
        const query = (search?.value || '').trim().toLowerCase();
        return !query || `${item.name} ${item.desc || ''} ${libraryTags(item).join(' ')}`.toLowerCase().includes(query);
    }

    function sortItems(items) {
        const rows = playHistory();
        const history = new Map(rows.map(row => [row.key, row]));
        const mode = sortSelect?.value || 'az';
        return items.sort((a, b) => {
            if (mode === 'za') return b.name.localeCompare(a.name);
            if (mode === 'recent') return (history.get(gameKey(b))?.lastPlayed || 0) - (history.get(gameKey(a))?.lastPlayed || 0) || a.name.localeCompare(b.name);
            if (mode === 'most') return (history.get(gameKey(b))?.plays || 0) - (history.get(gameKey(a))?.plays || 0) || a.name.localeCompare(b.name);
            return a.name.localeCompare(b.name);
        });
    }

    function renderLibraryPage() {
        if (!grid) return;
        const matches = sortItems(LIBRARY_ITEMS.filter(filterMatches));
        renderCards(grid, empty, matches);
        document.querySelectorAll('#libraryFilters [data-library-filter]').forEach(button => {
            const selected = button.dataset.libraryFilter === activeFilter;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    }

    function renderHomeShelves() {
        const recentRows = playHistory();
        const byKey = new Map(LIBRARY_ITEMS.map(item => [gameKey(item), item]));
        const continuedKey = localStorage.getItem(LIBRARY_KEYS.continue) || '';
        const continued = byKey.get(continuedKey);
        const recent = recentRows.map(row => byKey.get(row.key)).filter(Boolean).slice(0, 6);
        const favorites = LIBRARY_ITEMS
            .filter(item => favoriteKeys().has(gameKey(item)))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, 6);

        renderCards(document.getElementById('continueGrid'), document.getElementById('continueEmpty'), continued ? [continued] : []);
        renderCards(document.getElementById('recentGrid'), document.getElementById('recentEmpty'), recent);
        renderCards(document.getElementById('favoritesGrid'), document.getElementById('favoritesEmpty'), favorites);
    }

    document.getElementById('libraryFilters')?.addEventListener('click', event => {
        const button = event.target.closest('[data-library-filter]');
        if (!button) return;
        activeFilter = button.dataset.libraryFilter;
        renderLibraryPage();
    });
    document.addEventListener('click', event => {
        const button = event.target.closest('[data-library-filter]');
        if (!button || document.getElementById('libraryFilters')?.contains(button)) return;
        activeFilter = button.dataset.libraryFilter;
        if (typeof showPage === 'function') showPage('library');
        renderLibraryPage();
    });
    search?.addEventListener('input', renderLibraryPage);
    tagSelect?.addEventListener('change', renderLibraryPage);
    sortSelect?.addEventListener('change', renderLibraryPage);
    document.addEventListener('pu:favorites-changed', () => { renderHomeShelves(); renderLibraryPage(); });
    document.addEventListener('pu:history-changed', () => { renderHomeShelves(); renderLibraryPage(); });

    window.renderLibraryPage = renderLibraryPage;
    window.renderHomeShelves = renderHomeShelves;
    renderHomeShelves();
    renderLibraryPage();
})();
