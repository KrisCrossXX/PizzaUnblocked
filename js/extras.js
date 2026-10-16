const grid = document.getElementById('extraGrid');
const empty = document.getElementById('extrasEmpty');
renderCards(grid, empty, FANGAMES);
setupSearch(document.getElementById('extraSearch'), grid, empty, FANGAMES);
