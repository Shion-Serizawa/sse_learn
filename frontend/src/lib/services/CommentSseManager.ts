import { SseService } from './SseService';
import { commentStore, connectionStore, connectionStatsStore } from '../stores/commentStore';
import type { Comment } from '../types/comment';

/**
 * コメントSSE接続とストア管理を統合するマネージャークラス
 * SseServiceとSvelteストアを橋渡しし、一元的な状態管理を提供
 */
export class CommentSseManager {
  private sseService: SseService;
  private isInitialized = false;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.sseService = new SseService(`${baseUrl}/api/sse/comments`);
    this.setupSseHandlers();
  }

  /**
   * SSEサービスのイベントハンドラーをセットアップ
   */
  private setupSseHandlers(): void {
    this.sseService.setHandlers({
      onConnect: () => {
        console.log('CommentSseManager: Connected to SSE');
        connectionStatsStore.onConnect();
      },

      onDisconnect: () => {
        console.log('CommentSseManager: Disconnected from SSE');
        connectionStatsStore.onDisconnect();
      },

      onError: (error) => {
        console.error('CommentSseManager: SSE Error', error);
      },

      onStateChange: (state) => {
        console.log('CommentSseManager: State changed to', state);
        connectionStore.setState(state);
        
        if (state === 'reconnecting') {
          connectionStatsStore.onReconnectAttempt();
        }
      },

      onComment: (comment: Comment) => {
        console.log('CommentSseManager: New comment received', comment);
        commentStore.addComment(comment);
      },

      onCommentHistory: (comments: Comment[]) => {
        console.log('CommentSseManager: Comment history received', comments.length, 'comments');
        
        if (!this.isInitialized) {
          // 初回接続時は履歴で初期化
          commentStore.setHistory(comments);
          this.isInitialized = true;
        } else {
          // 再接続時も履歴をマージ
          commentStore.setHistory(comments);
        }
      }
    });
  }

  /**
   * SSE接続を開始
   */
  connect(): void {
    console.log('CommentSseManager: Starting connection');
    this.sseService.connect();
  }

  /**
   * SSE接続を切断
   */
  disconnect(): void {
    console.log('CommentSseManager: Disconnecting');
    this.sseService.disconnect();
  }

  /**
   * 接続状態を取得
   */
  getConnectionState() {
    return this.sseService.getState();
  }

  /**
   * 接続中かどうかを判定
   */
  isConnected(): boolean {
    return this.sseService.isConnected();
  }

  /**
   * マネージャーを破棄（リソースクリーンアップ）
   */
  destroy(): void {
    console.log('CommentSseManager: Destroying manager');
    this.sseService.destroy();
    this.isInitialized = false;
  }

  /**
   * 手動再接続トリガー
   */
  reconnect(): void {
    console.log('CommentSseManager: Manual reconnection triggered');
    this.sseService.disconnect();
    // 短い遅延後に再接続
    setTimeout(() => {
      this.sseService.connect();
    }, 1000);
  }

  /**
   * 全状態をリセット（開発用）
   */
  resetAll(): void {
    console.log('CommentSseManager: Resetting all state');
    this.disconnect();
    
    // ストアをリセット
    commentStore.clear();
    connectionStore.setState('disconnected');
    connectionStatsStore.reset();
    
    this.isInitialized = false;
  }
}