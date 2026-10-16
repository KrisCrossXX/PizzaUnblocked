// crashlog.js — captures errors into localStorage 'pu_crashlog' (max 150 entries).
// Loaded on every game page. View/clear from the settings popup.
(function () {
    const KEY = 'pu_crashlog';
    const MAX = 150;

    function push(msg, extra) {
        try {
            const log = JSON.parse(localStorage.getItem(KEY) || '[]');
            log.push({
                t: new Date().toISOString(),
                page: location.pathname.replace(/^.*\/games\//, 'games/').replace(/\/$/, ''),
                msg: String(msg).slice(0, 2000),
                extra: extra ? String(extra).slice(0, 500) : undefined,
            });
            while (log.length > MAX) log.shift();
            localStorage.setItem(KEY, JSON.stringify(log));
        } catch (e) { /* storage full/blocked — ignore */ }
    }

    addEventListener('error', (e) => {
        push(e.message || 'script error', (e.filename || '') + ':' + (e.lineno || 0));
    });
    addEventListener('unhandledrejection', (e) => {
        push('unhandled rejection: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason));
    });

    const origErr = console.error.bind(console);
    console.error = function (...args) {
        push(args.map(a => (a && a.stack) || a).join(' '));
        origErr(...args);
    };

    // GM runner reports its own "Exception thrown" through the status element —
    // watch for it since it doesn't always surface as a window error.
    const statusObserver = new MutationObserver(() => {
        const s = document.getElementById('status');
        if (s && /exception|error|crash/i.test(s.textContent)) {
            push('runner: ' + s.textContent.trim());
        }
        // mods' crash overlay: "#message-container" / generic error dialogs
        const mc = document.getElementById('message-container');
        if (mc && mc.style.display !== 'none' && /error|unable|exception/i.test(mc.textContent)) {
            push('runner-msg: ' + mc.textContent.trim());
        }
    });
    addEventListener('DOMContentLoaded', () => statusObserver.observe(document.body, { subtree: true, childList: true, characterData: true }));

    window.PU = window.PU || {};
    window.PU.crashlog = {
        read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
        clear() { localStorage.removeItem(KEY); },
        push,
    };
})();
