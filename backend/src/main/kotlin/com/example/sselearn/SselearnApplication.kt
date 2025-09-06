package com.example.sselearn

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class SselearnApplication

fun main(args: Array<String>) {
    runApplication<SselearnApplication>(*args)
}