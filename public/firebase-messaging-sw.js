// Firebase Messaging Service Worker

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// プッシュ通知ハンドラ（Chrome・Safari共通）
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let title = 'ふたりのアプリ';
    let body = '新しいメッセージがあるよ';

    if (event.data) {
      try {
        const json = event.data.json();
        const notif = json.notification || {};
        title = notif.title || title;
        body = notif.body || body;
      } catch(e) {}
    }

    // フォアグラウンドのクライアントを確認
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visibleClient = clientList.find(c => c.visibilityState === 'visible');

    if (visibleClient) {
      // アプリが開いてる → トースト表示のためクライアントにpostMessage
      visibleClient.postMessage({ type: 'PUSH_RECEIVED', title, body });
      return;
    }

    // バックグラウンド → OS通知を表示
    await self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
    });
  })());
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
