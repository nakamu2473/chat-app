// ============================================================
//  config.example.js
//  このファイルをコピーして config.js を作り、値を埋めてください
//  config.js は .gitignore に含まれています（GitHubに上がりません）
// ============================================================

const APP_CONFIG = {

  // ---------- Firebase ----------
  // Firebase Console > プロジェクトの設定 > マイアプリ > SDK の設定と構成
  firebase: {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId:         "YOUR_PROJECT",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID",
  },

  // ---------- Googleカレンダー（読み込みのみ） ----------
  // Googleカレンダー > 設定 > カレンダーの統合 > シークレットアドレス（iCal形式）
  // ※ シークレットアドレスは他人に見せないように！
  calendars: {
    yuki: {
      name: "ゆき",
      icalUrl: "https://calendar.google.com/calendar/ical/XXXXXXXX/private-XXXXXXXX/basic.ics",
    },
    take: {
      name: "たけ",
      icalUrl: "https://calendar.google.com/calendar/ical/XXXXXXXX/private-XXXXXXXX/basic.ics",
    },
  },

};
