/* Pizza Unblocked — device detection.
   Sets window.PU_DEVICE to 'mobile' or 'pc', tags <body> with
   device-mobile / device-pc, and fills #devLine where present. */
(function () {
    const ua = navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
        || ((navigator.maxTouchPoints || 0) > 1 && window.matchMedia && matchMedia('(pointer: coarse)').matches);
    window.PU_DEVICE = mobile ? 'mobile' : 'pc';
    document.documentElement.classList.add('device-' + window.PU_DEVICE);
    if (document.body) document.body.classList.add('device-' + window.PU_DEVICE);
    else addEventListener('DOMContentLoaded', () => document.body.classList.add('device-' + window.PU_DEVICE));
    const el = document.getElementById('devLine');
    if (el) el.textContent = 'device: ' + window.PU_DEVICE + (mobile ? ' (touch controls on in games)' : '');
})();
