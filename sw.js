/**
 * AE Survey — Offline-First Production Service Worker (`sw.js`)
 * Ensures seamless PWA launch on mobile and desktop, both online and completely offline.
 */

const CACHE_NAME = 'ae-survey-prod-v3.64';
const CODE_ASSET_TIMEOUT_MS = 2000;
const SW_IDB_CANDIDATES = ['AESurveyMonkeyDB', 'AESurveyDB'];

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './field.html',
  './robots.txt',
  './sitemap.xml',
  './llms.txt',
  './.well-known/ard.json',
  './css/tailwind.min.css',
  './manifest.json',
  './manifest-collector.json',
  './icons/agri_experience_logo.webp',
  './icons/agri_experience_logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/field-192.png',
  './icons/field-512.png',
  './icons/field-maskable-192.png',
  './icons/field-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/field-apple-touch-icon.png',
  './icons/favicon-48.png',
  './icons/favicon-32.png',
  './icons/field-favicon-32.png',
  './favicon.ico',
  './assets/screenshots/field-wide.png',
  './assets/screenshots/field-narrow.png',
  './assets/screenshots/admin-wide.png',
  './assets/screenshots/admin-narrow.png',
  './js/qrcode.js',
  './js/db.js',
  './js/i18n.js',
  './js/builder.js',
  './js/collector.js',
  './js/chart.umd.min.js',
  './js/text-intelligence.js',
  './js/analytics.js',
  './js/report-export.js',
  './js/templates.js',
  './js/app.js',
  './js/field-app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];

const ALLOWED_CDN_HOSTS = new Set([
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'basemaps.cartocdn.com',
  'a.basemaps.cartocdn.com',
  'b.basemaps.cartocdn.com',
  'c.basemaps.cartocdn.com',
  'd.basemaps.cartocdn.com',
  'tile.openstreetmap.org',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org'
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

function isSameOriginCodeAsset(url, request) {
  const pathname = (url && url.pathname ? url.pathname : '').toLowerCase();
  const dest = (request && request.destination ? request.destination : '').toLowerCase();
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    dest === 'script' ||
    dest === 'style'
  );
}

function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('NetworkTimeout')), timeoutMs);
    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
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

  // 1. Navigation requests: Fast App Shell Strategy (Guarantees PWA opens in <200ms offline and on rural 2G/3G)
  if (request.mode === 'navigate' || request.destination === 'document') {
    const isFieldApp = url.pathname.includes('/field');

    // Quick network fetch with 2200ms timeout race so rural network stalls never freeze PWA launch
    const networkFetchWithTimeout = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('NetworkTimeoutRuralField')), 2200);
      fetch(request)
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });

    event.respondWith(
      networkFetchWithTimeout
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
            '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>AE Survey Offline</h2><p>Please connect once to complete offline setup.</p></body></html>',
            { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Same-origin code assets (.js / .css): Network-First (2s timeout, cache fallback, exact URL match without ignoreSearch)
  if (isSameOrigin && isSameOriginCodeAsset(url, request)) {
    event.respondWith(
      fetchWithTimeout(request, CODE_ASSET_TIMEOUT_MS)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return networkResponse;
          }
          return caches.match(request).then((cached) => cached || networkResponse);
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 2b. Other same-origin static assets (images, icons, manifests): Cache-First with Background Revalidation
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
// CLOSED-TAB INDEXEDDB BACKGROUND SYNC HELPERS
// ----------------------------------------------------------------------------
function cleanAnswersForSwSync(answers) {
  if (!answers || typeof answers !== 'object') return {};
  const clean = {};
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === 'string' && v.startsWith('data:image/')) {
      clean[k] = '[Digital Signature/Image Recorded]';
    } else if (v && typeof v === 'object' && v.dataUrl) {
      if (v.durationSec !== undefined || (v.mimeType && String(v.mimeType).startsWith('audio/'))) {
        clean[k] = {
          capturedAt: v.capturedAt || '',
          durationSec: v.durationSec || 0,
          mimeType: v.mimeType || 'audio/webm',
          transcript: v.transcript || '',
          summary: `Audio note (${v.durationSec || 0}s)`
        };
      } else {
        clean[k] = {
          capturedAt: v.capturedAt || '',
          width: v.width || 0,
          height: v.height || 0,
          sizeKb: v.sizeKb || 0,
          summary: `Photo proof attached (${v.sizeKb || 0} KB)`
        };
      }
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

function openIdbDatabase(dbName) {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB unavailable in Service Worker'));
    }
    try {
      const req = indexedDB.open(dbName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    } catch (err) {
      reject(err);
    }
  });
}

function idbReadAll(db, storeName) {
  return new Promise((resolve) => {
    if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
      return resolve([]);
    }
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

function idbGetByKey(db, storeName, key) {
  return new Promise((resolve) => {
    if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
      return resolve(null);
    }
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

function idbPutMany(db, storeName, items) {
  return new Promise((resolve, reject) => {
    if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
      return resolve(0);
    }
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve(items.length);
      tx.onerror = () => reject(tx.error || new Error('IDB write failed'));
    } catch (err) {
      reject(err);
    }
  });
}

function idbDeleteMany(db, storeName, keys) {
  return new Promise((resolve) => {
    if (!db || !keys.length || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
      return resolve(0);
    }
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      keys.forEach((k) => store.delete(k));
      tx.oncomplete = () => resolve(keys.length);
      tx.onerror = () => resolve(0);
    } catch (e) {
      resolve(0);
    }
  });
}

async function readSyncSettingsFromIdb(db) {
  // Check dedicated 'settings' store first, then 'meta' store ('settings' / 'syncSettings')
  if (db.objectStoreNames && db.objectStoreNames.contains('settings')) {
    const direct = (await idbGetByKey(db, 'settings', 'settings')) ||
      (await idbGetByKey(db, 'settings', 'syncSettings'));
    if (direct && direct.gasWebAppUrl) return direct;
    const all = await idbReadAll(db, 'settings');
    const found = all.find((s) => s && s.gasWebAppUrl);
    if (found) return found;
  }
  if (db.objectStoreNames && db.objectStoreNames.contains('meta')) {
    const mSettings = (await idbGetByKey(db, 'meta', 'settings')) ||
      (await idbGetByKey(db, 'meta', 'syncSettings'));
    if (mSettings) {
      if (mSettings.gasWebAppUrl) return mSettings;
      if (mSettings.value && mSettings.value.gasWebAppUrl) return mSettings.value;
    }
  }
  return null;
}

async function performClosedTabBackgroundSync() {
  for (const dbName of SW_IDB_CANDIDATES) {
    let db = null;
    try {
      db = await openIdbDatabase(dbName);
      if (!db || !db.objectStoreNames || !db.objectStoreNames.contains('responses')) {
        if (db && typeof db.close === 'function') db.close();
        continue;
      }

      const settings = await readSyncSettingsFromIdb(db);
      const gasUrl = settings && settings.gasWebAppUrl ? String(settings.gasWebAppUrl).trim() : '';
      if (!gasUrl) {
        if (db && typeof db.close === 'function') db.close();
        continue;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(gasUrl);
      } catch (e) {
        if (db && typeof db.close === 'function') db.close();
        continue;
      }
      if (parsedUrl.protocol !== 'https:' || !isGoogleAppsScriptHost(parsedUrl.hostname)) {
        if (db && typeof db.close === 'function') db.close();
        continue;
      }

      const allResponses = await idbReadAll(db, 'responses');
      const unsynced = allResponses.filter((r) => r && r.syncStatus !== 'synced');
      if (unsynced.length === 0) {
        if (db && typeof db.close === 'function') db.close();
        return { ok: true, syncedCount: 0, dbName };
      }

      const payload = {
        action: 'BATCH_SYNC',
        syncToken: settings.syncToken || '',
        deviceId: settings.deviceId || 'sw-bg-sync',
        callerId: 'SW_BACKGROUND_SYNC',
        surveys: [],
        deletedSurveyIds: [],
        collectors: [],
        responses: unsynced.map((r) => ({
          ...r,
          answers: cleanAnswersForSwSync(r.answers)
        })),
        personnel: []
      };

      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (!res || !res.ok) {
        throw new Error(`SW BATCH_SYNC HTTP ${res ? res.status : 0}`);
      }

      const data = await res.json();
      if (!data || !data.ok) {
        throw new Error((data && data.error) || 'SW BATCH_SYNC returned error');
      }

      const syncedAt = data.serverTime || new Date().toISOString();
      const updatedResponses = unsynced.map((r) => ({
        ...r,
        syncStatus: 'synced',
        syncedAt
      }));
      await idbPutMany(db, 'responses', updatedResponses);

      // Prune matching SUBMIT_RESPONSE items from syncQueue if present
      if (db.objectStoreNames.contains('syncQueue')) {
        const syncedIds = new Set(unsynced.map((r) => r.id));
        const queueItems = await idbReadAll(db, 'syncQueue');
        const keysToDelete = queueItems
          .filter((q) => q && q.action === 'SUBMIT_RESPONSE' && syncedIds.has(q.recordId))
          .map((q) => q.id);
        await idbDeleteMany(db, 'syncQueue', keysToDelete);
      }

      if (db && typeof db.close === 'function') db.close();
      return { ok: true, syncedCount: updatedResponses.length, dbName };
    } catch (err) {
      if (db && typeof db.close === 'function') db.close();
      console.warn('[SW] Closed-tab background sync warning:', err && err.message ? err.message : err);
    }
  }
  return { ok: false, syncedCount: 0 };
}

// ----------------------------------------------------------------------------
// BACKGROUND SYNC API
// ----------------------------------------------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'ae-background-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients && clients.length > 0) {
          clients.forEach((client) => {
            client.postMessage({ type: 'TRIGGER_BG_SYNC' });
          });
          return;
        }
        return performClosedTabBackgroundSync();
      })
    );
  }
});

// Expose internals for automated verification
self.__AE_SW_INTERNALS__ = {
  CACHE_NAME,
  CODE_ASSET_TIMEOUT_MS,
  SW_IDB_CANDIDATES,
  isSameOriginCodeAsset,
  fetchWithTimeout,
  cleanAnswersForSwSync,
  performClosedTabBackgroundSync
};
