package com.example.sselearn.dto

import java.time.LocalDateTime
import java.util.UUID

/**
 * コメント投稿成功時のレスポンスDTO
 */
data class CommentResponse(
    val id: UUID,
    val status: String = "created",
    val timestamp: LocalDateTime
)