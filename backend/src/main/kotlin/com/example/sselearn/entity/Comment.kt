package com.example.sselearn.entity

import java.time.LocalDateTime
import java.util.UUID

/**
 * コメントエンティティ
 * コメント投稿時に生成される内部データ構造
 */
data class Comment(
    val id: UUID,
    val username: String,
    val message: String,
    val timestamp: LocalDateTime
)