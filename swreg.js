// swreg.js — registers the root service worker from any page depth.
// sw.js lives at the site root; games load it from games/<name>/ pages.
// First visit the page has no controller, so chunk requests would race the
// install and 404 — wait for activation then reload once; later visits are
// already controlled and load clean.
(function () {
    if (!('serviceWorker' in navigator)) return;
    var root = location.pathname.replace(/\/games\/.*$/, '/').replace(/\/[^/]*$/, '/');
    navigator.serviceWorker.register(root + 'sw.js').then(function () {
        if (!navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(function () { location.reload(); });
        }
    }).catch(function () {});
})();
