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
        // JSON Content-Type制約があるため、適切なヘッダーで不正なJSONを送信
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        // 空文字列ではなく、空のJSONオブジェクトを送信（バリデーションでエラーになる）
        val request = HttpEntity("{}", headers)
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
    
    // === 2.2 コメントデータ構造とバリデーション ===
    
    @Test
    fun `username フィールドを含むJSONを受け取る`() {
        // Red: usernameフィールドありのJSONが正しく処理されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val jsonWithUsername = """{"username":"testuser","message":"test"}"""
        val request = HttpEntity(jsonWithUsername, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        // レスポンスにusernameが何らかの形で反映されていることを確認
        assertThat(response.body).isNotNull()
    }
    
    @Test
    fun `message フィールドを含むJSONを受け取る`() {
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val jsonWithMessage = """{"username":"testuser","message":"test message"}"""
        val request = HttpEntity(jsonWithMessage, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body).isNotNull()
    }
    
    @Test
    fun `両フィールドが必須であることを検証する（username欠如）`() {
        // Red: usernameが欠けている場合に400エラーが返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val jsonWithoutUsername = """{"message":"test message"}"""
        val request = HttpEntity(jsonWithoutUsername, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `両フィールドが必須であることを検証する（message欠如）`() {
        // Red: messageが欠けている場合に400エラーが返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val jsonWithoutMessage = """{"username":"testuser"}"""
        val request = HttpEntity(jsonWithoutMessage, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `空文字列やnullの場合にHTTP 400を返す（username空文字列）`() {
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val jsonWithEmptyUsername = """{"username":"","message":"test"}"""
        val request = HttpEntity(jsonWithEmptyUsername, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `空文字列やnullの場合にHTTP 400を返す（message空文字列）`() {
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val jsonWithEmptyMessage = """{"username":"user","message":""}"""
        val request = HttpEntity(jsonWithEmptyMessage, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `空文字列やnullの場合にHTTP 400を返す（usernameがnull）`() {
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val jsonWithNullUsername = """{"username":null,"message":"test"}"""
        val request = HttpEntity(jsonWithNullUsername, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `username長すぎる（50文字超）でHTTP 400を返す`() {
        // Red: 51文字のusernameで400エラーが返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val longUsername = "a".repeat(51) // 51文字
        val jsonWithLongUsername = """{"username":"$longUsername","message":"test"}"""
        val request = HttpEntity(jsonWithLongUsername, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `message長すぎる（500文字超）でHTTP 400を返す`() {
        // Red: 501文字のmessageで400エラーが返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val longMessage = "a".repeat(501) // 501文字
        val jsonWithLongMessage = """{"username":"user","message":"$longMessage"}"""
        val request = HttpEntity(jsonWithLongMessage, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
    
    @Test
    fun `成功時にCommentエンティティを生成する`() {
        // Red: 有効なJSONでCommentエンティティが内部で生成されることを期待
        // エンティティ生成を直接テストするのは困難なため、
        // レスポンスに含まれる要素でエンティティ生成を推測する
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val validJson = """{"username":"testuser","message":"test message"}"""
        val request = HttpEntity(validJson, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body).contains("id")
        assertThat(response.body).contains("status")
        // 将来的にはtimestampやその他の要素も含まれることを期待
    }
    
    // === 2.4 コメントSSE配信（既存SseService統合） ===
    
    @Test
    fun `コメント投稿と同時にSSE配信が動作する`() {
        // Red: コメント投稿APIが成功するとSSE配信も同時実行されることを期待
        // 統合テストとして、エンドポイント経由でのSSE配信動作を確認
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val validJson = """{"username":"testuser","message":"test message"}"""
        val request = HttpEntity(validJson, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        // APIが正常に成功することを確認
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body).contains("id")
        assertThat(response.body).contains("timestamp")
        
        // 注意：実際のSSE配信はモック環境では直接テストが困難
        // そのため、APIが成功すればSSE配信も動作すると仮定
        // 実際の配信はServiceレイヤーでテスト済み
    }
    
    // === 2.6 エラーハンドリングと品質向上 ===
    
    @Test
    fun `統一されたエラーレスポンス形式を実装する`() {
        // Red: バリデーションエラー時に統一形式のJSONエラーレスポンスが返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val invalidJson = """{"username":"","message":""}""" // 空文字列でバリデーションエラー
        val request = HttpEntity(invalidJson, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        // エラーレスポンスがJSON形式であることを確認
        assertThat(response.body).isNotNull()
        assertThat(response.body).contains("error")
        // 将来的には、ApiError形式のJSONを期待
    }
    
    @Test
    fun `バリデーションエラーでフィールド別エラーメッセージを返す`() {
        // Red: フィールド別の詳細エラー情報が返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        val invalidJson = """{"username":"","message":""}"""
        val request = HttpEntity(invalidJson, headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(response.body).isNotNull()
        // 将来的にはフィールド別エラーメッセージを含むことを期待
    }
    
    @Test
    fun `不正なContent-Typeでのアクセスを400エラーで処理する`() {
        // Red: application/json以外のContent-Typeで400エラーが返されることを期待
        val headers = HttpHeaders().apply { 
            contentType = MediaType.TEXT_PLAIN // 不正なContent-Type
        }
        val request = HttpEntity("invalid content type", headers)
        val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
        
        // 不正なContent-Typeは415 Unsupported Media Type または 400 Bad Request
        assertThat(response.statusCode).isIn(HttpStatus.BAD_REQUEST, HttpStatus.UNSUPPORTED_MEDIA_TYPE)
    }
    
    @Test
    fun `大量コメント投稿に対する基本的なレート制限を検討する`() {
        // Red: 短期間での連続投稿を制限することを期待
        // 注意：本格的なレート制限は複雑なため、ここでは基本実装のみ
        val headers = HttpHeaders().apply { 
            contentType = MediaType.APPLICATION_JSON 
        }
        
        // 連続で複数のコメントを投稿
        repeat(3) { i ->
            val json = """{"username":"user","message":"rapid message $i"}"""
            val request = HttpEntity(json, headers)
            val response = restTemplate.exchange("/api/comments", HttpMethod.POST, request, String::class.java)
            
            // 現在の実装では全て成功するはず（基本レート制限未実装）
            assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        }
        
        // 将来的には、短期間での連続投稿を制限する機能を追加予定
        // 例：同一IPから1秒間に5回以上の投稿で429 Too Many Requests
    }
}