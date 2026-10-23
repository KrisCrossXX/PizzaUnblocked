// build_embedded.cjs — produces the GH-Pages-branch artifacts:
//   embedded.html  — site JS/CSS inlined, <base> pinned to the main host
//   embedded.svg   — same document served through an svg foreignObject loader
// Assets (thumbs, fonts, games) stay remote — only code is baked in.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const HOST = 'https://pizza-tower-9iw.pages.dev';

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// pin relative asset/script paths to the main host
html = html.replace('<meta charset="utf-8">',
    `<meta charset="utf-8"><base href="${HOST}/">`);

// inline local stylesheets
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
    const p = href.replace(/\?.*$/, '');
    if (!fs.existsSync(path.join(root, p))) return m;
    let css = fs.readFileSync(path.join(root, p), 'utf8');
    css = css.replace(/url\(['"]?\.\.\/([^'")]+)['"]?\)/g, `url("${HOST}/$1")`);
    return `<style>${css}</style>`;
});

// inline local scripts
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    const p = src.replace(/\?.*$/, '');
    if (!fs.existsSync(path.join(root, p)) || /^https?:/.test(p)) return m;
    const code = fs.readFileSync(path.join(root, p), 'utf8');
    return `<script>${code}</script>`;
});

fs.writeFileSync(path.join(root, 'embedded.html'), html);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:fixed;inset:0"><title>Pizza Unblocked</title><foreignObject id="site" x="0" y="0" width="100%" height="100%"/><script><![CDATA[
var frame = document.createElementNS('http://www.w3.org/1999/xhtml', 'iframe');
frame.setAttribute('title', 'Pizza Unblocked');
frame.setAttribute('style', 'width:100%;height:100%;border:0;display:block;background:#1e1a16');
frame.setAttribute('allow', 'autoplay; fullscreen; gamepad; cross-origin-isolated');
frame.setAttribute('allowfullscreen', '');
document.getElementById('site').appendChild(frame);
frame.srcdoc = ${JSON.stringify(html).replace('</script>', '<\\/script>')};
]]></script></svg>`;
fs.writeFileSync(path.join(root, 'embedded.svg'), svg);
console.log('embedded.html', fs.statSync(path.join(root, 'embedded.html')).size, 'embedded.svg', fs.statSync(path.join(root, 'embedded.svg')).size);
