import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

function parseJsonValue(value: JsonValue): JsonValue {
  let current = value
  for (let attempt = 0; attempt < 4 && typeof current === 'string'; attempt += 1) {
    const text = current.trim()
    if (!text) break
    try {
      current = JSON.parse(text) as JsonValue
    } catch {
      break
    }
  }
  return current
}

function normalizeTextList(value: JsonValue | undefined, preferredKeys: string[]): JsonValue[] {
  const parsed = parseJsonValue(value ?? [])
  if (!Array.isArray(parsed)) return []
  return parsed.map((item) => {
    if (typeof item === 'string') return item.trim()
    if (!item || typeof item !== 'object' || Array.isArray(item)) return String(item ?? '').trim()
    for (const key of preferredKeys) {
      const candidate = item[key]
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    }
    return JSON.stringify(item)
  }).filter(Boolean)
}

export function normalizeInterviewSpec(value: JsonValue): JsonValue {
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

export function normalizeSemanticModel(value: JsonValue): JsonValue {
  let parsed = parseJsonValue(value)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.model && !parsed.predicates) {
    parsed = parseJsonValue(parsed.model)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('SemanticGoapModel must be a JSON object, build result, or JSON-encoded object')
  }
  return parsed
}

async function postJson(baseUrl: string, path: string, body: JsonValue, signal: AbortSignal): Promise<JsonValue> {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const value = await response.json() as JsonValue
  if (!response.ok) throw new Error(`Semantic GOAP API ${response.status}: ${JSON.stringify(value)}`)
  return value
}

const jsonOutput = {
  schema: { type: 'json' as const },
  render: (_args: unknown, value: JsonValue) => [{ type: 'text' as const, text: JSON.stringify(value) }],
}

/**
 * Register the Semantic GOAP control plane as typed DSH tools.
 * Mount this from a DSH plugin after @deepseek-ai/dsh-tools is available.
 */
export function registerSemanticGoapTools(ctx: Context, baseUrl = 'http://127.0.0.1:8080') {
  ctx.tools.register(defineTool({
    name: 'semantic_goap_spec_review',
    description: 'Review the current versioned InterviewSpec and return structural gaps, including missing failure modes, recovery paths, removals, and reversibility decisions.',
    parameters: {
      spec: { type: 'json', required: true, description: 'Complete current InterviewSpec JSON' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson(baseUrl, '/api/interviews/spec/review', normalizeInterviewSpec(args.spec), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_build',
    description: 'Build a Semantic GOAP model only from a complete and explicitly confirmed InterviewSpec with exception and compensation semantics.',
    parameters: {
      spec: { type: 'json', required: true, description: 'Confirmed InterviewSpec with no unresolved questions' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson(baseUrl, '/api/interviews/spec/build', normalizeInterviewSpec(args.spec), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_validate',
    description: 'Validate predicate references, role ownership, executors, and goal reachability before compilation.',
    parameters: {
      model: { type: 'json', required: true, description: 'Semantic GOAP model returned by semantic_goap_build' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson(baseUrl, '/api/models/validate', normalizeSemanticModel(args.model), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_compile',
    description: 'Compile a validated Semantic GOAP model into an Embabel Agent summary.',
    parameters: {
      model: { type: 'json', required: true, description: 'Validated Semantic GOAP model' },
    },
    output: jsonOutput,
    timeoutMs: 30_000,
    execute: (args, exec) => postJson(baseUrl, '/api/models/compile', normalizeSemanticModel(args.model), exec.signal),
  }))

  ctx.tools.register(defineTool({
    name: 'semantic_goap_run',
    description: 'Execute a validated model toward one goal and return steps, replans, final state, and evidence.',
    parameters: {
      model: { type: 'json', required: true, description: 'Validated Semantic GOAP model' },
      goalId: { type: 'string', required: true, description: 'Goal identifier from the model' },
      initialPredicates: {
        type: 'array',
        items: { type: 'string' },
        description: 'Predicates already true before this run',
      },
    },
    output: jsonOutput,
    timeoutMs: 120_000,
    execute: (args, exec) => postJson(baseUrl, '/api/agents/run', {
      ...args,
      model: normalizeSemanticModel(args.model),
    } as JsonValue, exec.signal),
  }))
}
