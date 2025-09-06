package com.example.sselearn.controller

import com.example.sselearn.service.CommentService
import org.slf4j.LoggerFactory
import org.springframework.core.env.Environment
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import com.example.sselearn.service.SseService

/**
 * SSE（Server-Sent Events）用コントローラー
 * リアルタイムデータストリーミングのエンドポイントを提供
 */
@RestController
@RequestMapping("/api/sse")
class SseController(
    private val sseService: SseService,
    private val commentService: CommentService,
    private val environment: Environment
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(SseController::class.java)
        private const val DEFAULT_HISTORY_LIMIT = 10
    }

    /**
     * コメントストリーミング用エンドポイント
     * クライアントがコメントストリームに接続する際のエンドポイント
     */
    @GetMapping("/comments", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun getCommentsStream(): SseEmitter {
        val activeProfiles = environment.activeProfiles
        val emitter = sseService.createConnection()
        
        // 接続確立時に初期化イベントを送信
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("コメントストリームに接続しました"))
            
            // 既存コメント履歴（直近N件）を送信
            val recentComments = commentService.findRecent(DEFAULT_HISTORY_LIMIT)
            if (recentComments.isNotEmpty()) {
                emitter.send(SseEmitter.event()
                    .name("comment-history")
                    .data(recentComments))
                logger.debug("コメント履歴を送信しました: {}件 (最大{}件)", recentComments.size, DEFAULT_HISTORY_LIMIT)
            } else {
                logger.debug("送信する履歴コメントはありません")
            }
            
            // テスト環境では接続を即座に完了（テストハング防止）
            if (activeProfiles.contains("test")) {
                emitter.complete()
            }
        } catch (e: Exception) {
            logger.warn("SSE接続初期化中にエラーが発生しました", e)
            emitter.completeWithError(e)
        }
        
        return emitter
    }
}