// Firebase Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// 新バージョンのSWをすぐに有効化する（古いキャッシュを残さない）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // プッシュが来る前にFirebaseを初期化しておく
      loadConfigFromDB().then(config => { if (config) initFirebaseWithConfig(config); }),
    ])
  );
});

let messaging = null;

// IndexedDBからFirebase設定を読み込む（アプリが閉じている場合のフォールバック）
function loadConfigFromDB() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('futari-sw-config', 1);
      req.onupgradeneeded = (e) => e.target.result.createObjectStore('config');
      req.onsuccess = (e) => {
        const db = e.target.result;
        const getReq = db.transaction('config', 'readonly').objectStore('config').get('firebase');
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror  = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch(e) { resolve(null); }
  });
}

function initFirebaseWithConfig(config) {
  if (!config || !config.messagingSenderId) return false;
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  messaging = firebase.messaging();

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
  return true;
}

// index.htmlからFirebase設定を受け取る
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    try {
      initFirebaseWithConfig(event.data.config);
    } catch(e) {
      console.error('SW Firebase init error:', e);
    }
  }
});

// アプリが閉じているときにプッシュが来た場合の処理
self.addEventListener('push', (event) => {
  // 既に初期化済みならFirebase SDKに任せる
  if (firebase.apps.length) return;

  event.waitUntil((async () => {
    const config = await loadConfigFromDB();
    if (config) {
      initFirebaseWithConfig(config);
      // SDKのpushリスナーはこのイベントには間に合わないため直接通知を表示
    }
    await self.registration.showNotification('ふたりのアプリ', {
      body: '新しいメッセージがあるよ',
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
