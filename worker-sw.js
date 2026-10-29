/* Tiny service worker: lets the worker page open even with no signal.
   Network first (so updates always arrive), cached copy only as a fallback. */
var CACHE = 'aha-worker-v1';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;
    var url = new URL(req.url);
    var ok = url.origin === self.location.origin || url.hostname === 'www.gstatic.com';
    if (!ok) return; // Firestore/Auth traffic is handled by Firebase itself
    e.respondWith(fetch(req).then(function (res) {
        if (res && res.status === 200) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
    }).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
});
