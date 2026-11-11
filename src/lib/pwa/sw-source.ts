import { CACHE_PREFIX, OFFLINE_URL, PAGES_CACHE, STATIC_CACHE, SW_VERSION } from './constants';

/**
 * Source of the service worker served at /sw.js (see src/app/sw.js/route.ts).
 * Plain JavaScript in a string so the worker is exactly what the browser runs and
 * tests/unit/pwa/sw.test.ts can execute it against fakes.
 *
 * Allowlist, not denylist: only these are handled, everything else goes to the
 * network untouched.
 *  - GET /_next/static/** and /brand/** : cache-first (hashed files, brand images)
 *  - navigations: network-first, redirect to the offline page when the network fails, nothing stored
 *  - /api/** and /auth/** are never intercepted (private data, OAuth redirects, exports)
 */
export function buildWorkerSource(): string {
  return String.raw`// Kit de Atividades service worker ${SW_VERSION}
'use strict';
const PREFIX = ${JSON.stringify(CACHE_PREFIX)};
const STATIC_CACHE = ${JSON.stringify(STATIC_CACHE)};
const PAGES_CACHE = ${JSON.stringify(PAGES_CACHE)};
const OFFLINE_URL = ${JSON.stringify(OFFLINE_URL)};

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/brand/');
}

function isNeverIntercepted(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');
}

async function storeOfflinePage() {
  // Fetched without credentials so the stored page is the neutral, public one.
  const response = await fetch(OFFLINE_URL, { credentials: 'omit', cache: 'reload' });
  if (!response.ok) throw new Error('offline page unavailable');
  const html = await response.clone().text();
  await (await caches.open(PAGES_CACHE)).put(OFFLINE_URL, response);
  // The offline page must render without a network: keep the files it references.
  const assets = Array.from(new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || []));
  const statics = await caches.open(STATIC_CACHE);
  await Promise.all(assets.map((asset) => statics.add(asset).catch(() => undefined)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(storeOfflinePage());
});

// Sign-out clears every cache, including the public offline page. Put it back on the
// next navigation so a signed-out phone still gets the offline page. Best effort.
async function restoreOfflinePage() {
  if (await caches.match(OFFLINE_URL, { cacheName: PAGES_CACHE, ignoreSearch: true })) return;
  try {
    await storeOfflinePage();
  } catch (error) {
    // Offline or server error: try again on a later navigation.
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [STATIC_CACHE, PAGES_CACHE];
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith(PREFIX) && !keep.includes(key)).map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
  return response;
}

// Offline: send the user to the offline page, remembering where they were going so
// "Tentar novamente" can return there. A redirect (not the cached HTML under the original
// URL) keeps the URL, the page chrome and hydration consistent.
async function navigate(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const offline = await caches.match(OFFLINE_URL, { cacheName: PAGES_CACHE, ignoreSearch: true });
    if (!offline) return Response.error();
    const url = new URL(request.url);
    if (url.pathname === OFFLINE_URL) return offline;
    const target = new URL(OFFLINE_URL, self.location.origin);
    target.searchParams.set('from', url.pathname + url.search);
    return Response.redirect(target.href, 302);
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isNeverIntercepted(url)) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    event.waitUntil(restoreOfflinePage());
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
`;
}

/**
 * Served at /sw.js when the pwa flag is off: installed clients pick it up on their next
 * visit, delete the worker's caches and unregister, returning to a plain website.
 */
export function buildKillSwitchSource(): string {
  return String.raw`// Kit de Atividades service worker: switched off
'use strict';
const PREFIX = ${JSON.stringify(CACHE_PREFIX)};

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(PREFIX)).map((key) => caches.delete(key)));
    await self.registration.unregister();
  })());
});
`;
}
