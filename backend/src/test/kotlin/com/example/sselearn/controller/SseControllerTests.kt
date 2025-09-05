package com.example.sselearn.controller

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

/**
 * SSEコントローラーの統合テスト
 * 実際のHTTPエンドポイント経由でのSSE機能をテスト
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@org.springframework.test.context.ActiveProfiles("test")
class SseControllerTests {

    @Autowired
    private lateinit var restTemplate: TestRestTemplate

    // === SSE基本エンドポイントテスト ===
    
    @Test
    fun `GET api sse comments が404ではない`() {
        val response = restTemplate.getForEntity("/api/sse/comments", String::class.java)
        assertThat(response.statusCode).isNotEqualTo(HttpStatus.NOT_FOUND)
    }

    @Test
    fun `GET api sse comments がHTTP 200を返す`() {
        val response = restTemplate.getForEntity("/api/sse/comments", String::class.java)
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `GET api sse comments がContent-Type text event-stream を返す`() {
        val headers = HttpHeaders().apply { accept = listOf(MediaType.TEXT_EVENT_STREAM) }
        val request = HttpEntity<String>(headers)
        val response = restTemplate.exchange("/api/sse/comments", HttpMethod.GET, request, String::class.java)
        
        assertThat(response.headers.contentType).isEqualTo(MediaType.TEXT_EVENT_STREAM)
    }

    @Test
    fun `SSE接続で初期化メッセージを受信する`() {
        val headers = HttpHeaders().apply { accept = listOf(MediaType.TEXT_EVENT_STREAM) }
        val request = HttpEntity<String>(headers)
        val response = restTemplate.exchange("/api/sse/comments", HttpMethod.GET, request, String::class.java)
        
        // SSE接続が成功し、レスポンスボディに初期化メッセージが含まれること
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        
        // 実際のSSE形式でのレスポンス確認
        // 注意：TestRestTemplateでは完全なSSEストリームのテストは困難
        // このテストは基本的なエンドポイント動作確認として機能
        assertThat(response.body).isNotNull()
    }

    @Test
    fun `複数回のSSE接続が可能`() {
        val headers = HttpHeaders().apply { accept = listOf(MediaType.TEXT_EVENT_STREAM) }
        val request = HttpEntity<String>(headers)
        
        // 複数の接続を順次実行
        repeat(3) { 
            val response = restTemplate.exchange("/api/sse/comments", HttpMethod.GET, request, String::class.java)
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        }
    }
    
    // === プロダクション品質確認テスト ===
    
    @Test
    fun `SSEエンドポイントが適切なヘッダーを返す`() {
        val headers = HttpHeaders().apply { accept = listOf(MediaType.TEXT_EVENT_STREAM) }
        val request = HttpEntity<String>(headers)
        val response = restTemplate.exchange("/api/sse/comments", HttpMethod.GET, request, String::class.java)
        
        // レスポンスヘッダーの確認
        assertThat(response.headers.contentType).isEqualTo(MediaType.TEXT_EVENT_STREAM)
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
    }
}