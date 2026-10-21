package com.acme.enterprisegoap.service

import com.acme.enterprisegoap.compiler.CompiledAgentSummary
import com.acme.enterprisegoap.compiler.SemanticGoapCompiler
import com.acme.enterprisegoap.interview.InterviewExtraction
import com.acme.enterprisegoap.interview.InterviewExtractor
import com.acme.enterprisegoap.interview.InterviewRequest
import com.acme.enterprisegoap.interview.InterviewSpec
import com.acme.enterprisegoap.interview.InterviewSpecService
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.model.SemanticState
import com.acme.enterprisegoap.model.ActionOutcome
import com.acme.enterprisegoap.runtime.DeterministicGoapRuntime
import com.acme.enterprisegoap.runtime.RunResult
import com.acme.enterprisegoap.validation.SemanticGoapValidator
import com.acme.enterprisegoap.validation.ValidationResult
import com.acme.enterprisegoap.semantic.ProjectedWorldState
import com.acme.enterprisegoap.semantic.SemanticSnapshot
import com.acme.enterprisegoap.semantic.SemanticStateProjector
import com.acme.enterprisegoap.scenario.CreateScenarioVersionRequest
import com.acme.enterprisegoap.scenario.ScenarioStore
import org.springframework.stereotype.Service

data class ExecuteRequest(
    val model: SemanticGoapModel,
    val goalId: String,
    val initialPredicates: Set<String> = emptySet(),
    val semanticSnapshot: SemanticSnapshot? = null,
    val outcomeOverrides: Map<String, ActionOutcome> = emptyMap(),
)

data class ProjectionRequest(
    val model: SemanticGoapModel,
    val snapshot: SemanticSnapshot,
)

data class PipelineResult(
    val extraction: InterviewExtraction,
    val validation: ValidationResult,
    val compiled: CompiledAgentSummary?,
    val run: RunResult?,
)

@Service
class PipelineService(
    private val extractor: InterviewExtractor,
    private val specService: InterviewSpecService,
    private val validator: SemanticGoapValidator,
    private val compiler: SemanticGoapCompiler,
    private val runtime: DeterministicGoapRuntime,
    private val projector: SemanticStateProjector,
    private val scenarios: ScenarioStore,
) {
    fun interview(request: InterviewRequest) = extractor.extract(request)

    fun reviewSpec(spec: InterviewSpec, sessionId: String? = null, scenarioId: String? = null) =
        scenarios.reviewAndSave(spec, scenarioId, sessionId, specService::review)

    fun buildFromSpec(spec: InterviewSpec, sessionId: String? = null, scenarioId: String? = null) =
        specService.build(reviewSpec(spec, sessionId, scenarioId).spec).also {
            scenarios.saveBuild(it, sessionId, scenarioId)
        }

    fun validate(model: SemanticGoapModel, sessionId: String? = null) = validator.validate(model).also {
        scenarios.saveValidation(model, it, sessionId)
    }

    fun compile(model: SemanticGoapModel, sessionId: String? = null) = compiler.compile(model).summary.also {
        scenarios.saveCompilation(model, it, sessionId)
    }

    fun project(request: ProjectionRequest): ProjectedWorldState {
        val validation = validator.validate(request.model)
        require(validation.valid) { "Invalid semantic model: ${validation.errors.joinToString { it.message }}" }
        return projector.project(request.model, request.snapshot)
    }

    fun execute(request: ExecuteRequest, sessionId: String? = null): RunResult {
        val validation = validator.validate(request.model)
        require(validation.valid) { "Invalid semantic model: ${validation.errors.joinToString { it.message }}" }
        compiler.compile(request.model)
        val projection = request.semanticSnapshot?.let { projector.project(request.model, it) }
        return runtime.run(
            model = request.model,
            goalId = request.goalId,
            initialState = projection?.state ?: SemanticState(request.initialPredicates),
            outcomeOverrides = request.outcomeOverrides,
            blockedPredicates = projection?.blockedPredicates.orEmpty(),
            escalationRequired = projection?.escalationRequired.orEmpty(),
        ).also { scenarios.saveRun(request.model, it, sessionId) }
    }

    fun createScenarioVersion(id: String, request: CreateScenarioVersionRequest) =
        scenarios.createVersion(id, request, specService::review)

    fun runPipeline(request: InterviewRequest): PipelineResult {
        val extraction = extractor.extract(request)
        val validation = validator.validate(extraction.candidate)
        if (!validation.valid) return PipelineResult(extraction, validation, null, null)
        val compiled = compiler.compile(extraction.candidate).summary
        val goal = extraction.candidate.goals.first()
        val run = runtime.run(extraction.candidate, goal.id)
        return PipelineResult(extraction, validation, compiled, run)
    }
}
