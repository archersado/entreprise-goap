package com.acme.enterprisegoap.api

import com.acme.enterprisegoap.interview.InterviewRequest
import com.acme.enterprisegoap.service.PipelineService
import org.springframework.http.HttpStatus
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.JsonNode

@RestController
@RequestMapping("/api")
class PipelineController(
    private val service: PipelineService,
    private val requestDecoder: GoapRequestDecoder,
) {
    @PostMapping("/interviews/extract")
    fun interview(@RequestBody request: InterviewRequest) = service.interview(request)

    @PostMapping("/interviews/spec/review")
    fun reviewSpec(@RequestBody body: JsonNode) = service.reviewSpec(requestDecoder.interviewSpec(body))

    @PostMapping("/interviews/spec/build")
    fun buildSpec(@RequestBody body: JsonNode) = service.buildFromSpec(requestDecoder.interviewSpec(body))

    @PostMapping("/models/validate")
    fun validate(@RequestBody body: JsonNode) = service.validate(requestDecoder.model(body))

    @PostMapping("/models/compile")
    fun compile(@RequestBody body: JsonNode) = service.compile(requestDecoder.model(body))

    @PostMapping("/agents/run")
    fun execute(@RequestBody body: JsonNode) = service.execute(requestDecoder.execution(body))

    @PostMapping("/pipeline/run")
    fun pipeline(@RequestBody request: InterviewRequest) = service.runPipeline(request)

    @ExceptionHandler(IllegalArgumentException::class, IllegalStateException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun invalidRequest(exception: RuntimeException) = mapOf("error" to (exception.message ?: "invalid request"))

    @ExceptionHandler(HttpMessageNotReadableException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun malformedJson(exception: HttpMessageNotReadableException) = mapOf(
        "error" to "invalid JSON request: ${exception.mostSpecificCause.message ?: exception.message}",
    )
}
