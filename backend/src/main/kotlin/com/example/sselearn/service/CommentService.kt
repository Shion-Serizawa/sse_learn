package com.example.sselearn.service

import com.example.sselearn.entity.Comment
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap
import java.util.UUID

/**
 * コメント管理サービス
 * コメントのCRUD操作とメモリストレージを管理
 */
@Service
class CommentService {

    // スレッドセーフなメモリストレージ
    private val comments = ConcurrentHashMap<UUID, Comment>()

    /**
     * コメントを保存する
     */
    fun saveComment(comment: Comment): Comment {
        comments[comment.id] = comment
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
     * 全てのコメントをクリア（テスト用）
     */
    fun clearAll() {
        comments.clear()
    }
}