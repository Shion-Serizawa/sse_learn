package com.example.sselearn.exception

/**
 * バリデーションエラー専用例外
 * フィールド別のエラーメッセージを管理
 */
class ValidationException(
    message: String,
    val fieldErrors: Map<String, String> = emptyMap()
) : RuntimeException(message)