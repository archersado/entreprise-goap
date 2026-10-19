package com.acme.enterprisegoap.runtime

import com.acme.enterprisegoap.capability.CapabilityRegistry
import com.acme.enterprisegoap.model.CapabilitySpec
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.model.SemanticState
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.ArrayDeque

data class RunStep(
    val sequence: Int,
    val capabilityId: String,
    val ownerRole: String,
    val plan: List<String>,
    val preconditions: Set<String>,
    val effects: Set<String>,
    val removes: Set<String>,
    val before: Set<String>,
    val after: Set<String>,
    val missingGoalPredicatesBefore: Set<String>,
    val remainingGoalPredicates: Set<String>,
    val selectedBecause: String,
    val at: Instant = Instant.now(),
)

data class RunResult(
    val goalId: String,
    val goalPredicates: Set<String>,
    val achieved: Boolean,
    val initialState: SemanticState,
    val finalState: SemanticState,
    val steps: List<RunStep>,
    val replans: Int,
)

/**
 * Small transparent executor for the MVP. It replans after every action, which
 * makes outcome checking explicit. The compiled Embabel Agent is the production
 * boundary; this runner keeps the demo model/provider independent and testable.
 */
@Component
class DeterministicGoapRuntime(private val registry: CapabilityRegistry) {
    fun run(
        model: SemanticGoapModel,
        goalId: String,
        initialState: SemanticState = SemanticState(),
    ): RunResult {
        val goal = model.goals.firstOrNull { it.id == goalId } ?: error("Unknown goal '$goalId'")
        var state = initialState
        val steps = mutableListOf<RunStep>()
        var replans = 0

        while (!state.satisfies(goal.satisfiedBy)) {
            val plan = plan(model.capabilities, state.truePredicates, goal.satisfiedBy)
                ?: return RunResult(
                    goalId = goalId,
                    goalPredicates = goal.satisfiedBy,
                    achieved = false,
                    initialState = initialState,
                    finalState = state,
                    steps = steps,
                    replans = replans,
                )
            val action = plan.firstOrNull() ?: return RunResult(
                goalId = goalId,
                goalPredicates = goal.satisfiedBy,
                achieved = false,
                initialState = initialState,
                finalState = state,
                steps = steps,
                replans = replans,
            )
            val before = state.truePredicates
            val missingBefore = goal.satisfiedBy - before
            state = registry.execute(action.executor, state, action)
            val remaining = goal.satisfiedBy - state.truePredicates
            steps += RunStep(
                sequence = steps.size + 1,
                capabilityId = action.id,
                ownerRole = action.ownerRole,
                plan = plan.map { it.id },
                preconditions = action.preconditions,
                effects = action.effects,
                removes = action.removes,
                before = before,
                after = state.truePredicates,
                missingGoalPredicatesBefore = missingBefore,
                remainingGoalPredicates = remaining,
                selectedBecause = "All preconditions ${action.preconditions.sorted()} are satisfied; " +
                    "this is the first action in the shortest plan ${plan.map { it.id }} toward ${goal.satisfiedBy.sorted()}.",
            )
            replans++
        }
        return RunResult(
            goalId = goalId,
            goalPredicates = goal.satisfiedBy,
            achieved = true,
            initialState = initialState,
            finalState = state,
            steps = steps,
            replans = replans,
        )
    }

    private fun plan(
        actions: List<CapabilitySpec>,
        initial: Set<String>,
        goal: Set<String>,
    ): List<CapabilitySpec>? {
        if (initial.containsAll(goal)) return emptyList()
        data class Node(val facts: Set<String>, val path: List<CapabilitySpec>)
        val queue = ArrayDeque<Node>()
        val visited = mutableSetOf(initial)
        queue += Node(initial, emptyList())

        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            actions.asSequence()
                .filter { node.facts.containsAll(it.preconditions) }
                .filterNot { node.facts.containsAll(it.effects) && it.removes.none(node.facts::contains) }
                .forEach { action ->
                    val nextFacts = (node.facts - action.removes) + action.effects
                    val nextPath = node.path + action
                    if (nextFacts.containsAll(goal)) return nextPath
                    if (visited.add(nextFacts)) queue += Node(nextFacts, nextPath)
                }
        }
        return null
    }
}
