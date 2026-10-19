package com.acme.enterprisegoap.compiler

import com.acme.enterprisegoap.capability.CapabilityRegistry
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.model.SemanticState
import com.acme.enterprisegoap.validation.SemanticGoapValidator
import com.embabel.agent.api.common.OperationContext
import com.embabel.agent.api.dsl.AgentBuilder
import com.embabel.agent.core.Agent
import com.embabel.agent.core.Condition
import com.embabel.plan.common.condition.ConditionDetermination
import org.springframework.stereotype.Component

data class CompiledAgent(
    val agent: Agent,
    val summary: CompiledAgentSummary,
)

data class CompiledAgentSummary(
    val name: String,
    val description: String,
    val actions: List<String>,
    val goals: List<String>,
    val conditions: List<String>,
)

class SemanticPredicateCondition(
    override val name: String,
    private val stateBinding: String,
) : Condition {
    override val cost: Double = 0.0

    override fun evaluate(context: OperationContext): ConditionDetermination {
        val state = context[stateBinding] as? SemanticState
        return ConditionDetermination(state?.truePredicates?.contains(name))
    }
}

@Component
class SemanticGoapCompiler(
    private val registry: CapabilityRegistry,
    private val validator: SemanticGoapValidator,
) {
    companion object {
        const val STATE_BINDING = "semanticState"
    }

    fun compile(model: SemanticGoapModel): CompiledAgent {
        val validation = validator.validate(model)
        require(validation.valid) { "Invalid semantic model: ${validation.errors.joinToString { it.message }}" }

        val builder = AgentBuilder(
            name = model.id,
            description = model.description,
        )
        val conditions = model.predicates.associate { predicate ->
            predicate.id to SemanticPredicateCondition(predicate.id, STATE_BINDING)
        }
        conditions.values.forEach { condition -> builder.condition { condition } }

        model.capabilities.forEach { capability ->
            builder.transformation<SemanticState, SemanticState>(
                name = capability.id,
                description = capability.description,
                pre = capability.preconditions.toList(),
                post = capability.effects.map(conditions::getValue),
                canRerun = false,
                inputVarName = STATE_BINDING,
                outputVarName = STATE_BINDING,
                cost = { capability.cost },
            ) { context ->
                registry.execute(capability.executor, context.input, capability)
            }
        }

        model.goals.forEach { goal ->
            builder.goal(
                name = goal.id,
                description = goal.description,
                pre = goal.satisfiedBy.map(conditions::getValue),
                value = { goal.value },
            )
        }

        val agent = builder.build()
        return CompiledAgent(
            agent = agent,
            summary = CompiledAgentSummary(
                name = agent.name,
                description = agent.description,
                actions = agent.actions.map { it.name }.sorted(),
                goals = agent.goals.map { it.name }.sorted(),
                conditions = agent.conditions.map { it.name }.sorted(),
            ),
        )
    }
}
