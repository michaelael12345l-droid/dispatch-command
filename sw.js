/* Dispatch Command phone app: service worker.
   - phone.html, the manifest and icons: always try the network first, so a new upload shows up right away.
     The saved copy is only used when the phone is offline.
   - map libraries and fonts (fixed versions): served from the saved copy for faster starts.
   - Everything else (map tiles, routes, addresses, the PC index.html) is left alone. */
const CACHE = 'dispatch-phone-v1';
const OWN = /\/(phone\.html|manifest\.webmanifest|icon-[\w-]+\.png|apple-touch-icon\.png)?$/;
const LIBS = /^https:\/\/(cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet\/|unpkg\.com\/(maplibre-gl@|@maplibre\/maplibre-gl-leaflet@)|fonts\.(googleapis|gstatic)\.com\/)/;
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    const path = u.pathname.slice(new URL(self.registration.scope).pathname.length - 1);
    if (!OWN.test(path) || /\/$/.test(path)) return;           // index.html and the PC game are not touched
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); } return res; })
      .catch(() => caches.match(r, {ignoreSearch: true})));
    return;
  }
  if (LIBS.test(r.url)) {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); } return res; })));
  }
});
