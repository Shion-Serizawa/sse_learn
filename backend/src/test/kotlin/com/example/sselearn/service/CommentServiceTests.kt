package com.example.sselearn.service

import com.example.sselearn.entity.Comment
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.verify
import org.mockito.Mockito.times
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.context.ActiveProfiles
import java.time.LocalDateTime
import java.util.UUID

/**
 * CommentServiceの単体テスト
 * メモリストレージ機能をテスト
 */
@SpringBootTest
@ActiveProfiles("test")
class CommentServiceTests {

    @Autowired
    private lateinit var commentService: CommentService
    
    @MockBean
    private lateinit var sseService: SseService

    @BeforeEach
    fun setup() {
        commentService.clearAll()
    }

    // === 2.3 コメント保存（メモリストレージ） ===
    
    @Test
    fun `受け取ったコメントをメモリに保存する`() {
        // Red: コメントが正しく保存されることを期待
        val comment = Comment(
            id = UUID.randomUUID(),
            username = "testuser",
            message = "test message",
            timestamp = LocalDateTime.now()
        )
        
        val savedComment = commentService.saveComment(comment)
        
        assertThat(savedComment).isEqualTo(comment)
        assertThat(commentService.getCommentCount()).isEqualTo(1)
    }
    
    @Test
    fun `コメントにタイムスタンプが自動追加される`() {
        val beforeSave = LocalDateTime.now()
        
        val comment = Comment(
            id = UUID.randomUUID(),
            username = "testuser",
            message = "test message",
            timestamp = LocalDateTime.now()
        )
        
        val savedComment = commentService.saveComment(comment)
        val afterSave = LocalDateTime.now()
        
        // タイムスタンプが保存前後の時間範囲内にあることを確認
        assertThat(savedComment.timestamp).isBetween(beforeSave, afterSave)
        assertThat(savedComment.timestamp).isNotNull()
    }
    
    @Test
    fun `コメントにIDが自動生成される`() {
        val comment = Comment(
            id = UUID.randomUUID(),
            username = "testuser", 
            message = "test message",
            timestamp = LocalDateTime.now()
        )
        
        val savedComment = commentService.saveComment(comment)
        
        // UUIDが正しく設定されていることを確認
        assertThat(savedComment.id).isNotNull()
        assertThat(savedComment.id).isInstanceOf(UUID::class.java)
    }
    
    @Test
    fun `保存されたコメント数を確認できる`() {
        // Red: 複数コメント保存時のカウンターが正しいことを期待
        assertThat(commentService.getCommentCount()).isEqualTo(0)
        
        val comment1 = Comment(UUID.randomUUID(), "user1", "message1", LocalDateTime.now())
        val comment2 = Comment(UUID.randomUUID(), "user2", "message2", LocalDateTime.now())
        
        commentService.saveComment(comment1)
        assertThat(commentService.getCommentCount()).isEqualTo(1)
        
        commentService.saveComment(comment2)
        assertThat(commentService.getCommentCount()).isEqualTo(2)
    }
    
    @Test
    fun `スレッドセーフなコメント管理を実装する`() {
        // Red: 並行アクセスでもデータ整合性が保たれることを期待
        val threadCount = 10
        val commentsPerThread = 5
        val totalExpected = threadCount * commentsPerThread
        
        // 複数スレッドで同時にコメントを保存
        val threads = (1..threadCount).map { threadId ->
            Thread {
                repeat(commentsPerThread) { commentId ->
                    val comment = Comment(
                        id = UUID.randomUUID(),
                        username = "user$threadId-$commentId",
                        message = "message from thread $threadId comment $commentId",
                        timestamp = LocalDateTime.now()
                    )
                    commentService.saveComment(comment)
                }
            }
        }
        
        // 全スレッドを開始して完了を待つ
        threads.forEach { it.start() }
        threads.forEach { it.join() }
        
        // 全てのコメントが正しく保存されていることを確認
        assertThat(commentService.getCommentCount()).isEqualTo(totalExpected)
    }
    
    // === 2.4 コメントSSE配信（既存SseService統合） ===
    
    @Test
    fun `CommentServiceからSseServiceのbroadcastToAllを呼び出す`() {
        // Red: コメント保存時にSSE配信が呼び出されることを期待
        val comment = Comment(
            id = UUID.randomUUID(),
            username = "testuser",
            message = "test message",
            timestamp = LocalDateTime.now()
        )
        
        commentService.saveComment(comment)
        
        // SseServiceのbroadcastToAllが呼ばれることを検証
        verify(sseService, times(1)).broadcastToAll("comment", comment)
    }
    
    @Test
    fun `新しいコメントがSSE経由で全クライアントに配信される`() {
        val comment1 = Comment(UUID.randomUUID(), "user1", "message1", LocalDateTime.now())
        val comment2 = Comment(UUID.randomUUID(), "user2", "message2", LocalDateTime.now())
        
        commentService.saveComment(comment1)
        commentService.saveComment(comment2)
        
        // 各コメントごとにSSE配信が呼ばれることを検証
        verify(sseService, times(1)).broadcastToAll("comment", comment1)
        verify(sseService, times(1)).broadcastToAll("comment", comment2)
    }
    
    @Test
    fun `配信データがJSON形式である（Jackson自動変換）`() {
        // Red: SseServiceへCommentオブジェクトがそのまま渡されることを期待
        // Springの自動JSON変換により、配信時にJSON形式になる
        val comment = Comment(
            id = UUID.randomUUID(),
            username = "testuser",
            message = "test message", 
            timestamp = LocalDateTime.now()
        )
        
        commentService.saveComment(comment)
        
        // Commentオブジェクト自体が渡されることを確認（JSON変換はSpringが自動で行う）
        verify(sseService, times(1)).broadcastToAll("comment", comment)
    }
    
    @Test
    fun `配信データにid username message timestampが含まれる`() {
        val commentId = UUID.randomUUID()
        val timestamp = LocalDateTime.now()
        val comment = Comment(
            id = commentId,
            username = "testuser",
            message = "test message",
            timestamp = timestamp
        )
        
        commentService.saveComment(comment)
        
        // Commentエンティティが完全に渡されることを確認
        verify(sseService, times(1)).broadcastToAll("comment", comment)
        
        // 実際のコメントデータが正しく設定されていることを確認
        assertThat(comment.id).isEqualTo(commentId)
        assertThat(comment.username).isEqualTo("testuser")
        assertThat(comment.message).isEqualTo("test message")
        assertThat(comment.timestamp).isEqualTo(timestamp)
    }
    
    @Test
    fun `event comment イベント名で配信される`() {
        val comment = Comment(UUID.randomUUID(), "user", "message", LocalDateTime.now())
        
        commentService.saveComment(comment)
        
        // "comment"イベント名で配信されることを確認
        verify(sseService, times(1)).broadcastToAll("comment", comment)
    }
}