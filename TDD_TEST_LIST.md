# TDD テストリスト - SSE学習プロジェクト

Kent BeckのTDD原則に従い、最小単位での機能実装を行います。

## 開発戦略
**バックエンド先行開発**: APIを先に完成させてからフロントエンド実装
- ブランチ戦略: `feature/{機能名}-backend` → `feature/{機能名}-frontend`
- バックエンドのAPI仕様確定後にフロントエンド着手

## テスト進行状況の記号
- ⭕ 完了
- 🔄 実装中  
- ⏸️ 待機

**現在のフェーズ**: フェーズ1（SSE基礎インフラ・バックエンド）

---

## フェーズ1: SSE基礎インフラ（バックエンド）
**ブランチ**: `feature/sse-infrastructure-backend`

### 1.1 SSEエンドポイント基本接続
- ⭕ `GET /api/sse/comments` が404ではない
- ⭕ `GET /api/sse/comments` がHTTP 200を返す
- ⭕ `GET /api/sse/comments` がContent-Type `text/event-stream`を返す
- ⭕ `Cache-Control: no-cache`ヘッダーを返す
- ⭕ `Connection: keep-alive`ヘッダーを返す

### 1.2 SSEEmitter基本動作
- ⭕ SseEmitterオブジェクトが作成される
- ⭕ SseEmitterがnullではない
- ⭕ SseEmitterのタイムアウトが設定される（30秒）
- ⭕ 接続確立時に初期化イベントが送信される（`event: connected`）

### 1.3 単純データ送信
- ⭕ 固定文字列データを送信できる（`data: hello`）
- ⭕ イベント名付きでデータを送信できる（`event: test\ndata: message`）
- ⭕ JSON形式のデータを送信できる

### 1.4 クライアント接続管理
- ⭕ クライアント接続数をカウントできる
- ⭕ 複数クライアント接続を管理できる
- ⭕ クライアント切断を検知できる
- ⭕ 切断時にクライアントリストから削除される
- ⭕ 無効な接続に送信を試みた時エラーハンドリングする

## フェーズ2: コメントシステム（バックエンド）
**ブランチ**: `feature/comments-backend`

### 2.1 コメント投稿API基本
- ⏸️ `POST /api/comments` が404ではない
- ⏸️ `POST /api/comments` がHTTP 400を返す（空のリクエスト）
- ⏸️ `Content-Type: application/json`を受け取る
- ⏸️ 空のJSONボディ `{}` でHTTP 400エラーを返す
- ⏸️ 成功時にHTTP 201とコメントIDを返す

### 2.2 コメントデータ構造とバリデーション
- ⏸️ `username`フィールドを含むJSONを受け取る
- ⏸️ `message`フィールドを含むJSONを受け取る
- ⏸️ 両フィールドが必須であることを検証する（400エラー）
- ⏸️ 空文字列やnullの場合にHTTP 400を返す
- ⏸️ username長すぎる（50文字超）でHTTP 400を返す
- ⏸️ message長すぎる（500文字超）でHTTP 400を返す
- ⏸️ 成功時にCommentエンティティを生成する

### 2.3 コメント保存（メモリストレージ）
- ⏸️ 受け取ったコメントをメモリに保存する（ConcurrentHashMap）
- ⏸️ コメントにタイムスタンプ（LocalDateTime）を自動追加する
- ⏸️ コメントにID（UUID）を自動生成する
- ⏸️ 保存されたコメント数を確認できる
- ⏸️ CommentServiceでCRUD操作を管理する
- ⏸️ スレッドセーフなコメント管理を実装する

### 2.4 コメントSSE配信（既存SseService統合）
- ⏸️ CommentServiceからSseServiceのbroadcastToAllを呼び出す
- ⏸️ 新しいコメントがSSE経由で全クライアントに配信される
- ⏸️ 配信データがJSON形式である（Jackson自動変換）
- ⏸️ 配信データに`id`, `username`, `message`, `timestamp`が含まれる
- ⏸️ `event: comment`イベント名で配信される
- ⏸️ コメント投稿と同時にSSE配信が動作する

### 2.5 複数クライアント同期と履歴配信
- ⏸️ 複数のSSEクライアントに同じコメントが同時配信される
- ⏸️ SseController接続時に既存コメント履歴（直近10件）を送信する
- ⏸️ 履歴は`event: comment-history`イベントで一括送信する
- ⏸️ 新着コメントは`event: comment`で個別送信する
- ⏸️ クライアント毎に独立してメッセージが送信される
- ⏸️ 一つのクライアントの切断が他に影響しない（既存SseService保証）

### 2.6 エラーハンドリングと品質向上
- ⏸️ 統一されたエラーレスポンス形式を実装する（ApiError data class）
- ⏸️ バリデーションエラーでフィールド別エラーメッセージを返す
- ⏸️ サーバー内部エラー（500）で適切なエラーログを出力する
- ⏸️ 不正なContent-Typeでのアクセスを400エラーで処理する
- ⏸️ 大量コメント投稿に対する基本的なレート制限を検討する

### フェーズ2コミット戦略

#### 基本方針: ハイブリッドTDDコミット
- **重要な境界**: セクション単位（2.1→2.2→...）でコミット
- **複雑な実装**: Red-Green-Refactorを個別コミット  
- **単純な実装**: Red-Greenを1コミット、Refactorを別コミット

#### セクション別コミット計画
```
2.1 API基本 (5項目) → 2-3コミット
2.2 データ構造 (7項目) → 3-4コミット  
2.3 ストレージ (6項目) → 2-3コミット
2.4 SSE統合 (6項目) → 2-3コミット (複雑)
2.5 クライアント同期 (6項目) → 3-4コミット (複雑)
2.6 エラーハンドリング (5項目) → 2コミット
```

#### コミットメッセージテンプレート
```
<type>(comments): <section> - <description>

<TDD phase details>
- Red: <test description>
- Green: <implementation description>  
- Refactor: <improvement description>

Technical notes:
- <architecture decisions>
- <integration points>
```

---

## フェーズ3: コメント機能（フロントエンド）
**ブランチ**: `feature/comments-frontend`
**前提**: フェーズ2のバックエンドAPI完成後に着手

### 3.1 SSE接続クライアント
- ⏸️ `EventSource`でSSE接続を確立できる
- ⏸️ 接続エラー時の再接続処理が動作する
- ⏸️ 接続状態（接続中/切断中）を表示できる
- ⏸️ `comment`イベントを受信できる

### 3.2 コメント表示
- ⏸️ 受信したコメントを画面に表示する
- ⏸️ コメントリストが時系列順で表示される
- ⏸️ 新着コメントが上部に追加される
- ⏸️ 古いコメントは自動で削除される（最大100件表示）

### 3.3 コメント投稿フォーム
- ⏸️ ユーザー名入力フィールドがある
- ⏸️ コメント入力フィールドがある
- ⏸️ 送信ボタンがある
- ⏸️ 必須入力チェックが動作する
- ⏸️ 文字数制限チェックが動作する

### 3.4 コメント送信
- ⏸️ フォーム送信で`POST /api/comments`を呼び出す
- ⏸️ 送信中はボタンを無効化する
- ⏸️ 送信成功時にフォームをクリアする
- ⏸️ 送信エラー時にエラーメッセージを表示する

## フェーズ4: 運営通知システム（バックエンド）
**ブランチ**: `feature/admin-notifications-backend`

### 4.1 運営トースト送信API
- ⏸️ `POST /api/admin/toast` が404ではない
- ⏸️ `POST /api/admin/toast` がHTTP 200を返す
- ⏸️ `Content-Type: application/json`を受け取る

### 4.2 トースト通知データ構造  
- ⏸️ `message`フィールドを含むJSONを受け取る
- ⏸️ `type`フィールド（info/warning/error）を受け取る
- ⏸️ `duration`フィールド（表示時間ms）を受け取る
- ⏸️ 必須フィールドの検証を行う

### 4.3 通知専用SSEエンドポイント
- ⏸️ `GET /api/sse/notifications` が存在する
- ⏸️ Content-Type `text/event-stream`を返す
- ⏸️ コメント用とは独立した接続管理を行う

### 4.4 通知SSE配信
- ⏸️ トースト投稿時にSSE経由で配信される
- ⏸️ `event: toast`イベント名で配信される
- ⏸️ 配信データに`message`, `type`, `duration`, `timestamp`が含まれる
- ⏸️ 通知用SSE接続のみに配信される（コメント用には配信されない）

---

## フェーズ5: 運営通知機能（フロントエンド）
**ブランチ**: `feature/admin-notifications-frontend` 
**前提**: フェーズ4のバックエンドAPI完成後に着手

### 5.1 通知SSE接続
- ⏸️ `EventSource`で通知専用SSE接続を確立できる
- ⏸️ `toast`イベントを受信できる
- ⏸️ 接続エラー時の再接続処理が動作する

### 5.2 トースト表示システム
- ⏸️ 受信した通知をオーバーレイ表示する
- ⏸️ 通知タイプ（info/warning/error）で色分け表示する
- ⏸️ 指定時間後に自動で消える
- ⏸️ 複数の通知を縦に並べて表示する

### 5.3 運営用送信フォーム（開発用）
- ⏸️ 通知メッセージ入力フィールド
- ⏸️ 通知タイプ選択（ラジオボタン）
- ⏸️ 表示時間指定（秒数入力）
- ⏸️ 送信ボタン

### 5.4 運営通知送信
- ⏸️ フォーム送信で`POST /api/admin/toast`を呼び出す
- ⏸️ 送信成功時にフォームをクリアする
- ⏸️ 送信エラー時にエラー表示する

---

## フェーズ6: Valkey統合（将来実装）
**ブランチ**: `feature/valkey-integration-backend`

### Valkey基本接続
- ⏸️ Valkeyに接続できる
- ⏸️ Valkeyにデータを保存できる
- ⏸️ Valkeyからデータを取得できる

### メッセージキュー
- ⏸️ コメントをValkeyキューに送信する
- ⏸️ キューからコメントを受信してSSE配信する
- ⏸️ 複数サーバー間での配信同期が動作する

---

## 進行メモ
- 各テストは **Red（失敗）→ Green（成功）→ Refactor（改善）** の順で実装
- 最小限のコードでテストを通す
- テスト通過後にのみリファクタリング実行
- 一度に一つのテストのみ実装