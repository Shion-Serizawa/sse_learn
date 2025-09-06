package com.example.sselearn.controller

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * コメント投稿API用コントローラー
 * リアルタイムコメント機能のエンドポイントを提供
 */
@RestController
@RequestMapping("/api/comments")
class CommentController {

    @PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    fun postComment(@RequestBody body: String): ResponseEntity<String> {
        // 空のリクエストまたは空のJSONの場合は400エラーを返す
        if (body.isBlank() || body.trim() == "{}") {
            return ResponseEntity.badRequest().body("Bad Request")
        }
        
        // 有効なJSONの場合は201とコメントIDを返す（最小限の実装）
        val commentId = UUID.randomUUID()
        return ResponseEntity.status(HttpStatus.CREATED)
            .body("""{"id":"$commentId","status":"created"}""")
    }
}