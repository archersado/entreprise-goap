package com.acme.enterprisegoap.model

import java.time.Instant

data class SemanticGoapModel(
    val id: String,
    val name: String,
    val description: String,
    val predicates: List<PredicateSpec>,
    val capabilities: List<CapabilitySpec>,
    val goals: List<GoalSpec>,
    val roles: List<AgentRoleSpec> = emptyList(),
    val policies: List<PolicySpec> = emptyList(),
    val provenance: List<SourceClaim> = emptyList(),
)

data class PredicateSpec(
    val id: String,
    val description: String,
    val closedWorld: Boolean = true,
)

data class CapabilitySpec(
    val id: String,
    val description: String,
    val ownerRole: String,
    val executor: String,
    val preconditions: Set<String> = emptySet(),
    val effects: Set<String>,
    val removes: Set<String> = emptySet(),
    val cost: Double = 1.0,
    val idempotent: Boolean = true,
    val evidenceType: String,
    val failureModes: List<FailureModeSpec> = emptyList(),
    val noKnownFailureRationale: String = "",
    val reversibility: String = "NOT_ASSESSED",
    val reverseActionId: String? = null,
)

data class FailureModeSpec(
    val id: String,
    val trigger: String,
    val description: String,
    val effects: Set<String>,
    val recoveryActionId: String? = null,
    val terminal: Boolean = false,
    val evidenceType: String,
)

data class GoalSpec(
    val id: String,
    val description: String,
    val satisfiedBy: Set<String>,
    val value: Double = 1.0,
)

data class AgentRoleSpec(
    val id: String,
    val description: String,
    val capabilities: Set<String>,
)

data class PolicySpec(
    val id: String,
    val description: String,
    val expression: String,
)

data class SourceClaim(
    val sourceText: String,
    val targetId: String,
    val confidence: Double,
    val status: ClaimStatus,
)

enum class ClaimStatus { EXTRACTED, CONFIRMED, REJECTED }

data class SemanticState(
    val truePredicates: Set<String> = emptySet(),
    val evidence: List<Evidence> = emptyList(),
) {
    fun satisfies(predicates: Set<String>) = truePredicates.containsAll(predicates)

    fun transition(capability: CapabilitySpec): SemanticState = copy(
        truePredicates = (truePredicates - capability.removes) + capability.effects,
        evidence = evidence + Evidence(
            capabilityId = capability.id,
            type = capability.evidenceType,
            summary = "${capability.id} asserted ${capability.effects.sorted()}" +
                if (capability.removes.isEmpty()) "" else " and retracted ${capability.removes.sorted()}",
        ),
    )
}

data class Evidence(
    val capabilityId: String,
    val type: String,
    val summary: String,
    val at: Instant = Instant.now(),
)
