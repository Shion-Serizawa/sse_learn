import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { 
  commentStore, 
  connectionStore, 
  connectionStatsStore, 
  resetAllStores,
  MAX_COMMENTS_DISPLAY 
} from './commentStore';
import type { Comment } from '../types/comment';

describe('commentStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('initial state', () => {
    it('should start with empty comments array', () => {
      expect(get(commentStore)).toEqual([]);
    });
  });

  describe('addComment', () => {
    it('should add comment to the beginning of array', () => {
      const comment1: Comment = {
        id: 'test-1',
        username: 'user1',
        message: 'first message',
        timestamp: '2024-01-01T10:00:00Z'
      };

      const comment2: Comment = {
        id: 'test-2',
        username: 'user2',
        message: 'second message',
        timestamp: '2024-01-01T10:01:00Z'
      };

      commentStore.addComment(comment1);
      expect(get(commentStore)).toEqual([comment1]);

      commentStore.addComment(comment2);
      expect(get(commentStore)).toEqual([comment2, comment1]);
    });

    it('should enforce max comment limit', () => {
      // MAX_COMMENTS_DISPLAY + 1 個のコメントを追加
      const comments: Comment[] = Array.from({ length: MAX_COMMENTS_DISPLAY + 1 }, (_, i) => ({
        id: `test-${i}`,
        username: `user${i}`,
        message: `message ${i}`,
        timestamp: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`
      }));

      comments.forEach(comment => commentStore.addComment(comment));

      const storedComments = get(commentStore);
      expect(storedComments).toHaveLength(MAX_COMMENTS_DISPLAY);
      
      // 最新のコメントが保持されていることを確認
      expect(storedComments[0].id).toBe(`test-${MAX_COMMENTS_DISPLAY}`);
    });
  });

  describe('setHistory', () => {
    it('should set comments in chronological order (newest first)', () => {
      const historyComments: Comment[] = [
        {
          id: 'old-1',
          username: 'user1',
          message: 'oldest',
          timestamp: '2024-01-01T08:00:00Z'
        },
        {
          id: 'new-1',
          username: 'user2',
          message: 'newest',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: 'mid-1',
          username: 'user3',
          message: 'middle',
          timestamp: '2024-01-01T09:00:00Z'
        }
      ];

      commentStore.setHistory(historyComments);

      const storedComments = get(commentStore);
      expect(storedComments[0].id).toBe('new-1'); // newest first
      expect(storedComments[1].id).toBe('mid-1');
      expect(storedComments[2].id).toBe('old-1');
    });

    it('should merge with existing comments without duplicates', () => {
      // 既存コメントを追加
      const existingComment: Comment = {
        id: 'existing-1',
        username: 'existing',
        message: 'existing message',
        timestamp: '2024-01-01T11:00:00Z'
      };
      commentStore.addComment(existingComment);

      // 履歴コメント（重複あり）
      const historyComments: Comment[] = [
        existingComment, // 重複
        {
          id: 'history-1',
          username: 'history',
          message: 'history message',
          timestamp: '2024-01-01T09:00:00Z'
        }
      ];

      commentStore.setHistory(historyComments);

      const storedComments = get(commentStore);
      expect(storedComments).toHaveLength(2);
      expect(storedComments[0].id).toBe('existing-1'); // newest first
      expect(storedComments[1].id).toBe('history-1');
    });

    it('should enforce max comment limit for history', () => {
      const historyComments: Comment[] = Array.from({ length: MAX_COMMENTS_DISPLAY + 1 }, (_, i) => ({
        id: `history-${i}`,
        username: `user${i}`,
        message: `history message ${i}`,
        timestamp: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`
      }));

      commentStore.setHistory(historyComments);

      const storedComments = get(commentStore);
      expect(storedComments).toHaveLength(MAX_COMMENTS_DISPLAY);
    });
  });

  describe('clear', () => {
    it('should clear all comments', () => {
      const comment: Comment = {
        id: 'test-1',
        username: 'user1',
        message: 'test message',
        timestamp: '2024-01-01T10:00:00Z'
      };

      commentStore.addComment(comment);
      expect(get(commentStore)).toHaveLength(1);

      commentStore.clear();
      expect(get(commentStore)).toEqual([]);
    });
  });

  describe('setAll', () => {
    it('should replace all comments with sorted array', () => {
      const comments: Comment[] = [
        {
          id: 'old',
          username: 'user1',
          message: 'old message',
          timestamp: '2024-01-01T08:00:00Z'
        },
        {
          id: 'new',
          username: 'user2',
          message: 'new message',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ];

      commentStore.setAll(comments);

      const storedComments = get(commentStore);
      expect(storedComments).toHaveLength(2);
      expect(storedComments[0].id).toBe('new'); // newest first
      expect(storedComments[1].id).toBe('old');
    });

    it('should enforce max comment limit', () => {
      const comments: Comment[] = Array.from({ length: MAX_COMMENTS_DISPLAY + 1 }, (_, i) => ({
        id: `test-${i}`,
        username: `user${i}`,
        message: `message ${i}`,
        timestamp: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`
      }));

      commentStore.setAll(comments);

      const storedComments = get(commentStore);
      expect(storedComments).toHaveLength(MAX_COMMENTS_DISPLAY);
    });
  });
});

describe('connectionStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('initial state', () => {
    it('should start as disconnected', () => {
      expect(get(connectionStore)).toBe('disconnected');
    });
  });

  describe('setState', () => {
    it('should update connection state', () => {
      connectionStore.setState('connecting');
      expect(get(connectionStore)).toBe('connecting');

      connectionStore.setState('connected');
      expect(get(connectionStore)).toBe('connected');

      connectionStore.setState('error');
      expect(get(connectionStore)).toBe('error');
    });
  });

  describe('isConnected', () => {
    it('should return true only when connected', () => {
      connectionStore.setState('disconnected');
      expect(connectionStore.isConnected()).toBe(false);

      connectionStore.setState('connecting');
      expect(connectionStore.isConnected()).toBe(false);

      connectionStore.setState('connected');
      expect(connectionStore.isConnected()).toBe(true);

      connectionStore.setState('error');
      expect(connectionStore.isConnected()).toBe(false);
    });
  });
});

describe('connectionStatsStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('initial state', () => {
    it('should start with zero stats', () => {
      const stats = get(connectionStatsStore);
      expect(stats.totalConnections).toBe(0);
      expect(stats.reconnectAttempts).toBe(0);
      expect(stats.lastConnectionTime).toBe(null);
      expect(stats.lastDisconnectionTime).toBe(null);
    });
  });

  describe('onConnect', () => {
    it('should increment total connections and reset reconnect attempts', () => {
      connectionStatsStore.onConnect();

      const stats = get(connectionStatsStore);
      expect(stats.totalConnections).toBe(1);
      expect(stats.reconnectAttempts).toBe(0);
      expect(stats.lastConnectionTime).toBeInstanceOf(Date);
    });

    it('should reset reconnect attempts on successful connection', () => {
      connectionStatsStore.onReconnectAttempt();
      connectionStatsStore.onReconnectAttempt();
      
      let stats = get(connectionStatsStore);
      expect(stats.reconnectAttempts).toBe(2);

      connectionStatsStore.onConnect();
      
      stats = get(connectionStatsStore);
      expect(stats.reconnectAttempts).toBe(0);
    });
  });

  describe('onDisconnect', () => {
    it('should set last disconnection time', () => {
      connectionStatsStore.onDisconnect();

      const stats = get(connectionStatsStore);
      expect(stats.lastDisconnectionTime).toBeInstanceOf(Date);
    });
  });

  describe('onReconnectAttempt', () => {
    it('should increment reconnect attempts', () => {
      connectionStatsStore.onReconnectAttempt();
      connectionStatsStore.onReconnectAttempt();

      const stats = get(connectionStatsStore);
      expect(stats.reconnectAttempts).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset all stats to initial values', () => {
      connectionStatsStore.onConnect();
      connectionStatsStore.onDisconnect();
      connectionStatsStore.onReconnectAttempt();

      connectionStatsStore.reset();

      const stats = get(connectionStatsStore);
      expect(stats.totalConnections).toBe(0);
      expect(stats.reconnectAttempts).toBe(0);
      expect(stats.lastConnectionTime).toBe(null);
      expect(stats.lastDisconnectionTime).toBe(null);
    });
  });
});

describe('resetAllStores', () => {
  it('should reset all stores to initial state', () => {
    // 各ストアに状態を設定
    const comment: Comment = {
      id: 'test',
      username: 'user',
      message: 'message',
      timestamp: '2024-01-01T10:00:00Z'
    };
    commentStore.addComment(comment);
    connectionStore.setState('connected');
    connectionStatsStore.onConnect();

    // リセット前の状態確認
    expect(get(commentStore)).toHaveLength(1);
    expect(get(connectionStore)).toBe('connected');
    expect(get(connectionStatsStore).totalConnections).toBe(1);

    // 全リセット
    resetAllStores();

    // リセット後の状態確認
    expect(get(commentStore)).toEqual([]);
    expect(get(connectionStore)).toBe('disconnected');
    expect(get(connectionStatsStore).totalConnections).toBe(0);
  });
});