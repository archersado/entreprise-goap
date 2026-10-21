package com.acme.enterprisegoap.interview

import com.acme.enterprisegoap.model.AgentRoleSpec
import com.acme.enterprisegoap.model.CapabilitySpec
import com.acme.enterprisegoap.model.ClaimStatus
import com.acme.enterprisegoap.model.GoalSpec
import com.acme.enterprisegoap.model.PolicySpec
import com.acme.enterprisegoap.model.PredicateSpec
import com.acme.enterprisegoap.model.ProjectionStrategy
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.model.SourceClaim
import org.springframework.stereotype.Component

enum class InterviewSpecStatus { DRAFT, CONFIRMED }
enum class ActionReversibility { NOT_ASSESSED, REVERSIBLE, COMPENSATABLE, IRREVERSIBLE }
enum class FailureTrigger { FAILURE, TIMEOUT, REJECTION, CANCELLATION, PARTIAL_SUCCESS, BUSINESS_RULE }

data class InterviewSpec(
    val id: String = "",
    val version: Int = 1,
    val title: String = "",
    val summary: String = "",
    val objective: String = "",
    val actors: List<SpecActor> = emptyList(),
    val states: List<SpecState> = emptyList(),
    val actions: List<SpecAction> = emptyList(),
    val goals: List<SpecGoal> = emptyList(),
    val policies: List<SpecPolicy> = emptyList(),
    val assumptions: List<String> = emptyList(),
    val openQuestions: List<String> = emptyList(),
    val confirmedClaims: List<String> = emptyList(),
    val rejectedClaims: List<String> = emptyList(),
    val status: InterviewSpecStatus = InterviewSpecStatus.DRAFT,
)

data class SpecActor(
    val id: String = "",
    val name: String = "",
    val responsibilities: List<String> = emptyList(),
)

data class SpecState(
    val id: String = "",
    val description: String = "",
    val observable: Boolean = true,
    val evidenceRequired: String = "",
    val semanticQuery: String = "",
    val unknownStrategy: ProjectionStrategy = ProjectionStrategy.FALSE,
    val conflictStrategy: ProjectionStrategy = ProjectionStrategy.BLOCK,
)

data class SpecAction(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val ownerRole: String = "",
    val preconditions: Set<String> = emptySet(),
    val effects: Set<String> = emptySet(),
    val removes: Set<String> = emptySet(),
    val observes: Set<String> = emptySet(),
    val executor: String = "demo:semantic-action",
    val evidenceType: String = "",
    val failureHandling: String = "",
    val failureModes: List<SpecFailureMode> = emptyList(),
    val noKnownFailureRationale: String = "",
    val reversibility: ActionReversibility = ActionReversibility.NOT_ASSESSED,
    val reverseActionId: String? = null,
    val cost: Double = 1.0,
    val idempotent: Boolean = true,
)

data class SpecFailureMode(
    val id: String = "",
    val trigger: FailureTrigger? = null,
    val description: String = "",
    val effects: Set<String> = emptySet(),
    val recoveryActionId: String? = null,
    val terminal: Boolean = false,
    val evidenceType: String = "",
)

data class SpecGoal(
    val id: String = "",
    val description: String = "",
    val satisfiedBy: Set<String> = emptySet(),
    val value: Double = 1.0,
)

data class SpecPolicy(
    val id: String = "",
    val description: String = "",
    val expression: String = "",
)

data class SpecReviewResult(
    val spec: InterviewSpec,
    val missingFields: List<String>,
    val clarificationQuestions: List<String>,
    val readyToBuild: Boolean,
)

data class SpecBuildResult(
    val spec: InterviewSpec,
    val review: SpecReviewResult,
    val model: SemanticGoapModel,
)

@Component
class InterviewSpecService {
    fun review(spec: InterviewSpec): SpecReviewResult {
        val missing = buildList {
            if (spec.id.isBlank()) add("id")
            if (spec.title.isBlank()) add("title")
            if (spec.summary.isBlank()) add("summary")
            if (spec.objective.isBlank()) add("objective")
            if (spec.actors.isEmpty()) add("actors")
            if (spec.states.isEmpty()) add("states")
            if (spec.actions.isEmpty()) add("actions")
            if (spec.goals.isEmpty()) add("goals")

            val actorIds = spec.actors.map { it.id }.toSet()
            val stateIds = spec.states.map { it.id }.toSet()
            val actionIds = spec.actions.map { it.id }.toSet()
            spec.actors.forEachIndexed { index, actor ->
                if (actor.id.isBlank()) add("actors[$index].id")
                if (actor.name.isBlank()) add("actors[$index].name")
            }
            spec.states.forEachIndexed { index, state ->
                if (state.id.isBlank()) add("states[$index].id")
                if (state.description.isBlank()) add("states[$index].description")
                if (state.evidenceRequired.isBlank()) add("states[$index].evidenceRequired")
                if (state.semanticQuery.isBlank()) add("states[$index].semanticQuery")
                if (state.unknownStrategy == ProjectionStrategy.OBSERVE &&
                    spec.actions.none { state.id in it.observes }
                ) {
                    add("states[$index].observerAction")
                }
            }
            spec.actions.forEachIndexed { index, action ->
                if (action.id.isBlank()) add("actions[$index].id")
                if (action.name.isBlank()) add("actions[$index].name")
                if (action.description.isBlank()) add("actions[$index].description")
                if (action.ownerRole !in actorIds) add("actions[$index].ownerRole")
                if (action.effects.isEmpty() && action.removes.isEmpty() && action.observes.isEmpty()) add("actions[$index].effects")
                if ((action.preconditions + action.effects + action.removes + action.observes).any { it !in stateIds }) {
                    add("actions[$index].stateReferences")
                }
                if ((action.effects intersect action.removes).isNotEmpty()) add("actions[$index].conflictingEffects")
                if (action.evidenceType.isBlank()) add("actions[$index].evidenceType")
                if (action.failureHandling.isBlank()) add("actions[$index].failureHandling")
                if (action.failureModes.isEmpty() && action.noKnownFailureRationale.isBlank()) {
                    add("actions[$index].failureModes")
                }
                if (action.failureModes.isNotEmpty() && action.noKnownFailureRationale.isNotBlank()) {
                    add("actions[$index].failureModeConflict")
                }
                if (action.reversibility == ActionReversibility.NOT_ASSESSED) add("actions[$index].reversibility")
                if (action.reversibility in setOf(ActionReversibility.REVERSIBLE, ActionReversibility.COMPENSATABLE)) {
                    if (action.reverseActionId.isNullOrBlank() || action.reverseActionId !in actionIds) {
                        add("actions[$index].reverseActionId")
                    }
                }
                if (action.reversibility == ActionReversibility.IRREVERSIBLE && !action.reverseActionId.isNullOrBlank()) {
                    add("actions[$index].reverseActionConflict")
                }
                action.failureModes.forEachIndexed { failureIndex, failure ->
                    if (failure.id.isBlank()) add("actions[$index].failureModes[$failureIndex].id")
                    if (failure.trigger == null) add("actions[$index].failureModes[$failureIndex].trigger")
                    if (failure.description.isBlank()) add("actions[$index].failureModes[$failureIndex].description")
                    if (failure.effects.isEmpty()) add("actions[$index].failureModes[$failureIndex].effects")
                    if (failure.effects.any { it !in stateIds }) add("actions[$index].failureModes[$failureIndex].stateReferences")
                    if (failure.evidenceType.isBlank()) add("actions[$index].failureModes[$failureIndex].evidenceType")
                    if (!failure.terminal && (failure.recoveryActionId.isNullOrBlank() || failure.recoveryActionId !in actionIds)) {
                        add("actions[$index].failureModes[$failureIndex].recoveryActionId")
                    }
                }
            }
            spec.goals.forEachIndexed { index, goal ->
                if (goal.id.isBlank()) add("goals[$index].id")
                if (goal.description.isBlank()) add("goals[$index].description")
                if (goal.satisfiedBy.isEmpty()) add("goals[$index].satisfiedBy")
                if (goal.satisfiedBy.any { it !in stateIds }) add("goals[$index].stateReferences")
            }
            spec.policies.forEachIndexed { index, policy ->
                if (policy.id.isBlank()) add("policies[$index].id")
                if (policy.description.isBlank()) add("policies[$index].description")
                if (policy.expression.isBlank()) add("policies[$index].expression")
            }
        }.distinct()

        val generatedQuestions = missing.map { path ->
            when {
                path == "objective" -> "这个流程最终要实现的业务结果是什么？"
                path == "actors" -> "哪些人或 Agent 负责参与，各自职责是什么？"
                path == "states" -> "规划器需要判断哪些可观察状态，分别由什么证据证明？"
                path == "actions" -> "为达到目标可以执行哪些动作？"
                path == "goals" -> "什么可验证状态代表目标已经达成？"
                path.endsWith(".ownerRole") -> "每个动作分别由哪个角色负责？"
                path.endsWith(".effects") -> "动作成功后会产生哪些可观察状态？"
                path.endsWith(".failureHandling") -> "动作失败、超时或被拒绝时应如何处理？"
                path.endsWith(".failureModes") -> "这个动作可能失败、超时、被拒绝、取消或部分成功吗？每种情况产生什么可观察状态、证据，并由哪个恢复动作处理？若确实没有，请给出明确理由。"
                path.endsWith(".reversibility") -> "这个动作可撤销、需要补偿，还是业务上不可逆？"
                path.endsWith(".reverseActionId") -> "哪个已定义动作负责撤销或补偿这个动作？"
                path.endsWith(".recoveryActionId") -> "该异常由哪个已定义的恢复、重试、升级或人工介入动作处理？"
                path.endsWith(".conflictingEffects") -> "同一动作不能同时产生并删除同一个状态，请确认真实的状态迁移。"
                path.endsWith(".failureModeConflict") -> "不能同时声明异常列表和“无已知异常”，请选择真实情况。"
                path.endsWith(".reverseActionConflict") -> "不可逆动作不能再引用逆向动作，请确认业务语义。"
                path.endsWith(".evidenceType") || path.endsWith(".evidenceRequired") ->
                    "每个动作或状态需要留下什么证据？"
                path.endsWith(".semanticQuery") -> "这个状态由 Semantica 的哪个查询或规则判定？请给出稳定的语义表达式。"
                path.endsWith(".observerAction") -> "该状态为 UNKNOWN 时需要主动观察；哪个 Action 负责获得它的真实值？"
                path.endsWith(".stateReferences") -> "动作、目标引用的状态是否已经完整定义？"
                else -> "请补全 Spec 字段：$path。"
            }
        }
        val questions = (spec.openQuestions + generatedQuestions).filter(String::isNotBlank).distinct()
        return SpecReviewResult(
            spec = spec,
            missingFields = missing,
            clarificationQuestions = questions,
            readyToBuild = missing.isEmpty() && questions.isEmpty() && spec.status == InterviewSpecStatus.CONFIRMED,
        )
    }

    fun build(spec: InterviewSpec): SpecBuildResult {
        val review = review(spec)
        require(review.readyToBuild) {
            "Interview Spec is not ready: status=${spec.status}, missing=${review.missingFields}, openQuestions=${review.clarificationQuestions}"
        }
        val actionsByRole = spec.actions.groupBy { it.ownerRole }
        val model = SemanticGoapModel(
            id = spec.id,
            name = spec.title,
            description = spec.summary,
            version = spec.version,
            predicates = spec.states.map { state ->
                PredicateSpec(
                    id = state.id,
                    description = "${state.description}；证据：${state.evidenceRequired}",
                    closedWorld = true,
                    semanticQuery = state.semanticQuery,
                    unknownStrategy = state.unknownStrategy,
                    conflictStrategy = state.conflictStrategy,
                )
            },
            capabilities = spec.actions.map { action ->
                CapabilitySpec(
                    id = action.id,
                    description = "${action.description}；失败处理：${action.failureHandling}",
                    ownerRole = action.ownerRole,
                    executor = action.executor,
                    preconditions = action.preconditions,
                    effects = action.effects,
                    removes = action.removes,
                    observes = action.observes,
                    cost = action.cost,
                    idempotent = action.idempotent,
                    evidenceType = action.evidenceType,
                    failureModes = action.failureModes.map { failure ->
                        com.acme.enterprisegoap.model.FailureModeSpec(
                            id = failure.id,
                            trigger = requireNotNull(failure.trigger).name,
                            description = failure.description,
                            effects = failure.effects,
                            recoveryActionId = failure.recoveryActionId,
                            terminal = failure.terminal,
                            evidenceType = failure.evidenceType,
                        )
                    },
                    noKnownFailureRationale = action.noKnownFailureRationale,
                    reversibility = action.reversibility.name,
                    reverseActionId = action.reverseActionId,
                )
            },
            goals = spec.goals.map { GoalSpec(it.id, it.description, it.satisfiedBy, it.value) },
            roles = spec.actors.map { actor ->
                AgentRoleSpec(
                    id = actor.id,
                    description = "${actor.name}：${actor.responsibilities.joinToString("；")}",
                    capabilities = actionsByRole[actor.id].orEmpty().map { it.id }.toSet(),
                )
            },
            policies = spec.policies.map { PolicySpec(it.id, it.description, it.expression) },
            provenance = spec.confirmedClaims.map {
                SourceClaim(it, spec.id, 1.0, ClaimStatus.CONFIRMED)
            } + spec.rejectedClaims.map {
                SourceClaim(it, spec.id, 1.0, ClaimStatus.REJECTED)
            },
        )
        return SpecBuildResult(spec, review, model)
    }
}
