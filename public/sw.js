const CACHE_NAME = 'stivulator-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/icon-512.png',
  '/assets/steve-idle.png',
  '/assets/face-annoyed.png',
  '/assets/face-laughing.png',
  '/assets/face-eating.png',
  '/assets/samsung-body.png',
  '/assets/item-apple.png',
  '/assets/item-android.png',
  '/assets/item-windows.png',
  '/assets/item-banana.png',
  '/assets/item-burger.png',
  '/assets/item-pastry.png',
  '/assets/bg-room.jpg',
  '/assets/finger-cursor.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(() => {
      // Graceful: continue even if some assets fail to cache
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback could go here
        return new Response('Offline - play Stivulator!', { status: 503 });
      });
    })
  );
});
