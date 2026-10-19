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
import com.acme.enterprisegoap.runtime.DeterministicGoapRuntime
import com.acme.enterprisegoap.runtime.RunResult
import com.acme.enterprisegoap.validation.SemanticGoapValidator
import com.acme.enterprisegoap.validation.ValidationResult
import org.springframework.stereotype.Service

data class ExecuteRequest(
    val model: SemanticGoapModel,
    val goalId: String,
    val initialPredicates: Set<String> = emptySet(),
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
) {
    fun interview(request: InterviewRequest) = extractor.extract(request)

    fun reviewSpec(spec: InterviewSpec) = specService.review(spec)

    fun buildFromSpec(spec: InterviewSpec) = specService.build(spec)

    fun validate(model: SemanticGoapModel) = validator.validate(model)

    fun compile(model: SemanticGoapModel) = compiler.compile(model).summary

    fun execute(request: ExecuteRequest): RunResult {
        val validation = validator.validate(request.model)
        require(validation.valid) { "Invalid semantic model: ${validation.errors.joinToString { it.message }}" }
        compiler.compile(request.model)
        return runtime.run(
            model = request.model,
            goalId = request.goalId,
            initialState = SemanticState(request.initialPredicates),
        )
    }

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
