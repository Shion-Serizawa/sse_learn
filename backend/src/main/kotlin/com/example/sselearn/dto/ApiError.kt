package com.example.sselearn.dto

import java.time.LocalDateTime

/**
 * API統一エラーレスポンス形式
 * 全てのAPIエラーレスポンスはこの形式で返す
 */
data class ApiError(
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val status: Int,
    val error: String,
    val message: String,
    val path: String? = null,
    val fieldErrors: Map<String, String>? = null
)