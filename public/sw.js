self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch fresh network assets for script files
  if (event.request.destination === 'script' || event.request.url.endsWith('.js')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
});
