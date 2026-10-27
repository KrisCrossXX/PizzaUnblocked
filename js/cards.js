// Shared card rendering, favorites, and local play history for every copy of the site.
const ITCH_PROXY = 'https://pizza-game-module-proxy.sm64noahm.workers.dev/itch/';
const LIBRARY_ITEMS = [
    { name: 'pizza tower', desc: 'the original game', dir: 'pizzatower', img: 'assets/btn-pizzatower.png', libraryType: 'game' },
    ...MODS.map(g => ({ ...g, libraryType: 'mod' })),
    ...FANGAMES.filter(g => !g.hideFromLibrary).map(g => ({
        ...g,
        libraryType: g.category === 'extras' ? 'extra' : g.ext ? 'web' : 'game',
    })),
];
const LIBRARY_KEYS = {
    favorites: 'pu_favorite_games_v1',
    history: 'pu_recent_games_v1',
    continue: 'pu_continue_game_v1',
};

function gameUrl(g) {
    if (!g.ext) return (g.category || 'games') + '/' + g.dir + '/';
    return g.ext.replace(/^https?:\/\/html(-classic)?\.itch\.zone\/html\//, ITCH_PROXY);
}

function siteAssetUrl(path) {
    if (window.PU_HOST) return new URL(path, window.PU_HOST.replace(/\/?$/, '/') ).href;
    if (location.protocol === 'file:') return new URL(path, location.pathname.replace(/[^/]*$/, '')).href;
    return new URL(path, location.origin !== 'null' ? location.origin + '/' : document.baseURI).href;
}

function gameKey(g) {
    return `${g.libraryType || 'game'}:${g.dir || g.ext || g.name}`;
}

function decodeGameKey(value) {
    try { return decodeURIComponent(value || ''); } catch { return ''; }
}

function readLibraryJson(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        return value ?? fallback;
    } catch { return fallback; }
}

function favoriteKeys() {
    const keys = readLibraryJson(LIBRARY_KEYS.favorites, []);
    return new Set(Array.isArray(keys) ? keys : []);
}

function playHistory() {
    const rows = readLibraryJson(LIBRARY_KEYS.history, []);
    return Array.isArray(rows) ? rows : [];
}

function libraryTags(g) {
    const tags = [g.libraryType];
    if (g.ext) tags.push('web');
    if (g.save || g.save101) tags.push('save');
    if (/online|multiplayer|co-?op/i.test(`${g.name} ${g.desc || ''}`)) tags.push('online');
    return tags;
}

function favoriteButton(key) {
    const selected = favoriteKeys().has(key);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'favorite-toggle';
    button.dataset.gameKey = encodeURIComponent(key);
    button.setAttribute('aria-label', selected ? 'Remove from favorites' : 'Add to favorites');
    button.setAttribute('aria-pressed', String(selected));
    button.title = selected ? 'remove favorite' : 'add to favorites';
    button.textContent = selected ? '★' : '☆';
    return button;
}

function renderCards(gridEl, emptyEl, list) {
    if (!gridEl) return;
    gridEl.replaceChildren();
    const favorites = favoriteKeys();
    for (const g of list) {
        const key = gameKey(g);
        const article = document.createElement('article');
        article.className = 'library-card';
        article.dataset.gameKey = encodeURIComponent(key);

        const favorite = favoriteButton(key);
        article.appendChild(favorite);

        const link = document.createElement(g.action ? 'button' : 'a');
        link.className = 'card';
        if (g.action) {
            link.type = 'button';
            link.dataset.cardAction = g.action;
        } else {
            link.setAttribute('href', gameUrl(g));
        }
        link.dataset.gameKey = encodeURIComponent(key);
        link.setAttribute('aria-label', `${g.action ? 'Open' : 'Play'} ${g.name}`);

        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        const image = document.createElement('img');
        image.src = g.img.startsWith('assets/') ? siteAssetUrl(g.img) : g.img;
        image.alt = g.name;
        image.loading = 'lazy';
        image.decoding = 'async';
        thumb.appendChild(image);
        link.appendChild(thumb);

        const name = document.createElement('div');
        name.className = 'cname';
        name.textContent = g.name;
        link.appendChild(name);

        const tags = document.createElement('div');
        tags.className = 'card-tags';
        for (const tag of libraryTags(g)) {
            const pill = document.createElement('span');
            pill.className = 'library-tag-pill';
            pill.textContent = ({ mod: 'mod', game: 'game', extra: 'extra', web: 'web game', save: 'save', online: 'online' })[tag] || tag;
            tags.appendChild(pill);
        }
        link.appendChild(tags);

        if (g.desc) {
            const desc = document.createElement('p');
            desc.className = 'cdesc';
            desc.textContent = g.desc;
            link.appendChild(desc);
        }
        article.appendChild(link);
        gridEl.appendChild(article);
    }
    if (emptyEl) emptyEl.hidden = list.length > 0;
    syncFavoriteButtons(favorites);
}

function syncFavoriteButtons(keys = favoriteKeys()) {
    for (const button of document.querySelectorAll('.favorite-toggle')) {
        const key = decodeGameKey(button.dataset.gameKey);
        const selected = keys.has(key);
        button.textContent = selected ? '★' : '☆';
        button.setAttribute('aria-pressed', String(selected));
        button.setAttribute('aria-label', selected ? 'Remove from favorites' : 'Add to favorites');
        button.title = selected ? 'remove favorite' : 'add to favorites';
    }
}

function recordGameLaunch(anchor) {
    const key = decodeGameKey(anchor?.dataset.gameKey);
    const item = LIBRARY_ITEMS.find(g => gameKey(g) === key);
    if (!item) return;
    const history = playHistory();
    const previous = history.find(row => row.key === key);
    const row = { key, lastPlayed: Date.now(), plays: (previous?.plays || 0) + 1 };
    localStorage.setItem(LIBRARY_KEYS.history, JSON.stringify([row, ...history.filter(x => x.key !== key)].slice(0, 30)));
    localStorage.setItem(LIBRARY_KEYS.continue, key);
    document.dispatchEvent(new CustomEvent('pu:history-changed'));
}

document.addEventListener('click', event => {
    const button = event.target.closest('.favorite-toggle');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const key = decodeGameKey(button.dataset.gameKey);
    const keys = favoriteKeys();
    if (keys.has(key)) keys.delete(key); else keys.add(key);
    localStorage.setItem(LIBRARY_KEYS.favorites, JSON.stringify([...keys]));
    syncFavoriteButtons(keys);
    document.dispatchEvent(new CustomEvent('pu:favorites-changed'));
});

function setupSearch(inputEl, gridEl, emptyEl, list) {
    if (!inputEl) return;
    const filter = () => {
        const q = inputEl.value.trim().toLowerCase();
        const filtered = q ? list.filter(g => `${g.name} ${g.desc || ''} ${libraryTags(g).join(' ')}`.toLowerCase().includes(q)) : list;
        renderCards(gridEl, emptyEl, filtered);
    };
    inputEl.addEventListener('input', filter);
}

function setupCatalogFilters(inputEl, filterEl, gridEl, emptyEl, list, categoryFor) {
    if (!filterEl) {
        setupSearch(inputEl, gridEl, emptyEl, list);
        return;
    }
    let active = 'all';
    const render = () => {
        const q = (inputEl?.value || '').trim().toLowerCase();
        const filtered = list.filter(item => {
            const categoryMatch = active === 'all'
                || (active === 'favorites' ? favoriteKeys().has(gameKey(item)) : categoryFor(item) === active);
            const searchMatch = !q || `${item.name} ${item.desc || ''} ${libraryTags(item).join(' ')}`.toLowerCase().includes(q);
            return categoryMatch && searchMatch;
        });
        renderCards(gridEl, emptyEl, filtered);
        for (const button of filterEl.querySelectorAll('[data-catalog-filter]')) {
            const selected = button.dataset.catalogFilter === active;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        }
    };
    inputEl?.addEventListener('input', render);
    filterEl.addEventListener('click', event => {
        const button = event.target.closest('[data-catalog-filter]');
        if (!button || !filterEl.contains(button)) return;
        active = active === button.dataset.catalogFilter ? 'all' : button.dataset.catalogFilter;
        render();
    });
    document.addEventListener('pu:favorites-changed', render);
    render();
}

// Hover sound for catalog cards.
const hoverSfx = new Audio('assets/sfx/buttons.ogg');
hoverSfx.volume = 0.6;
hoverSfx.preload = 'auto';
document.addEventListener('mouseover', event => {
    if (event.target.closest('.card, .favorite-toggle, .icon-btn, .pizza-icon')) {
        hoverSfx.currentTime = 0;
        hoverSfx.play().catch(() => {});
    }
});
