/* save popup — intercepts clicks on catalog entries flagged save101
   (noise-update-era mods that use the shared saveData*.ini format). */
(function () {
    const SAVE_DIRS = new Set();
    for (const g of [...(typeof MODS !== 'undefined' ? MODS : []), ...(typeof FANGAMES !== 'undefined' ? FANGAMES : [])])
        if (g.save101) SAVE_DIRS.add(g.dir);
    if (!SAVE_DIRS.size) return;

    const pop = document.getElementById('popSave');
    const title = document.getElementById('saveTitle');
    let target = null;

    const FILES101 = ['saveData1.ini', 'saveData1C.ini', 'saveData1N.ini',
                      'saveData2.ini', 'saveData2N.ini', 'saveData3.ini', 'saveData3N.ini'];

    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href]');
        if (!a) return;
        const m = (a.getAttribute('href') || '').match(/^games\/([^/]+)\/?$/);
        if (!m || !SAVE_DIRS.has(m[1])) return;
        e.preventDefault();
        target = { dir: m[1], href: a.getAttribute('href') };
        const nm = a.querySelector('.cname');
        title.textContent = nm ? nm.textContent : m[1];
        pop.hidden = false;
    });

    const go = () => {
        const href = target && target.href;
        pop.hidden = true;
        if (href) location.href = href;
    };

    document.getElementById('saveCancel').addEventListener('click', () => { pop.hidden = true; });
    document.getElementById('saveKeep').addEventListener('click', go);

    document.getElementById('saveBackup').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.textContent = 'backing up…';
        const ok = await PU_SAVES.downloadBackup(target.dir);
        btn.textContent = ok ? 'backup saved!' : 'no saves to back up';
        setTimeout(() => { btn.textContent = 'back up my save'; }, 1500);
    });

    document.getElementById('saveInject').addEventListener('click', async (e) => {
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
