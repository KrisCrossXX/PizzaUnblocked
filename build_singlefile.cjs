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

// candidate hosts for the stub to pull the bundle from, tried in order
const HOSTS = [
    'https://pizza-tower-9iw.pages.dev',
    'https://pizzaunblocked.b-cdn.net',
    'https://kriscrossxx.github.io/PizzaUnblocked',
    'https://pizza-unblocked.kriscrossxx.workers.dev',
];
// game + asset links always resolve here — the only host with the full payload
// (pages.dev drops the big chunked game files)
const GAME_HOST = 'https://pizzaunblocked.b-cdn.net';

const MIME = { png: 'image/png', gif: 'image/gif', mp3: 'audio/mpeg', ogg: 'audio/ogg', ttf: 'font/ttf', ico: 'image/x-icon', jpg: 'image/jpeg' };
function dataUri(rel) {
    const ext = rel.split('.').pop().toLowerCase();
    return `data:${MIME[ext] || 'application/octet-stream'};base64,${fs.readFileSync(path.join(root, rel)).toString('base64')}`;
}

let css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
let catalog = fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8');
let credits = fs.readFileSync(path.join(root, 'js/credits.js'), 'utf8');
let music = fs.readFileSync(path.join(root, 'js/music.js'), 'utf8');
let device = fs.readFileSync(path.join(root, 'js/device.js'), 'utf8');
let cards = fs.readFileSync(path.join(root, 'js/cards.js'), 'utf8');
let library = fs.readFileSync(path.join(root, 'js/library.js'), 'utf8');
let mods = fs.readFileSync(path.join(root, 'js/mods.js'), 'utf8');
let extras = fs.readFileSync(path.join(root, 'js/extras.js'), 'utf8');
let main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
let themes = fs.readFileSync(path.join(root, 'js/themes.js'), 'utf8');
let saves = fs.readFileSync(path.join(root, 'js/saves.js'), 'utf8');
let savepop = fs.readFileSync(path.join(root, 'js/savepop.js'), 'utf8');
let swreg = fs.readFileSync(path.join(root, 'swreg.js'), 'utf8');

// inline the bundled 101% save files so the popup works standalone
const saveDir = path.join(root, 'assets/saves101');
const save101 = {};
if (fs.existsSync(saveDir))
    for (const f of fs.readdirSync(saveDir))
        if (f.endsWith('.ini')) save101[f] = fs.readFileSync(path.join(saveDir, f), 'utf8');

// css url() refs -> data uris
css = css.replace(/url\(['"]?\.\.\/([^'")]+)['"]?\)/g, (m, p) => `url("${dataUri(p)}")`);

const assetRefs = new Set();
for (const s of [catalog, credits, music, device, cards, library, mods, extras, main, themes]) {
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
credits = inlineAssets(credits); music = inlineAssets(music); device = inlineAssets(device); cards = inlineAssets(cards);
library = inlineAssets(library);
mods = inlineAssets(mods); extras = inlineAssets(extras); main = inlineAssets(main); themes = inlineAssets(themes);

// baseURI comes from the host that served the bundle (stub sets window.PU_HOST
// before writing the doc); standalone/local use falls back to its own dir
main = main.replace(
    "appBase.href = location.pathname.replace(/[^/]*$/, '');",
    "appBase.href = ((window.PU_HOST || '" + GAME_HOST + "') + '/');"
);

// extract index body content (logo, icons, menu, pizza-icon, popups) —
// run its asset refs through inlineAssets too so the bundle is complete
// even when opened directly as a local file (no host base to resolve against)
const bodyMatch = index.match(/<body>([\s\S]*)<\/body>/)[1];
const bodyCore = inlineAssets(bodyMatch.replace(/<script[\s\S]*?<\/script>/g, ''));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pizza Unblocked</title>
<link rel="icon" href="${uriMap['assets/favicon-pizza-face.png']}" type="image/png">
<link rel="apple-touch-icon" href="${uriMap['assets/favicon-pizza-face.png']}">
<style>${css}</style>
</head>
<body>

${bodyCore}

<script>${catalog}</script>
<script>${credits}</script>
<script>${music}</script>
<script>${device}</script>
<script>${cards}</script>
<script>${library}</script>
<script>${mods}</script>
<script>${extras}</script>
<script>${main}</script>
<script>${themes}</script>
<script>${swreg}</script>
<script>window.PU_SAVE101=${JSON.stringify(save101)};</script>
<script>${saves}</script>
<script>${savepop}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'pusinglefile.html'), html);

// loader stub — the file you actually share. Tries each host in order, then
// document.writes the bundle in with a PU_HOST var first so game links resolve
// against whichever origin answered. The real domain never hits history.
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
var HOSTS = ${JSON.stringify(HOSTS)};
(function go(i){
  if (i >= HOSTS.length) { document.body.innerHTML = "pizza unblocked isn't deployed yet"; return; }
  // ?v= is baked per-build so a rebuilt bundle busts CDN + browser caches;
  // no-store so an old cached bundle can never be reused either
  fetch(HOSTS[i] + "/pusinglefile.html?v=${Date.now()}", { cache: "no-store" })
    .then(r => { if (!r.ok) throw 0; return r.text(); })
    .then(h => {
      document.open();
      document.write('<script>var PU_HOST="${GAME_HOST}";<\\/script>' + h);
      document.close();
    })
    .catch(() => go(i + 1));
})(0);
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'pizza-unblocked.html'), stub);
// same loader under the download-page name
fs.writeFileSync(path.join(root, 'single-file.html'), stub);

// svg variant — same live-fetch idea, but delivered through foreignObject +
// srcdoc since XML documents can't document.write. Always current bundle.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:fixed;inset:0"><title>Pizza Unblocked</title><foreignObject id="site" x="0" y="0" width="100%" height="100%"/><script><![CDATA[
var HOSTS = ${JSON.stringify(HOSTS)};
var frame = document.createElementNS('http://www.w3.org/1999/xhtml', 'iframe');
frame.setAttribute('title', 'Pizza Unblocked');
frame.setAttribute('style', 'width:100%;height:100%;border:0;display:block;background:#1e1a16');
frame.setAttribute('allow', 'autoplay; fullscreen; gamepad; cross-origin-isolated');
frame.setAttribute('allowfullscreen', '');
frame.srcdoc = '<body style="background:#1e1a16;color:#fff4e0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">loading pizza unblocked...</body>';
document.getElementById('site').appendChild(frame);
(function go(i) {
  if (i >= HOSTS.length) { frame.srcdoc = '<body style="background:#1e1a16;color:#fff4e0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">pizza unblocked is unreachable right now</body>'; return; }
  fetch(HOSTS[i] + '/pusinglefile.html?v=${Date.now()}', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw 0; return r.text(); })
    .then(function (h) { frame.srcdoc = '<script>var PU_HOST="${GAME_HOST}";<\\/script>' + h; })
    .catch(function () { go(i + 1); });
})(0);
]]></script></svg>
`;
fs.writeFileSync(path.join(root, 'single-file.svg'), svg);

console.log('wrote pusinglefile.html', (html.length / 1024 / 1024).toFixed(1) + 'MB');
console.log('wrote pizza-unblocked.html + single-file.html + single-file.svg (stub → ' + HOSTS.join(' → ') + ')');
