import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SseService } from './SseService';
import type { Comment } from '../types/comment';

// EventSource のモック
class MockEventSource {
  url: string;
  readyState: number = EventSource.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: Map<string, ((event: MessageEvent) => void)[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(event: MessageEvent) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
    return true;
  }

  close() {
    this.readyState = EventSource.CLOSED;
  }

  // テスト用ヘルパーメソッド
  simulateOpen() {
    this.readyState = EventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateMessage(type: string, data: string) {
    const event = new MessageEvent(type, { data });
    this.dispatchEvent(event);
  }
}

// グローバルのEventSourceをモック
vi.stubGlobal('EventSource', MockEventSource);

describe('SseService', () => {
  let service: SseService;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    service = new SseService('/api/sse/comments');
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(service.getState()).toBe('disconnected');
      expect(service.isConnected()).toBe(false);
    });

    it('should create with custom config', () => {
      const customService = new SseService('/custom', {
        maxReconnectAttempts: 5,
        reconnectInterval: 2000
      });
      expect(customService.getState()).toBe('disconnected');
      customService.destroy();
    });
  });

  describe('connect', () => {
    it('should establish SSE connection', () => {
      const onStateChange = vi.fn();
      service.onStateChange(onStateChange);

      service.connect();

      expect(onStateChange).toHaveBeenCalledWith('connecting');
      expect(service.getState()).toBe('connecting');
    });

    it('should not connect if already connected', () => {
      const onStateChange = vi.fn();
      service.onStateChange(onStateChange);

      // 最初の接続
      service.connect();
      onStateChange.mockClear();

      // 2回目の接続試行
      service.connect();

      // 状態変更が呼ばれないことを確認
      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect and cleanup', () => {
      const onStateChange = vi.fn();
      service.onStateChange(onStateChange);

      service.connect();
      service.disconnect();

      expect(onStateChange).toHaveBeenCalledWith('disconnected');
      expect(service.getState()).toBe('disconnected');
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      service.connect();
      // connectメソッド内で作成されたEventSourceを取得
      mockEventSource = (service as any).eventSource as MockEventSource;
    });

    it('should handle connection success', () => {
      const onConnect = vi.fn();
      const onStateChange = vi.fn();
      
      service.onConnect(onConnect);
      service.onStateChange(onStateChange);

      mockEventSource.simulateOpen();

      expect(onConnect).toHaveBeenCalled();
      expect(onStateChange).toHaveBeenCalledWith('connected');
      expect(service.isConnected()).toBe(true);
    });

    it('should handle connection error', () => {
      const onError = vi.fn();
      service.onError(onError);

      mockEventSource.simulateError();

      expect(onError).toHaveBeenCalled();
    });

    it('should handle comment event', () => {
      const onComment = vi.fn();
      service.onComment(onComment);

      const testComment: Comment = {
        id: 'test-id',
        username: 'testuser',
        message: 'test message',
        timestamp: '2024-01-01T00:00:00Z'
      };

      mockEventSource.simulateMessage('comment', JSON.stringify(testComment));

      expect(onComment).toHaveBeenCalledWith(testComment);
    });

    it('should handle comment-history event', () => {
      const onCommentHistory = vi.fn();
      service.onCommentHistory(onCommentHistory);

      const testComments: Comment[] = [
        {
          id: 'test-id-1',
          username: 'user1',
          message: 'message 1',
          timestamp: '2024-01-01T00:00:00Z'
        },
        {
          id: 'test-id-2',
          username: 'user2',
          message: 'message 2',
          timestamp: '2024-01-01T00:01:00Z'
        }
      ];

      mockEventSource.simulateMessage('comment-history', JSON.stringify(testComments));

      expect(onCommentHistory).toHaveBeenCalledWith(testComments);
    });

    it('should handle invalid JSON gracefully', () => {
      const onComment = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      service.onComment(onComment);

      mockEventSource.simulateMessage('comment', 'invalid-json');

      expect(onComment).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'SseService: Failed to parse comment data:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle connected event from server', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockEventSource.simulateMessage('connected', 'コメントストリームに接続しました');

      expect(consoleSpy).toHaveBeenCalledWith(
        'SseService: Server connection confirmed:',
        'コメントストリームに接続しました'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handler configuration', () => {
    it('should set multiple handlers at once', () => {
      const handlers = {
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onComment: vi.fn(),
        onCommentHistory: vi.fn(),
        onError: vi.fn(),
        onStateChange: vi.fn()
      };

      service.setHandlers(handlers);

      // 各ハンドラーが正しく設定されていることを確認
      service.connect();
      mockEventSource = (service as any).eventSource as MockEventSource;
      
      mockEventSource.simulateOpen();
      expect(handlers.onConnect).toHaveBeenCalled();
      expect(handlers.onStateChange).toHaveBeenCalledWith('connected');
    });
  });

  describe('state management', () => {
    it('should maintain correct state transitions', () => {
      const states: string[] = [];
      service.onStateChange((state) => states.push(state));

      // disconnected -> connecting
      service.connect();
      mockEventSource = (service as any).eventSource as MockEventSource;

      // connecting -> connected
      mockEventSource.simulateOpen();

      // connected -> disconnected
      service.disconnect();

      expect(states).toEqual(['connecting', 'connected', 'disconnected']);
    });
  });

  describe('destroy', () => {
    it('should cleanup all resources', () => {
      const onConnect = vi.fn();
      service.onConnect(onConnect);
      
      service.connect();
      service.destroy();

      expect(service.getState()).toBe('disconnected');
      expect(service.isConnected()).toBe(false);
    });
  });
});