package com.acme.enterprisegoap.sample

import com.acme.enterprisegoap.model.*

object RdScenario {
    fun fromInterview(transcript: String, scenarioName: String = "研发交付") = SemanticGoapModel(
        id = "rd-delivery",
        name = scenarioName,
        description = "从需求访谈到可发布候选版本的最小研发闭环",
        predicates = listOf(
            predicate("requirement_defined", "需求已经结构化并确认"),
            predicate("design_approved", "技术设计已经评审通过"),
            predicate("implementation_complete", "实现已经完成"),
            predicate("tests_passed", "自动化测试通过"),
            predicate("release_candidate_ready", "发布候选物及证据齐备"),
        ),
        capabilities = listOf(
            capability("capture_requirement", "访谈并结构化需求", "product", emptySet(), setOf("requirement_defined")),
            capability("approve_design", "形成并评审技术设计", "architect", setOf("requirement_defined"), setOf("design_approved")),
            capability("implement_change", "实现需求", "developer", setOf("design_approved"), setOf("implementation_complete")),
            capability("verify_change", "执行自动化验证", "qa", setOf("implementation_complete"), setOf("tests_passed")),
            capability("package_release", "汇总制品和证据", "release", setOf("tests_passed"), setOf("release_candidate_ready")),
        ),
        goals = listOf(
            GoalSpec("release_ready", "得到可审计的发布候选版本", setOf("release_candidate_ready"), value = 1.0),
        ),
        roles = listOf(
            role("product", "产品访谈 Agent", "capture_requirement"),
            role("architect", "架构评审 Agent", "approve_design"),
            role("developer", "研发 Agent", "implement_change"),
            role("qa", "测试 Agent", "verify_change"),
            role("release", "发布 Agent", "package_release"),
        ),
        policies = listOf(
            PolicySpec("test_gate", "没有测试证据不得形成发布候选", "tests_passed -> package_release"),
        ),
        provenance = listOf(
            SourceClaim(transcript, "rd-delivery", 0.72, ClaimStatus.EXTRACTED),
        ),
    )

    private fun predicate(id: String, description: String) = PredicateSpec(id, description)

    private fun capability(id: String, description: String, role: String, pre: Set<String>, effects: Set<String>) =
        CapabilitySpec(
            id = id,
            description = description,
            ownerRole = role,
            executor = "demo:$id",
            preconditions = pre,
            effects = effects,
            evidenceType = "${id}_evidence",
            noKnownFailureRationale = "静态演示场景仅验证成功路径，生产建模前必须重新访谈异常分支",
            reversibility = "IRREVERSIBLE",
        )

    private fun role(id: String, description: String, vararg capabilities: String) =
        AgentRoleSpec(id, description, capabilities.toSet())
}
