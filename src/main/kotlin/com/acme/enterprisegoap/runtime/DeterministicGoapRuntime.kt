package com.acme.enterprisegoap.runtime

import com.acme.enterprisegoap.capability.CapabilityRegistry
import com.acme.enterprisegoap.model.CapabilitySpec
import com.acme.enterprisegoap.model.ActionOutcome
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.model.SemanticState
import com.acme.enterprisegoap.model.SemanticTruth
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
    val observes: Set<String>,
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
    val termination: RunTermination = if (achieved) RunTermination.ACHIEVED else RunTermination.NO_PLAN,
    val pendingPredicates: Set<String> = emptySet(),
)

enum class RunTermination { ACHIEVED, NO_PLAN, AWAITING_OBSERVATION, BLOCKED, ESCALATION_REQUIRED, STEP_LIMIT }

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
        outcomeOverrides: Map<String, ActionOutcome> = emptyMap(),
        blockedPredicates: Set<String> = emptySet(),
        escalationRequired: Set<String> = emptySet(),
        maxSteps: Int = 100,
    ): RunResult {
        val goal = model.goals.firstOrNull { it.id == goalId } ?: error("Unknown goal '$goalId'")
        var state = initialState
        val steps = mutableListOf<RunStep>()
        var replans = 0

        if (escalationRequired.isNotEmpty()) return stopped(
            goalId, goal.satisfiedBy, initialState, state, steps, replans,
            RunTermination.ESCALATION_REQUIRED, escalationRequired,
        )

        while (!state.satisfies(goal.satisfiedBy)) {
            if (steps.size >= maxSteps) return stopped(
                goalId, goal.satisfiedBy, initialState, state, steps, replans,
                RunTermination.STEP_LIMIT, goal.satisfiedBy - state.truePredicates,
            )
            val plan = plan(model.capabilities, state, goal.satisfiedBy, blockedPredicates)
                ?: return stopped(
                    goalId, goal.satisfiedBy, initialState, state, steps, replans,
                    if (blockedPredicates.isNotEmpty()) RunTermination.BLOCKED
                    else RunTermination.NO_PLAN,
                    goal.satisfiedBy - state.truePredicates,
                )
            val action = plan.firstOrNull() ?: return stopped(
                goalId, goal.satisfiedBy, initialState, state, steps, replans,
                RunTermination.NO_PLAN, goal.satisfiedBy - state.truePredicates,
            )
            val before = state.truePredicates
            val beforeTruth = state.truthValues
            val missingBefore = goal.satisfiedBy - before
            state = registry.execute(action.executor, state, action, outcomeOverrides[action.id])
            val remaining = goal.satisfiedBy - state.truePredicates
            steps += RunStep(
                sequence = steps.size + 1,
                capabilityId = action.id,
                ownerRole = action.ownerRole,
                plan = plan.map { it.id },
                preconditions = action.preconditions,
                effects = action.effects,
                removes = action.removes,
                observes = action.observes,
                before = before,
                after = state.truePredicates,
                missingGoalPredicatesBefore = missingBefore,
                remainingGoalPredicates = remaining,
                selectedBecause = "All preconditions ${action.preconditions.sorted()} are satisfied; " +
                    "this is the first action in the shortest plan ${plan.map { it.id }} toward ${goal.satisfiedBy.sorted()}.",
            )
            replans++
            val unresolvedObservations = action.observes.filter {
                state.truthValues[it] in setOf(null, SemanticTruth.UNKNOWN, SemanticTruth.CONFLICT)
            }.toSet()
            if (unresolvedObservations.isNotEmpty() && state.truthValues == beforeTruth) {
                return stopped(
                    goalId, goal.satisfiedBy, initialState, state, steps, replans,
                    RunTermination.AWAITING_OBSERVATION, unresolvedObservations,
                )
            }
        }
        return RunResult(
            goalId = goalId,
            goalPredicates = goal.satisfiedBy,
            achieved = true,
            initialState = initialState,
            finalState = state,
            steps = steps,
            replans = replans,
            termination = RunTermination.ACHIEVED,
        )
    }

    private fun plan(
        actions: List<CapabilitySpec>,
        initialState: SemanticState,
        goal: Set<String>,
        blockedPredicates: Set<String>,
    ): List<CapabilitySpec>? {
        val initial = initialState.truePredicates
        if (initial.containsAll(goal)) return emptyList()
        data class Node(val facts: Set<String>, val path: List<CapabilitySpec>)
        val queue = ArrayDeque<Node>()
        val visited = mutableSetOf(initial)
        queue += Node(initial, emptyList())

        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            actions.asSequence()
                .filter { action -> (action.preconditions + action.observes).none(blockedPredicates::contains) }
                .filter { node.facts.containsAll(it.preconditions) }
                .filter { action ->
                    action.observes.isEmpty() || action.observes.any {
                        initialState.truthValues[it] in setOf(null, SemanticTruth.UNKNOWN, SemanticTruth.CONFLICT)
                    }
                }
                .filterNot { node.facts.containsAll(it.effects + it.observes) && it.removes.none(node.facts::contains) }
                .forEach { action ->
                    // Observation is optimistic only inside search. Runtime commits the executor's actual truth value.
                    val nextFacts = (node.facts - action.removes) + action.effects + action.observes
                    val nextPath = node.path + action
                    if (nextFacts.containsAll(goal)) return nextPath
                    if (visited.add(nextFacts)) queue += Node(nextFacts, nextPath)
                }
        }
        return null
    }

    private fun stopped(
        goalId: String,
        goal: Set<String>,
        initial: SemanticState,
        current: SemanticState,
        steps: List<RunStep>,
        replans: Int,
        termination: RunTermination,
        pending: Set<String>,
    ) = RunResult(
        goalId = goalId,
        goalPredicates = goal,
        achieved = false,
        initialState = initial,
        finalState = current,
        steps = steps,
        replans = replans,
        termination = termination,
        pendingPredicates = pending,
    )
}
