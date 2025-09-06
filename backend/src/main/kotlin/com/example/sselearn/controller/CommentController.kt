package com.example.sselearn.controller

import com.example.sselearn.dto.CommentRequest
import com.example.sselearn.entity.Comment
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
class CommentController {

    @PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    fun postComment(@RequestBody request: CommentRequest): ResponseEntity<String> {
        // 必須フィールドのバリデーション
        if (request.username.isNullOrBlank() || request.message.isNullOrBlank()) {
            return ResponseEntity.badRequest().body("Bad Request: username and message are required")
        }
        
        // 長さ制限バリデーション
        if (request.username.length > 50) {
            return ResponseEntity.badRequest().body("Bad Request: username too long (max 50 characters)")
        }
        if (request.message.length > 500) {
            return ResponseEntity.badRequest().body("Bad Request: message too long (max 500 characters)")
        }
        
        // バリデーション通過後、Commentエンティティを生成
        val comment = Comment(
            id = UUID.randomUUID(),
            username = request.username,
            message = request.message,
            timestamp = LocalDateTime.now()
        )
        
        // TODO: 将来的にはCommentServiceに保存処理を委譲する
        // 現在は最小限の実装として、エンティティ生成のみ実行
        
        // 201と作成されたコメント情報を返す
        return ResponseEntity.status(HttpStatus.CREATED)
            .body("""{"id":"${comment.id}","status":"created","timestamp":"${comment.timestamp}"}""")
    }
}