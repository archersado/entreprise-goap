package com.acme.enterprisegoap.interview

import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.sample.RdScenario
import org.springframework.stereotype.Component

data class InterviewRequest(
    val transcript: String,
    val scenarioName: String = "研发交付",
)

data class InterviewExtraction(
    val candidate: SemanticGoapModel,
    val clarificationQuestions: List<String>,
    val warnings: List<String>,
)

fun interface InterviewExtractor {
    fun extract(request: InterviewRequest): InterviewExtraction
}

/**
 * Deterministic baseline. It proves the contract without an API key. DSH or an LLM
 * may later implement the same port, but still has to produce this typed candidate.
 */
@Component
class RuleBasedInterviewExtractor : InterviewExtractor {
    override fun extract(request: InterviewRequest): InterviewExtraction {
        val questions = buildList {
            if (!request.transcript.contains("测试")) add("发布前采用什么测试通过标准？")
            if (!request.transcript.contains("审批") && !request.transcript.contains("评审")) {
                add("设计是否需要人工评审或审批？")
            }
            if (!request.transcript.contains("失败")) add("每个动作失败后允许重试还是转人工？")
        }
        return InterviewExtraction(
            candidate = RdScenario.fromInterview(request.transcript, request.scenarioName),
            clarificationQuestions = questions,
            warnings = listOf("当前抽取器是离线基线；未经确认的语义不能直接部署到生产。"),
        )
    }
}
