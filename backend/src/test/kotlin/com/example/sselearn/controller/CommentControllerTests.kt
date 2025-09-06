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
import org.springframework.test.context.ActiveProfiles

/**
 * コメントAPIの統合テスト
 * TDD原則に従い、コメント投稿機能をテストする
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class CommentControllerTests {

    @Autowired
    private lateinit var restTemplate: TestRestTemplate

    // === 2.1 コメント投稿API基本 ===
    
    @Test
    fun `POST api comments が404ではない`() {
        val response = restTemplate.postForEntity("/api/comments", "", String::class.java)
        assertThat(response.statusCode).isNotEqualTo(HttpStatus.NOT_FOUND)
    }
    
    @Test
    fun `POST api comments がHTTP 400を返す（空のリクエスト）`() {
        // JSON Content-Type制約があるため、適切なヘッダーで空文字列を送信
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val request = HttpEntity("", headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `Content-Type application json を受け取る`() {
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val request = HttpEntity("{}", headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isNotEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
    }
    
    @Test
    fun `空のJSONボディ でHTTP 400エラーを返す`() {
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val request = HttpEntity("{}", headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `成功時にHTTP 201とコメントIDを返す`() {
        // Red: 有効なJSONでHTTP 201とIDが返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val validJson = """{"username":"testuser","message":"test message"}"""
        val request = HttpEntity(validJson, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body).contains("id") // レスポンスにIDが含まれていることを確認
    }
}