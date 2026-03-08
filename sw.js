const CACHE = 'nogluten-v4';
const PRECACHE = ['/index.html', '/styles.css', '/main.js', '/recipes.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // allSettled: one slow/missing file won't abort the whole install
      .then(c => Promise.allSettled(PRECACHE.map(url => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Always kick off a network request to keep cache fresh (stale-while-revalidate)
      const network = fetch(e.request).then(response => {
        if (response && response.ok) {
          caches.open(CACHE).then(c => c.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => null);

      // Return cached immediately if available; otherwise wait for network
      return cached ?? network.then(r => r ?? Response.error());
    })
  );
});
