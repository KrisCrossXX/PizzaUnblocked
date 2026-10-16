// crashlog.js — captures errors into localStorage 'pu_crashlog' (max 150 entries)
// and attempts automatic recovery: dynamic function stubs, cache/SW nuking,
// one reload per crash pattern, then a persistent "copy report" overlay.
// Loaded on every game page. View/clear the log from the site settings popup.
(function () {
    const KEY = 'pu_crashlog';
    const STUBS_KEY = 'pu_stubs';
    const MAX = 150;
    const page = location.pathname.replace(/^.*\/games\//, 'games/').replace(/\/+$/, '');
    const triesKey = 'pu_autofix_' + page;

    // ---- auto-fix: missing extension functions (fmod_*, etc.) ----
    function readStubs() { try { return JSON.parse(localStorage.getItem(STUBS_KEY) || '[]'); } catch { return []; } }
    function defineStub(name) {
        const fn = /isplaying|is_playing|paused|exists/.test(name) ? function () { return 0; }
            : /path|property|result|name|string/.test(name) ? function () { return ''; }
            : /create|instance|init|load/.test(name) ? (function () { let h = defineStub._h || 0; return function () { return ++h; }; })()
            : function () { return 0; };
        const g = [window, globalThis];
        if (window.Module) g.push(window.Module);
        for (const o of g) if (typeof o[name] === 'undefined') o[name] = fn;
    }
    // install all remembered stubs now; keep patching Module once the runner defines it
    const pending = new Set(readStubs());
    for (const n of pending) defineStub(n);
    const modTimer = setInterval(() => {
        if (!window.Module) return;
        for (const n of pending) if (typeof window.Module[n] === 'undefined') window.Module[n] = window[n];
    }, 100);
    setTimeout(() => clearInterval(modTimer), 60000);

    // ---- UI: fix-status banner ----
    function banner(text, withCopy) {
        let el = document.getElementById('pu-fix-banner');
        if (!el) {
            el = document.createElement('div');
            el.id = 'pu-fix-banner';
            el.style.cssText = 'position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:99999;' +
                'background:rgba(10,10,14,.92);border:2px solid #ffd75e;color:#ffd75e;padding:10px 16px;' +
                'font-family:monospace;font-size:13px;text-align:center;max-width:90vw;border-radius:2px;';
            document.body.appendChild(el);
        }
        el.innerHTML = '';
        el.appendChild(document.createTextNode(text));
        if (withCopy) {
            const b = document.createElement('button');
            b.textContent = ' copy crash report ';
            b.style.cssText = 'margin-left:10px;background:#000;color:#fff;border:1px solid #ffd75e;font:inherit;cursor:pointer;padding:4px 8px;';
            b.onclick = () => {
                const report = JSON.stringify(readLog().slice(-20), null, 1);
                (navigator.clipboard ? navigator.clipboard.writeText(report) : Promise.reject())
                    .then(() => b.textContent = ' copied ', () => b.textContent = ' copy failed ');
            };
            el.appendChild(b);
        }
    }

    // ---- crash capture ----
    function readLog() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
    function push(msg, extra) {
        try {
            const log = readLog();
            const text = typeof msg === 'string' ? msg : (msg && (msg.stack || msg.message)) || JSON.stringify(msg);
            log.push({ t: new Date().toISOString(), page, msg: String(text).slice(0, 2000), extra: extra ? String(extra).slice(0, 500) : undefined });
            while (log.length > MAX) log.shift();
            localStorage.setItem(KEY, JSON.stringify(log));
            maybeAutofix(String(text));
        } catch (e) {}
    }

    let reloading = false;
    function maybeAutofix(text) {
        if (reloading) return;
        let tries = 0;
        try { tries = JSON.parse(sessionStorage.getItem(triesKey) || '0'); } catch {}
        if (tries >= 2) { banner('crash could not be auto-fixed — send this to devin:', true); return; }

        const m = /unable to find function ([\w$]+)/i.exec(text);
        if (m) {
            const name = m[1];
            const stubs = readStubs();
            if (!stubs.includes(name)) { stubs.push(name); localStorage.setItem(STUBS_KEY, JSON.stringify(stubs)); }
            pending.add(name); defineStub(name);
            recover(`missing function "${name}" — stubbed it, reloading…`);
            return;
        }
        if (/exception thrown|error on load|uncaught|webgl|out of memory|wasm|abort/i.test(text)) {
            recover('crash detected — clearing cache and reloading…');
        }
    }

    async function recover(note) {
        reloading = true;
        sessionStorage.setItem(triesKey, JSON.stringify(triesNow() + 1));
        banner(note);
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {}
        setTimeout(() => location.reload(), 1200);
    }
    function triesNow() { try { return JSON.parse(sessionStorage.getItem(triesKey) || '0'); } catch { return 0; } }

    addEventListener('error', (e) => push(e.message || 'script error', (e.filename || '') + ':' + (e.lineno || 0)));
    addEventListener('unhandledrejection', (e) => push('unhandled rejection: ' + (e.reason && (e.reason.stack || e.reason.message) || JSON.stringify(e.reason))));

    const origErr = console.error.bind(console);
    console.error = function (...args) {
        push(args.map(a => (a && a.stack) || (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
        origErr(...args);
    };

    const statusObserver = new MutationObserver(() => {
        const s = document.getElementById('status');
        if (s && /exception|error|crash/i.test(s.textContent)) push('runner: ' + s.textContent.trim());
        const mc = document.getElementById('message-container');
        if (mc && mc.style.display !== 'none' && /error|unable|exception/i.test(mc.textContent)) push('runner-msg: ' + mc.textContent.trim());
    });
    addEventListener('DOMContentLoaded', () => statusObserver.observe(document.body, { subtree: true, childList: true, characterData: true }));

    window.PU = window.PU || {};
    window.PU.crashlog = {
        read: readLog,
        clear() { localStorage.removeItem(KEY); },
        push,
        defineStub,
    };
})();
