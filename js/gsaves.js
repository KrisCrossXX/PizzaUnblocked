/* game-side half of the save popup for GXMFS (emscripten yoyo runner) ports.
   The site popup stashes a {filename: text} map in
   sessionStorage['pu_saveinject_<dir>'] before navigating here; this script
   wraps window.oprt.gameStorage so the runner sees those files as if they
   were already on disk. Nothing is written to localStorage — when the game
   later saves over a slot the real write wins. */
(function () {
    const dir = location.pathname.split('/').filter(Boolean).pop() || 'unknown';
    let files = null;
    try { files = JSON.parse(sessionStorage.getItem('pu_saveinject_' + dir) || 'null'); } catch (e) {}
    if (!files || !Object.keys(files).length) return;
    sessionStorage.removeItem('pu_saveinject_' + dir);

    const pending = Object.assign({}, files);
    const find = (k) => pending[k] !== undefined ? pending[k] : pending[k.split('/').pop()];

    const wrap = (gs) => {
        if (!gs || gs.__puWrapped) return;
        gs.__puWrapped = true;
        const open = gs.open.bind(gs);
        gs.open = function (name) {
            const h = open(name);
            if (!h || h.__puWrapped) return h;
            h.__puWrapped = true;
            if (h.get) {
                const get = h.get.bind(h);
                h.get = (k) => get(k).then((v) => (v === undefined && find(k) !== undefined ? find(k) : v));
            }
            if (h.list) {
                const list = h.list.bind(h);
                h.list = () => list().then((o) => { for (const k in pending) if (!(k in o)) o[k] = pending[k]; return o; });
            }
            if (h.put) {
                const put = h.put.bind(h);
                h.put = (k, v) => { delete pending[k]; delete pending[k.split('/').pop()]; return put(k, v); };
            }
            return h;
        };
    };

    if (window.oprt && window.oprt.gameStorage) wrap(window.oprt.gameStorage);
    let tries = 0;
    const iv = setInterval(() => {
        if (window.oprt && window.oprt.gameStorage) { wrap(window.oprt.gameStorage); clearInterval(iv); }
        else if (++tries > 200) clearInterval(iv);
    }, 50);
})();
