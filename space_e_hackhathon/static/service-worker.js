const CACHE_NAME = 'flask-pwa-v1';
const urlsToCache = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/images/icon-192x192.png',
    '/static/images/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});