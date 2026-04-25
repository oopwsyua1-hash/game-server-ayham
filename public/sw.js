const CACHE_NAME = 'al-sabe7-v2'; // بس تعدل الكود غير الرقم لـ v3, v4...

self.addEventListener('install', event => {
  self.skipWaiting(); // فعل النسخة الجديدة فوراً بدون ما تستنى
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/me',
        '/socket.io/socket.io.js'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cache);
            return caches.delete(cache); // امسح اي كاش قديم
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // صفحات HTML: جيب من النت اولاً، اذا فشل جيب من الكاش
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // باقي الملفات: كاش اولاً
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
