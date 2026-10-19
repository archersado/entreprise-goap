package com.acme.enterprisegoap.validation

import com.acme.enterprisegoap.capability.CapabilityRegistry
import com.acme.enterprisegoap.model.SemanticGoapModel
import org.springframework.stereotype.Component

data class ValidationIssue(val path: String, val message: String)

data class ValidationResult(
    val errors: List<ValidationIssue>,
    val warnings: List<ValidationIssue> = emptyList(),
) {
    val valid: Boolean get() = errors.isEmpty()
}

@Component
class SemanticGoapValidator(private val registry: CapabilityRegistry) {
    fun validate(model: SemanticGoapModel): ValidationResult {
        val errors = mutableListOf<ValidationIssue>()
        val warnings = mutableListOf<ValidationIssue>()
        val predicates = model.predicates.map { it.id }.toSet()
        val capabilities = model.capabilities.map { it.id }.toSet()
        val capabilitiesById = model.capabilities.associateBy { it.id }
        val roles = model.roles.map { it.id }.toSet()

        duplicateIds(model.predicates.map { it.id }).forEach {
            errors += ValidationIssue("predicates", "duplicate predicate '$it'")
        }
        duplicateIds(model.capabilities.map { it.id }).forEach {
            errors += ValidationIssue("capabilities", "duplicate capability '$it'")
        }
        duplicateIds(model.goals.map { it.id }).forEach {
            errors += ValidationIssue("goals", "duplicate goal '$it'")
        }

        model.capabilities.forEachIndexed { index, capability ->
            val negatedPreconditions = capability.preconditions.filter(::isNegatedPredicate)
            negatedPreconditions.forEach {
                errors += ValidationIssue(
                    "capabilities[$index].preconditions",
                    "negative predicate syntax '$it' is not supported; model an explicit positive state instead",
                )
            }
            (capability.preconditions.filterNot(::isNegatedPredicate) + capability.effects + capability.removes)
                .filterNot(predicates::contains).forEach {
                errors += ValidationIssue("capabilities[$index]", "unknown predicate '$it'")
            }
            (capability.effects intersect capability.removes).forEach {
                errors += ValidationIssue("capabilities[$index]", "predicate '$it' cannot be asserted and retracted by the same action")
            }
            if (capability.ownerRole !in roles) {
                errors += ValidationIssue("capabilities[$index].ownerRole", "unknown role '${capability.ownerRole}'")
            }
            if (!registry.contains(capability.executor)) {
                errors += ValidationIssue("capabilities[$index].executor", "unbound executor '${capability.executor}'")
            }
            if (capability.effects.isEmpty()) {
                errors += ValidationIssue("capabilities[$index].effects", "an action must assert at least one observable effect")
            }
            if (capability.failureModes.isEmpty() && capability.noKnownFailureRationale.isBlank()) {
                errors += ValidationIssue("capabilities[$index].failureModes", "failure modes must be modeled or explicitly ruled out with a rationale")
            }
            if (capability.failureModes.isNotEmpty() && capability.noKnownFailureRationale.isNotBlank()) {
                errors += ValidationIssue("capabilities[$index].failureModes", "failure modes and noKnownFailureRationale are mutually exclusive")
            }
            if (capability.reversibility == "NOT_ASSESSED") {
                errors += ValidationIssue("capabilities[$index].reversibility", "reversibility must be assessed")
            }
            if (capability.reversibility in setOf("REVERSIBLE", "COMPENSATABLE")) {
                val reverse = capability.reverseActionId?.let(capabilitiesById::get)
                if (reverse == null) {
                    errors += ValidationIssue("capabilities[$index].reverseActionId", "a reversible or compensatable action must reference a defined reverse action")
                } else if ((reverse.removes intersect capability.effects).isEmpty()) {
                    warnings += ValidationIssue("capabilities[$index].reverseActionId", "reverse action '${reverse.id}' does not retract any successful effect of '${capability.id}'")
                }
            }
            if (capability.reversibility == "IRREVERSIBLE" && capability.reverseActionId != null) {
                errors += ValidationIssue("capabilities[$index].reverseActionId", "an irreversible action cannot reference a reverse action")
            }
            duplicateIds(capability.failureModes.map { it.id }).forEach {
                errors += ValidationIssue("capabilities[$index].failureModes", "duplicate failure mode '$it'")
            }
            capability.failureModes.forEachIndexed { failureIndex, failure ->
                failure.effects.filterNot(predicates::contains).forEach {
                    errors += ValidationIssue("capabilities[$index].failureModes[$failureIndex]", "unknown predicate '$it'")
                }
                if (failure.effects.isEmpty()) {
                    errors += ValidationIssue("capabilities[$index].failureModes[$failureIndex].effects", "a failure mode must assert an observable exception state")
                }
                if (!failure.terminal) {
                    val recovery = failure.recoveryActionId?.let(capabilitiesById::get)
                    if (recovery == null) {
                        errors += ValidationIssue("capabilities[$index].failureModes[$failureIndex].recoveryActionId", "a non-terminal failure mode must reference a defined recovery action")
                    } else if ((recovery.preconditions intersect failure.effects).isEmpty()) {
                        warnings += ValidationIssue("capabilities[$index].failureModes[$failureIndex].recoveryActionId", "recovery action '${recovery.id}' is not gated by the exception state ${failure.effects.sorted()}")
                    }
                }
            }
        }

        model.roles.forEachIndexed { index, role ->
            role.capabilities.filterNot(capabilities::contains).forEach {
                errors += ValidationIssue("roles[$index].capabilities", "unknown capability '$it'")
            }
        }

        model.goals.forEachIndexed { index, goal ->
            goal.satisfiedBy.filterNot(predicates::contains).forEach {
                errors += ValidationIssue("goals[$index]", "unknown predicate '$it'")
            }
            val producible = model.capabilities.flatMap { it.effects }.toSet()
            goal.satisfiedBy.filterNot(producible::contains).forEach {
                warnings += ValidationIssue("goals[$index]", "predicate '$it' has no producing capability")
            }
        }

        return ValidationResult(errors, warnings)
    }

    private fun duplicateIds(ids: List<String>) = ids.groupingBy { it }.eachCount().filterValues { it > 1 }.keys

    private fun isNegatedPredicate(value: String): Boolean {
        val normalized = value.trim()
        return normalized.startsWith("!") ||
            normalized.startsWith("NOT ", ignoreCase = true) ||
            normalized.startsWith("NOT(", ignoreCase = true)
    }
}
