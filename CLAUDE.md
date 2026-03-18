# Claude向けルール

## ブランチ・コミット運用

- **`main` ブランチへの直接 push は禁止**
- 変更は必ず別ブランチを作成し、Pull Request 経由でマージすること
- ブランチ名は `fix/...`、`feat/...` などの形式を推奨

## 作業フロー

1. `main` から最新を取得
2. 作業ブランチを作成（例: `git checkout -b fix/login-mobile-bug`）
3. 変更をコミット
4. リモートへ push
5. Pull Request を作成
