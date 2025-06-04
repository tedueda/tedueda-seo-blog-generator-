# SEO Blog Generator

OpenAI APIを活用した静的HTMLブログ自動生成システム

## 概要

このアプリケーションは、OpenAI APIを使用してSEO対策済みのブログ記事を自動生成し、Quillエディタで編集可能な完全なブログ管理システムです。

## 主な機能

- **OpenAI API統合**: GPT-4を使用した高品質なコンテンツ自動生成
- **SEO最適化**: メタタグ、構造化データ（JSON-LD）の自動生成
- **Quillエディタ**: 4セクション構成の直感的な編集インターフェース
- **画像管理**: 自動圧縮・バリデーション機能付き画像アップロード
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **リアルタイムプレビュー**: 編集内容の即座確認
- **文字数カウンター**: SEO最適化のための文字数管理

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **エディタ**: Quill.js
- **ビルドツール**: Eleventy (11ty)
- **AI統合**: OpenAI API (GPT-4)
- **デプロイ**: 静的サイトホスティング対応

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/tedueda/seo-blog-generator.git
cd seo-blog-generator
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、OpenAI APIキーを設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
SITE_NAME=あなたのサイト名
BASE_URL=https://your-domain.com
```

### 4. 開発サーバーの起動

```bash
npm start
```

ブラウザで `http://localhost:8080/blog-generator/` にアクセス

### 5. 本番環境へのデプロイ

```bash
npm run build
```

生成された `_site` フォルダを任意の静的サイトホスティングサービスにデプロイ

## 使用方法

### 1. 記事生成
1. ターゲット層を入力（例：「バーチャル合成スタジオ利用者」）
2. メインキーワードを入力（例：「バーチャル合成スタジオで出来る撮影」）
3. 「記事生成」ボタンをクリック

### 2. 記事編集
1. 生成された記事が編集画面に表示
2. 4つのセクション（はじめに、基本概念、実践的テクニック、まとめ）をQuillエディタで編集
3. SEOタイトル・メタディスクリプションを調整
4. 画像をアップロード（自動圧縮・最適化）

### 3. 記事公開
1. 「最終確認」ボタンで内容を確認
2. 「公開する」ボタンで記事を公開

## ファイル構成

```
seo-blog-generator/
├── blog-generator/
│   ├── index.html              # メインフォーム
│   ├── preview.html            # 編集インターフェース
│   ├── blog-generator.js       # メイン処理ロジック
│   ├── quill-config.js         # Quillエディタ設定
│   ├── blog-generator.css      # スタイルシート
│   └── api/
│       └── generate-content.js # OpenAI API統合
├── blog-automation/
│   ├── openai-integration.js   # OpenAI統合モジュール
│   └── templates/              # HTMLテンプレート
├── package.json
├── .eleventy.js               # Eleventyビルド設定
└── README.md
```

## API仕様

### OpenAI統合

```javascript
// コンテンツ生成
const generator = new OpenAIBlogGenerator();
const content = await generator.generateSEOOptimizedContent(keyword, options);
```

### 生成されるコンテンツ構造

```json
{
  "title": "SEOタイトル",
  "metaDescription": "メタディスクリプション",
  "sections": {
    "introduction": "はじめに",
    "concepts": "基本的な概念", 
    "techniques": "実践的なテクニック",
    "conclusion": "まとめ"
  },
  "jsonLd": "構造化データ"
}
```

## デプロイ

### 静的サイトとしてデプロイ

```bash
npm run build
```

生成された `_site` フォルダを任意の静的サイトホスティングサービスにデプロイ

### 対応プラットフォーム

- Netlify
- Vercel  
- GitHub Pages
- AWS S3 + CloudFront
- Devin Apps (https://devinapps.com)

## デモ

本システムのライブデモ: https://seo-blog-generator-h60j6nng.devinapps.com

## カスタマイズ

### テンプレートの編集

`blog-automation/templates/` 内のHTMLテンプレートを編集してデザインをカスタマイズ

### スタイルの変更

`blog-generator/blog-generator.css` でUIスタイルを調整

### OpenAI設定の変更

`blog-automation/openai-integration.js` でAIモデルやパラメータを調整

## ライセンス

MIT License

## 作成者

Studio Q - バーチャル合成スタジオ
