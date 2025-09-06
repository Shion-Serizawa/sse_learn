package com.example.sselearn.controller

import com.example.sselearn.dto.CommentRequest
import com.example.sselearn.dto.CommentResponse
import com.example.sselearn.entity.Comment
import com.example.sselearn.exception.ValidationException
import com.example.sselearn.service.CommentService
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime
import java.util.UUID

/**
 * コメント投稿API用コントローラー
 * リアルタイムコメント機能のエンドポイントを提供
 */
@RestController
@RequestMapping("/api/comments")
class CommentController(
    private val commentService: CommentService
) {

    @PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    fun postComment(@RequestBody request: CommentRequest): ResponseEntity<CommentResponse> {
        // バリデーションエラーを収集
        val fieldErrors = mutableMapOf<String, String>()
        
        // 必須フィールドのバリデーション
        if (request.username.isNullOrBlank()) {
            fieldErrors["username"] = "ユーザー名は必須です"
        }
        if (request.message.isNullOrBlank()) {
            fieldErrors["message"] = "メッセージは必須です"
        }
        
        // 長さ制限バリデーション
        if (!request.username.isNullOrBlank() && request.username.length > 50) {
            fieldErrors["username"] = "ユーザー名は50文字以内で入力してください"
        }
        if (!request.message.isNullOrBlank() && request.message.length > 500) {
            fieldErrors["message"] = "メッセージは500文字以内で入力してください"
        }
        
        // バリデーションエラーがある場合は例外をスロー
        if (fieldErrors.isNotEmpty()) {
            throw ValidationException("入力データに問題があります", fieldErrors)
        }
        
        // バリデーション通過後、Commentエンティティを生成
        // バリデーション済みなのでnull安全キャストを使用
        val comment = Comment(
            id = UUID.randomUUID(),
            username = request.username!!,
            message = request.message!!,
            timestamp = LocalDateTime.now()
        )
        
        // CommentServiceに保存処理を委譲
        val savedComment = commentService.saveComment(comment)
        
        // 201と作成されたコメント情報を返す
        val response = CommentResponse(
            id = savedComment.id,
            timestamp = savedComment.timestamp
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }
}