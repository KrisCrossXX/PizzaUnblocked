// build_singlefile.cjs — packs the whole site UI into ONE html file.
// Emits two files:
//   pusinglefile.html   — the fat bundle (all assets inlined). Host this one.
//   pizza-unblocked.html — a tiny loader stub that fetches the bundle from
//                         SITE_ORIGIN and document.writes it (like tobysingle.html).
// Game links inside the bundle are rebased to SITE_ORIGIN so they launch from
// the hosted site no matter where the stub file lives.
const fs = require('fs');
const path = require('path');
const root = __dirname;

// where the bundle is hosted — everything the stub needs resolves from here
const SITE_ORIGIN = process.env.PU_ORIGIN || 'https://pizza-unblocked.kriscrossxx.workers.dev';

const MIME = { png: 'image/png', gif: 'image/gif', mp3: 'audio/mpeg', ogg: 'audio/ogg', ttf: 'font/ttf', ico: 'image/x-icon', jpg: 'image/jpeg' };
function dataUri(rel) {
    const ext = rel.split('.').pop().toLowerCase();
    return `data:${MIME[ext] || 'application/octet-stream'};base64,${fs.readFileSync(path.join(root, rel)).toString('base64')}`;
}

let css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
let catalog = fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8');
let music = fs.readFileSync(path.join(root, 'js/music.js'), 'utf8');
let device = fs.readFileSync(path.join(root, 'js/device.js'), 'utf8');
let cards = fs.readFileSync(path.join(root, 'js/cards.js'), 'utf8');
let mods = fs.readFileSync(path.join(root, 'js/mods.js'), 'utf8');
let extras = fs.readFileSync(path.join(root, 'js/extras.js'), 'utf8');
let main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
let saves = fs.readFileSync(path.join(root, 'js/saves.js'), 'utf8');
let savepop = fs.readFileSync(path.join(root, 'js/savepop.js'), 'utf8');

// inline the bundled 101% save files so the popup works standalone
const saveDir = path.join(root, 'assets/saves101');
const save101 = {};
if (fs.existsSync(saveDir))
    for (const f of fs.readdirSync(saveDir))
        if (f.endsWith('.ini')) save101[f] = fs.readFileSync(path.join(saveDir, f), 'utf8');

// css url() refs -> data uris
css = css.replace(/url\(['"]?\.\.\/([^'")]+)['"]?\)/g, (m, p) => `url("${dataUri(p)}")`);

const assetRefs = new Set();
for (const s of [catalog, music, device, cards, mods, extras, main]) {
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
music = inlineAssets(music); device = inlineAssets(device); cards = inlineAssets(cards);
mods = inlineAssets(mods); extras = inlineAssets(extras); main = inlineAssets(main);

// pin document.baseURI to the hosted site so game links launch from the real
// origin even when the bundle runs inside the file:// loader stub
main = main.replace(
    "appBase.href = location.pathname.replace(/[^/]*$/, '');",
    `appBase.href = '${SITE_ORIGIN}/';`
);

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

<script>${catalog}</script>
<script>${music}</script>
<script>${device}</script>
<script>${cards}</script>
<script>${mods}</script>
<script>${extras}</script>
<script>${main}</script>
<script>window.PU_SAVE101=${JSON.stringify(save101)};</script>
<script>${saves}</script>
<script>${savepop}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'pusinglefile.html'), html);

// loader stub — the file you actually share. Fetches the hosted bundle and
// writes it into the current document, so the real domain never hits history.
const stub = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pizza Unblocked</title>
</head>
<body>
<p>loading pizza unblocked...</p>
<script>
fetch("${SITE_ORIGIN}/pusinglefile.html")
  .then(r => r.text())
  .then(h => {
    document.open();
    document.write(h);
    document.close();
  })
  .catch(e => alert(e));
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'pizza-unblocked.html'), stub);

console.log('wrote pusinglefile.html', (html.length / 1024 / 1024).toFixed(1) + 'MB');
console.log('wrote pizza-unblocked.html (stub → ' + SITE_ORIGIN + ')');
