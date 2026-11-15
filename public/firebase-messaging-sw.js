/* Punarchakra Firebase Cloud Messaging Service Worker */
try {
  importScripts('https://www.gstatic.com/firebasejs/13.3.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/13.3.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    projectId: 'gen-lang-client-0338843837',
    appId: '1:783517347667:web:aa1af8cfe1b76e47f6bba6',
    apiKey: 'AIzaSyAaAWRp8Z2zNVNk9OEbhK5gy-DcWgPyKKg',
    authDomain: 'gen-lang-client-0338843837.firebaseapp.com',
    storageBucket: 'gen-lang-client-0338843837.firebasestorage.app',
    messagingSenderId: '783517347667',
  });

  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || payload?.data?.title || 'PUNARCHAKRA Pickup Update';
    const body = payload?.notification?.body || payload?.data?.body || 'Your Bengaluru pickup status has changed.';
    const icon = '/src/assets/images/punarchakra_brand_logo_1794725975670.jpg';
    return self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag: payload?.data?.orderId || 'punarchakra-status',
      data: payload?.data || {},
    });
  });
} catch (_err) {
  // Fallback handled by standard Web Push / message listeners below
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload?.notification?.title || payload?.title || 'PUNARCHAKRA Update';
    const body = payload?.notification?.body || payload?.body || 'Real-time pickup alert.';
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/src/assets/images/punarchakra_brand_logo_1794725975670.jpg',
        data: payload?.data || {},
      })
    );
  } catch (_e) {
    // Handled by Firebase compat listener
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PNC_LOCAL_PUSH') {
    const { title, body, data } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'PUNARCHAKRA Pickup Update', {
        body: body || 'Real-time pickup status updated.',
        icon: '/src/assets/images/punarchakra_brand_logo_1794725975670.jpg',
        tag: data?.orderId || 'punarchakra-status',
        data: data || {},
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
