// Service Worker for PWA Updates
const CACHE_NAME = 'laiq-bags-v1.6';
const urlsToCache = [
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

// Fetch event - simple network-first for everything except static assets
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip caching for HTML pages, API calls, and images
  if (request.mode === 'navigate' || 
      request.destination === 'document' ||
      request.url.includes('.html') ||
      request.url.endsWith('/') ||
      request.url.includes('/api/') ||
      request.destination === 'image' ||
      request.url.includes('cloudinary.com') ||
      request.url.includes('res.cloudinary.com')) {
    
    // Always fetch from network, no caching
    event.respondWith(fetch(request));
    return;
  }
  
  // Cache-first only for static assets (CSS, JS, manifest)
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
