package com.acme.enterprisegoap.api

import com.acme.enterprisegoap.interview.InterviewRequest
import com.acme.enterprisegoap.service.PipelineService
import com.acme.enterprisegoap.scenario.BindScenarioRequest
import com.acme.enterprisegoap.scenario.CreateScenarioRequest
import com.acme.enterprisegoap.scenario.CreateScenarioVersionRequest
import com.acme.enterprisegoap.scenario.ScenarioStore
import com.acme.enterprisegoap.scenario.ScenarioSessionRequest
import org.springframework.http.HttpStatus
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.JsonNode

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["http://127.0.0.1:3080", "http://localhost:3080"])
class PipelineController(
    private val service: PipelineService,
    private val requestDecoder: GoapRequestDecoder,
    private val scenarios: ScenarioStore,
) {
    @PostMapping("/interviews/extract")
    fun interview(@RequestBody request: InterviewRequest) = service.interview(request)

    @PostMapping("/interviews/spec/review")
    fun reviewSpec(@RequestBody body: JsonNode) = service.reviewSpec(
        requestDecoder.interviewSpec(body), text(body, "sessionId"), text(body, "scenarioId"),
    )

    @PostMapping("/interviews/spec/build")
    fun buildSpec(@RequestBody body: JsonNode) = service.buildFromSpec(
        requestDecoder.interviewSpec(body), text(body, "sessionId"), text(body, "scenarioId"),
    )

    @PostMapping("/models/validate")
    fun validate(@RequestBody body: JsonNode) = service.validate(requestDecoder.model(body), text(body, "sessionId"))

    @PostMapping("/models/compile")
    fun compile(@RequestBody body: JsonNode) = service.compile(requestDecoder.model(body), text(body, "sessionId"))

    @PostMapping("/agents/run")
    fun execute(@RequestBody body: JsonNode) = service.execute(requestDecoder.execution(body), text(body, "sessionId"))

    @GetMapping("/scenarios")
    fun scenarios() = scenarios.list()

    @PostMapping("/scenarios")
    fun createScenario(@RequestBody request: CreateScenarioRequest) = scenarios.create(request)

    @PostMapping("/scenarios/current")
    fun currentScenario(@RequestBody request: ScenarioSessionRequest) =
        scenarios.selectedForSession(request.sessionId)
            ?: throw IllegalArgumentException("no scenario is bound to session ${request.sessionId}")

    @GetMapping("/scenarios/{id}")
    fun scenario(@PathVariable id: String) = scenarios.get(id)

    @PutMapping("/scenarios/{id}/binding")
    fun bindScenario(@PathVariable id: String, @RequestBody request: BindScenarioRequest) = scenarios.bind(id, request.sessionId)

    @PostMapping("/scenarios/{id}/versions")
    fun createScenarioVersion(
        @PathVariable id: String,
        @RequestBody request: CreateScenarioVersionRequest,
    ) = service.createScenarioVersion(id, request)

    @PostMapping("/semantic/project")
    fun project(@RequestBody body: JsonNode) = service.project(requestDecoder.projection(body))

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

    private fun text(body: JsonNode, field: String): String? = body.get(field)?.asText()?.takeIf(String::isNotBlank)
}
