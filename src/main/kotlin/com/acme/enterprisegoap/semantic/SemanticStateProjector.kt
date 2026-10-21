package com.acme.enterprisegoap.semantic

import com.acme.enterprisegoap.model.Evidence
import com.acme.enterprisegoap.model.ProjectionStrategy
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.model.SemanticState
import com.acme.enterprisegoap.model.SemanticTruth
import org.springframework.stereotype.Component

data class SemanticFact(
    val predicateId: String,
    val value: SemanticTruth,
    val evidence: String = "",
)

data class SemanticSnapshot(
    val revision: Long = 0,
    val facts: List<SemanticFact> = emptyList(),
)

data class ProjectionDecision(
    val predicateId: String,
    val semanticValue: SemanticTruth,
    val strategy: ProjectionStrategy?,
    val projectedTrue: Boolean,
    val reason: String,
)

data class ProjectedWorldState(
    val revision: Long,
    val state: SemanticState,
    val blockedPredicates: Set<String>,
    val observationRequired: Set<String>,
    val escalationRequired: Set<String>,
    val decisions: List<ProjectionDecision>,
)

@Component
class SemanticStateProjector {
    fun project(model: SemanticGoapModel, snapshot: SemanticSnapshot): ProjectedWorldState {
        val supplied = snapshot.facts.associateBy { it.predicateId }
        val decisions = model.predicates.map { predicate ->
            val value = supplied[predicate.id]?.value ?: SemanticTruth.UNKNOWN
            val strategy = when (value) {
                SemanticTruth.UNKNOWN -> predicate.unknownStrategy
                SemanticTruth.CONFLICT -> predicate.conflictStrategy
                else -> null
            }
            ProjectionDecision(
                predicateId = predicate.id,
                semanticValue = value,
                strategy = strategy,
                projectedTrue = value == SemanticTruth.TRUE,
                reason = when (value) {
                    SemanticTruth.TRUE -> "Semantica evaluated the predicate as TRUE."
                    SemanticTruth.FALSE -> "Semantica evaluated the predicate as FALSE."
                    SemanticTruth.UNKNOWN -> "UNKNOWN is handled by ${predicate.unknownStrategy}."
                    SemanticTruth.CONFLICT -> "CONFLICT is handled by ${predicate.conflictStrategy}."
                },
            )
        }
        fun selected(strategy: ProjectionStrategy) = decisions
            .filter { it.strategy == strategy }
            .map { it.predicateId }
            .toSet()
        val truthValues = decisions.associate { it.predicateId to it.semanticValue }
        return ProjectedWorldState(
            revision = snapshot.revision,
            state = SemanticState(
                truePredicates = decisions.filter { it.projectedTrue }.map { it.predicateId }.toSet(),
                truthValues = truthValues,
                evidence = snapshot.facts.filter { it.evidence.isNotBlank() }.map {
                    Evidence("semantica@${snapshot.revision}", "semantic_fact", "${it.predicateId}: ${it.evidence}")
                },
            ),
            blockedPredicates = selected(ProjectionStrategy.BLOCK),
            observationRequired = selected(ProjectionStrategy.OBSERVE),
            escalationRequired = selected(ProjectionStrategy.ESCALATE),
            decisions = decisions,
        )
    }
}
