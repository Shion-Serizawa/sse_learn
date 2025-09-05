# SSE学習プロジェクト - ライブ配信サービス

## プロジェクト概要
Server-Sent Events (SSE) の学習を目的とした、ライブ配信サービスのモック実装

## 技術スタック

### バックエンド
- **Kotlin** + Spring Boot 3.4.1
- **Gradle** 8.11.1 (ビルドツール)
- **Java 17** (Kotlin実行環境)
- **Valkey** (Redis互換、メッセージキューとSSEクライアント管理)

### フロントエンド  
- **SvelteKit** (フレームワーク)
- **TailwindCSS** (CSSフレームワーク)

### インフラ・開発環境
- **Docker** + Docker Compose (コンテナ化)
- **mise** (開発環境管理・ツールバージョン固定)

## プロジェクト構成
```
sse_learn/
├── backend/              # Kotlin Spring Boot API
│   ├── src/main/kotlin/
│   ├── gradle/wrapper/   # Gradleラッパー設定
│   ├── build.gradle.kts
│   ├── gradlew          # Unix用Gradleラッパー
│   ├── gradlew.bat      # Windows用Gradleラッパー
│   └── Dockerfile
├── frontend/             # SvelteKit アプリケーション  
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── .mise.toml           # 開発環境・ツール設定
├── docker-compose.yml   # フルスタックDocker設定
├── docker-compose.dev.yml # 開発用Docker設定
├── TDD_TEST_LIST.md     # TDDテストリスト
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
1. **環境構築**（バックエンド、フロントエンド、Docker） ✅ 完了
2. **TDD用のテストリスト作成** → `TDD_TEST_LIST.md`
3. **実装の流れを決定**
4. **TDDに従い実装**
   - Kotlin Spring BootでSSE対応バックエンド構築
   - SvelteKitでSSE EventSource接続のフロントエンド作成
   - Valkey導入（メッセージキューとSSEクライアント管理）
   - DockerコンテナとCompose設定構築
   - モック配信インターフェースのシンプルUI作成
   - リアルタイムコメント・通知システムのテスト

## SSE実装の要点
- Spring Bootの`SseEmitter`を使用したサーバーサイドイベントストリーミング
- クライアント追跡機能付きの接続管理
- フロントエンドでの再接続ロジック処理
- コメントと運営通知用の独立したSSEチャンネル

## 開発・実行コマンド

### mise使用（推奨）
```bash
# 開発用サービス起動（Valkeyのみ）
mise run docker-dev

# バックエンド起動（別ターミナル）
mise run backend

# フロントエンド起動（別ターミナル）
mise run frontend

# テスト実行
mise run test

# ビルド
mise run build

# Docker停止
mise run docker-stop
```

### Docker Compose直接使用
```bash
# フルスタック起動
docker-compose --profile full up -d

# 開発用（Valkeyのみ）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up valkey -d

# 停止
docker-compose down
```

### 個別実行
```bash
# バックエンド（Java 17が必要）
cd backend && mise exec -- ./gradlew.bat bootRun

# フロントエンド
cd frontend && npm run dev

# バックエンドテスト
cd backend && mise exec -- ./gradlew.bat test
```

## 学習目標
- SSEの基本概念とブラウザAPIの理解
- サーバーサイドでのSSE実装方法
- リアルタイム通信におけるクライアント管理
- WebSocketとSSEの使い分け

## 開発方針
このプロジェクトは **Kent BeckのTest-Driven Development (TDD)** に従って開発します。

### TDDサイクル
1. **Red**: 失敗するテストを書く
2. **Green**: テストを通すための最小限のコードを書く  
3. **Refactor**: コードをリファクタリングして品質を向上させる

### 開発戦略・ブランチ運用
- **バックエンド先行開発**: APIを先に完成させてからフロントエンド実装
- **機能単位ブランチ**: `feature/{機能名}-backend` → `feature/{機能名}-frontend`
- **段階的統合**: 各フェーズ完了後にmainブランチにマージ

#### ブランチ構成例
```
main
├── feature/sse-infrastructure-backend
├── feature/comments-backend  
├── feature/comments-frontend (backend完了後)
├── feature/admin-notifications-backend
└── feature/admin-notifications-frontend (backend完了後)
```

### コミット戦略・Git運用
#### コミット粒度（推奨）
**TDDサイクル単位でコミット** - Red→Green→Refactorを1セットとする
```
test(sse): GET /api/sse/comments エンドポイント基本動作
- Red: 失敗テスト追加
- Green: 基本エンドポイント実装  
- Refactor: コントローラー構成整理
```

#### コミットメッセージ規約
```
<type>(<scope>): <subject>

<body>
```

**Type一覧**:
- `test`: テストの追加・修正
- `feat`: 新機能追加
- `fix`: バグ修正  
- `refactor`: リファクタリング
- `docs`: ドキュメント更新
- `style`: コードフォーマット
- `chore`: ビルド・設定変更

**Scope例**: `sse`, `comments`, `admin-notifications`

#### 特殊コミットパターン
- **複雑なTDD**: Red/Green/Refactorを個別コミット
- **フェーズ完了**: 機能完成時の統合コミット
- **ホットフィックス**: 緊急修正時の最小コミット

### 技術調査・学習方針
- **不明な仕様**: Context7でライブラリドキュメントを調査してから実装
- **Spring Boot**: SSE、WebFlux、テスト関連の最新仕様確認
- **SvelteKit**: EventSource、TypeScript統合の確認
- **調査→実装→テスト**の順序を徹底

### TDD適用範囲
- **バックエンド**: JUnit 5 + MockKを使用したユニット・統合テスト
- **フロントエンド**: Vitest + Testing Libraryを使用したコンポーネントテスト
- **SSE機能**: テスト用のSSEクライアント・サーバーシミュレーション

### テストファイル分割方針
- **アプリケーション**: 基本起動テストのみ
- **Controller層**: エンドポイント別にテストクラス分離
- **Service層**: ビジネスロジック単位でテスト分離
- **Integration**: 機能全体の統合テスト
- **Kotlinネイティブ**: `String::class`形式を使用、Java interop最小化

### 開発フロー
1. **フェーズ1**: SSE基礎インフラ（バックエンド）
2. **フェーズ2**: コメントシステム（バックエンド）
3. **フェーズ3**: コメント機能（フロントエンド）
4. **フェーズ4**: 運営通知システム（バックエンド）
5. **フェーズ5**: 運営通知機能（フロントエンド）
6. **フェーズ6**: Valkey統合（将来実装）

<critical_development_rules>
### TDDサイクル
1. **Red**: 失敗するテストを書く
2. **Green**: テストを通すための最小限のコードを書く  
3. **Refactor**: コードをリファクタリングして品質を向上させる
</critical_development_rules>