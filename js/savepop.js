/* save popup — intercepts clicks on catalog entries flagged save101 (full
   popup incl. the shared saveData*.ini 101% set) or save (backup/play only,
   for non-PT-format games). */
(function () {
    const SAVE_DIRS = new Map(); // dir -> can inject the 101% ini set
    for (const g of [...(typeof MODS !== 'undefined' ? MODS : []), ...(typeof FANGAMES !== 'undefined' ? FANGAMES : [])]) {
        if (g.save101) SAVE_DIRS.set(g.dir, true);
        else if (g.save) SAVE_DIRS.set(g.dir, false);
    }
    if (!SAVE_DIRS.size) return;

    const pop = document.getElementById('popSave');
    const title = document.getElementById('saveTitle');
    const injectBtn = document.getElementById('saveInject');
    let target = null;

    const FILES101 = ['saveData1.ini', 'saveData1C.ini', 'saveData1N.ini',
                      'saveData2.ini', 'saveData2N.ini', 'saveData3.ini', 'saveData3N.ini'];

    // capture phase so we win over main.js's bubble-phase openGame handler
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href]');
        if (!a) return;
        const m = (a.getAttribute('href') || '').match(/^games\/([^/]+)\/?$/);
        if (!m || !SAVE_DIRS.has(m[1])) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        target = { dir: m[1], a };
        const nm = a.querySelector('.cname');
        title.textContent = nm ? nm.textContent : m[1];
        injectBtn.hidden = !SAVE_DIRS.get(m[1]);
        pop.hidden = false;
    }, true);

    const go = () => {
        const a = target && target.a;
        pop.hidden = true;
        if (a && typeof openGame === 'function') openGame(a);
        else if (a) location.href = a.getAttribute('href');
    };

    document.getElementById('saveCancel').addEventListener('click', () => { pop.hidden = true; });
    document.getElementById('saveKeep').addEventListener('click', go);

    document.getElementById('saveBackup').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.textContent = 'backing up…';
        const ok = await PU_SAVES.backupGame(target.dir);
        btn.textContent = ok ? 'backup saved!' : 'no saves to back up';
        setTimeout(() => { btn.textContent = 'back up my save'; }, 1500);
    });

    injectBtn.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.textContent = 'loading save…';
        try {
            let out = null;
            if (typeof PU_SAVE101 !== 'undefined') out = PU_SAVE101; // inlined by single-file build
            else {
                out = {};
                for (const f of FILES101) {
                    const r = await fetch('assets/saves101/' + f);
                    if (r.ok) out[f] = await r.text();
                }
            }
            sessionStorage.setItem('pu_saveinject_' + target.dir, JSON.stringify(out));
        } catch {}
        go();
    });
})();
