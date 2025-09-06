import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { CommentSseManager } from './CommentSseManager';
import { commentStore, connectionStore, connectionStatsStore, resetAllStores } from '../stores/commentStore';
import type { Comment } from '../types/comment';

// SseServiceのモック
vi.mock('./SseService', () => {
  const mockHandlers: any = {};
  
  return {
    SseService: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      getState: vi.fn().mockReturnValue('disconnected'),
      isConnected: vi.fn().mockReturnValue(false),
      setHandlers: vi.fn((handlers) => {
        Object.assign(mockHandlers, handlers);
      }),
      destroy: vi.fn(),
      // テスト用ヘルパー
      __mockTriggerConnect: () => mockHandlers.onConnect?.(),
      __mockTriggerDisconnect: () => mockHandlers.onDisconnect?.(),
      __mockTriggerError: (error: Event) => mockHandlers.onError?.(error),
      __mockTriggerStateChange: (state: string) => mockHandlers.onStateChange?.(state),
      __mockTriggerComment: (comment: Comment) => mockHandlers.onComment?.(comment),
      __mockTriggerCommentHistory: (comments: Comment[]) => mockHandlers.onCommentHistory?.(comments)
    }))
  };
});

describe('CommentSseManager', () => {
  let manager: CommentSseManager;
  let mockSseService: any;

  beforeEach(() => {
    resetAllStores();
    manager = new CommentSseManager('http://test:8080');
    // モックSseServiceインスタンスを取得
    mockSseService = (manager as any).sseService;
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('constructor', () => {
    it('should create manager with default URL', () => {
      const defaultManager = new CommentSseManager();
      expect(defaultManager).toBeDefined();
      defaultManager.destroy();
    });

    it('should create manager with custom URL', () => {
      expect(manager).toBeDefined();
      expect(mockSseService.setHandlers).toHaveBeenCalled();
    });
  });

  describe('connection management', () => {
    it('should connect via SSE service', () => {
      manager.connect();
      expect(mockSseService.connect).toHaveBeenCalled();
    });

    it('should disconnect via SSE service', () => {
      manager.disconnect();
      expect(mockSseService.disconnect).toHaveBeenCalled();
    });

    it('should get connection state from SSE service', () => {
      mockSseService.getState.mockReturnValue('connected');
      expect(manager.getConnectionState()).toBe('connected');
    });

    it('should check connection status via SSE service', () => {
      mockSseService.isConnected.mockReturnValue(true);
      expect(manager.isConnected()).toBe(true);
    });
  });

  describe('SSE event handling', () => {
    it('should handle connect event', () => {
      mockSseService.__mockTriggerConnect();
      
      const stats = get(connectionStatsStore);
      expect(stats.totalConnections).toBe(1);
      expect(stats.lastConnectionTime).toBeInstanceOf(Date);
    });

    it('should handle disconnect event', () => {
      mockSseService.__mockTriggerDisconnect();
      
      const stats = get(connectionStatsStore);
      expect(stats.lastDisconnectionTime).toBeInstanceOf(Date);
    });

    it('should handle error event', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Event('error');
      
      mockSseService.__mockTriggerError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'CommentSseManager: SSE Error',
        error
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle state change event', () => {
      mockSseService.__mockTriggerStateChange('connecting');
      
      expect(get(connectionStore)).toBe('connecting');
    });

    it('should handle state change to reconnecting', () => {
      mockSseService.__mockTriggerStateChange('reconnecting');
      
      expect(get(connectionStore)).toBe('reconnecting');
      expect(get(connectionStatsStore).reconnectAttempts).toBe(1);
    });

    it('should handle new comment event', () => {
      const testComment: Comment = {
        id: 'test-1',
        username: 'testuser',
        message: 'test message',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockSseService.__mockTriggerComment(testComment);
      
      const comments = get(commentStore);
      expect(comments).toHaveLength(1);
      expect(comments[0]).toEqual(testComment);
    });

    it('should handle comment history on initial connection', () => {
      const historyComments: Comment[] = [
        {
          id: 'history-1',
          username: 'user1',
          message: 'history message 1',
          timestamp: '2024-01-01T09:00:00Z'
        },
        {
          id: 'history-2',
          username: 'user2',
          message: 'history message 2',
          timestamp: '2024-01-01T08:00:00Z'
        }
      ];

      mockSseService.__mockTriggerCommentHistory(historyComments);
      
      const comments = get(commentStore);
      expect(comments).toHaveLength(2);
      // 新しい順でソートされていることを確認
      expect(comments[0].id).toBe('history-1');
      expect(comments[1].id).toBe('history-2');
    });

    it('should handle comment history on reconnection', () => {
      // 初回履歴
      const initialHistory: Comment[] = [
        {
          id: 'initial-1',
          username: 'user1',
          message: 'initial message',
          timestamp: '2024-01-01T09:00:00Z'
        }
      ];
      mockSseService.__mockTriggerCommentHistory(initialHistory);

      // 再接続時の履歴（新しいコメント追加）
      const reconnectHistory: Comment[] = [
        ...initialHistory,
        {
          id: 'reconnect-1',
          username: 'user2',
          message: 'reconnect message',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ];
      mockSseService.__mockTriggerCommentHistory(reconnectHistory);
      
      const comments = get(commentStore);
      expect(comments).toHaveLength(2);
      expect(comments[0].id).toBe('reconnect-1'); // 新しいのが先頭
    });
  });

  describe('utility methods', () => {
    it('should manually reconnect with delay', async () => {
      vi.useFakeTimers();
      
      manager.reconnect();
      
      expect(mockSseService.disconnect).toHaveBeenCalled();
      
      // 1秒後の再接続をシミュレート
      vi.advanceTimersByTime(1000);
      
      expect(mockSseService.connect).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should reset all state', () => {
      // 初期状態を設定
      const testComment: Comment = {
        id: 'test',
        username: 'user',
        message: 'message',
        timestamp: '2024-01-01T10:00:00Z'
      };
      commentStore.addComment(testComment);
      connectionStore.setState('connected');
      connectionStatsStore.onConnect();

      // リセット前の確認
      expect(get(commentStore)).toHaveLength(1);
      expect(get(connectionStore)).toBe('connected');
      expect(get(connectionStatsStore).totalConnections).toBe(1);

      // リセット実行
      manager.resetAll();

      // リセット後の確認
      expect(get(commentStore)).toEqual([]);
      expect(get(connectionStore)).toBe('disconnected');
      expect(get(connectionStatsStore).totalConnections).toBe(0);
      expect(mockSseService.disconnect).toHaveBeenCalled();
    });

    it('should destroy manager and cleanup resources', () => {
      manager.destroy();
      expect(mockSseService.destroy).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('should log connection events', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      manager.connect();
      mockSseService.__mockTriggerConnect();

      expect(consoleSpy).toHaveBeenCalledWith(
        'CommentSseManager: Starting connection'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'CommentSseManager: Connected to SSE'
      );

      consoleSpy.mockRestore();
    });

    it('should log comment events', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const testComment: Comment = {
        id: 'test',
        username: 'user',
        message: 'message',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockSseService.__mockTriggerComment(testComment);

      expect(consoleSpy).toHaveBeenCalledWith(
        'CommentSseManager: New comment received',
        testComment
      );

      consoleSpy.mockRestore();
    });
  });
});