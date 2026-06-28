/* Тратометр PWA — service worker.
   Полный офлайн: оболочка приложения кешируется при установке и отдаётся
   из кеша (cache-first). Сеть нужна только для самого первого открытия и
   для обновления версии. Все пути относительные — работает и из корня
   домена, и из подпапки project-страницы GitHub Pages. */

const VERSION = 'tratometr-v5';

// Файлы оболочки. Относительно расположения sw.js (корень scope).
const SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './xlsx.js',
  './sound/more_gold.mp3',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      // addAll падает целиком, если хоть один файл не скачался — добавляем по
      // одному и не валим установку из-за мелочи (например, favicon).
      Promise.all(
        SHELL.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Чужие домены не трогаем (их и нет — приложение самодостаточно).
  if (url.origin !== self.location.origin) return;

  // Навигации (открытие приложения) всегда отдаём из кешированной оболочки —
  // это и есть офлайн-вход. Если в кеше нет — пробуем сеть.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => cached || fetch(req))
    );
    return;
  }

  // Остальное: cache-first, с дозаписью в кеш при удачном сетевом ответе.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
