// swreg.js — registers the root service worker from any page depth.
// sw.js lives at the site root; games load it from games/<name>/ pages.
(function () {
    if (!('serviceWorker' in navigator)) return;
    var root = location.pathname.replace(/\/games\/.*$/, '/').replace(/\/[^/]*$/, '/');
    navigator.serviceWorker.register(root + 'sw.js').catch(function () {});
})();
