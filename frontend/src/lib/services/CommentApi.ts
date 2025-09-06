import type { 
  CommentRequest, 
  CommentResponse, 
  ApiError, 
  CommentPostResult 
} from '../types/comment';

/**
 * コメント投稿APIクライアント
 * バックエンドの /api/comments エンドポイントとの通信を管理
 */
export class CommentApi {
  private baseUrl: string;
  private isPosting = false;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * コメントを投稿する
   * @param request コメント投稿リクエスト
   * @returns 投稿結果（成功時はCommentResponse、失敗時はApiError）
   */
  async postComment(request: CommentRequest): Promise<CommentPostResult> {
    if (this.isPosting) {
      return {
        success: false,
        error: {
          timestamp: new Date().toISOString(),
          status: 429,
          error: 'Too Many Requests',
          message: '投稿処理中です。しばらくお待ちください。',
          path: '/api/comments'
        }
      };
    }

    // バリデーション
    const validationError = this.validateRequest(request);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    this.isPosting = true;

    try {
      console.log('CommentApi: Posting comment', { 
        username: request.username, 
        messageLength: request.message.length 
      });

      const response = await fetch(`${this.baseUrl}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        console.error('CommentApi: Post failed', errorData);
        return {
          success: false,
          error: errorData
        };
      }

      const data: CommentResponse = await response.json();
      console.log('CommentApi: Post successful', data);
      
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('CommentApi: Network error', error);
      
      return {
        success: false,
        error: {
          timestamp: new Date().toISOString(),
          status: 0,
          error: 'Network Error',
          message: 'ネットワークエラーが発生しました。接続を確認してください。',
          path: '/api/comments'
        }
      };
    } finally {
      this.isPosting = false;
    }
  }

  /**
   * 投稿中かどうかを判定
   */
  isPostingComment(): boolean {
    return this.isPosting;
  }

  /**
   * リクエストのクライアントサイドバリデーション
   */
  private validateRequest(request: CommentRequest): ApiError | null {
    const fieldErrors: Record<string, string> = {};

    // 必須フィールドチェック
    if (!request.username || request.username.trim() === '') {
      fieldErrors.username = 'ユーザー名は必須です';
    }

    if (!request.message || request.message.trim() === '') {
      fieldErrors.message = 'メッセージは必須です';
    }

    // 文字数制限チェック（バックエンドと同じ制限）
    if (request.username && request.username.length > 50) {
      fieldErrors.username = 'ユーザー名は50文字以内で入力してください';
    }

    if (request.message && request.message.length > 500) {
      fieldErrors.message = 'メッセージは500文字以内で入力してください';
    }

    // エラーがある場合はApiErrorを返す
    if (Object.keys(fieldErrors).length > 0) {
      return {
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Validation Error',
        message: '入力データに問題があります',
        path: '/api/comments',
        fieldErrors
      };
    }

    return null;
  }

  /**
   * エラーレスポンスをパースする
   */
  private async parseErrorResponse(response: Response): Promise<ApiError> {
    try {
      const errorData = await response.json() as ApiError;
      
      // バックエンドからのエラーレスポンスを返す
      return {
        timestamp: errorData.timestamp || new Date().toISOString(),
        status: response.status,
        error: errorData.error || response.statusText,
        message: errorData.message || 'サーバーエラーが発生しました',
        path: errorData.path || '/api/comments',
        fieldErrors: errorData.fieldErrors
      };
      
    } catch (parseError) {
      // JSONパースに失敗した場合のフォールバック
      console.warn('CommentApi: Failed to parse error response', parseError);
      
      return {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText,
        message: this.getStatusMessage(response.status),
        path: '/api/comments'
      };
    }
  }

  /**
   * HTTPステータスコードに応じたメッセージを取得
   */
  private getStatusMessage(status: number): string {
    switch (status) {
      case 400:
        return '入力データに問題があります';
      case 401:
        return '認証が必要です';
      case 403:
        return 'アクセスが拒否されました';
      case 404:
        return 'APIエンドポイントが見つかりません';
      case 429:
        return '投稿頻度が高すぎます。しばらくお待ちください。';
      case 500:
        return 'サーバー内部エラーが発生しました';
      case 502:
        return 'サーバーが利用できません';
      case 503:
        return 'サーバーが一時的に利用できません';
      default:
        return `エラーが発生しました (${status})`;
    }
  }

  /**
   * APIクライアントの設定を変更
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * 現在のベースURLを取得
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}