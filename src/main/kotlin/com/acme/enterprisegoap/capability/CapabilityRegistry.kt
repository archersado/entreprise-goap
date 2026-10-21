package com.acme.enterprisegoap.capability

import com.acme.enterprisegoap.model.CapabilitySpec
import com.acme.enterprisegoap.model.ActionOutcome
import com.acme.enterprisegoap.model.SemanticState
import org.springframework.stereotype.Component

fun interface CapabilityExecutor {
    fun execute(state: SemanticState, capability: CapabilitySpec): ActionOutcome
}

@Component
class CapabilityRegistry {
    private val executors = mutableMapOf<String, CapabilityExecutor>()

    init {
        register("demo:semantic-action") { _, capability ->
            ActionOutcome(asserted = capability.effects, retracted = capability.removes)
        }
        listOf(
            "capture_requirement",
            "approve_design",
            "implement_change",
            "verify_change",
            "package_release",
        ).forEach { actionId ->
            register("demo:$actionId") { _, capability ->
                ActionOutcome(asserted = capability.effects, retracted = capability.removes)
            }
        }
    }

    fun register(id: String, executor: CapabilityExecutor) {
        executors[id] = executor
    }

    fun contains(id: String) = executors.containsKey(id)

    fun execute(
        id: String,
        state: SemanticState,
        capability: CapabilitySpec,
        outcomeOverride: ActionOutcome? = null,
    ): SemanticState {
        val outcome = outcomeOverride ?: executors[id]?.execute(state, capability)
            ?: error("No executable capability registered for '$id'")
        return state.apply(capability, outcome)
    }
}
