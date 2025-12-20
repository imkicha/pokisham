// Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyDV7oLGOjmMQyquPMocTIankEhUuKvJdVs',
  authDomain: 'pokisham-1dd84.firebaseapp.com',
  projectId: 'pokisham-1dd84',
  storageBucket: 'pokisham-1dd84.firebasestorage.app',
  messagingSenderId: '927535602268',
  appId: '1:927535602268:web:81ab883b40369a33822499',
});

const messaging = firebase.messaging();

// Handle Firebase background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Firebase background message:', payload);

  const notificationTitle = payload.notification?.title || 'Pokisham';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.type || 'pokisham-notification',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = 'pokisham-v1';
const STATIC_CACHE = 'pokisham-static-v1';
const DYNAMIC_CACHE = 'pokisham-dynamic-v1';
const IMAGE_CACHE = 'pokisham-images-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/apple-touch-icon.png',
  '/treasure-open-removebg-preview.png',
  '/treasure-closed-removebg-preview.png',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('pokisham-') &&
                     name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper function to determine cache strategy
const getCacheStrategy = (request) => {
  const url = new URL(request.url);

  // API calls - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    return 'network-first';
  }

  // Images - Cache first
  if (request.destination === 'image' ||
      url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    return 'cache-first';
  }

  // Static assets - Cache first
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    return 'cache-first';
  }

  // HTML pages - Network first
  return 'network-first';
};

// Network first strategy
const networkFirst = async (request, cacheName) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
};

// Cache first strategy
const cacheFirst = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder for images
    if (request.destination === 'image') {
      return caches.match('/logo192.png');
    }
    throw error;
  }
};

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  const strategy = getCacheStrategy(request);

  if (strategy === 'cache-first') {
    event.respondWith(
      cacheFirst(request, request.destination === 'image' ? IMAGE_CACHE : STATIC_CACHE)
    );
  } else {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE)
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

// Sync cart data when back online
const syncCart = async () => {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const pendingCartData = await cache.match('/pending-cart');

    if (pendingCartData) {
      const data = await pendingCartData.json();
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await cache.delete('/pending-cart');
    }
  } catch (error) {
    console.error('[Service Worker] Cart sync failed:', error);
  }
};

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  const options = {
    body: event.data ? event.data.text() : 'New update from Pokisham!',
    icon: '/logo192.png',
    badge: '/favicon-48.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'View Now' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pokisham', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();

  // Get click action from notification data (Firebase) or default
  const clickAction = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(clickAction);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
