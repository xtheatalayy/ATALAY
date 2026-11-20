/* Planned Life service worker — offline shell + notifications.
   Navigations and API calls are network-only; only static assets and the offline page are cached. */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `pl-static-${VERSION}`;
const PRECACHE = ['/cevrimdisi', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) await cache.put(url, response);
          } catch {
            // a single missing asset must not abort the install
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('pl-') && key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // never cache API or auth traffic — it is per-user
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          const offline = await cache.match('/cevrimdisi');
          if (offline) return offline;
          return new Response('<!doctype html><meta charset="utf-8"><title>Çevrimdışı</title><p>İnternet bağlantısı yok.</p>', {
            status: 503,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          });
        }
      })(),
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith('/_next/static/') || /\.(?:png|svg|ico|webp|jpg|jpeg|woff2?|css|js)$/.test(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return cached || Response.error();
      }
    })(),
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Planned Life', body: 'Bir hatırlatman var.' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { title: parsed.title || payload.title, body: parsed.body || payload.body };
    }
  } catch {
    // keep the default payload
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
