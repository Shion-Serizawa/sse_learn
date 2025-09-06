/**
 * SSE関連の型定義
 */

/**
 * SSE接続の状態
 */
export type SseConnectionState = 
  | 'connecting'      // 接続試行中
  | 'connected'       // 接続成功
  | 'disconnected'    // 切断状態
  | 'reconnecting'    // 再接続試行中
  | 'error';          // エラー状態

/**
 * SSEイベントの種類
 */
export type SseEventType = 
  | 'connected'       // 接続確立通知
  | 'comment'         // 新着コメント
  | 'comment-history' // コメント履歴;

/**
 * SSEイベントデータの基本構造
 */
export interface SseEventData<T = unknown> {
  type: SseEventType;
  data: T;
  timestamp?: string;
}

/**
 * SSEサービスの設定
 */
export interface SseServiceConfig {
  url: string;
  maxReconnectAttempts: number;
  reconnectInterval: number; // ミリ秒
  exponentialBackoff: boolean;
}

/**
 * SSEイベントハンドラー
 */
export interface SseEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onComment?: (comment: import('./comment').Comment) => void;
  onCommentHistory?: (comments: import('./comment').Comment[]) => void;
  onStateChange?: (state: SseConnectionState) => void;
}

/**
 * 再接続戦略の設定
 */
export interface ReconnectionStrategy {
  maxAttempts: number;
  baseDelay: number; // ミリ秒
  maxDelay: number;  // ミリ秒
  exponentialBackoff: boolean;
}