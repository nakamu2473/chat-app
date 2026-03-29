# 🏠 ふたりのアプリ

ふたり専用の共有アプリです。
チャット / 買い物リスト / メモ・TODO / カレンダー が使えます。

## セットアップ

### 1. このリポジトリをクローン

```bash
git clone https://github.com/YOUR_NAME/futari-app.git
cd futari-app
```

### 2. config.js を作成

```bash
cp config.example.js config.js
```

`config.js` を開いて、Firebase と Googleカレンダーの設定を書き込んでください。

### 3. Firebase をセットアップ

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. 左メニュー「Realtime Database」→「データベースを作成」→ テストモードで開始
3. 左メニュー「プロジェクトの設定」→「マイアプリ」→ `</>` でウェブアプリ登録
4. 表示された設定値を `config.js` の `firebase` セクションに貼り付け

### 4. Googleカレンダー URL を取得（任意）

1. [Googleカレンダー](https://calendar.google.com/) を開く
2. 左側のカレンダー名 → 「︙」→「設定と共有」
3. 「カレンダーの統合」→「**シークレットアドレス（iCal形式）**」をコピー
4. `config.js` の `calendars` の各 `icalUrl` に貼り付け

> ⚠️ シークレットアドレスは他人に見せないように注意してください

### 5. index.html をブラウザで開く

サーバー不要です。`index.html` をそのままブラウザで開けば使えます。

---

## ファイル構成

```
futari-app/
├── index.html          # アプリ本体
├── config.js           # 🔒 設定ファイル（.gitignore済み・GitHubに上がらない）
├── config.example.js   # 設定テンプレート
├── .gitignore
└── README.md
```

## 注意

- `config.js` は **絶対に** GitHub に push しないでください（`.gitignore` で除外済み）
- Firebase Realtime Database のルールは本番運用前に適切に設定してください
