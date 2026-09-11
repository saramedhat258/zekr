const CACHE_NAME = 'zekr-v3';

// Static assets known ahead of time
const STATIC_ASSETS = [
  '/manifest.json',
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
  '/icons/icon-512x512.png',
];

// ─── Install ─────────────────────────────────────────────────────────────────
// 1. Cache all known static assets.
// 2. Fetch the two main entry pages (ar/home + en/home) with the browser so
//    the browser's own parsing triggers sub-resource fetches. We also
//    intercept every _next/ chunk loaded during those fetches (via the fetch
//    handler below) and store them. This guarantees the JS/CSS bundles for
//    first-load are cached even if we can't enumerate their hashed names.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache static assets (best-effort, individual errors won't abort)
      await Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => { /* ignore individual failures */ })
        )
      );

      // Pre-fetch the app shell pages so Next.js chunks get intercepted
      // and cached by the fetch handler during install.
      const pages = ['/ar/home', '/en/home', '/ar', '/en', '/'];
      await Promise.allSettled(
        pages.map((page) =>
          fetch(page, { credentials: 'same-origin' })
            .then((res) => {
              if (res && res.status === 200) {
                return cache.put(page, res);
              }
            })
            .catch(() => { /* offline install is fine; page will be cached on first online visit */ })
        )
      );
    })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests over http(s)
  if (
    request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // ── Cache-First: immutable Next.js static chunks (_next/static/)
  // These filenames contain content hashes so they never change; safe to
  // serve from cache indefinitely and update silently in background.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // ── Cache-First: other static media (images, sounds, icons)
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/sounds/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Revalidate in background
          fetch(request).then((res) => {
            if (res && res.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(request, res));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // ── Stale-While-Revalidate: Next.js data routes (_next/data/)
  if (url.pathname.startsWith('/_next/data/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => cached || new Response('{}', { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ── Network-First with Cache fallback: HTML pages / app routes
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        // Try exact match first
        const cached = await caches.match(request);
        if (cached) return cached;

        // For HTML navigations, serve the locale home page as app shell
        if (request.headers.get('accept')?.includes('text/html')) {
          const locale = url.pathname.startsWith('/ar') ? 'ar' : 'en';
          const shell =
            await caches.match(`/${locale}/home`) ||
            await caches.match(`/${locale}`) ||
            await caches.match('/ar/home') ||
            await caches.match('/');
          if (shell) return shell;
        }

        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
