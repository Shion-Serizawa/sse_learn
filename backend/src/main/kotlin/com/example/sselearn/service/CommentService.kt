package com.example.sselearn.service

import com.example.sselearn.entity.Comment
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap
import java.util.UUID

/**
 * コメント管理サービス
 * コメントのCRUD操作とメモリストレージを管理
 */
@Service
class CommentService(
    private val sseService: SseService
) {

    companion object {
        private val logger = LoggerFactory.getLogger(CommentService::class.java)
    }

    // スレッドセーフなメモリストレージ
    private val comments = ConcurrentHashMap<UUID, Comment>()

    /**
     * コメントを保存する
     */
    fun saveComment(comment: Comment): Comment {
        comments[comment.id] = comment
        logger.debug("コメントを保存しました: id={}, username={}", comment.id, comment.username)
        
        // 保存後にSSE経由で全クライアントに配信
        sseService.broadcastToAll("comment", comment)
        logger.debug("コメントをSSE配信しました: id={}", comment.id)
        
        return comment
    }

    /**
     * 保存されたコメント数を取得
     */
    fun getCommentCount(): Int {
        return comments.size
    }

    /**
     * IDでコメントを取得する
     */
    fun findById(id: UUID): Comment? {
        return comments[id]
    }
    
    /**
     * 全てのコメントを取得する（投稿順）
     */
    fun findAll(): List<Comment> {
        return comments.values.sortedBy { it.timestamp }
    }
    
    /**
     * 直近のコメントを指定件数取得する（新しい順）
     */
    fun findRecent(limit: Int): List<Comment> {
        return comments.values
            .sortedByDescending { it.timestamp }
            .take(limit)
    }
    
    /**
     * 全てのコメントをクリア（テスト用）
     */
    fun clearAll() {
        comments.clear()
    }
}