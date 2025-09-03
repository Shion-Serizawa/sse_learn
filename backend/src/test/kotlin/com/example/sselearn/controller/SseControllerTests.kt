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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SseControllerTests {

    @Autowired
    private lateinit var restTemplate: TestRestTemplate

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
    fun `GET api sse comments がCache-Control no-cacheヘッダーを返す`() {
        val headers = HttpHeaders().apply { accept = listOf(MediaType.TEXT_EVENT_STREAM) }
        val request = HttpEntity<String>(headers)
        val response = restTemplate.exchange("/api/sse/comments", HttpMethod.GET, request, String::class.java)
        
        assertThat(response.headers["Cache-Control"]).contains("no-cache")
    }

    @Test
    fun `GET api sse comments がConnection keep-aliveヘッダーを返す`() {
        val headers = HttpHeaders().apply { accept = listOf(MediaType.TEXT_EVENT_STREAM) }
        val request = HttpEntity<String>(headers)
        val response = restTemplate.exchange("/api/sse/comments", HttpMethod.GET, request, String::class.java)
        
        assertThat(response.headers["Connection"]).contains("keep-alive")
    }
}