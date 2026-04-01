/**
 * ============================================================
 * Vibe Boilerplate — service-worker.js
 * PWA OFFLINE SUPPORT — OPTIONAL
 * ============================================================
 *
 * This service worker implements a Cache-First strategy for
 * static assets, with a network fallback.
 *
 * STRATEGY:
 *   1. On install: pre-cache all listed static assets.
 *   2. On fetch:   return from cache if available; otherwise
 *                  fetch from network and cache the result.
 *   3. On activate: delete outdated cache versions.
 *
 * TO ENABLE:
 *   Uncomment the service worker registration block in index.html.
 *
 * LOCAL TESTING LIMITATIONS:
 *   - Service workers require HTTPS or localhost.
 *   - Opening via file:// protocol will NOT register the SW.
 *   - Use a local server (e.g. VS Code Live Server, Python's
 *     http.server, or `npx serve`) for local PWA testing.
 *
 * GITHUB PAGES:
 *   - GitHub Pages serves over HTTPS, so the SW will register
 *     and work correctly once deployed.
 *   - If your repo is in a subfolder (e.g. /my-repo/), update
 *     CACHE_URLS paths accordingly (prefix with /my-repo/).
 *
 * CACHE BUSTING:
 *   Increment CACHE_VERSION when you deploy updated assets.
 *   The activate handler will delete the old cache automatically.
 *
 * ============================================================
 */

/* ─────────────────────────────────────────────
   CONFIGURATION
   ───────────────────────────────────────────── */

/** Change this string whenever you deploy updated assets. */
const CACHE_VERSION = 'v1';

/** Unique cache name for this version of the app. */
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

/**
 * Files to pre-cache during installation.
 * Must be relative to the service worker's scope.
 * Add any other static assets your app depends on at load time.
 */
const CACHE_URLS = [
  './',
  './index.html',
  './404.html',
  './css/style.css',
  './js/main.js',
  './manifest.json',
  // './assets/icons/favicon.svg',
  // './assets/icons/icon-192.png',
  // './assets/icons/icon-512.png',
];


/* ─────────────────────────────────────────────
   INSTALL EVENT
   Pre-caches listed assets.
   skipWaiting() activates the new SW immediately.
   ───────────────────────────────────────────── */

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing cache: ${CACHE_NAME}`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching assets');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        // Activate new SW without waiting for all tabs to close
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Pre-cache failed:', err);
      })
  );
});


/* ─────────────────────────────────────────────
   ACTIVATE EVENT
   Removes old/outdated caches.
   clients.claim() takes control of open pages immediately.
   ───────────────────────────────────────────── */

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating: ${CACHE_NAME}`);

  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        // Take control of all open clients immediately
        return self.clients.claim();
      })
  );
});


/* ─────────────────────────────────────────────
   FETCH EVENT
   Cache-first strategy.
   For network-first or stale-while-revalidate strategies,
   see: https://developer.chrome.com/docs/workbox/caching-strategies-overview/
   ───────────────────────────────────────────── */

self.addEventListener('fetch', (event) => {
  // Only handle GET requests; ignore POST/PUT/DELETE etc.
  if (event.request.method !== 'GET') return;

  // Ignore browser extensions and non-http(s) requests
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Ignore requests to external origins (APIs etc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }

        // Not in cache — fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Only cache valid responses
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== 'basic'
            ) {
              return networkResponse;
            }

            // Clone the response (it can only be consumed once)
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.warn('[SW] Cache put failed:', err));

            return networkResponse;
          })
          .catch(() => {
            /*
             * Network failed and no cache hit.
             * Return a fallback page for navigation requests.
             * For other requests (images, etc.) the browser will handle the error.
             */
            if (event.request.destination === 'document') {
              return caches.match('./404.html');
            }
          });
      })
  );
});
