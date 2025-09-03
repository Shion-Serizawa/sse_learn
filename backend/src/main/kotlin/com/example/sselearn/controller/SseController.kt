package com.example.sselearn.controller

import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

/**
 * SSE（Server-Sent Events）用コントローラー
 * リアルタイムデータストリーミングのエンドポイントを提供
 */
@RestController
@RequestMapping("/api/sse")
class SseController {

    /**
     * コメントストリーミング用エンドポイント
     * TODO: 後でSseEmitterに変更予定
     */
    @GetMapping("/comments", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun getCommentsStream(): ResponseEntity<SseEmitter> {
        val emitter = SseEmitter()
        emitter.complete()
        
        return ResponseEntity.ok()
            .header("Cache-Control", "no-cache")
            .header("Connection", "keep-alive")
            .contentType(MediaType.TEXT_EVENT_STREAM)
            .body(emitter)
    }
}