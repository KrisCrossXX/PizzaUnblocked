/* Pizza Unblocked — mobile touch controls.
   Injected into game pages. Shows a salami-sprite joystick (left) and
   action buttons (right) on touch-capable devices. Dispatches synthetic
   KeyboardEvents so keyboard-only engine builds become touch-playable.
   Auto-shows on phones/tablets; hidden on desktop. */
(function () {
    if (window.__puTouch) return;

    // Prefer the primary pointer type. Desktop browsers can expose
    // `ontouchstart` and `maxTouchPoints` even when a mouse/keyboard is the
    // active input, which incorrectly overlays giant controls on PC.
    const isTouchDevice = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches
        && !matchMedia('(pointer: fine)').matches);
    function readMode() {
        const mode = localStorage.getItem('pu_touch_mode');
        if (mode === 'on' || mode === 'off' || mode === 'auto') return mode;
        return localStorage.getItem('pu_touch') === 'off' ? 'off' : localStorage.getItem('pu_touch') === 'on' ? 'on' : 'auto';
    }
    let enabled = readMode() === 'on' || (readMode() === 'auto' && isTouchDevice());

    const held = new Set();
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
    function press(key, code, kc) {
        if (held.has(kc)) return;
        held.add(kc);
        fire('keydown', key, code, kc);
    }
    function release(kc) {
        if (!held.has(kc)) return;
        held.delete(kc);
        const map = { 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 16: 'Shift', 90: 'z', 88: 'x', 27: 'Escape' };
        const codes = { 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 16: 'ShiftLeft', 90: 'KeyZ', 88: 'KeyX', 27: 'Escape' };
        fire('keyup', map[kc] || '', codes[kc] || '', kc);
    }
    function releaseAll() { for (const kc of [...held]) release(kc); }

    const A = '../../assets/';
    const css = document.createElement('style');
    css.textContent = `
        #pu-touch, #pu-touch * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        #pu-touch { position: fixed; inset: 0; z-index: 99998; pointer-events: none;
            display: none; user-select: none; -webkit-user-select: none; touch-action: none; }
        #pu-touch.on { display: block; }
        .pu-tc { position: absolute; pointer-events: auto; touch-action: none; }
        .pu-tc img { width: 100%; height: 100%; object-fit: contain; pointer-events: none;
            image-rendering: auto; display: block; }
        .pu-tc.press img { transform: scale(.9); filter: brightness(1.15); }
        #pu-stick { left: 3vmin; bottom: 3vmin; width: 42vmin; height: 42vmin; }
        #pu-stick .base { position: absolute; inset: 0; }
        #pu-stick .knob { position: absolute; width: 56.4%; height: 56.4%;
            left: 21.8%; top: 21.8%; }
        #pu-arrows { left: 4vmin; bottom: 4vmin; width: 32vmin; height: 30vmin;
            display: none; grid-template: 1fr 1fr 1fr / 1fr 1fr 1fr; gap: 3px; }
        #pu-arrows button { border: 2px solid #fff5d7; border-radius: 50%; background: #17110dcc;
            color: #fff5d7; font: bold 5vmin/1 sans-serif; text-shadow: 1px 2px #000; touch-action: none; }
        #pu-touch.layout-arrows #pu-stick { display: none; }
        #pu-touch.layout-arrows #pu-arrows { display: grid; }
        #pu-arrows [data-dir="up"] { grid-area: 1 / 2; }
        #pu-arrows [data-dir="left"] { grid-area: 2 / 1; }
        #pu-arrows [data-dir="down"] { grid-area: 2 / 2; }
        #pu-arrows [data-dir="right"] { grid-area: 2 / 3; }
        #pu-jump  { right: 4vmin;  bottom: 5vmin;  width: 21vmin; height: 21vmin; }
        #pu-dash  { right: 8vmin;  bottom: 27vmin; width: 17vmin; height: 17vmin; }
        #pu-grab  { right: 26vmin; bottom: 12vmin; width: 17vmin; height: 17vmin; }
        #pu-pause { right: 2.5vmin; top: 7vmin;  width: 11vmin; height: 11vmin; opacity: .9; }
        @media (max-aspect-ratio: 1/1) {
            #pu-stick { width: 34vmin; height: 34vmin; }
            #pu-jump { width: 19vmin; } #pu-dash, #pu-grab { width: 15vmin; }
        }`;
    document.documentElement.appendChild(css);

    const root = document.createElement('div');
    root.id = 'pu-touch';
    root.innerHTML = `
        <div class="pu-tc" id="pu-stick">
            <img class="base" src="${A}touch-stick-base.png" alt="">
            <img class="knob" src="${A}touch-stick-knob.png" alt="">
        </div>
        <div class="pu-tc" id="pu-arrows" aria-label="Movement controls">
            <button type="button" data-dir="up" aria-label="up">▲</button>
            <button type="button" data-dir="left" aria-label="left">◀</button>
            <button type="button" data-dir="down" aria-label="down">▼</button>
            <button type="button" data-dir="right" aria-label="right">▶</button>
        </div>
        <div class="pu-tc" id="pu-jump"><img src="${A}touch-jump.png" alt="jump"></div>
        <div class="pu-tc" id="pu-dash"><img src="${A}touch-dash.png" alt="dash"></div>
        <div class="pu-tc" id="pu-grab"><img src="${A}touch-grab.png" alt="grab"></div>
        <div class="pu-tc" id="pu-pause"><img src="${A}touch-pause.png" alt="pause"></div>`;
    document.documentElement.appendChild(root);

    function sync() {
        root.classList.toggle('on', enabled);
        root.classList.toggle('layout-arrows', localStorage.getItem('pu_touch_layout') === 'arrows');
        if (!enabled) releaseAll();
    }
    window.addEventListener('storage', event => {
        if (event.key === 'pu_touch_mode' || event.key === 'pu_touch') {
            const mode = readMode();
            enabled = mode === 'on' || (mode === 'auto' && isTouchDevice());
            sync();
        }
        if (event.key === 'pu_touch_layout') sync();
    });

    // --- action buttons ---
    function bindBtn(id, key, code, kc, tap) {
        const el = root.querySelector(id);
        let pid = null;
        el.addEventListener('pointerdown', e => {
            e.preventDefault();
            pid = e.pointerId;
            el.setPointerCapture(pid);
            el.classList.add('press');
            press(key, code, kc);
            if (tap) setTimeout(() => release(kc), 60);
        });
        const up = e => {
            if (e.pointerId !== pid) return;
            pid = null;
            el.classList.remove('press');
            release(kc);
        };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
    }
    bindBtn('#pu-jump', 'z', 'KeyZ', 90);
    bindBtn('#pu-grab', 'x', 'KeyX', 88);
    bindBtn('#pu-dash', 'Shift', 'ShiftLeft', 16);
    bindBtn('#pu-pause', 'Escape', 'Escape', 27, true);

    const keyForDirection = { up: [38, 'ArrowUp'], down: [40, 'ArrowDown'], left: [37, 'ArrowLeft'], right: [39, 'ArrowRight'] };
    for (const button of root.querySelectorAll('#pu-arrows button')) {
        const [kc, key] = keyForDirection[button.dataset.dir];
        bindBtn(`#pu-arrows [data-dir="${button.dataset.dir}"]`, key, key, kc);
    }

    // --- joystick ---
    const stick = root.querySelector('#pu-stick');
    const knob = stick.querySelector('.knob');
    let spid = null;
    const dirs = { 37: false, 38: false, 39: false, 40: false };

    function stickMove(e) {
        const r = stick.getBoundingClientRect();
        const cx = r.left + r.width * 0.53, cy = r.top + r.height * 0.49; // art is slightly off-center
        let dx = (e.clientX - cx) / (r.width * 0.30);
        let dy = (e.clientY - cy) / (r.width * 0.30);
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        knob.style.transform = `translate(${dx * r.width * 0.19}px, ${dy * r.width * 0.19}px)`;
        const DEAD = 0.30;
        const want = {
            37: dx < -DEAD, 39: dx > DEAD,
            38: dy < -DEAD, 40: dy > DEAD,
        };
        for (const kc of [37, 38, 39, 40]) {
            if (want[kc] && !dirs[kc]) { dirs[kc] = true; press('Arrow' + { 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down' }[kc], 'Arrow' + { 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down' }[kc], kc); }
            else if (!want[kc] && dirs[kc]) { dirs[kc] = false; release(kc); }
        }
    }
    function stickReset() {
        knob.style.transform = '';
        for (const kc of [37, 38, 39, 40]) { dirs[kc] = false; release(kc); }
    }
    stick.addEventListener('pointerdown', e => {
        e.preventDefault();
        spid = e.pointerId;
        stick.setPointerCapture(spid);
        stickMove(e);
    });
    stick.addEventListener('pointermove', e => { if (e.pointerId === spid) stickMove(e); });
    const stickUp = e => { if (e.pointerId === spid) { spid = null; stickReset(); } };
    stick.addEventListener('pointerup', stickUp);
    stick.addEventListener('pointercancel', stickUp);

    window.addEventListener('blur', () => { spid = null; stickReset(); releaseAll(); });

    sync();
    window.__puTouch = { get enabled() { return enabled; } };
})();
