package com.example.sselearn.dto

/**
 * コメント投稿リクエストのデータ構造
 */
data class CommentRequest(
    val username: String?,
    val message: String?
)