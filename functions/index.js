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
    console.log('送信者:', sender, '/ 登録トークン数:', tokens ? Object.keys(tokens).length : 0);
    if (!tokens) return null;

    // 全トークンへ通知を送る（送信者自身も含む・テスト用）
    const sends = Object.entries(tokens)
      .filter(([, data]) => data && data.token)
      .map(([user, data]) => {
        console.log('通知送信先:', user);
        return admin.messaging().send({
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
        }).catch(async (e) => {
          console.warn('FCM send error:', user, e.message);
          // 無効トークンは削除して次回以降のエラーを防ぐ
          if (
            e.code === 'messaging/registration-token-not-registered' ||
            e.code === 'messaging/invalid-registration-token' ||
            e.message?.includes('not-registered') ||
            e.message?.includes('invalid-argument')
          ) {
            await admin.database().ref('fcmTokens/' + user).remove();
            console.log('無効トークンを削除:', user);
          }
          return null;
        });
      });

    return Promise.all(sends);
  });
