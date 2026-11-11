// Manga Reader — service worker: funziona anche offline.
const VERSION = 'manga-v7';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  './icon-180.png', './icon-192.png', './icon-512.png',
  './pdfjs/pdf.min.js', './pdfjs/pdf.worker.min.js', './fflate.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  if (req.mode === 'navigate') {
    // pagina: prima la rete (aggiornamenti), poi la cache
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
