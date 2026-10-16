// shared card renderer + sfx for mods/extras pages
function renderCards(gridEl, emptyEl, list) {
    for (const g of list) {
        const a = document.createElement('a');
        a.className = 'card';
        a.href = 'games/' + g.dir + '/';
        a.innerHTML =
            `<div class="thumb"><img src="${g.img}" alt="${g.name}"><button class="dots" tabindex="-1">⋮</button></div>` +
            `<div class="cname">${g.name}</div>`;
        gridEl.appendChild(a);
    }
    emptyEl.hidden = list.length > 0;
}

// hover sfx
const hoverSfx = new Audio('assets/sfx/buttons.ogg');
hoverSfx.volume = 0.6;
hoverSfx.preload = 'auto';
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.card, .icon-btn, .pizza-icon')) {
        hoverSfx.currentTime = 0;
        hoverSfx.play().catch(() => {});
    }
});
