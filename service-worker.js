// Service worker de "Mantención Equipos de Clima y Presurizadores".
// IMPORTANTE (ver plantilla de arquitectura): CACHE (acá) y APP_VERSION (en index.html)
// suben JUNTOS, en cada entrega. El registro en index.html agrega "?v=APP_VERSION" a la
// URL de este archivo, así el navegador lo trata como un archivo nuevo y no se queda
// pegado en una versión vieja cacheada.
const CACHE = 'clima-ant-v11';

const PRECACHE_URLS = [
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first: sirve desde caché si existe, y en paralelo actualiza el caché desde la red
// para la próxima vez. Si no hay caché ni red (offline puro), intenta servir index.html
// como fallback de navegación (para que la app abra igual, aunque sea con datos viejos).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return; // no cachear POST (llamadas al backend de Apps Script)
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // no tocar peticiones a otros dominios (Apps Script, etc.)

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    }).catch(() =>
      req.mode === 'navigate' ? caches.match('./index.html') : undefined
    )
  );
});
