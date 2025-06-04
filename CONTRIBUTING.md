# Contributing to SEO Blog Generator

## 開発環境のセットアップ

1. Node.js (v18以上) をインストール
2. リポジトリをクローン
3. 依存関係をインストール: `npm install`
4. 環境変数を設定: `.env.example` を `.env` にコピーして編集
5. 開発サーバーを起動: `npm start`

## 開発ワークフロー

### ブランチ戦略
- `main`: 本番環境用の安定版
- `develop`: 開発用ブランチ
- `feature/*`: 新機能開発用ブランチ

### コミットメッセージ
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
```

## ファイル構成

```
seo-blog-generator/
├── blog-generator/          # フロントエンドUI
│   ├── index.html          # メインフォーム
│   ├── preview.html        # 編集インターフェース
│   ├── blog-generator.js   # メイン処理ロジック
│   ├── quill-config.js     # Quillエディタ設定
│   └── api/
│       └── generate-content.js # OpenAI API統合
├── blog-automation/         # バックエンド処理
│   ├── openai-integration.js   # OpenAI統合モジュール
│   └── templates/              # HTMLテンプレート
├── .eleventy.js            # Eleventyビルド設定
└── package.json
```

## テスト

```bash
# 開発サーバーでテスト
npm start

# ビルドテスト
npm run build
```

## プルリクエスト

1. 機能ブランチを作成
2. 変更を実装
3. テストを実行
4. プルリクエストを作成
5. レビューを受ける

## 問題報告

GitHubのIssuesで問題を報告してください：
- バグの詳細な説明
- 再現手順
- 期待される動作
- 実際の動作
- 環境情報（OS、ブラウザ等）
