/**
 * AE Survey — Offline-First Production Service Worker (`sw.js`)
 * Ensures seamless PWA launch on mobile and desktop, both online and completely offline.
 */

const CACHE_NAME = 'ae-survey-prod-v3.41';

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './field',
  './field.html',
  './manifest.json',
  './manifest-collector.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './js/qrcode.js',
  './js/db.js',
  './js/i18n.js',
  './js/builder.js',
  './js/collector.js',
  './js/chart.umd.min.js',
  './js/analytics.js',
  './js/app.js',
  './js/field-app.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
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

// ----------------------------------------------------------------------------
// INSTALL EVENT
// ----------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pre-cache assets resiliently so a transient CDN error never halts installation
      await Promise.allSettled(
        APP_SHELL_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn('[SW] Pre-caching asset bypassed:', asset, err.message);
          }
        })
      );

      // Ensure /field and /field.html are mirrored in cache
      try {
        let fieldResp = (await cache.match('./field')) || (await cache.match('./field.html'));
        if (!fieldResp) {
          const fetched = await fetch('./field.html');
          if (fetched && fetched.status === 200) fieldResp = fetched;
        }
        if (fieldResp) {
          await cache.put('./field', fieldResp.clone());
          await cache.put('./field.html', fieldResp.clone());
        }

        let indexResp = (await cache.match('./')) || (await cache.match('./index.html'));
        if (!indexResp) {
          const fetchedIndex = await fetch('./index.html');
          if (fetchedIndex && fetchedIndex.status === 200) indexResp = fetchedIndex;
        }
        if (indexResp) {
          await cache.put('./', indexResp.clone());
          await cache.put('./index.html', indexResp.clone());
        }
      } catch (e) {
        console.warn('[SW] Shell mirroring warning:', e.message);
      }
    })
  );
  self.skipWaiting();
});

// ----------------------------------------------------------------------------
// ACTIVATE EVENT
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// FETCH EVENT
// ----------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never cache Google Apps Script live backend calls
  if (isGoogleAppsScriptHost(url.hostname)) {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isTrustedCdn = ALLOWED_CDN_HOSTS.has(url.hostname);
  if (!isSameOrigin && !isTrustedCdn) {
    return;
  }

  // 1. Navigation requests: App Shell Strategy (Guarantees PWA opens on mobile & offline)
  if (request.mode === 'navigate' || request.destination === 'document') {
    const isFieldApp = url.pathname.includes('/field');
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
              if (isFieldApp) {
                cache.put('./field', clone.clone());
                cache.put('./field.html', clone.clone());
              } else {
                cache.put('./', clone.clone());
                cache.put('./index.html', clone.clone());
              }
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          if (isFieldApp) {
            const cachedField =
              (await cache.match('./field', { ignoreSearch: true })) ||
              (await cache.match('./field.html', { ignoreSearch: true })) ||
              (await cache.match(request, { ignoreSearch: true }));
            if (cachedField) return cachedField;
          }

          const cachedIndex =
            (await cache.match('./', { ignoreSearch: true })) ||
            (await cache.match('./index.html', { ignoreSearch: true })) ||
            (await cache.match(request, { ignoreSearch: true }));
          if (cachedIndex) return cachedIndex;

          return new Response(
            '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Offline</h2><p>Please connect once to complete offline setup.</p></body></html>',
            { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Same-origin static assets: Cache-First with Background Revalidation
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Trusted CDN dependencies (Tailwind, FontAwesome, Leaflet, GSAP, Fonts)
  if (isTrustedCdn) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.type === 'opaque')
            ) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }
});

// ----------------------------------------------------------------------------
// BACKGROUND SYNC API
// ----------------------------------------------------------------------------
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
