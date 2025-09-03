# SSE学習プロジェクト - ライブ配信サービス

## プロジェクト概要
Server-Sent Events (SSE) の学習を目的とした、ライブ配信サービスのモック実装

## 技術スタック

### バックエンド
- **Kotlin** + Spring Boot
- **Gradle** (ビルドツール)
- **valkey** (メッセージキューとSSEクライアント管理)

### フロントエンド  
- **SvelteKit** (フレームワーク)
- **TailwindCSS** (CSSフレームワーク)

### インフラ
- **Docker** + Docker Compose (コンテナ化)

## プロジェクト構成
```
sse_learn/
├── backend/              # Kotlin Spring Boot API
│   ├── src/main/kotlin/
│   ├── build.gradle.kts
│   └── Dockerfile
├── frontend/             # SvelteKit アプリケーション  
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── CLAUDE.md
└── README.md
```

## 実装機能

### 1. リアルタイムコメントシステム (SSE)
- **エンドポイント**: `GET /api/sse/comments` - コメント用SSE接続
- **エンドポイント**: `POST /api/comments` - コメント投稿
- 全接続クライアントへのリアルタイムコメント配信

### 2. 運営用トースト通知システム (SSE)  
- **エンドポイント**: `GET /api/sse/notifications` - 通知用SSE接続
- **エンドポイント**: `POST /api/admin/toast` - 運営専用トースト送信
- 配信画面上部にオーバーレイ表示される通知

### 3. モック配信インターフェース
- モック動画プレースホルダー付きの配信ページ
- リアルタイムコメントフィードサイドバー
- トースト通知オーバーレイシステム


## 実装手順
1. **環境構築**（バックエンド、フロントエンド、Docker）
2. **TDD用のテストリスト作成**
3. **実装の流れを決定**
4. **TDDに従い実装**
   - Kotlin Spring BootでSSE対応バックエンド構築
   - SvelteKitでSSE EventSource接続のフロントエンド作成
   - valkey導入（メッセージキューとSSEクライアント管理）
   - DockerコンテナとCompose設定構築
   - モック配信インターフェースのシンプルUI作成
   - リアルタイムコメント・通知システムのテスト

## SSE実装の要点
- Spring Bootの`SseEmitter`を使用したサーバーサイドイベントストリーミング
- クライアント追跡機能付きの接続管理
- フロントエンドでの再接続ロジック処理
- コメントと運営通知用の独立したSSEチャンネル

## 開発・実行コマンド
```bash
# プロジェクト全体をDocker Composeで起動
docker-compose up --build

# 個別サービス起動（開発時）
# バックエンド
cd backend && ./gradlew bootRun

# フロントエンド  
cd frontend && npm run dev
```

## 学習目標
- SSEの基本概念とブラウザAPIの理解
- サーバーサイドでのSSE実装方法
- リアルタイム通信におけるクライアント管理
- WebSocketとSSEの使い分け

## 開発方針
このプロジェクトは **Kent BeckのTest-Driven Development (TDD)** に従って開発します。

<repeat_this_order>
### TDDサイクル
1. **Red**: 失敗するテストを書く
2. **Green**: テストを通すための最小限のコードを書く  
3. **Refactor**: コードをリファクタリングして品質を向上させる
</repeat_this_order>


### TDD適用範囲
- **バックエンド**: JUnit 5 + MockKを使用したユニット・統合テスト
- **フロントエンド**: Vitest + Testing Libraryを使用したコンポーネントテスト
- **SSE機能**: テスト用のSSEクライアント・サーバーシミュレーション