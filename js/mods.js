const grid = document.getElementById('modGrid');
const empty = document.getElementById('modsEmpty');
renderCards(grid, empty, MODS);
setupSearch(document.getElementById('modSearch'), grid, empty, MODS);
