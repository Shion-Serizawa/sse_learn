package com.example.sselearn

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class SseLearnApplication

fun main(args: Array<String>) {
    runApplication<SseLearnApplication>(*args)
}