package com.example.sselearn.service

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

/**
 * SSE接続とブロードキャスト機能を管理するサービス
 */
@Service
class SseService {

    companion object {
        private val logger = LoggerFactory.getLogger(SseService::class.java)
        private const val DEFAULT_TIMEOUT_MS = 300_000L // 5分 (ライブ配信視聴用)
    }

    // アクティブな接続を管理（スレッドセーフ）
    private val activeConnections = CopyOnWriteArrayList<SseEmitter>()

    /**
     * 新しいSSE接続を作成して管理下に追加
     */
    fun createConnection(): SseEmitter {
        val emitter = SseEmitter(DEFAULT_TIMEOUT_MS)
        
        // 接続終了時のクリーンアップを設定
        emitter.onCompletion { 
            removeConnection(emitter)
            logger.debug("SSE接続が正常に終了しました")
        }
        
        emitter.onTimeout {
            removeConnection(emitter)
            logger.debug("SSE接続がタイムアウトしました")
        }
        
        emitter.onError { throwable ->
            removeConnection(emitter)
            logger.warn("SSE接続でエラーが発生しました", throwable)
        }
        
        activeConnections.add(emitter)
        logger.debug("新しいSSE接続を作成しました。アクティブ接続数: {}", activeConnections.size)
        
        return emitter
    }

    /**
     * 全ての接続にメッセージをブロードキャスト
     */
    fun broadcastToAll(eventName: String? = null, data: Any) {
        if (activeConnections.isEmpty()) {
            logger.debug("ブロードキャスト対象の接続がありません")
            return
        }

        val deadConnections = mutableListOf<SseEmitter>()
        
        activeConnections.forEach { emitter ->
            try {
                val event = SseEmitter.event().data(data)
                if (eventName != null) {
                    event.name(eventName)
                }
                emitter.send(event)
            } catch (e: Exception) {
                logger.warn("ブロードキャスト中にエラーが発生しました", e)
                deadConnections.add(emitter)
            }
        }
        
        // エラーが発生した接続を削除
        deadConnections.forEach { removeConnection(it) }
        
        logger.debug("{}個の接続にブロードキャストしました", activeConnections.size - deadConnections.size)
    }

    /**
     * アクティブな接続数を取得
     */
    fun getActiveConnectionCount(): Int {
        return activeConnections.size
    }

    /**
     * 接続を管理リストから削除
     */
    private fun removeConnection(emitter: SseEmitter) {
        if (activeConnections.remove(emitter)) {
            logger.debug("SSE接続を削除しました。アクティブ接続数: {}", activeConnections.size)
        }
    }

    /**
     * 全ての接続を強制終了（アプリケーション終了時など）
     */
    fun closeAllConnections() {
        val connectionCount = activeConnections.size
        activeConnections.forEach { emitter ->
            try {
                emitter.complete()
            } catch (e: Exception) {
                logger.warn("接続終了時にエラーが発生しました", e)
            }
        }
        activeConnections.clear()
        logger.info("{}個のSSE接続を全て終了しました", connectionCount)
    }

    /**
     * Keep-Aliveハートビート送信（4分間隔）
     * 5分タイムアウトの前に生存確認を送信して接続維持
     */
    @Scheduled(fixedRate = 240_000) // 4分間隔
    fun sendKeepAlive() {
        if (activeConnections.isEmpty()) {
            return
        }
        
        logger.debug("Keep-Aliveハートビートを送信中...アクティブ接続数: {}", activeConnections.size)
        broadcastToAll("ping", mapOf(
            "type" to "keep-alive",
            "timestamp" to System.currentTimeMillis(),
            "activeConnections" to activeConnections.size
        ))
    }
}