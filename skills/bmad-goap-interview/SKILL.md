---
name: bmad-goap-interview
description: Turn a vague business need into a user-confirmed, executable GOAP InterviewSpec through a BMAD-inspired multi-round interview. Use when discovering a workflow, clarifying goals and boundaries, defining actors/states/actions, pressure-testing exceptions, or preparing a GOAP model before validation, compilation, or execution.
---

# BMAD GOAP Interview

Convert fuzzy intent into a decision-complete GOAP contract. Treat the human as the decision owner and the agent as facilitator, analyst, adversarial reviewer, and specification editor.

Read [the InterviewSpec contract](references/interview-spec-contract.md) before producing or reviewing JSON.

## Run the clarity ladder

Move through these gates in order. Revisit an earlier gate whenever a later answer contradicts it.

1. **Intent** — Capture the desired business outcome, why it matters, the initiating event, explicit non-goals, and the person authorized to confirm the result.
2. **Evidence** — Identify actors, current process, source systems, policies, constraints, and examples or records that support claims. Put unverified claims in `assumptions`.
3. **Scenario map** — Describe the happy path, then run a pre-mortem. For every action examine failure, timeout, rejection, cancellation, partial success, business-rule blocking, duplicate submission, concurrency, authorization, missing evidence, and external-system outage.
4. **GOAP semantics** — Convert prose into observable states, actions with positive preconditions, success effects, stale-state removals, exception outcomes, recovery actions, goals, and policies. Do not encode prose-only branches that the planner cannot observe.
5. **Decision closure** — Record accepted answers in `confirmedClaims`, rejected proposals in `rejectedClaims`, and unresolved decisions in `openQuestions`. Ask the highest-leverage one to three questions per round.
6. **Contract confirmation** — Present a compact change summary and the complete spec. Keep `status: DRAFT` until the user explicitly confirms it. Then set `CONFIRMED` and run structural review again before building.

## Maintain the interview artifact

- Keep one complete `InterviewSpec` in the conversation; do not emit disconnected fragments as the canonical artifact.
- Increment `version` after every meaningful user answer or accepted correction.
- After each round, summarize: decisions added, assumptions added or removed, conflicts found, and remaining questions.
- Prefer concrete choices tied to consequences over generic questions such as “anything else?”.
- Never convert silence into approval or an assumption into a confirmed fact.
- Scale the number of rounds to risk and ambiguity. A small well-defined flow can pass quickly; irreversible or cross-system work needs deeper discovery.

## Pressure-test every action

For each action:

1. Confirm the owning human, agent, system, or team and the evidence proving execution.
2. Define success `effects` and facts invalidated by success in `removes`.
3. Enumerate realistic failure modes. Each mode needs a trigger, observable effect, evidence, and either a recovery action or `terminal: true`.
4. Classify reversibility as `REVERSIBLE`, `COMPENSATABLE`, or `IRREVERSIBLE`.
5. For reversible or compensatable work, reference a defined `reverseActionId`; the reverse action must remove invalidated facts and assert the resulting business state.
6. If no failure is known, require a specific `noKnownFailureRationale`; never use it as a shortcut around discovery.

## Enforce readiness

Do not build while any of these are true:

- a required field is absent;
- `openQuestions` is non-empty;
- an action lacks exception assessment or reversibility classification;
- a recovery or reverse action references an undefined action;
- a state has no evidence requirement;
- the user has not explicitly confirmed the full artifact.

Once ready, hand the confirmed spec to the GOAP review/build/validate/compile pipeline. Execute only when the user separately requests execution.

