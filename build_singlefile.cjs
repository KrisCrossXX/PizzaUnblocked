// build_singlefile.cjs — packs the whole site UI into ONE html file (pizza-unblocked.html).
// Assets are inlined as base64 data URIs. Game links stay relative (games/...),
// so the file must sit next to the games/ folder (or be served) for games to launch.
const fs = require('fs');
const path = require('path');
const root = __dirname;

const MIME = { png: 'image/png', gif: 'image/gif', mp3: 'audio/mpeg', ogg: 'audio/ogg', ttf: 'font/ttf', ico: 'image/x-icon', jpg: 'image/jpeg' };
function dataUri(rel) {
    const ext = rel.split('.').pop().toLowerCase();
    return `data:${MIME[ext] || 'application/octet-stream'};base64,${fs.readFileSync(path.join(root, rel)).toString('base64')}`;
}

let css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
let catalog = fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8');
let music = fs.readFileSync(path.join(root, 'js/music.js'), 'utf8');
let cards = fs.readFileSync(path.join(root, 'js/cards.js'), 'utf8');
let main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');

// css url() refs -> data uris
css = css.replace(/url\(['"]?\.\.\/([^'")]+)['"]?\)/g, (m, p) => `url("${dataUri(p)}")`);

const assetRefs = new Set();
for (const s of [catalog, music, cards, main]) {
    for (const m of s.matchAll(/assets\/[\w.\-/ ()]+/g)) assetRefs.add(m[0]);
}
let index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of index.matchAll(/assets\/[\w.\-/ ()]+/g)) assetRefs.add(m[0]);

const uriMap = {};
for (const a of assetRefs) {
    if (fs.existsSync(path.join(root, a)) && fs.statSync(path.join(root, a)).isFile()) uriMap[a] = dataUri(a);
}
const inlineAssets = (s) => s.replace(/assets\/[\w.\-/ ()]+/g, (m) => uriMap[m] || m);
for (const k in uriMap) catalog = catalog.replaceAll(`'${k}'`, `'${uriMap[k]}'`);
music = inlineAssets(music); cards = inlineAssets(cards); main = inlineAssets(main);

// extract index body content (logo, icons, menu, pizza-icon, popups)
const bodyMatch = index.match(/<body>([\s\S]*)<\/body>/)[1];
const bodyCore = bodyMatch.replace(/<script[\s\S]*?<\/script>/g, '');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pizza Unblocked</title>
<link rel="icon" href="${uriMap['assets/pizza-icon.png']}">
<style>${css}</style>
</head>
<body>

${bodyCore}

<!-- card pages rendered in-place (single file: no separate html) -->
<main class="page" id="pageMods" hidden><div class="card-grid" id="modGrid"></div><p class="empty-note" id="modsEmpty" hidden>no mods yet</p></main>
<main class="page" id="pageExtras" hidden><div class="card-grid" id="extraGrid"></div><p class="empty-note" id="extrasEmpty" hidden>no extras yet</p></main>

<script>${catalog}</script>
<script>${music}</script>
<script>${cards}</script>
<script>
// single-file router: mods.html / extras.html / index.html links switch sections in place
function showPage(name) {
    document.querySelector('.menu').hidden = name !== 'home';
    document.getElementById('pageMods').hidden = name !== 'mods';
    document.getElementById('pageExtras').hidden = name !== 'extras';
    if (name === 'mods') renderCards(document.getElementById('modGrid'), document.getElementById('modsEmpty'), MODS);
    if (name === 'extras') renderCards(document.getElementById('extraGrid'), document.getElementById('extrasEmpty'), FANGAMES);
}
document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === 'mods.html') { e.preventDefault(); showPage('mods'); }
    else if (href === 'extras.html') { e.preventDefault(); showPage('extras'); }
    else if (href === 'index.html') { e.preventDefault(); showPage('home'); }
    else if (href.endsWith('/')) { /* game dir link — follow normally */ }
});
</script>
<script>${main}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'pizza-unblocked.html'), html);
console.log('wrote pizza-unblocked.html', (html.length / 1024 / 1024).toFixed(1) + 'MB');
