const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// チャット送信時に相手へプッシュ通知を送る
exports.sendChatNotification = functions.database.ref('/chat/{messageId}')
  .onCreate(async (snapshot) => {
    const msg = snapshot.val();
    if (!msg || !msg.user || !msg.text) return null;

    const sender = msg.user;

    // 全ユーザーのFCMトークンを取得
    const tokensSnap = await admin.database().ref('fcmTokens').once('value');
    const tokens = tokensSnap.val();
    if (!tokens) return null;

    // 送信者以外のトークンへ通知を送る
    const sends = Object.entries(tokens)
      .filter(([user, data]) => user !== sender && data && data.token)
      .map(([, data]) =>
        admin.messaging().send({
          token: data.token,
          notification: {
            title: `${sender}からメッセージ`,
            body: msg.text.length > 50 ? msg.text.slice(0, 50) + '…' : msg.text,
          },
          data: { type: 'chat' },
          apns: {
            payload: { aps: { sound: 'default' } },
          },
          android: {
            notification: { sound: 'default' },
          },
        }).catch((e) => {
          console.warn('FCM send error:', e.message);
          return null;
        })
      );

    return Promise.all(sends);
  });
