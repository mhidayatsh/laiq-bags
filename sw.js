// Service Worker for PWA Updates
const CACHE_NAME = 'laiq-bags-v1.4';
const urlsToCache = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/css/styles.css',
  '/js/main.js',
  '/js/home.js',
  '/assets/laiq-logo-192x192.png',
  '/assets/laiq-logo-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('🚀 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Don't cache images, API calls, or external resources
  if (request.destination === 'image' || 
      request.url.includes('/api/') ||
      request.url.includes('cloudinary.com') ||
      request.url.includes('res.cloudinary.com') ||
      request.url.includes('placeholder') ||
      request.url.includes('.jpg') ||
      request.url.includes('.jpeg') ||
      request.url.includes('.png') ||
      request.url.includes('.webp')) {
    
    // For images, always fetch from network first, fallback to cache
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful image responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // For other resources, use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request);
      })
  );
});

// Force update notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
