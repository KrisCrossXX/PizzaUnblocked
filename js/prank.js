/* Pizza Unblocked — P-rank tracker.
   Per-game level lists, manual rank selection (click to cycle D→C→B→A→S→P),
   progress percentages, achievement checklists. Persists to IndexedDB
   (db 'pu-prank', store 'state', keyPath 'game'). */
(function () {
    const RANKS = ['-', 'd', 'c', 'b', 'a', 's', 'p'];
    const RANK_PTS = { d: 1, c: 2, b: 3, a: 4, s: 5, p: 6 };

    // seeded level lists — pizzatower gets the full roster; other games
    // start empty and accept custom level entries
    const SEED = {
        pizzatower: {
            levels: [
                'tutorial', 'john gutter', 'pizzascape', 'ancient cheese', 'bloodsauce dungeon',
                'oregano desert', 'wasteyard', 'fun farm', 'fastfood saloon', 'crust cove',
                'gnome forest', 'deep-dish 9', 'golf', 'the pig city', 'peppibot factory',
                'oh shit!', 'refrigerator-refrigerador-freezerator', "don't make a sound", 'war',
                'pepperman (boss)', 'the vigilante (boss)', 'the noise (boss)',
                'fake peppino', 'pizzaface + pizzahead',
            ],
            achievements: [
                'john approved', 'the critic',
                's ranked #1', 's ranked #2', 's ranked #3', 's ranked #4', 's ranked #5',
                'p ranked #1', 'p ranked #2', 'p ranked #3', 'p ranked #4', 'p ranked #5',
            ],
        },
        sugaryspire: { levels: ['entryway', 'sugarshack mines', 'marshmallow mount'] },
    };

    function db() {
        return new Promise((res, rej) => {
            const r = indexedDB.open('pu-prank', 1);
            r.onupgradeneeded = () => r.result.createObjectStore('state', { keyPath: 'game' });
            r.onsuccess = () => res(r.result);
            r.onerror = () => rej(r.error);
        });
    }
    async function loadState(game) {
        const d = await db();
        return new Promise((res, rej) => {
            const r = d.transaction('state').objectStore('state').get(game);
            r.onsuccess = () => {
                const seed = SEED[game] || { levels: [] };
                res(r.result || { game, levels: seed.levels.slice(), ranks: {}, ach: (seed.achievements || []).slice(), achDone: {}, custom: [] });
            };
            r.onerror = () => rej(r.error);
        });
    }
    async function saveState(st) {
        const d = await db();
        return new Promise((res, rej) => {
            const tx = d.transaction('state', 'readwrite');
            tx.objectStore('state').put(st);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    }

    // all catalog games get a tracker entry
    function gameList() {
        const out = [{ dir: 'pizzatower', name: 'pizza tower' }];
        for (const g of (typeof MODS !== 'undefined' ? MODS : [])) out.push({ dir: g.dir, name: g.name });
        for (const g of (typeof FANGAMES !== 'undefined' ? FANGAMES : [])) out.push({ dir: g.dir, name: g.name });
        return out;
    }

    let cur = null, st = null;

    function pct(n, d) { return d ? Math.round(n / d * 100) : 0; }

    async function render() {
        const sel = document.getElementById('prGameSel');
        if (!sel) return;
        if (!sel.options.length) {
            for (const g of gameList()) {
                const o = document.createElement('option');
                o.value = g.dir; o.textContent = g.name;
                sel.appendChild(o);
            }
            sel.value = cur;
        }
        st = await loadState(cur);
        const lvEl = document.getElementById('prLevels');
        lvEl.innerHTML = '';
        let pCount = 0;
        const rankColor = { p: '#ffd75e', s: '#e8e8ff', a: '#7dff7d', b: '#ff9d3b', c: '#ff6b6b', d: '#999' };
        for (const name of st.levels) {
            const row = document.createElement('div');
            row.className = 'pr-row';
            const rk = st.ranks[name] || '-';
            if (rk === 'p') pCount++;
            const nm = document.createElement('span');
            nm.className = 'pr-lname';
            nm.textContent = name;
            const btn = document.createElement('button');
            btn.className = 'pr-rank';
            btn.textContent = rk;
            btn.style.color = rankColor[rk] || '#fff';
            btn.style.borderColor = rankColor[rk] || '#fff';
            btn.onclick = async () => {
                const i = (RANKS.indexOf(st.ranks[name] || '-') + 1) % RANKS.length;
                st.ranks[name] = RANKS[i];
                await saveState(st); render();
            };
            row.appendChild(nm); row.appendChild(btn);
            if ((st.custom || []).includes(name)) {
                const del = document.createElement('button');
                del.className = 'pr-del'; del.textContent = 'x';
                del.onclick = async () => {
                    st.custom = st.custom.filter(x => x !== name);
                    st.levels = st.levels.filter(x => x !== name);
                    delete st.ranks[name];
                    await saveState(st); render();
                };
                row.appendChild(del);
            }
            lvEl.appendChild(row);
        }
        const achEl = document.getElementById('prAch');
        achEl.innerHTML = '';
        let aDone = 0;
        for (const name of st.ach) {
            if (st.achDone[name]) aDone++;
            const row = document.createElement('label');
            row.className = 'pr-ach-row';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!st.achDone[name];
            cb.onchange = async () => { st.achDone[name] = cb.checked; await saveState(st); render(); };
            const sp = document.createElement('span');
            sp.textContent = name;
            row.appendChild(cb); row.appendChild(sp);
            achEl.appendChild(row);
        }
        document.getElementById('prProg').textContent =
            `p-ranks: ${pCount}/${st.levels.length} (${pct(pCount, st.levels.length)}%)` +
            `   achievements: ${aDone}/${st.ach.length} (${pct(aDone, st.ach.length)}%)`;
    }

    function initPrank() {
        const sel = document.getElementById('prGameSel');
        if (!sel || sel.dataset.init) return;
        sel.dataset.init = '1';
        cur = 'pizzatower';
        sel.addEventListener('change', () => { cur = sel.value; render(); });
        document.getElementById('prAddLevel').addEventListener('click', async () => {
            const inp = document.getElementById('prNewLevel');
            const v = inp.value.trim();
            if (!v || !st) return;
            if (!st.levels.includes(v)) { st.levels.push(v); (st.custom = st.custom || []).push(v); }
            inp.value = '';
            await saveState(st); render();
        });
        document.getElementById('prAddAch').addEventListener('click', async () => {
            const inp = document.getElementById('prNewAch');
            const v = inp.value.trim();
            if (!v || !st) return;
            if (!st.ach.includes(v)) st.ach.push(v);
            inp.value = '';
            await saveState(st); render();
        });
        render();
    }

    window.initPrank = initPrank;
    if (document.readyState !== 'loading') initPrank();
    else document.addEventListener('DOMContentLoaded', initPrank);
})();
