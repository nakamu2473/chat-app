# Claude向けルール

## ブランチ・コミット運用

- **`main` ブランチへの直接 push は禁止**
- 変更は必ず別ブランチを作成し、Pull Request 経由でマージすること
- ブランチ名は `fix/...`、`feat/...`、`ci/...` などの形式を推奨

## 作業フロー

1. `main` から最新を取得
2. 作業ブランチを作成（例: `git checkout -b fix/login-mobile-bug`）
3. 変更をコミット
4. `git push -u origin <branch-name>` でリモートへ push
5. Pull Request を作成（ユーザーから明示的に依頼があった場合のみ）

---

## プロジェクト概要

**ふたりのアプリ** — ゆき・たけ専用のプライベートカップルアプリ。
Firebase をバックエンドに使った PWA（Progressive Web App）。

- **URL**: Firebase Hosting でデプロイ済み（プロジェクト ID: `chat-a23ce`）
- **対象ユーザー**: 2名固定（`yuki` / `take`）

---

## アーキテクチャ

### フロントエンド

| ファイル | 役割 |
|---|---|
| `index.html` | アプリ全体（HTML + CSS + JavaScript を1ファイルに集約したSPA） |
| `config.js` | Firebase・FCM・カレンダー設定（**gitignore済み・本番秘密情報**） |
| `config.example.js` | `config.js` のテンプレート（値をコピーして埋める） |
| `manifest.json` | PWA マニフェスト |
| `firebase-messaging-sw.js` | Service Worker（FCM プッシュ通知ハンドラ） |
| `404.html` | Firebase Hosting 用 404 ページ |

### バックエンド

| ディレクトリ/ファイル | 役割 |
|---|---|
| `functions/index.js` | Cloud Functions（Node.js 20） |
| `functions/package.json` | Functions 依存関係（`firebase-admin ^11`, `firebase-functions ^4`） |
| `firebase.json` | Firebase Hosting + Functions 設定 |
| `.firebaserc` | Firebase プロジェクト紐づけ |
| `cors.json` | Firebase Storage CORS 設定 |

### ビルドステップなし

このプロジェクトはバンドラー・トランスパイラを使わない。
`index.html` を直接編集すれば即反映される。`npm install` や `npm run build` は不要。

---

## 主要機能（タブ構成）

| タブ | 機能 |
|---|---|
| **チャット** | リアルタイムテキスト・画像送信、FCM プッシュ通知 |
| **かいもの** | 共有買い物リスト（未完了 / 完了に分類） |
| **メモ・TODO** | メモ・TODO の投稿、タグフィルタリング、完了チェック |
| **カレンダー** | 独自イベント登録 + Google カレンダー iCal 取得（読み込みのみ） |
| **アルバム** | Firebase Storage への写真アップロード、いいね、タグ、全画面表示 |
| **ねこ** | 猫ごとのプロフィール・体重記録・食事・病院・水分記録 |

---

## Firebase Realtime Database スキーマ

```
/chat/{messageId}       # チャットメッセージ
/shop/{itemId}          # 買い物リストアイテム
/memo/{itemId}          # メモ・TODOアイテム
/events/{eventId}       # カレンダーイベント
/photos/{photoId}       # アルバム写真メタデータ
/cats/{catId}           # 猫プロフィール・各種記録
/water_log/{logId}      # 水分補給ログ
/fcmTokens/{user}       # FCM デバイストークン
/loginBonus/{user}      # ログインボーナス状態
```

---

## 設定ファイル（config.js）

`config.js` は gitignore されており Git に含まれない。
`config.example.js` をコピーして `config.js` を作成し、各値を設定する。

```js
window.APP_CONFIG = {
  firebase: { apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId },
  fcm: { vapidKey },
  calendars: {
    yuki: { name, icalUrl },
    take: { name, icalUrl },
  },
};
```

`config.js` が存在しない（または読み込み失敗）場合はデモモードで動作し、
Firebase の代わりに `localStorage` を使用する。

---

## CI / CD（GitHub Actions）

| ワークフロー | トリガー | 動作 |
|---|---|---|
| `firebase-hosting-merge.yml` | `main` への push | Functions デプロイ + Hosting 本番デプロイ |
| `firebase-hosting-pull-request.yml` | Pull Request | Hosting プレビューチャンネルへデプロイ |

### 必要な GitHub Secrets

| シークレット名 | 内容 |
|---|---|
| `CONFIG_JS` | `config.js` の内容全体 |
| `FIREBASE_TOKEN` | `firebase login:ci` で取得したトークン |
| `FIREBASE_SERVICE_ACCOUNT_CHAT_A23CE` | Firebase サービスアカウント JSON |

---

## Cloud Functions

`functions/index.js` に定義された唯一の Function:

**`sendChatNotification`**
- トリガー: `/chat/{messageId}` への書き込み（onCreate）
- 動作: `/fcmTokens` に登録された全デバイスへ FCM プッシュ通知を送信
- 無効なトークンは自動削除される

---

## コーディング規約

- **JavaScript**: バニラJS（フレームワーク・トランスパイラなし）
- **CSS**: CSS カスタムプロパティ（変数）を使用。カラーは `:root` の変数を参照すること
  - `--accent: #3d6b5e`（メインカラー・緑系）
  - `--accent2: #c4773b`（サブカラー・オレンジ系）
  - `--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--danger` 等
- **フォント**: `Noto Sans JP`（日本語）、`DM Mono`（数値・時刻）
- **Firebase SDK**: compat版 v9.23.0（`firebase-app-compat.js` 等）を CDN 経由で読み込み
- **Firebase 書き込み**: `fbSet(path, value)` ヘルパーを使用（デモモード対応のため）
- **Firebase 読み込み**: `fbGet(path)` ヘルパーを使用

### デモモード

`useFirebase` フラグが `false` の場合（config.js なし）は `localStorage` でデータを管理。
`fbSet` / `fbGet` が自動的に localStorage を使う。

---

## ローカル開発

ビルドステップは不要。HTTP サーバーで `index.html` を配信するだけでよい。

```bash
# シンプルな確認方法
npx serve .
# または
python3 -m http.server 8080
```

Firebase エミュレータを使う場合:

```bash
firebase emulators:start
```

Functions の依存インストール:

```bash
npm ci --prefix functions
```
