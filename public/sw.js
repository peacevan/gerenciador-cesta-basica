const CACHE_NAME = 'smartlist-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/list-voice',
  '/assets/styles.css',
  '/assets/script.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Allow the page to trigger skipWaiting on the waiting worker
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Handle navigation requests (HTML) with network-first, fallback to cached list-voice
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/list-voice'))
    );
    return;
  }

  // For scripts and styles prefer network (avoid caching HTML under JS paths)
  const accept = request.headers.get('accept') || '';
  const isScript = request.destination === 'script' || /\.(js|mjs)$/.test(request.url);
  const isStyle = request.destination === 'style' || /\.css$/.test(request.url);
  if (isScript || isStyle) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          // If server returned HTML for a JS/CSS request, don't cache it
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default cache-first strategy for other resources
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match('/list-voice'));
    })
  );
});
