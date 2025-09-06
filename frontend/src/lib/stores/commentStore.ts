import { writable } from 'svelte/store';
import type { Comment } from '../types/comment';
import type { SseConnectionState } from '../types/sse';

/**
 * コメント表示の最大件数制限
 */
export const MAX_COMMENTS_DISPLAY = 100;

/**
 * コメント配列のリアクティブストア
 */
function createCommentStore() {
  const { subscribe, set, update } = writable<Comment[]>([]);

  return {
    subscribe,
    
    /**
     * 新着コメントを追加（先頭に挿入）
     */
    addComment: (comment: Comment) => update(comments => {
      const newComments = [comment, ...comments];
      // 最大件数制限を適用
      if (newComments.length > MAX_COMMENTS_DISPLAY) {
        return newComments.slice(0, MAX_COMMENTS_DISPLAY);
      }
      return newComments;
    }),
    
    /**
     * コメント履歴を設定（初期読み込み時）
     */
    setHistory: (historyComments: Comment[]) => update(currentComments => {
      // 履歴コメントを時系列でソート（新しい順）
      const sortedHistory = [...historyComments].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // 既存コメントと重複を排除しつつマージ
      const existingIds = new Set(currentComments.map(c => c.id));
      const uniqueHistory = sortedHistory.filter(c => !existingIds.has(c.id));
      
      const mergedComments = [...currentComments, ...uniqueHistory];
      
      // 再度時系列ソートして最大件数制限を適用
      const finalComments = mergedComments
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_COMMENTS_DISPLAY);
        
      return finalComments;
    }),
    
    /**
     * 全コメントをクリア
     */
    clear: () => set([]),
    
    /**
     * コメント配列全体を置換
     */
    setAll: (comments: Comment[]) => {
      // 時系列ソートして最大件数制限を適用
      const sortedComments = [...comments]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_COMMENTS_DISPLAY);
      set(sortedComments);
    }
  };
}

/**
 * SSE接続状態のリアクティブストア
 */
function createConnectionStore() {
  const { subscribe, set } = writable<SseConnectionState>('disconnected');

  return {
    subscribe,
    
    /**
     * 接続状態を更新
     */
    setState: (state: SseConnectionState) => set(state),
    
    /**
     * 接続中かどうかを判定するための派生ストア
     */
    isConnected: () => {
      let currentState: SseConnectionState = 'disconnected';
      subscribe(state => { currentState = state; })();
      return currentState === 'connected';
    }
  };
}

/**
 * 接続統計情報のストア
 */
function createConnectionStatsStore() {
  const { subscribe, set, update } = writable({
    totalConnections: 0,
    reconnectAttempts: 0,
    lastConnectionTime: null as Date | null,
    lastDisconnectionTime: null as Date | null
  });

  return {
    subscribe,
    
    /**
     * 接続成功時の統計更新
     */
    onConnect: () => update(stats => ({
      ...stats,
      totalConnections: stats.totalConnections + 1,
      reconnectAttempts: 0,
      lastConnectionTime: new Date()
    })),
    
    /**
     * 切断時の統計更新
     */
    onDisconnect: () => update(stats => ({
      ...stats,
      lastDisconnectionTime: new Date()
    })),
    
    /**
     * 再接続試行時の統計更新
     */
    onReconnectAttempt: () => update(stats => ({
      ...stats,
      reconnectAttempts: stats.reconnectAttempts + 1
    })),
    
    /**
     * 統計をリセット
     */
    reset: () => set({
      totalConnections: 0,
      reconnectAttempts: 0,
      lastConnectionTime: null,
      lastDisconnectionTime: null
    })
  };
}

/**
 * エクスポートするストアインスタンス
 */
export const commentStore = createCommentStore();
export const connectionStore = createConnectionStore();
export const connectionStatsStore = createConnectionStatsStore();

/**
 * 全ストアの状態をリセットするユーティリティ
 */
export function resetAllStores() {
  commentStore.clear();
  connectionStore.setState('disconnected');
  connectionStatsStore.reset();
}