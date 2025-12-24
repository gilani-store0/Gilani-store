
[file name]: sw.js
[file content begin]
// Service Worker لمتجر التجميل
const CACHE_NAME = 'beauty-store-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.12.0/toastify.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.12.0/toastify.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('جاري تخزين الملفات في الذاكرة المؤقتة');
                return cache.addAll(urllsToCache);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('جاري حذف الذاكرة المؤقتة القديمة:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            }).catch(() => {
                // إذا فشل التحميل، عرض صفحة غير متصل
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});
[file content end]
