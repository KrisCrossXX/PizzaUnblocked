(function () {
    const grid = document.getElementById('modGrid');
    const empty = document.getElementById('modsEmpty');
    const category = item => {
        const text = `${item.name} ${item.desc || ''}`.toLowerCase();
        if (/\blap\b|lapper/.test(text)) return 'lap';
        return 'other';
    };
    setupCatalogFilters(document.getElementById('modSearch'), document.getElementById('modFilters'), grid, empty, MODS, category);
})();
