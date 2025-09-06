import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommentApi } from './CommentApi';
import type { CommentRequest, CommentResponse, ApiError } from '../types/comment';

// Fetchのモック
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('CommentApi', () => {
  let api: CommentApi;

  beforeEach(() => {
    api = new CommentApi('http://test:8080');
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create with default base URL', () => {
      const defaultApi = new CommentApi();
      expect(defaultApi.getBaseUrl()).toBe('http://localhost:8080');
    });

    it('should create with custom base URL', () => {
      expect(api.getBaseUrl()).toBe('http://test:8080');
    });

    it('should remove trailing slash from base URL', () => {
      const apiWithSlash = new CommentApi('http://test:8080/');
      expect(apiWithSlash.getBaseUrl()).toBe('http://test:8080');
    });
  });

  describe('postComment - success cases', () => {
    it('should post comment successfully', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'test message'
      };

      const mockResponse: CommentResponse = {
        id: 'test-id-123',
        status: 'created',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.postComment(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResponse);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test:8080/api/comments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        }
      );
    });

    it('should handle valid edge case inputs', async () => {
      const request: CommentRequest = {
        username: 'u'.repeat(50), // 最大長
        message: 'm'.repeat(500)  // 最大長
      };

      const mockResponse: CommentResponse = {
        id: 'test-id',
        status: 'created',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.postComment(request);

      expect(result.success).toBe(true);
    });
  });

  describe('postComment - validation errors', () => {
    it('should reject empty username', async () => {
      const request: CommentRequest = {
        username: '',
        message: 'test message'
      };

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        expect(result.error.fieldErrors?.username).toBe('ユーザー名は必須です');
      }

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only username', async () => {
      const request: CommentRequest = {
        username: '   ',
        message: 'test message'
      };

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.fieldErrors?.username).toBe('ユーザー名は必須です');
      }
    });

    it('should reject empty message', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: ''
      };

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.fieldErrors?.message).toBe('メッセージは必須です');
      }
    });

    it('should reject username that is too long', async () => {
      const request: CommentRequest = {
        username: 'u'.repeat(51), // 51文字（制限50文字超）
        message: 'test message'
      };

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.fieldErrors?.username).toBe('ユーザー名は50文字以内で入力してください');
      }
    });

    it('should reject message that is too long', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'm'.repeat(501) // 501文字（制限500文字超）
      };

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.fieldErrors?.message).toBe('メッセージは500文字以内で入力してください');
      }
    });

    it('should collect multiple validation errors', async () => {
      const request: CommentRequest = {
        username: '', // 必須エラー
        message: 'm'.repeat(501) // 長さエラー
      };

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.fieldErrors?.username).toBe('ユーザー名は必須です');
        expect(result.error.fieldErrors?.message).toBe('メッセージは500文字以内で入力してください');
      }
    });
  });

  describe('postComment - server errors', () => {
    it('should handle 400 error with field errors from server', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'test message'
      };

      const serverError: ApiError = {
        timestamp: '2024-01-01T10:00:00Z',
        status: 400,
        error: 'Validation Error',
        message: '入力データに問題があります',
        path: '/api/comments',
        fieldErrors: {
          username: 'ユーザー名が不正です（サーバー判定）'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => serverError
      });

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        expect(result.error.fieldErrors?.username).toBe('ユーザー名が不正です（サーバー判定）');
      }
    });

    it('should handle 500 internal server error', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'test message'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('JSON parse failed');
        }
      });

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(500);
        expect(result.error.message).toBe('サーバー内部エラーが発生しました');
      }
    });

    it('should handle network error', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'test message'
      };

      mockFetch.mockRejectedValueOnce(new Error('Network failed'));

      const result = await api.postComment(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(0);
        expect(result.error.error).toBe('Network Error');
        expect(result.error.message).toBe('ネットワークエラーが発生しました。接続を確認してください。');
      }
    });
  });

  describe('concurrent posting prevention', () => {
    it('should prevent concurrent posts', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'test message'
      };

      // 最初の投稿を遅延させる
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ id: 'test-id', status: 'created', timestamp: '2024-01-01T10:00:00Z' })
          }), 100)
        )
      );

      // 同時に2回投稿を試行
      const promise1 = api.postComment(request);
      const promise2 = api.postComment(request); // これは即座に429エラーを返すべき

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error.status).toBe(429);
        expect(result2.error.message).toBe('投稿処理中です。しばらくお待ちください。');
      }
    });

    it('should reset posting state after completion', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'test message'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-id-1', status: 'created', timestamp: '2024-01-01T10:00:00Z' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-id-2', status: 'created', timestamp: '2024-01-01T10:01:00Z' })
      });

      // 最初の投稿
      const result1 = await api.postComment(request);
      expect(result1.success).toBe(true);

      // 投稿完了後なので2回目も成功するはず
      const result2 = await api.postComment(request);
      expect(result2.success).toBe(true);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('isPostingComment', () => {
    it('should return false initially', () => {
      expect(api.isPostingComment()).toBe(false);
    });

    it('should return true during posting', async () => {
      const request: CommentRequest = {
        username: 'testuser',
        message: 'test message'
      };

      let postingDuringRequest = false;

      mockFetch.mockImplementationOnce(async () => {
        postingDuringRequest = api.isPostingComment();
        return {
          ok: true,
          json: async () => ({ id: 'test-id', status: 'created', timestamp: '2024-01-01T10:00:00Z' })
        };
      });

      await api.postComment(request);

      expect(postingDuringRequest).toBe(true);
      expect(api.isPostingComment()).toBe(false); // 完了後はfalse
    });
  });

  describe('configuration', () => {
    it('should update base URL', () => {
      api.setBaseUrl('http://new-server:9000');
      expect(api.getBaseUrl()).toBe('http://new-server:9000');
    });

    it('should remove trailing slash when setting URL', () => {
      api.setBaseUrl('http://new-server:9000/');
      expect(api.getBaseUrl()).toBe('http://new-server:9000');
    });
  });

  describe('status message mapping', () => {
    const statusTests = [
      { status: 400, expectedMessage: '入力データに問題があります' },
      { status: 401, expectedMessage: '認証が必要です' },
      { status: 403, expectedMessage: 'アクセスが拒否されました' },
      { status: 404, expectedMessage: 'APIエンドポイントが見つかりません' },
      { status: 429, expectedMessage: '投稿頻度が高すぎます。しばらくお待ちください。' },
      { status: 500, expectedMessage: 'サーバー内部エラーが発生しました' },
      { status: 502, expectedMessage: 'サーバーが利用できません' },
      { status: 503, expectedMessage: 'サーバーが一時的に利用できません' },
      { status: 999, expectedMessage: 'エラーが発生しました (999)' }
    ];

    statusTests.forEach(({ status, expectedMessage }) => {
      it(`should map status ${status} correctly`, async () => {
        const request: CommentRequest = {
          username: 'testuser',
          message: 'test message'
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: `Status ${status}`,
          json: async () => {
            throw new Error('No JSON response');
          }
        });

        const result = await api.postComment(request);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(expectedMessage);
        }
      });
    });
  });
});