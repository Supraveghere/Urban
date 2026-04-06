/* ═══════════════════════════════════════════════════════════════
   UrbanDatabase — Service Worker
   Strategie: Network First → dacă nu e internet, din cache
   Schimbă CACHE_VERSION la fiecare update major dacă vrei să
   forțezi ștergerea cache-ului vechi.
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'urbandb-v1';

const PRECACHE = [
  '/',
  '/index.html',
];

/* ── Install: pre-cache fișierele de bază ── */
self.addEventListener('install', event => {
  self.skipWaiting(); // activează imediat, nu așteaptă tab-uri vechi
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});

/* ── Activate: șterge cache-urile vechi ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // preia controlul imediat
  );
});

/* ── Fetch: Network First ── */
self.addEventListener('fetch', event => {
  // Ignoră request-uri non-GET și extensii Chrome
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Răspuns valid de la server — actualizează cache-ul
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cloned);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline — încearcă din cache
        return caches.match(event.request).then(cached => {
          return cached || new Response('Offline — deschide site-ul când ai internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
