const CACHE_NAME = 'zekr-app-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/ar',
  '/en',
  '/ar/home',
  '/en/home',
  '/ar/session',
  '/en/session',
  '/sounds/soft-chime.mp3',
  '/sounds/completion-tone.mp3',
  '/sounds/notification-tone.mp3',
  '/sounds/success-bell.mp3',
  '/images/logo.svg',
  '/images/mic.svg',
  '/images/mic2.svg',
  '/images/micgray.svg',
  '/images/privacy.svg',
  '/images/replay.svg',
  '/images/selected.svg',
  '/images/alert-circle.svg',
  '/images/audio-wave.svg',
  '/images/change.svg',
  '/images/pause.svg',
  '/images/play.svg',
  '/images/tooltip.svg',
  '/images/islamicpattern.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Cache-First strategy for static media and assets
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/sounds/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.mp3')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-First with Cache fallback for routes
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.headers.get('accept')?.includes('text/html')) {
          const match = await caches.match('/ar/home') || await caches.match('/en/home') || await caches.match('/');
          if (match) return match;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
