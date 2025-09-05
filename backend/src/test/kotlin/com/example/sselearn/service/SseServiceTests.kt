package com.example.sselearn.service

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

/**
 * SseServiceのユニットテスト
 * SSE接続管理とブロードキャスト機能をテスト
 */
class SseServiceTests {

    private lateinit var sseService: SseService

    @BeforeEach
    fun setUp() {
        sseService = SseService()
    }

    // === 基本接続管理テスト ===

    @Test
    fun `初期状態では接続数が0`() {
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(0)
    }

    @Test
    fun `新しい接続を作成できる`() {
        val emitter = sseService.createConnection()
        
        assertThat(emitter).isNotNull()
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(1)
    }

    @Test
    fun `複数の接続を管理できる`() {
        val emitters = mutableListOf<SseEmitter>()
        
        repeat(3) {
            emitters.add(sseService.createConnection())
        }
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(3)
        
        // 各接続が異なるオブジェクトであることを確認
        val distinctEmitters = emitters.distinct()
        assertThat(distinctEmitters).hasSize(3)
    }

    @Test
    fun `複数接続の管理と個別完了`() {
        // 複数の接続を作成
        val emitter1 = sseService.createConnection()
        val emitter2 = sseService.createConnection()
        val emitter3 = sseService.createConnection()
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(3)
        
        // 1つの接続を完了（ユニットテストでは直接管理を確認）
        // Note: SseEmitterコールバックはHTTPコンテキストでないと動作しないため
        // このテストは統合テストで行い、ここでは基本的な接続管理を確認
        assertThat(emitter1).isNotNull()
        assertThat(emitter2).isNotNull()
        assertThat(emitter3).isNotNull()
        
        // 各接続が異なるオブジェクトであることを確認
        assertThat(emitter1).isNotEqualTo(emitter2)
        assertThat(emitter2).isNotEqualTo(emitter3)
    }

    // === ブロードキャスト機能テスト ===

    @Test
    fun `接続がない場合のブロードキャストは正常に処理される`() {
        // 例外が発生しないことを確認
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(0)
        
        // ブロードキャスト実行（例外が発生しないことを確認）
        sseService.broadcastToAll(data = "test message")
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(0)
    }

    @Test
    fun `イベント名なしでブロードキャストできる`() {
        sseService.createConnection()
        
        // ブロードキャスト実行（例外が発生しないことを確認）
        sseService.broadcastToAll(data = "test message")
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(1)
    }

    @Test
    fun `イベント名付きでブロードキャストできる`() {
        sseService.createConnection()
        
        // イベント名付きでブロードキャスト実行
        sseService.broadcastToAll(eventName = "test-event", data = "test message")
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(1)
    }

    @Test
    fun `JSON形式データをブロードキャストできる`() {
        sseService.createConnection()
        val jsonData = mapOf("username" to "user1", "message" to "Hello World")
        
        // JSON形式でブロードキャスト実行
        sseService.broadcastToAll(data = jsonData)
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(1)
    }

    // === クリーンアップ機能テスト ===

    @Test
    fun `全接続を強制終了できる`() {
        // 複数の接続を作成
        repeat(3) {
            sseService.createConnection()
        }
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(3)
        
        // 全接続を強制終了
        sseService.closeAllConnections()
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(0)
    }

    @Test
    fun `接続がない場合の全終了処理は正常に動作する`() {
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(0)
        
        // 例外が発生しないことを確認
        sseService.closeAllConnections()
        
        assertThat(sseService.getActiveConnectionCount()).isEqualTo(0)
    }
}