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
    let stubHandle = 0;
    function stubFn(name) {
        if (/isplaying|is_playing|paused|exists/.test(name)) return function () { return 0; };
        if (/path|property|result|name|string/.test(name)) return function () { return ''; };
        if (/create|instance|init|load|event/.test(name)) return function () { return ++stubHandle; };
        return function () { return 0; };
    }
    function defineStub(name) {
        for (const o of [window, globalThis, window.Module].filter(Boolean)) {
            if (typeof o[name] === 'undefined') o[name] = stubFn(name);
        }
    }
    // install all remembered stubs now; keep patching Module once the runner defines it
    const pending = new Set(readStubs());
    for (const n of pending) defineStub(n);
    const modTimer = setInterval(() => {
        if (!window.Module) return;
        for (const n of pending) if (typeof window.Module[n] === 'undefined') window.Module[n] = stubFn(n);
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

    // ---- serialization ----
    function ser(v) {
        if (v == null) return String(v);
        if (typeof v === 'string') return v;
        if (v instanceof Error) return (v.name + ': ' + v.message + '\n' + (v.stack || '')).trim();
        if (typeof v === 'object') {
            const parts = [];
            for (const k of Object.getOwnPropertyNames(v)) {
                try { parts.push(k + '=' + ser(v[k])); } catch {}
            }
            const s = parts.join(', ');
            return s.length > 600 ? s.slice(0, 600) : s;
        }
        return String(v);
    }

    // ---- crash capture (deduped) ----
    function readLog() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
    let lastMsg = '', lastTime = 0;
    function push(msg, extra) {
        const text = ser(msg).slice(0, 2000);
        const now = Date.now();
        if (text === lastMsg && now - lastTime < 10000) return; // dedupe spam
        lastMsg = text; lastTime = now;
        try {
            const log = readLog();
            log.push({ t: new Date().toISOString(), page, msg: text, extra: extra ? String(extra).slice(0, 500) : undefined });
            while (log.length > MAX) log.shift();
            localStorage.setItem(KEY, JSON.stringify(log));
        } catch (e) {}
        maybeAutofix(text);
    }

    // errors that look scary but never kill the game — fullscreen/pointer-lock/
    // autoplay/permission denials and browser-extension noise
    const BENIGN_RX = /permissions check failed|exitFullscreen|requestFullscreen|not active|user gesture|notallowederror|pointerlock|pointer lock|user didn't interact|interact with the document first/i;
    const FATAL_RX = /exception thrown|error on load|out of memory|memory access out of bounds|runtimeerror|abort\(|unable to find function|referenceerror|\bis not defined\b/i;

    let reloading = false;
    function maybeAutofix(text) {
        if (reloading) return;
        if (BENIGN_RX.test(text) && !FATAL_RX.test(text)) return;

        const m = /unable to find function ([\w$]+)/i.exec(text);
        if (m) {
            if (triesNow() >= 2) { banner('crash could not be auto-fixed — send this to devin:', true); return; }
            const name = m[1];
            const stubs = readStubs();
            if (!stubs.includes(name)) { stubs.push(name); localStorage.setItem(STUBS_KEY, JSON.stringify(stubs)); }
            pending.add(name); defineStub(name);
            recover(`missing function "${name}" — stubbed it, reloading…`);
            return;
        }
        if (FATAL_RX.test(text)) {
            if (triesNow() >= 2) { banner('crash could not be auto-fixed — send this to devin:', true); return; }
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

    addEventListener('error', (e) => {
        push(e.error || e.message || 'script error', (e.filename || '') + ':' + (e.lineno || 0));
    });
    addEventListener('unhandledrejection', (e) => push('unhandled rejection: ' + ser(e.reason)));

    const origErr = console.error.bind(console);
    console.error = function (...args) {
        push(args.map(ser).join(' '));
        origErr(...args);
    };

    // runner's own error surfaces: #status text, #message-container, and any DOM
    // text matching a crash signature (covers the mods' "Error on load" dialog)
    const CRASH_RX = /unable to find function|error on load|exception thrown|crash/i;
    const seenText = new Set();
    function scanText(txt) {
        const t = (txt || '').trim();
        if (t && CRASH_RX.test(t) && !seenText.has(t)) {
            seenText.add(t);
            push('runner: ' + t.slice(0, 2000));
        }
    }
    const statusObserver = new MutationObserver((muts) => {
        const s = document.getElementById('status');
        if (s) scanText(s.textContent);
        const mc = document.getElementById('message-container');
        if (mc && mc.style.display !== 'none') scanText(mc.textContent);
        for (const mu of muts) {
            for (const n of mu.addedNodes) {
                if (n.nodeType === 3) {
                    const p = n.parentElement;
                    if (p && (p.id === 'pu-fix-banner' || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName))) continue;
                    scanText(n.nodeValue);
                } else if (n.nodeType === 1) {
                    if (n.id === 'pu-fix-banner' || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.tagName)) continue;
                    scanText(n.textContent);
                }
            }
            if (mu.type === 'characterData') {
                const p = mu.target.parentElement;
                if (p && (p.id === 'pu-fix-banner' || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName))) continue;
                scanText(mu.target.nodeValue);
            }
        }
    });
    addEventListener('DOMContentLoaded', () => {
        statusObserver.observe(document.body, { subtree: true, childList: true, characterData: true });
        // also catch the error dialog if it already exists
        document.querySelectorAll('body *').forEach(el => {
            if (el.children.length === 0) scanText(el.textContent);
        });
    });

    window.PU = window.PU || {};
    window.PU.crashlog = {
        read: readLog,
        clear() { localStorage.removeItem(KEY); },
        push,
        defineStub,
    };
})();
