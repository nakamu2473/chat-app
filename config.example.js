// ============================================================
//  config.example.js
//  このファイルをコピーして config.js を作り、値を埋めてください
//  config.js は .gitignore に含まれています（GitHubに上がりません）
// ============================================================

window.APP_CONFIG = {

  // ---------- Firebase ----------
  firebase: {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId:         "YOUR_PROJECT",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID",
  },

  // ---------- FCM（プッシュ通知）----------
  // Firebase Console > プロジェクトの設定 > Cloud Messaging > ウェブプッシュ証明書 > キーペア
  fcm: {
    vapidKey: "YOUR_VAPID_KEY",
  },

  // ---------- Googleカレンダー（読み込みのみ） ----------
  calendars: {
    user1: {
      name: "ユーザー1",
      icalUrl: "https://calendar.google.com/calendar/ical/XXXXXXXX/private-XXXXXXXX/basic.ics",
    },
    user2: {
      name: "ユーザー2",
      icalUrl: "https://calendar.google.com/calendar/ical/XXXXXXXX/private-XXXXXXXX/basic.ics",
    },
  },

};