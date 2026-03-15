// Firebase Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

let messaging = null;

// index.htmlからFirebase設定を受け取る
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(event.data.config);
      }
      messaging = firebase.messaging();

      // バックグラウンド通知の処理
      messaging.onBackgroundMessage((payload) => {
        const { title, body, icon } = payload.notification || {};
        self.registration.showNotification(title || 'ふたりのアプリ', {
          body: body || '新しいメッセージがあるよ',
          icon: icon || '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          data: payload.data,
        });
      });
    } catch(e) {
      console.error('SW Firebase init error:', e);
    }
  }
});

// 通知クリック時にアプリを開く
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});