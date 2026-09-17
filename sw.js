// Service worker: app shell offline-first, API Firebase selalu network.
var CACHE = 'mm-margosari-v15';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo.png',
  './favicon.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/modules.css',
  './css/theme.css',
  './js/firebase.js',
  './js/auth.js',
  './js/data.js',
  './js/helpers.js',
  './js/nav.js',
  './js/dashboard.js',
  './js/absen.js',
  './js/rekap.js',
  './js/sesi.js',
  './js/anggota.js',
  './js/kas.js',
  './js/ekspor.js',
  './js/boot.js'
];

function isApi(url) {
  return url.indexOf('firestore.googleapis.com') > -1 ||
    url.indexOf('identitytoolkit') > -1 ||
    url.indexOf('securetoken.googleapis.com') > -1 ||
    url.indexOf('firebaseinstallations.googleapis.com') > -1;
}

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  if (e.request.method !== 'GET' || isApi(url)) return;
  // Navigasi: network dulu, jatuh ke cache saat offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }
  // Aset statis & font: sajikan cache, perbarui di belakang layar.
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var fresh = fetch(e.request).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || fresh;
    })
  );
});
