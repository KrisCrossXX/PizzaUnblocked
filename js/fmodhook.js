/* fmodhook.js — for OFFICIAL GameMaker HTML5 exports carrying fmod_gms_shim.
   The runner routes show_debug_message to console.log, so we wrap it and feed
   every line into PU_AUDIO.handleLine (which understands the fmod: protocol
   emitted by the GML shim). Load AFTER js/bsaudio.js. */
(() => {
    if (!window.PU_AUDIO) return console.warn('[fmodhook] PU_AUDIO missing');
    const orig = console.log.bind(console);
    console.log = (...args) => {
        orig(...args);
        try { PU_AUDIO.handleLine(args.map(String).join(' ')); } catch (e) {}
    };
    PU_AUDIO.load();
    const unlock = () => {
        PU_AUDIO.unlock();
        removeEventListener('pointerdown', unlock);
        removeEventListener('keydown', unlock);
    };
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
})();
