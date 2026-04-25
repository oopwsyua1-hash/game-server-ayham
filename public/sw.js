// sw.js - نسخة ذكية بتحدث حالها
const CACHE_NAME = 'al-sabe7-v2'; // كل ما تغير الكود زيد الرقم v3, v4...
const urlsToCache = [
  '/',
  '/me',
  '/room.html', // مهم عشان يحدثو
  '/socket.io/socket.io.js'
];

// 1. وقت التنصيب - خزن الملفات
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  self.skipWaiting(); // فعل النسخة الجديدة فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Caching files');
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. وقت التفعيل - امسح الكاش القديم
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
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
    }).then(() => self.clients.claim()) // سيطر عالصفحات المفتوحة
  );
});

// 3. وقت جلب الملفات - Network First للـ HTML
self.addEventListener('fetch', event => {
  // للـ HTML جيب من النت اولاً، اذا فشل جيب من الكاش
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // لباقي الملفات: كاش اولاً
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
