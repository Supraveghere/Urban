/* ═══════════════════════════════════════════════════════════════
   UrbanDatabase — Service Worker
   
   ⚡ IMPORTANT: Schimbă CACHE_VERSION de fiecare dată când
   faci update la index.html — browserul va detecta automat
   că SW-ul s-a schimbat și va lua versiunea nouă.
   
   Ex: 'urbandb-v1' → 'urbandb-v2' → 'urbandb-v3' etc.
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'urbandb-v1'; // ← SCHIMBĂ ASTA LA FIECARE UPDATE

/* ── Install: skip waiting = activare imediată ── */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      cache.addAll(['/', '/index.html'])
    )
  );
});

/* ── Activate: șterge toate cache-urile vechi ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: Network First ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache =>
            cache.put(event.request, cloned)
          );
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || new Response('Offline — deschide site-ul când ai internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          })
        )
      )
  );
});
