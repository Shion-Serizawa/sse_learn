package com.example.sselearn.exception

import com.example.sselearn.dto.ApiError
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.context.request.WebRequest
import java.time.LocalDateTime

/**
 * グローバルエラーハンドラー
 * 全てのAPIエンドポイントで統一されたエラーレスポンス形式を提供
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    companion object {
        private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    }

    /**
     * 不正なContent-Typeのハンドリング
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException::class)
    fun handleMediaTypeNotSupported(
        ex: HttpMediaTypeNotSupportedException,
        request: WebRequest
    ): ResponseEntity<ApiError> {
        val error = ApiError(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
            error = "Unsupported Media Type",
            message = "Content-Type 'application/json' が必要です",
            path = request.getDescription(false).removePrefix("uri=")
        )
        
        logger.warn("不正なContent-Type: {}", ex.contentType)
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(error)
    }

    /**
     * バリデーションエラーのハンドリング
     */
    @ExceptionHandler(ValidationException::class)
    fun handleValidationException(
        ex: ValidationException,
        request: WebRequest
    ): ResponseEntity<ApiError> {
        val error = ApiError(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Validation Error",
            message = ex.message ?: "バリデーションエラーが発生しました",
            path = request.getDescription(false).removePrefix("uri="),
            fieldErrors = if (ex.fieldErrors.isNotEmpty()) ex.fieldErrors else null
        )
        
        logger.warn("バリデーションエラー: {} - 対象フィールド: {}", ex.message, ex.fieldErrors.keys)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    /**
     * 一般的な例外のハンドリング
     */
    @ExceptionHandler(Exception::class)
    fun handleGeneralException(
        ex: Exception,
        request: WebRequest
    ): ResponseEntity<ApiError> {
        val error = ApiError(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = "Internal Server Error",
            message = "サーバー内部エラーが発生しました",
            path = request.getDescription(false).removePrefix("uri=")
        )
        
        logger.error("サーバー内部エラー", ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error)
    }
}