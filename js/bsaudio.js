/* Butterscotch audio bridge — no FMOD in the web runner, so the wad's fmod_*
   FUNC records are repointed to builtins whose side effects reach stdout.

   Dual-mode wads (lhpp/cc — window_set_caption exists in STRG):
     "Game: event:/x"                          fmod_event_one_shot      -> play now
     "Runner: Window title set to: event:/x"   fmod_event_create_instance -> pending
     "Game: <struct:N>" / "Game: undefined"    fmod_event_instance_play   -> play pending
     "Runner: Window title set to: <struct|undefined>" fmod_event_instance_stop -> stop
   Single-mode wads (elm — no window_set_caption):
     "Game: event:/x"                          one_shot/create          -> play now
     instance_stop/instance_play               get_timer (silent)       -> nothing

   Instance ids arrive as wrapper structs ("<struct:N>") or undefined, so stops
   can't be correlated to events — a stop kills the most recent created instance,
   falling back to the music track.
*/
const PU_AUDIO = (() => {
    let map = null;
    let musicEl = null, musicKey = null;
    const lastPlay = new Map();
    const sfx = new Set();
    const instances = [];           // {el} — created-instance plays (loops), stack order
    let pending = null;             // {ev, at} create awaiting its play-confirm
    let dual = false;               // seen a "Window title set to: event:" line
    const evTimes = [];

    const norm = s => s.toLowerCase().replace(/[^a-z0-9_]/g, '');

    function fileFor(evName) {
        if (!map) return null;
        const segs = evName.split('/').filter(Boolean);
        const last = norm(segs[segs.length - 1] || '');
        const cands = [];
        for (let i = 0; i < segs.length; i++) cands.push(norm(segs.slice(i).join('_')));
        cands.push('mu_' + last, 'snd_' + last, 'sfx_' + last, 'mus_' + last, 'music_' + last);
        for (const c of cands) if (map[c]) return map[c];
        // numbered variants (PT picks e.g. barrelbump1-7 at random per event)
        for (const c of cands.concat(['mu_' + last, 'snd_' + last, 'sfx_' + last])) {
            const variants = [];
            for (const k in map)
                if (k.startsWith(c) && /^\d+$/.test(k.slice(c.length))) variants.push(map[k]);
            if (variants.length) return variants[Math.floor(Math.random() * variants.length)];
        }
        if (last.length >= 5)
            for (const k in map) if (k.endsWith(last)) return map[k];
        // basename ends with a shorter sample name (event:/sfx/ui/bombfuse -> fuse)
        if (last.length >= 5)
            for (const k in map) if (k.length >= 4 && last.endsWith(k)) return map[k];
        return null;
    }

    async function load() {
        map = await fetch('soundmap.json').then(r => r.json()).catch(() => ({}));
    }

    function makeAudio(rel, loop) {
        const a = new Audio(rel);
        a.loop = loop;
        a.play().catch(() => {});
        return a;
    }

    const isMusic = ev => /^event:\/[^/]*music\//i.test(ev);

    function startMusic(file) {
        if (musicEl && musicKey === file) return;
        if (musicEl) musicEl.pause();
        musicKey = file;
        musicEl = makeAudio('../_audio/' + file, true);
    }

    function playNow(evName, instanced) {
        const now = performance.now();
        if (now - (lastPlay.get(evName) || 0) < 900) return;
        lastPlay.set(evName, now);
        const file = fileFor(evName);
        if (!file) { console.log('[audio] no map for', evName); return; }
        if (isMusic(evName)) { startMusic(file); return; }
        const a = makeAudio('../_audio/' + file, instanced);
        sfx.add(a);
        if (instanced) instances.push({ el: a });
        a.addEventListener('ended', () => {
            sfx.delete(a); a.src = '';
            const i = instances.findIndex(x => x.el === a);
            if (i >= 0) instances.splice(i, 1);
        });
        if (sfx.size > 24) { const f = sfx.values().next().value; f.pause(); sfx.delete(f); }
    }

    function doStop() {
        if (instances.length) {
            const { el } = instances.pop();
            el.pause(); sfx.delete(el);
        } else if (musicEl) {
            musicEl.pause(); musicEl = null; musicKey = null;
        }
    }

    function stopAll() {
        if (musicEl) { musicEl.pause(); musicEl = null; musicKey = null; }
        for (const a of sfx) a.pause();
        sfx.clear();
        instances.length = 0;
        pending = null;
    }

    // enumeration suppression: >8 events inside 600ms = init dump, not gameplay
    function isBurst() {
        const now = performance.now();
        evTimes.push(now);
        while (evTimes.length && evTimes[0] < now - 600) evTimes.shift();
        return evTimes.length > 8;
    }

    function onUndefined() {
        if (pending && performance.now() - pending.at < 4000) {
            const ev = pending.ev;
            pending = null;
            playNow(ev, !isMusic(ev));
        }
    }

    function onCaption(val) {
        if (val.startsWith('event:')) { dual = true; pending = { ev: val, at: performance.now() }; }
        else if (val === 'undefined' || val.startsWith('<struct')) doStop();
    }

    function handleLine(t) {
        let i = t.indexOf('Window title set to:');
        if (i >= 0) { onCaption(t.slice(i + 20).trim().replace(/^"|"$/g, '')); return; }
        i = t.indexOf('event:');
        if (i >= 0) {
            const ev = t.slice(i).split(/[\s"'\]]/, 1)[0].replace(/["']+$/, '');
            if (ev.length > 6 && !isBurst()) playNow(ev, false);
            return;
        }
        // "Game: <struct:N>" / "Game: undefined" — instance_play flood or stray.
        if (/Game:\s+(?:undefined|<struct)/.test(t)) onUndefined();
    }

    function unlock() {
        if (musicEl) musicEl.play().catch(() => {});
        for (const a of sfx) a.play().catch(() => {});
    }

    addEventListener('pagehide', stopAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });

    return { load, handleLine, unlock, stopAll };
})();
