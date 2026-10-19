package com.acme.enterprisegoap

import com.acme.enterprisegoap.capability.CapabilityRegistry
import com.acme.enterprisegoap.compiler.SemanticGoapCompiler
import com.acme.enterprisegoap.api.GoapRequestDecoder
import com.acme.enterprisegoap.interview.InterviewRequest
import com.acme.enterprisegoap.interview.ActionReversibility
import com.acme.enterprisegoap.interview.InterviewSpec
import com.acme.enterprisegoap.interview.InterviewSpecService
import com.acme.enterprisegoap.interview.InterviewSpecStatus
import com.acme.enterprisegoap.interview.RuleBasedInterviewExtractor
import com.acme.enterprisegoap.interview.SpecAction
import com.acme.enterprisegoap.interview.SpecActor
import com.acme.enterprisegoap.interview.SpecGoal
import com.acme.enterprisegoap.interview.SpecPolicy
import com.acme.enterprisegoap.interview.SpecState
import com.acme.enterprisegoap.model.CapabilitySpec
import com.acme.enterprisegoap.runtime.DeterministicGoapRuntime
import com.acme.enterprisegoap.sample.RdScenario
import com.acme.enterprisegoap.validation.SemanticGoapValidator
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class PipelineTest {
    private val registry = CapabilityRegistry()
    private val validator = SemanticGoapValidator(registry)
    private val compiler = SemanticGoapCompiler(registry, validator)
    private val runtime = DeterministicGoapRuntime(registry)
    private val specService = InterviewSpecService()
    private val objectMapper = JsonMapper.builder().addModule(KotlinModule.Builder().build()).build()
    private val requestDecoder = GoapRequestDecoder(objectMapper)

    @Test
    fun `interview to Embabel AgentBuilder to execution`() {
        val extraction = RuleBasedInterviewExtractor().extract(
            InterviewRequest("访谈需求，设计评审后实现，自动化测试通过再发布。失败转人工。")
        )

        val validation = validator.validate(extraction.candidate)
        assertTrue(validation.valid, validation.errors.toString())

        val compiled = compiler.compile(extraction.candidate)
        assertEquals(5, compiled.agent.actions.size)
        assertEquals(listOf("release_ready"), compiled.summary.goals)

        val result = runtime.run(extraction.candidate, "release_ready")
        assertTrue(result.achieved)
        assertEquals(5, result.steps.size)
        assertTrue("release_candidate_ready" in result.finalState.truePredicates)
        assertEquals(5, result.replans)
    }

    @Test
    fun `unregistered executor is rejected before compilation`() {
        val model = RdScenario.fromInterview("test").let { original ->
            original.copy(
                capabilities = original.capabilities.mapIndexed { index, capability ->
                    if (index == 0) capability.copy(executor = "missing:executor") else capability
                }
            )
        }

        val validation = validator.validate(model)
        assertFalse(validation.valid)
        assertTrue(validation.errors.any { "unbound executor" in it.message })
    }

    @Test
    fun `planner chooses only actions whose preconditions are satisfied`() {
        val model = RdScenario.fromInterview("test")
        val result = runtime.run(model, "release_ready")
        assertEquals(
            listOf("capture_requirement", "approve_design", "implement_change", "verify_change", "package_release"),
            result.steps.map { it.capabilityId },
        )
    }

    @Test
    fun `draft interview spec cannot build until questions are resolved and user confirms`() {
        val draft = sampleSpec().copy(
            openQuestions = listOf("谁批准上线？"),
            status = InterviewSpecStatus.DRAFT,
        )

        val review = specService.review(draft)

        assertFalse(review.readyToBuild)
        assertTrue("谁批准上线？" in review.clarificationQuestions)
        assertFailsWith<IllegalArgumentException> { specService.build(draft) }
    }

    @Test
    fun `confirmed interview spec builds a dynamic executable goap`() {
        val built = specService.build(sampleSpec())
        val validation = validator.validate(built.model)

        assertTrue(validation.valid, validation.errors.toString())
        assertEquals(listOf("collect_order", "approve_order"), built.model.capabilities.map { it.id })

        val result = runtime.run(built.model, "order_ready")
        assertTrue(result.achieved)
        assertEquals(listOf("collect_order", "approve_order"), result.steps.map { it.capabilityId })
    }

    @Test
    fun `interview remains incomplete until action risks and reversibility are assessed`() {
        val incomplete = sampleSpec().copy(
            actions = sampleSpec().actions.mapIndexed { index, action ->
                if (index == 0) action.copy(
                    noKnownFailureRationale = "",
                    reversibility = ActionReversibility.NOT_ASSESSED,
                ) else action
            },
        )

        val review = specService.review(incomplete)

        assertFalse(review.readyToBuild)
        assertTrue("actions[0].failureModes" in review.missingFields)
        assertTrue("actions[0].reversibility" in review.missingFields)
    }

    @Test
    fun `runtime retracts stale facts when an action declares removals`() {
        val built = specService.build(sampleSpec()).model
        val model = built.copy(
            capabilities = built.capabilities.map { capability ->
                if (capability.id == "approve_order") capability.copy(removes = setOf("order_complete")) else capability
            },
        )

        val result = runtime.run(model, "order_ready")

        assertTrue(result.achieved)
        assertFalse("order_complete" in result.finalState.truePredicates)
        assertEquals(setOf("order_complete"), result.steps.last().removes)
    }

    @Test
    fun `model endpoints accept JSON encoded build result and run model`() {
        val model = specService.build(sampleSpec()).model
        val buildResultJson = """{"model":${objectMapper.writeValueAsString(model)}}"""
        val encodedBuildResult = objectMapper.readTree(objectMapper.writeValueAsString(buildResultJson))

        val decodedModel = requestDecoder.model(encodedBuildResult)
        assertEquals(model, decodedModel)

        val modelJson = objectMapper.writeValueAsString(model)
        val runBody = objectMapper.readTree(
            """{"model":${objectMapper.writeValueAsString(modelJson)},"goalId":"order_ready","initialPredicates":[]}"""
        )
        val request = requestDecoder.execution(runBody)
        val result = runtime.run(request.model, request.goalId, com.acme.enterprisegoap.model.SemanticState(request.initialPredicates))

        assertTrue(result.achieved)
        assertEquals("order_ready", request.goalId)
    }

    @Test
    fun `spec endpoints accept raw wrapped and JSON encoded specs`() {
        val spec = sampleSpec()
        val raw = objectMapper.readTree(objectMapper.writeValueAsString(spec))
        val wrapped = objectMapper.readTree("""{"spec":${objectMapper.writeValueAsString(spec)}}""")
        val encoded = objectMapper.readTree(objectMapper.writeValueAsString(objectMapper.writeValueAsString(spec)))

        assertEquals(spec, requestDecoder.interviewSpec(raw))
        assertEquals(spec, requestDecoder.interviewSpec(wrapped))
        assertEquals(spec, requestDecoder.interviewSpec(encoded))
    }

    @Test
    fun `invalid interview spec reports the actual DTO field error`() {
        val partial = objectMapper.readTree("""{"id":"draft","actors":[{"name":"missing id"}]}""")

        val review = specService.review(requestDecoder.interviewSpec(partial))

        assertFalse(review.readyToBuild)
        assertTrue("actors[0].id" in review.missingFields)
        assertTrue("title" in review.missingFields)
    }

    @Test
    fun `validator explains unsupported negative predicate syntax`() {
        val model = specService.build(sampleSpec()).model.copy(
            capabilities = specService.build(sampleSpec()).model.capabilities.mapIndexed { index, capability ->
                if (index == 0) capability.copy(preconditions = setOf("NOT order_complete")) else capability
            },
        )

        val validation = validator.validate(model)

        assertFalse(validation.valid)
        assertTrue(validation.errors.any { "negative predicate syntax" in it.message })
        assertFalse(validation.errors.any { "unknown predicate 'NOT order_complete'" in it.message })
    }

    private fun sampleSpec() = InterviewSpec(
        id = "order-approval",
        version = 3,
        title = "订单审批",
        summary = "收集订单资料并完成审批",
        objective = "形成可以执行的已审批订单",
        actors = listOf(
            SpecActor("sales", "销售 Agent", listOf("收集订单资料")),
            SpecActor("manager", "审批 Agent", listOf("核对并批准订单")),
        ),
        states = listOf(
            SpecState("order_complete", "订单资料完整", evidenceRequired = "订单字段校验报告"),
            SpecState("order_approved", "订单已经批准", evidenceRequired = "审批记录"),
        ),
        actions = listOf(
            SpecAction(
                id = "collect_order",
                name = "收集订单",
                description = "补全并校验订单资料",
                ownerRole = "sales",
                effects = setOf("order_complete"),
                evidenceType = "order_validation",
                failureHandling = "缺失字段时回到销售补充",
                noKnownFailureRationale = "演示动作由确定性执行器完成，不接入外部系统。",
                reversibility = ActionReversibility.IRREVERSIBLE,
            ),
            SpecAction(
                id = "approve_order",
                name = "审批订单",
                description = "经理核对订单并做出审批决定",
                ownerRole = "manager",
                preconditions = setOf("order_complete"),
                effects = setOf("order_approved"),
                evidenceType = "approval_record",
                failureHandling = "拒绝时记录原因并返回销售",
                noKnownFailureRationale = "演示动作只覆盖成功审批，拒绝流程另行建模。",
                reversibility = ActionReversibility.IRREVERSIBLE,
            ),
        ),
        goals = listOf(SpecGoal("order_ready", "订单可执行", setOf("order_approved"))),
        policies = listOf(SpecPolicy("approval_gate", "资料完整才能审批", "order_complete -> approve_order")),
        confirmedClaims = listOf("订单资料完整后才能审批"),
        status = InterviewSpecStatus.CONFIRMED,
    )
}
