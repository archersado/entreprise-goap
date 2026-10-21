import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'semantic-goap-tools'
export const inject = ['tools']

const baseUrl = process.env.GOAP_API_BASE_URL || 'http://127.0.0.1:18080'

function parseJsonValue(value) {
  let current = value
  for (let attempt = 0; attempt < 4 && typeof current === 'string'; attempt += 1) {
    const text = current.trim()
    if (!text) break
    try {
      current = JSON.parse(text)
    } catch {
      break
    }
  }
  return current
}

function normalizeTextList(value, preferredKeys) {
  const parsed = parseJsonValue(value)
  if (!Array.isArray(parsed)) return []
  return parsed.map((item) => {
    if (typeof item === 'string') return item.trim()
    if (!item || typeof item !== 'object' || Array.isArray(item)) return String(item ?? '').trim()
    for (const key of preferredKeys) {
      if (typeof item[key] === 'string' && item[key].trim()) return item[key].trim()
    }
    return JSON.stringify(item)
  }).filter(Boolean)
}

export function normalizeInterviewSpec(value) {
  const parsed = parseJsonValue(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('InterviewSpec must be a JSON object (a JSON-encoded object string is also accepted)')
  }
  return {
    ...parsed,
    assumptions: normalizeTextList(parsed.assumptions, ['description', 'assumption', 'text', 'value']),
    openQuestions: normalizeTextList(parsed.openQuestions, ['question', 'description', 'text', 'value']),
    confirmedClaims: normalizeTextList(parsed.confirmedClaims, ['claim', 'description', 'text', 'value']),
    rejectedClaims: normalizeTextList(parsed.rejectedClaims, ['claim', 'description', 'text', 'value']),
  }
}

export function normalizeSemanticModel(value) {
  let parsed = parseJsonValue(value)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.model && !parsed.predicates) {
    parsed = parseJsonValue(parsed.model)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('SemanticGoapModel must be a JSON object, build result, or JSON-encoded object')
  }
  return parsed
}

async function postJson(path, body, signal) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const value = await response.json()
  if (!response.ok) throw new Error(`Semantic GOAP API ${response.status}: ${JSON.stringify(value)}`)
  return value
}

function sessionId(exec) {
  return exec.agent?.sessionId ? String(exec.agent.sessionId) : undefined
}

function contextual(exec, key, value) {
  return { [key]: value, ...(sessionId(exec) ? { sessionId: sessionId(exec) } : {}) }
}

const jsonOutput = {
  schema: { type: 'json' },
  render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
}

export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'semantic_goap_scenario_current',
    description: 'Read the complete persisted scenario and latest version bound by the GUI to this CUI session. Call this first when the user switches a scenario, edits an older artifact into a new version, or asks to continue previous work.',
    parameters: {},
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (_args, exec) => {
      const currentSessionId = sessionId(exec)
      if (!currentSessionId) throw new Error('Current DSH session id is unavailable')
      return postJson('/api/scenarios/current', { sessionId: currentSessionId }, exec.signal)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_spec_review',
    description: 'Publish and review the current live InterviewSpec after every meaningful user answer. On the first answer, send a sparse DRAFT immediately (known fields plus empty undiscovered collections and openQuestions); do not design the whole domain first. This request/result drives the GUI. Later reviews require semanticQuery and projection strategy for every state, observing actions for OBSERVE, and exception/reversibility decisions. Never build while readyToBuild is false.',
    parameters: {
      spec: { type: 'json', required: true, description: 'Complete current InterviewSpec JSON, including open questions, confirmed/rejected claims, version and status' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson('/api/interviews/spec/review', contextual(exec, 'spec', normalizeInterviewSpec(args.spec)), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_build',
    description: 'Build a Semantic GOAP model from a complete, explicitly user-confirmed InterviewSpec, including exception outcomes, removals, and reverse or compensating actions. The server rejects draft specs, unresolved questions and structurally incomplete specs.',
    parameters: {
      spec: { type: 'json', required: true, description: 'InterviewSpec whose status is CONFIRMED and whose openQuestions is empty' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson('/api/interviews/spec/build', contextual(exec, 'spec', normalizeInterviewSpec(args.spec)), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_validate',
    description: 'Validate a candidate model. Explain every error and do not compile when valid is false.',
    parameters: {
      model: { type: 'json', required: true, description: 'Candidate model returned by semantic_goap_interview' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson('/api/models/validate', contextual(exec, 'model', normalizeSemanticModel(args.model)), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_compile',
    description: 'Compile a user-confirmed, validated GOAP model into an Embabel Agent summary.',
    parameters: {
      model: { type: 'json', required: true, description: 'Validated and user-confirmed model' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson('/api/models/compile', contextual(exec, 'model', normalizeSemanticModel(args.model)), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_project',
    description: 'Project a versioned Semantica four-valued snapshot into GOAP world state. Returns explicit FALSE, BLOCK, OBSERVE and ESCALATE decisions; never coerce UNKNOWN silently.',
    parameters: {
      model: { type: 'json', required: true, description: 'Validated Layer 1 semantic model' },
      snapshot: { type: 'json', required: true, description: 'Semantica snapshot with revision and facts using TRUE/FALSE/UNKNOWN/CONFLICT' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson('/api/semantic/project', {
      model: normalizeSemanticModel(args.model),
      snapshot: parseJsonValue(args.snapshot),
      ...(sessionId(exec) ? { sessionId: sessionId(exec) } : {}),
    }, exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_run',
    description: 'Execute one confirmed GOAP model. Explain the initial state, each chosen action and its preconditions/effects, evidence, and why replanning occurs after every step.',
    parameters: {
      model: { type: 'json', required: true, description: 'Validated and compiled GOAP model' },
      goalId: { type: 'string', required: true, description: 'Goal identifier' },
      initialPredicates: { type: 'array', items: { type: 'string' }, description: 'Facts already true before execution' },
      semanticSnapshot: { type: 'json', description: 'Optional versioned Semantica snapshot; supersedes initialPredicates' },
      outcomeOverrides: { type: 'json', description: 'MVP executor outcomes keyed by action id (asserted/retracted/observed); production executors return these directly' },
    },
    output: jsonOutput,
    timeoutMs: 120_000,
    execute: (args, exec) => postJson('/api/agents/run', {
      ...args,
      model: normalizeSemanticModel(args.model),
      ...(sessionId(exec) ? { sessionId: sessionId(exec) } : {}),
    }, exec.signal),
  }))
}
