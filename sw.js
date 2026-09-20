const CACHE = 'fantacalcio-shell-v2';
const ASSETS = [
  './', './index.html', './manifest.json', './icon.svg',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7/babel.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // ogni asset viene messo in cache singolarmente: se uno fallisce (rete lenta,
      // CDN momentaneamente irraggiungibile) non blocca l'installazione degli altri
      Promise.all(ASSETS.map((url) => c.add(url).catch((err) => console.warn('SW: impossibile mettere in cache', url, err))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Shell statica e librerie CDN passano dalla cache (per il funzionamento offline);
// le chiamate AI e le funzioni Netlify vanno sempre in rete.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/.netlify/functions/')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      // aggiorna silenziosamente la cache con l'ultima versione ottenuta dalla rete
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
