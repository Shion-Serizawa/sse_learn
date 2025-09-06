import type { 
  SseConnectionState, 
  SseEventHandlers, 
  SseServiceConfig,
  ReconnectionStrategy 
} from '../types/sse';
import type { Comment } from '../types/comment';

/**
 * Server-Sent Events (SSE) 接続管理サービス
 * リアルタイムコメント配信のSSE接続を管理し、再接続ロジックを提供
 */
export class SseService {
  private eventSource: EventSource | null = null;
  private state: SseConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private readonly config: SseServiceConfig;
  private readonly reconnectionStrategy: ReconnectionStrategy;
  private readonly handlers: SseEventHandlers = {};

  constructor(
    url: string = '/api/sse/comments',
    config: Partial<SseServiceConfig> = {}
  ) {
    this.config = {
      url,
      maxReconnectAttempts: 10,
      reconnectInterval: 1000,
      exponentialBackoff: true,
      ...config
    };

    this.reconnectionStrategy = {
      maxAttempts: this.config.maxReconnectAttempts,
      baseDelay: this.config.reconnectInterval,
      maxDelay: 30000, // 最大30秒
      exponentialBackoff: this.config.exponentialBackoff
    };
  }

  /**
   * SSE接続を確立する
   */
  connect(): void {
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      console.warn('SseService: Already connected or connecting');
      return;
    }

    this.setState('connecting');
    console.log('SseService: Connecting to', this.config.url);

    try {
      this.eventSource = new EventSource(this.config.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('SseService: Failed to create EventSource', error);
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  /**
   * SSE接続を切断する
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setState('disconnected');
    this.reconnectAttempts = 0;
    console.log('SseService: Disconnected');
  }

  /**
   * 接続状態を取得
   */
  getState(): SseConnectionState {
    return this.state;
  }

  /**
   * 接続中かどうかを判定
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * イベントハンドラーを設定
   */
  setHandlers(handlers: SseEventHandlers): void {
    Object.assign(this.handlers, handlers);
  }

  /**
   * 特定のイベントハンドラーを設定
   */
  onConnect(handler: () => void): void {
    this.handlers.onConnect = handler;
  }

  onDisconnect(handler: () => void): void {
    this.handlers.onDisconnect = handler;
  }

  onError(handler: (error: Event) => void): void {
    this.handlers.onError = handler;
  }

  onComment(handler: (comment: Comment) => void): void {
    this.handlers.onComment = handler;
  }

  onCommentHistory(handler: (comments: Comment[]) => void): void {
    this.handlers.onCommentHistory = handler;
  }

  onStateChange(handler: (state: SseConnectionState) => void): void {
    this.handlers.onStateChange = handler;
  }

  /**
   * EventSourceのイベントリスナーをセットアップ
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // 接続確立
    this.eventSource.onopen = () => {
      console.log('SseService: Connection established');
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.handlers.onConnect?.();
    };

    // エラーハンドリング
    this.eventSource.onerror = (event) => {
      console.error('SseService: Connection error', event);
      
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.setState('disconnected');
        this.scheduleReconnect();
      } else {
        this.setState('error');
      }
      
      this.handlers.onError?.(event);
    };

    // 'connected' イベント（サーバーからの接続確認）
    this.eventSource.addEventListener('connected', (event) => {
      console.log('SseService: Server connection confirmed:', event.data);
    });

    // 'comment' イベント（新着コメント）
    this.eventSource.addEventListener('comment', (event) => {
      try {
        const comment: Comment = JSON.parse(event.data);
        console.log('SseService: New comment received:', comment);
        this.handlers.onComment?.(comment);
      } catch (error) {
        console.error('SseService: Failed to parse comment data:', error);
      }
    });

    // 'comment-history' イベント（コメント履歴）
    this.eventSource.addEventListener('comment-history', (event) => {
      try {
        const comments: Comment[] = JSON.parse(event.data);
        console.log('SseService: Comment history received:', comments.length, 'comments');
        this.handlers.onCommentHistory?.(comments);
      } catch (error) {
        console.error('SseService: Failed to parse comment history:', error);
      }
    });
  }

  /**
   * 接続状態を更新し、ハンドラーに通知
   */
  private setState(newState: SseConnectionState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      console.log(`SseService: State changed from ${oldState} to ${newState}`);
      this.handlers.onStateChange?.(newState);

      // 切断時のハンドラー呼び出し
      if (newState === 'disconnected' && oldState === 'connected') {
        this.handlers.onDisconnect?.();
      }
    }
  }

  /**
   * 再接続をスケジュール
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.reconnectionStrategy.maxAttempts) {
      console.error('SseService: Max reconnection attempts reached');
      this.setState('error');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();
    
    console.log(`SseService: Scheduling reconnect #${this.reconnectAttempts} in ${delay}ms`);
    this.setState('reconnecting');

    this.reconnectTimeout = (globalThis.setTimeout || setTimeout)(() => {
      this.reconnectTimeout = null;
      console.log(`SseService: Attempting reconnect #${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * 指数バックオフ戦略で再接続遅延時間を計算
   */
  private calculateReconnectDelay(): number {
    const { baseDelay, maxDelay, exponentialBackoff } = this.reconnectionStrategy;
    
    if (!exponentialBackoff) {
      return baseDelay;
    }

    // 指数バックオフ: baseDelay * (2 ^ attempts) + jitter
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // 0-1000msのランダム要素
    const delay = Math.min(exponentialDelay + jitter, maxDelay);
    
    return Math.floor(delay);
  }

  /**
   * リソースクリーンアップ（コンポーネント破棄時に呼び出し）
   */
  destroy(): void {
    this.disconnect();
    // 全ハンドラーをクリア
    Object.keys(this.handlers).forEach(key => {
      delete this.handlers[key as keyof SseEventHandlers];
    });
  }
}