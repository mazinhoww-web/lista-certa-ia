// Self-unregistering service worker.
// Defensive: if a previous PWA service worker was registered at /sw.js on this
// origin (e.g. an older preview build), this no-op replacement removes itself
// and clears caches so navigation works again. The production PWA bundle
// generates its own /sw.js at build time, which will replace this file.
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
