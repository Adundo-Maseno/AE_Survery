/**
 * AE Survey — Offline-First Service Worker (`sw.js`)
 * Caches application shell, Tailwind CDN, FontAwesome CDN, and Google Fonts
 * so field enumerators can load, build, and administer surveys 100% offline.
 */

const CACHE_NAME = 'ae-survey-prod-v3.37';
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './field.html',
  './manifest-collector.json',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  './js/qrcode.js',
  './js/db.js',
  './js/i18n.js',
  './js/builder.js',
  './js/collector.js',
  './js/chart.umd.min.js',
  './js/analytics.js',
  './js/app.js',
  './js/field-app.js'
];

const ALLOWED_CDN_HOSTS = new Set([
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

function isGoogleAppsScriptHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  return (
    h === 'script.google.com' ||
    h.endsWith('.script.google.com') ||
    h === 'googleusercontent.com' ||
    h.endsWith('.googleusercontent.com')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch(() => {
        // Ignore individual external asset failure during initial install
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never cache Google Apps Script live API calls
  if (isGoogleAppsScriptHost(url.hostname)) {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isTrustedCdn = ALLOWED_CDN_HOSTS.has(url.hostname);
  if (!isSameOrigin && !isTrustedCdn) {
    return;
  }

  // Network-First strategy for same-origin application code (scripts, pages, manifest)
  // Ensures all devices immediately run the latest production code when online,
  // while falling back seamlessly to offline cache in remote field zones!
  if (isSameOrigin && (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname === '/' || url.pathname.endsWith('/'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request, { ignoreSearch: true }).then((cached) => {
            if (cached) return cached;
            if (request.mode === 'navigate') {
              if (url.pathname.includes('field.html')) {
                return caches.match('./field.html', { ignoreSearch: true });
              }
              return caches.match('./index.html', { ignoreSearch: true });
            }
          });
        })
    );
    return;
  }

  // Stale-While-Revalidate for trusted static CDN assets (Tailwind, FontAwesome, Leaflet, GSAP)
  const hasQuery = url.search && url.search.length > 1;
  event.respondWith(
    caches.match(request, { ignoreSearch: !hasQuery }).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || (isTrustedCdn && networkResponse.type === 'opaque'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            if (url.pathname.endsWith('field.html') || url.pathname.includes('field.html')) {
              return caches.match('./field.html', { ignoreSearch: true });
            }
            return caches.match('./index.html', { ignoreSearch: true });
          }
        });

      return cachedResponse || networkFetch;
    })
  );
});

// W3C Service Worker Background Sync API (Handles background data flush when browser reconnects)
self.addEventListener('sync', (event) => {
  if (event.tag === 'ae-background-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_BG_SYNC' });
        });
      })
    );
  }
});

