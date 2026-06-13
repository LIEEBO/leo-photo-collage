/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'leo-collage-v1';
const SCOPE = self.registration.scope;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];
const cacheUrl = (path) => new URL(path, SCOPE).toString();

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS.map(cacheUrl)).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Cache-first for static assets
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;

  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|json)$/) ||
    url.href === SCOPE
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }
});
