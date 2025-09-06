/**
 * コメント関連の型定義
 * バックエンドAPI仕様に対応
 */

/**
 * コメントエンティティ（バックエンドComment.ktに対応）
 */
export interface Comment {
  id: string;
  username: string;
  message: string;
  timestamp: string; // ISO 8601文字列形式
}

/**
 * コメント投稿リクエスト（バックエンドCommentRequest.ktに対応）
 */
export interface CommentRequest {
  username: string;
  message: string;
}

/**
 * コメント投稿レスポンス（バックエンドCommentResponse.ktに対応）
 */
export interface CommentResponse {
  id: string;
  status: string;
  timestamp: string; // ISO 8601文字列形式
}

/**
 * APIエラーレスポンス（バックエンドApiError.ktに対応）
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

/**
 * コメント投稿の結果
 */
export type CommentPostResult = 
  | { success: true; data: CommentResponse }
  | { success: false; error: ApiError };