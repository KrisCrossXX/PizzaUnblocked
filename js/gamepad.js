/* Pizza Unblocked — gamepad → keyboard bridge.
   Injected into game pages. Polls the Gamepad API and dispatches synthetic
   KeyboardEvents so engine builds (GM/Godot/Construct/Unity) that only read
   keyboard input become controller-playable.
   Toggle with Alt+G. Supports standard-layout Xbox/PlayStation/etc pads. */
(function () {
    if (window.__puPad) return;
    if (!('getGamepads' in navigator)) return;

    // physical button index -> keyboard key
    // A=jump(Z)  B=action(X)  X=taunt(C)  Y=V  LB/RB=shift  LT/RT=A/S
    // back=enter  start=escape  sticks=digital arrows
    const BTN_MAP = {
        0: ['z', 'KeyZ', 90], 1: ['x', 'KeyX', 88], 2: ['c', 'KeyC', 67], 3: ['v', 'KeyV', 86],
        4: ['Shift', 'ShiftLeft', 16], 5: ['a', 'KeyA', 65],
        6: ['s', 'KeyS', 83], 7: ['d', 'KeyD', 68],
        8: ['Enter', 'Enter', 13], 9: ['Escape', 'Escape', 27],
        12: ['ArrowUp', 'ArrowUp', 38], 13: ['ArrowDown', 'ArrowDown', 40],
        14: ['ArrowLeft', 'ArrowLeft', 37], 15: ['ArrowRight', 'ArrowRight', 39],
    };
    const AXIS_THRESH = 0.4;
    const AXIS_MAP = { '0-': 'ArrowLeft', '0+': 'ArrowRight', '1-': 'ArrowUp', '1+': 'ArrowDown' };
    const AXIS_KC = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 };

    let enabled = localStorage.getItem('pu_gamepad') !== 'off';
    const held = new Map(); // key code string -> [key, code, keyCode]
    let pad = null, raf = 0, ind = null;

    function indicator() {
        if (ind) return ind;
        ind = document.createElement('div');
        ind.id = 'pu-pad';
        ind.style.cssText = 'position:fixed;bottom:8px;right:10px;z-index:99999;' +
            'font:12px monospace;color:#0f0;background:rgba(0,0,0,.6);padding:3px 8px;' +
            'border:1px solid #0f0;pointer-events:none;display:none';
        document.documentElement.appendChild(ind);
        return ind;
    }
    function showInd() {
        const el = indicator();
        if (pad) { el.textContent = enabled ? 'pad: ' + pad.id.slice(0, 28) : 'pad: off (alt+g)'; el.style.display = 'block'; }
        else el.style.display = 'none';
    }

    function fire(type, key, code, keyCode) {
        const e = new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true });
        try {
            Object.defineProperty(e, 'keyCode', { get: () => keyCode });
            Object.defineProperty(e, 'which', { get: () => keyCode });
        } catch (_) {}
        (document.body || document.documentElement).dispatchEvent(e);
        document.dispatchEvent(e);
        window.dispatchEvent(e);
    }

    function press(kc, key, code) {
        if (held.has(kc)) return;
        held.set(kc, [key, code, kc]);
        fire('keydown', key, code, kc);
    }
    function release(kc) {
        const k = held.get(kc);
        if (!k) return;
        held.delete(kc);
        fire('keyup', k[0], k[1], kc);
    }
    function releaseAll() { for (const kc of [...held.keys()]) release(kc); }

    function poll() {
        raf = requestAnimationFrame(poll);
        const pads = navigator.getGamepads();
        pad = null;
        for (const p of pads) if (p && p.connected) { pad = p; break; }
        showInd();
        if (!pad || !enabled) { if (held.size) releaseAll(); return; }

        for (const [idx, [key, code, kc]] of Object.entries(BTN_MAP)) {
            const b = pad.buttons[+idx];
            const down = b && (b.pressed || b.value > 0.5);
            if (down) press(kc, key, code); else release(kc);
        }
        for (const [sig, key] of Object.entries(AXIS_MAP)) {
            const ax = +sig[0], pos = sig[1] === '+';
            const v = pad.axes[ax] || 0;
            const down = pos ? v > AXIS_THRESH : v < -AXIS_THRESH;
            const kc = AXIS_KC[key];
            if (down) press(kc, key, key); else release(kc);
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.code === 'KeyG' || e.key === 'g')) {
            enabled = !enabled;
            localStorage.setItem('pu_gamepad', enabled ? 'on' : 'off');
            if (!enabled) releaseAll();
            showInd();
        }
    });
    window.addEventListener('gamepadconnected', showInd);
    window.addEventListener('gamepaddisconnected', () => { pad = null; releaseAll(); showInd(); });

    poll();
    window.__puPad = { get enabled() { return enabled; } };
})();
