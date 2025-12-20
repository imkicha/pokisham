/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This file must be in the public folder

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: These values must match your Firebase config in .env
firebase.initializeApp({
  apiKey: "AIzaSyDV7oLGOjmMQyquPMocTIankEhUuKvJdVs",
  authDomain: "pokisham-1dd84.firebaseapp.com",
  projectId: "pokisham-1dd84",
  storageBucket: "pokisham-1dd84.firebasestorage.app",
  messagingSenderId: "927535602268",
  appId: "1:927535602268:web:81ab883b40369a33822499"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Pokisham';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/favicon-32.png',
    tag: payload.data?.orderId || 'pokisham-notification',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'View Details'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  // Handle action button clicks
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/orders';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
