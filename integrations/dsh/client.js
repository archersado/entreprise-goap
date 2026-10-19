window.__ModuleLoader__.load({
  id: 'enterprise-semantic-goap-dsh',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { jsx, jsxs } = require('react/jsx-runtime')

    const inject = ['slots']
    const stages = [
      { id: 'interview', label: '业务访谈', hint: '澄清目标与边界', marker: 'semantic_goap_spec_review' },
      { id: 'spec', label: '确认 Spec', hint: '补全并确认语义', marker: 'semantic_goap_build' },
      { id: 'build', label: '构建模型', hint: '生成状态与动作图', marker: 'semantic_goap_validate' },
      { id: 'compile', label: '校验编译', hint: '绑定可执行能力', marker: 'semantic_goap_compile' },
      { id: 'run', label: '规划运行', hint: '执行并持续重规划', marker: 'semantic_goap_run' },
    ]

    const css = `
      :root {
        --goap-accent: #2f7d68;
        --goap-accent-soft: color-mix(in srgb, var(--goap-accent) 14%, transparent);
        --goap-line: color-mix(in srgb, var(--goap-accent) 30%, var(--dsw-alias-border-l1));
      }
      [class*="titleGroup"] > span:first-child,
      [class*="titleGroup"] > span:last-child { display: none !important; }
      [class*="titleGroup"]::before {
        content: "企业 GOAP 工作台";
        color: var(--dsw-alias-label-primary);
        font-size: 28px;
        font-weight: 650;
        letter-spacing: -.02em;
      }
      [class*="titleGroup"]::after {
        content: "从业务访谈到可审计运行";
        color: var(--dsw-alias-label-tertiary);
        display: block;
        font-size: 12px;
        font-weight: 400;
        letter-spacing: .04em;
        margin-top: 6px;
      }
      .goap-brand-mark {
        align-items: center;
        background: linear-gradient(145deg, #2f7d68, #173f36);
        border: 1px solid color-mix(in srgb, white 18%, transparent);
        border-radius: 8px;
        box-shadow: 0 6px 18px color-mix(in srgb, var(--goap-accent) 24%, transparent);
        color: white;
        display: inline-flex;
        flex: none;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-weight: 800;
        justify-content: center;
        line-height: 1;
      }
      .goap-brand-name {
        align-items: baseline;
        color: var(--dsw-alias-label-primary);
        display: inline-flex;
        font-size: 14px;
        font-weight: 650;
        gap: 7px;
        white-space: nowrap;
      }
      .goap-brand-name small {
        color: var(--goap-accent);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: .12em;
      }
      .goap-workflow {
        box-sizing: border-box;
        margin: 0 auto 12px;
        max-width: var(--dsh-composer-card-max-width, 760px);
        padding: 0 4px;
        width: 100%;
      }
      .goap-workflow__header {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin: 0 2px 9px;
      }
      .goap-workflow__eyebrow {
        color: var(--dsw-alias-label-secondary);
        font-size: 11px;
        font-weight: 650;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .goap-workflow__mode {
        align-items: center;
        color: var(--goap-accent);
        display: inline-flex;
        font-size: 11px;
        gap: 6px;
      }
      .goap-workflow__mode::before {
        background: currentColor;
        border-radius: 50%;
        box-shadow: 0 0 0 4px var(--goap-accent-soft);
        content: "";
        height: 6px;
        width: 6px;
      }
      .goap-workflow__rail {
        background: color-mix(in srgb, var(--dsw-specific-menu) 84%, transparent);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 14px;
        box-shadow: var(--dsw-elevation-panel);
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        overflow: hidden;
      }
      .goap-graph {
        background: color-mix(in srgb, var(--dsw-specific-menu) 88%, transparent);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 14px;
        box-shadow: var(--dsw-elevation-panel);
        margin-top: 10px;
        overflow: hidden;
      }
      .goap-graph__toolbar {
        align-items: center;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
        display: flex;
        justify-content: space-between;
        min-height: 38px;
        padding: 0 10px 0 12px;
      }
      .goap-graph__tabs { align-items: center; display: flex; gap: 4px; }
      .goap-graph__tab,
      .goap-graph__toggle {
        border: 0;
        color: var(--dsw-alias-label-tertiary);
        cursor: pointer;
        font: inherit;
      }
      .goap-graph__tab {
        background: transparent;
        border-radius: 7px;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 9px;
      }
      .goap-graph__tab:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .goap-graph__tab[aria-selected="true"] {
        background: var(--goap-accent-soft);
        color: var(--goap-accent);
      }
      .goap-graph__toggle { background: transparent; font-size: 11px; padding: 6px; }
      .goap-graph__meta {
        color: var(--dsw-alias-label-tertiary);
        font-size: 10px;
        margin-left: 7px;
      }
      .goap-graph__run-nav { align-items: center; display: inline-flex; gap: 3px; margin-left: 5px; }
      .goap-graph__run-nav button {
        background: transparent;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 6px;
        color: var(--dsw-alias-label-secondary);
        cursor: pointer;
        font-size: 10px;
        min-width: 22px;
        padding: 3px 5px;
      }
      .goap-graph__run-nav button:disabled { cursor: default; opacity: .35; }
      .goap-graph__viewport {
        height: 278px;
        overflow: auto;
        overscroll-behavior: contain;
      }
      .goap-graph__viewport svg {
        display: block;
        height: 100%;
        min-width: 760px;
        width: 100%;
      }
      .goap-graph__empty {
        align-items: center;
        color: var(--dsw-alias-label-tertiary);
        display: flex;
        flex-direction: column;
        font-size: 12px;
        gap: 7px;
        height: 100%;
        justify-content: center;
        text-align: center;
      }
      .goap-graph__empty strong { color: var(--dsw-alias-label-secondary); font-size: 13px; }
      .goap-graph__legend {
        align-items: center;
        border-top: 1px solid var(--dsw-alias-border-l1);
        color: var(--dsw-alias-label-tertiary);
        display: flex;
        flex-wrap: wrap;
        font-size: 9px;
        gap: 10px;
        min-height: 25px;
        padding: 0 12px;
      }
      .goap-graph__legend i { border-radius: 50%; display: inline-block; height: 6px; margin-right: 4px; width: 6px; }
      .goap-graph[data-collapsed="true"] .goap-graph__viewport,
      .goap-graph[data-collapsed="true"] .goap-graph__legend { display: none; }
      .goap-stage {
        min-width: 0;
        padding: 12px 11px 11px;
        position: relative;
      }
      .goap-stage + .goap-stage::before {
        background: var(--dsw-alias-border-l1);
        content: "";
        height: 34px;
        left: 0;
        position: absolute;
        top: 14px;
        width: 1px;
      }
      .goap-stage__top { align-items: center; display: flex; gap: 7px; }
      .goap-stage__number {
        align-items: center;
        background: var(--dsw-alias-fill-tertiary);
        border-radius: 50%;
        color: var(--dsw-alias-label-tertiary);
        display: inline-flex;
        flex: none;
        font-size: 10px;
        font-weight: 700;
        height: 20px;
        justify-content: center;
        width: 20px;
      }
      .goap-stage__label {
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .goap-stage__hint {
        color: var(--dsw-alias-label-tertiary);
        font-size: 10px;
        margin: 5px 0 0 27px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .goap-stage[data-state="done"] .goap-stage__number {
        background: var(--goap-accent);
        color: white;
      }
      .goap-stage[data-state="done"] .goap-stage__number::before { content: "✓"; }
      .goap-stage[data-state="done"] .goap-stage__number { font-size: 0; }
      .goap-stage[data-state="done"] .goap-stage__number::before { font-size: 11px; }
      .goap-stage[data-state="done"] .goap-stage__label { color: var(--goap-accent); }
      .goap-stage[data-state="active"] { background: var(--goap-accent-soft); }
      .goap-stage[data-state="active"] .goap-stage__number {
        background: var(--goap-accent);
        box-shadow: 0 0 0 4px var(--goap-accent-soft);
        color: white;
      }
      .goap-stage[data-state="active"] .goap-stage__label { color: var(--dsw-alias-label-primary); }
      @media (max-width: 720px) {
        .goap-workflow__rail { grid-template-columns: 1fr; }
        .goap-stage { display: none; }
        .goap-stage[data-state="active"], .goap-stage[data-state="done"]:last-of-type { display: block; }
        .goap-stage + .goap-stage::before { display: none; }
        .goap-graph__viewport { height: 230px; }
      }
    `

    function parseJson(value) {
      if (!value) return null
      if (typeof value === 'object') return value
      if (typeof value !== 'string') return null
      try {
        const parsed = JSON.parse(value)
        return typeof parsed === 'string' ? parseJson(parsed) : parsed
      } catch { return null }
    }

    function textResult(block) {
      if (!Array.isArray(block?.content)) return null
      const text = block.content
        .filter((item) => item?.type === 'text' && typeof item.text === 'string')
        .map((item) => item.text)
        .join('\n')
      return parseJson(text)
    }

    function collectCalls(chat) {
      const calls = []
      const visit = (block) => {
        if (!block) return
        const call = block.call || block
        const name = call?.name
        if (name) calls.push({
          name,
          args: parseJson(call.argsRaw),
          result: block.kind === 'tool-result' ? textResult(block) : null,
          seq: Number(block.seq || block.time || 0),
          running: block.kind !== 'tool-result',
        })
        ;(block.subCalls || []).forEach(visit)
      }
      if (chat) chat.nodes.values().forEach((node) => visit(node?.data?.root))
      return calls.sort((a, b) => a.seq - b.seq)
    }

    function latestGoapData(chat) {
      const calls = collectCalls(chat)
      let spec = null
      let model = null
      let run = null
      let runPending = false
      const runs = []
      for (const call of calls) {
        if (call.name === 'semantic_goap_spec_review') spec = parseJson(call.args?.spec) || spec
        if (call.name === 'semantic_goap_build') {
          spec = parseJson(call.result?.spec) || parseJson(call.args?.spec) || spec
          model = parseJson(call.result?.model) || model
        }
        if (['semantic_goap_validate', 'semantic_goap_compile', 'semantic_goap_run'].includes(call.name)) {
          // Prefer the authoritative build artifact. Later run calls may carry
          // temporary fault-injection variants that must not rewrite the Spec graph.
          model = model || parseJson(call.args?.model)
        }
        if (call.name === 'semantic_goap_run') {
          run = call.result || null
          runPending = call.running
          if (call.result) runs.push(call.result)
        }
      }
      return { calls, spec, model, run, runs, runPending }
    }

    function short(value, limit = 28) {
      const text = String(value || '')
      return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
    }

    function svgNode({ x, y, width = 185, height = 34, fill, stroke, title, subtitle, key }) {
      return jsxs('g', {
        transform: `translate(${x} ${y})`,
        role: 'img',
        'aria-label': `${title}${subtitle ? `, ${subtitle}` : ''}`,
        children: [
          jsx('rect', { width, height, rx: 8, fill, stroke, strokeWidth: 1 }),
          jsx('text', { x: 10, y: subtitle ? 14 : 21, fill: 'var(--dsw-alias-label-primary)', fontSize: 10, fontWeight: 650, children: short(title, 29) }),
          subtitle ? jsx('text', { x: 10, y: 27, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 8, children: short(subtitle, 34) }) : null,
        ],
      }, key)
    }

    function predicateDetails(item) {
      const raw = String(item.description || '')
      const marker = '；证据：'
      const markerIndex = raw.indexOf(marker)
      return {
        meaning: markerIndex >= 0 ? raw.slice(0, markerIndex) : raw || item.id,
        evidence: item.evidenceRequired || (markerIndex >= 0 ? raw.slice(markerIndex + marker.length) : '') || (item.closedWorld ? '闭世界可判定' : '待定义'),
      }
    }

    function svgPredicateNode({ item, x, y, key }) {
      const details = predicateDetails(item)
      const expression = `${item.id} = TRUE`
      return jsxs('g', {
        transform: `translate(${x} ${y})`,
        role: 'img',
        'aria-label': `语义谓词 ${expression}，${details.meaning}，证据 ${details.evidence}`,
        children: [
          jsx('title', { children: `谓词: ${expression}\n业务语义: ${details.meaning}\n证据: ${details.evidence}` }),
          jsx('rect', { width: 250, height: 54, rx: 8, fill: 'color-mix(in srgb, #59647a 14%, var(--dsw-specific-menu))', stroke: 'color-mix(in srgb, #8b93a7 55%, transparent)', strokeWidth: 1 }),
          jsx('text', { x: 10, y: 13, fill: '#8b93a7', fontSize: 7.5, fontWeight: 750, letterSpacing: .45, children: 'SEMANTIC PREDICATE' }),
          jsx('text', { x: 10, y: 28, fill: 'var(--dsw-alias-label-primary)', fontSize: 10, fontWeight: 700, children: short(expression, 38) }),
          jsx('text', { x: 10, y: 41, fill: 'var(--dsw-alias-label-secondary)', fontSize: 8, children: short(details.meaning, 42) }),
          jsx('text', { x: 10, y: 50, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 6.5, children: short(`证据 · ${details.evidence}`, 50) }),
        ],
      }, key)
    }

    function SpecGraph({ spec, model }) {
      const source = model || spec
      if (!source) return jsx(GraphEmpty, { title: '等待 Spec 产物', text: '访谈 Agent 开始维护 InterviewSpec 后，此处会实时生成状态—动作图。' })
      const predicates = source.predicates || source.states || []
      const actions = source.capabilities || source.actions || []
      const goals = source.goals || []
      const predicateIndex = new Map(predicates.map((item, index) => [item.id, index]))
      const actionIndex = new Map(actions.map((item, index) => [item.id, index]))
      const goalIndex = new Map(goals.map((item, index) => [item.id, index]))
      const rows = Math.max(predicates.length, actions.length, goals.length, 4)
      const height = Math.max(330, 68 * rows + 54)
      const py = (id) => 42 + (predicateIndex.get(id) || 0) * 68
      const ay = (id) => 50 + (actionIndex.get(id) || 0) * 68
      const gy = (id) => 50 + (goalIndex.get(id) || 0) * 68
      const edges = []
      actions.forEach((action) => {
        ;(action.preconditions || []).forEach((stateId) => {
          if (!predicateIndex.has(stateId)) return
          edges.push(jsx('path', { d: `M 280 ${py(stateId) + 27} C 320 ${py(stateId) + 27}, 340 ${ay(action.id) + 18}, 390 ${ay(action.id) + 18}`, fill: 'none', stroke: '#8b93a7', strokeWidth: 1, opacity: .72, markerEnd: 'url(#goap-arrow-pre)' }, `pre-${stateId}-${action.id}`))
        })
        ;(action.effects || []).forEach((stateId) => {
          if (!predicateIndex.has(stateId)) return
          edges.push(jsx('path', { d: `M 600 ${ay(action.id) + 18} C 650 ${ay(action.id) + 18}, 315 ${py(stateId) + 42}, 280 ${py(stateId) + 42}`, fill: 'none', stroke: '#2f7d68', strokeWidth: 1.35, opacity: .85, markerEnd: 'url(#goap-arrow-effect)' }, `effect-${action.id}-${stateId}`))
        })
        ;(action.removes || []).forEach((stateId) => {
          if (!predicateIndex.has(stateId)) return
          edges.push(jsx('path', { d: `M 600 ${ay(action.id) + 18} C 660 ${ay(action.id) + 18}, 315 ${py(stateId) + 11}, 280 ${py(stateId) + 11}`, fill: 'none', stroke: '#b44e55', strokeWidth: 1.25, strokeDasharray: '3 3', opacity: .9, markerEnd: 'url(#goap-arrow-remove)' }, `remove-${action.id}-${stateId}`))
        })
        ;(action.failureModes || []).forEach((failure, failureIndex) => (failure.effects || []).forEach((stateId) => {
          if (!predicateIndex.has(stateId)) return
          edges.push(jsx('path', { d: `M 600 ${ay(action.id) + 26} C 670 ${ay(action.id) + 26}, 320 ${py(stateId) + 27}, 280 ${py(stateId) + 27}`, fill: 'none', stroke: '#c46d2e', strokeWidth: 1.15, strokeDasharray: '6 3', opacity: .92, markerEnd: 'url(#goap-arrow-failure)' }, `failure-${action.id}-${failure.id || failureIndex}-${stateId}`))
        }))
      })
      goals.forEach((goal) => (goal.satisfiedBy || []).forEach((stateId) => {
        if (!predicateIndex.has(stateId)) return
        edges.push(jsx('path', { d: `M 280 ${py(stateId) + 27} C 650 ${py(stateId) + 27}, 690 ${gy(goal.id) + 18}, 740 ${gy(goal.id) + 18}`, fill: 'none', stroke: '#b7892f', strokeWidth: 1.4, strokeDasharray: '4 3', markerEnd: 'url(#goap-arrow-goal)' }, `goal-${stateId}-${goal.id}`))
      }))
      return jsxs('svg', {
        viewBox: `0 0 990 ${height}`,
        preserveAspectRatio: 'xMidYMid meet',
        'aria-label': 'GOAP Spec 状态动作图谱',
        children: [
          jsxs('defs', { children: [
            jsx('marker', { id: 'goap-arrow-pre', markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', children: jsx('path', { d: 'M0,0 L7,3.5 L0,7 Z', fill: '#8b93a7' }) }),
            jsx('marker', { id: 'goap-arrow-effect', markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', children: jsx('path', { d: 'M0,0 L7,3.5 L0,7 Z', fill: '#2f7d68' }) }),
            jsx('marker', { id: 'goap-arrow-goal', markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', children: jsx('path', { d: 'M0,0 L7,3.5 L0,7 Z', fill: '#b7892f' }) }),
            jsx('marker', { id: 'goap-arrow-remove', markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', children: jsx('path', { d: 'M0,0 L7,3.5 L0,7 Z', fill: '#b44e55' }) }),
            jsx('marker', { id: 'goap-arrow-failure', markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', children: jsx('path', { d: 'M0,0 L7,3.5 L0,7 Z', fill: '#c46d2e' }) }),
          ] }),
          jsx('text', { x: 30, y: 23, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, fontWeight: 700, children: `SEMANTIC PREDICATES · ${predicates.length}` }),
          jsx('text', { x: 390, y: 23, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, fontWeight: 700, children: `ACTIONS · ${actions.length}` }),
          jsx('text', { x: 740, y: 23, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, fontWeight: 700, children: `GOALS · ${goals.length}` }),
          ...edges,
          ...predicates.map((item) => svgPredicateNode({ item, x: 30, y: py(item.id), key: `p-${item.id}` })),
          ...actions.map((item) => svgNode({ x: 390, y: ay(item.id), width: 210, height: 40, fill: 'color-mix(in srgb, #2f7d68 13%, var(--dsw-specific-menu))', stroke: 'color-mix(in srgb, #2f7d68 58%, transparent)', title: item.name || item.id, subtitle: `${item.id} · ${item.ownerRole || '未分配'} · ${item.reversibility || '未评估'}`, key: `a-${item.id}` })),
          ...goals.map((item) => svgNode({ x: 740, y: gy(item.id), width: 220, height: 40, fill: 'color-mix(in srgb, #b7892f 13%, var(--dsw-specific-menu))', stroke: 'color-mix(in srgb, #b7892f 58%, transparent)', title: item.description || item.id, subtitle: `${item.id} ⇐ ${(item.satisfiedBy || []).join(' ∧ ') || '未定义谓词'}`, key: `g-${item.id}` })),
        ],
      })
    }

    function ExecutionGraph({ run, pending }) {
      const steps = run?.steps || []
      if (!run && !pending) return jsx(GraphEmpty, { title: '尚未运行', text: '用户确认执行后，此处展示计划选择、状态变化、证据和每轮重规划。' })
      if (!run && pending) return jsx(GraphEmpty, { title: '规划器正在求解', text: '等待第一个可执行动作与世界状态返回…' })
      const width = Math.max(900, 180 + steps.length * 145)
      const initial = run.initialState?.truePredicates || []
      const final = run.finalState?.truePredicates || []
      return jsxs('svg', {
        viewBox: `0 0 ${width} 300`,
        preserveAspectRatio: 'xMinYMid meet',
        style: { width: `${width}px` },
        'aria-label': 'GOAP 规划执行图谱',
        children: [
          jsx('line', { x1: 84, y1: 135, x2: width - 68, y2: 135, stroke: 'color-mix(in srgb, #2f7d68 45%, transparent)', strokeWidth: 2 }),
          svgNode({ x: 18, y: 112, width: 125, height: 46, fill: 'var(--dsw-alias-fill-tertiary)', stroke: 'var(--dsw-alias-border-l2)', title: '初始谓词', subtitle: initial.length ? initial.join(' ∧ ') : '∅ 空世界', key: 'initial' }),
          ...steps.flatMap((step, index) => {
            const x = 158 + index * 145
            const evidence = (run.finalState?.evidence || []).find((item) => item.capabilityId === step.capabilityId)
            return [
              jsx('circle', { cx: x + 58, cy: 135, r: 5, fill: '#2f7d68', stroke: 'color-mix(in srgb, white 65%, transparent)', strokeWidth: 2 }, `dot-${index}`),
              jsx('path', { d: `M ${x + 20} 101 Q ${x + 58} ${55 - (index % 2) * 9} ${x + 100} 101`, fill: 'none', stroke: '#789b91', strokeWidth: 1, strokeDasharray: '3 3' }, `replan-${index}`),
              jsx('text', { x: x + 58, y: 67 - (index % 2) * 9, textAnchor: 'middle', fill: 'var(--dsw-alias-label-tertiary)', fontSize: 8, children: `replan #${step.sequence}` }, `rt-${index}`),
              svgNode({ x, y: 101, width: 116, height: 68, fill: 'color-mix(in srgb, #2f7d68 15%, var(--dsw-specific-menu))', stroke: '#2f7d68', title: `${step.sequence}. ${step.capabilityId}`, subtitle: step.ownerRole, key: `step-${index}` }),
              jsx('text', { x: x + 58, y: 188, textAnchor: 'middle', fill: '#2f7d68', fontSize: 8, fontWeight: 650, children: short(`+ ${(step.effects || []).join(', ') || '-'} · − ${(step.removes || []).join(', ') || '-'}`, 28) }, `effect-${index}`),
              jsx('text', { x: x + 58, y: 204, textAnchor: 'middle', fill: 'var(--dsw-alias-label-tertiary)', fontSize: 7, children: evidence ? '✓ evidence' : `${(step.after || []).length} facts` }, `evidence-${index}`),
              jsx('text', { x: x + 58, y: 229, textAnchor: 'middle', fill: 'var(--dsw-alias-label-tertiary)', fontSize: 7, children: `plan ${Math.max(0, (step.plan || []).length - 1)} remaining` }, `plan-${index}`),
            ]
          }),
          svgNode({ x: width - 143, y: 112, width: 125, height: 46, fill: run.achieved ? 'color-mix(in srgb, #2f7d68 22%, var(--dsw-specific-menu))' : 'color-mix(in srgb, #b7892f 18%, var(--dsw-specific-menu))', stroke: run.achieved ? '#2f7d68' : '#b7892f', title: run.achieved ? '最终谓词' : '未达成谓词', subtitle: final.length ? final.join(' ∧ ') : '∅ 空世界', key: 'final' }),
          jsx('text', { x: 18, y: 274, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, children: `${steps.length} 步执行 · ${run.replans ?? steps.length} 次重规划 · ${(run.finalState?.evidence || []).length} 条证据 · goal: ${run.goalId || '-'}` }),
        ],
      })
    }

    function GraphEmpty({ title, text }) {
      return jsxs('div', { className: 'goap-graph__empty', children: [jsx('strong', { children: title }), jsx('span', { children: text })] })
    }

    function GraphPanel({ data }) {
      const [tab, setTab] = React.useState(data.run || data.runPending ? 'execution' : 'spec')
      const [collapsed, setCollapsed] = React.useState(false)
      const [runIndex, setRunIndex] = React.useState(Math.max(0, (data.runs?.length || 1) - 1))
      React.useEffect(() => {
        setRunIndex(Math.max(0, (data.runs?.length || 1) - 1))
      }, [data.runs?.length])
      const source = data.model || data.spec
      const predicates = source?.predicates || source?.states || []
      const actions = source?.capabilities || source?.actions || []
      const selectedRun = data.runs?.[runIndex] || data.run
      const meta = tab === 'spec'
        ? `${predicates.length} 状态 · ${actions.length} 动作 · ${(source?.goals || []).length} 目标`
        : selectedRun ? `${selectedRun.steps?.length || 0} 步 · ${selectedRun.replans ?? 0} 次重规划 · ${selectedRun.achieved ? '达成' : '死路'}` : '等待执行'
      return jsxs('section', {
        className: 'goap-graph',
        'data-collapsed': collapsed ? 'true' : 'false',
        'aria-label': 'GOAP 图谱',
        children: [
          jsxs('div', { className: 'goap-graph__toolbar', children: [
            jsxs('div', { className: 'goap-graph__tabs', role: 'tablist', children: [
              jsx('button', { type: 'button', className: 'goap-graph__tab', role: 'tab', 'aria-selected': tab === 'spec', onClick: () => { setTab('spec'); setCollapsed(false) }, children: 'Spec 构建图' }),
              jsx('button', { type: 'button', className: 'goap-graph__tab', role: 'tab', 'aria-selected': tab === 'execution', onClick: () => { setTab('execution'); setCollapsed(false) }, children: '规划执行图' }),
              jsx('span', { className: 'goap-graph__meta', children: meta }),
              tab === 'execution' && (data.runs?.length || 0) > 1 ? jsxs('span', { className: 'goap-graph__run-nav', 'aria-label': '执行历史', children: [
                jsx('button', { type: 'button', disabled: runIndex <= 0, onClick: () => setRunIndex((value) => Math.max(0, value - 1)), title: '上一次执行', children: '‹' }),
                jsx('span', { className: 'goap-graph__meta', children: `#${runIndex + 1}/${data.runs.length}` }),
                jsx('button', { type: 'button', disabled: runIndex >= data.runs.length - 1, onClick: () => setRunIndex((value) => Math.min(data.runs.length - 1, value + 1)), title: '下一次执行', children: '›' }),
              ] }) : null,
            ] }),
            jsx('button', { type: 'button', className: 'goap-graph__toggle', onClick: () => setCollapsed((value) => !value), children: collapsed ? '展开图谱' : '收起' }),
          ] }),
          jsx('div', { className: 'goap-graph__viewport', role: 'tabpanel', children: tab === 'spec' ? jsx(SpecGraph, { spec: data.spec, model: data.model }) : jsx(ExecutionGraph, { run: selectedRun, pending: data.runPending && runIndex === (data.runs?.length || 0) }) }),
          jsxs('div', { className: 'goap-graph__legend', children: tab === 'spec' ? [
            jsxs('span', { children: [jsx('i', { style: { background: '#8b93a7' } }), '谓词 → 动作：前置条件'] }),
            jsxs('span', { children: [jsx('i', { style: { background: '#2f7d68' } }), '动作 → 谓词：断言 TRUE'] }),
            jsxs('span', { children: [jsx('i', { style: { background: '#b44e55' } }), '动作 → 谓词：撤销事实'] }),
            jsxs('span', { children: [jsx('i', { style: { background: '#c46d2e' } }), '动作 → 谓词：异常结果'] }),
            jsxs('span', { children: [jsx('i', { style: { background: '#b7892f' } }), '谓词 → 目标：满足条件'] }),
          ] : [
            jsxs('span', { children: [jsx('i', { style: { background: '#2f7d68' } }), '已执行动作'] }),
            jsx('span', { children: '虚线弧 = 执行后重新规划' }),
            jsx('span', { children: '每步展示 effect、evidence 与剩余 plan' }),
          ] }),
        ],
      })
    }

    function BrandMark({ size = 24 }) {
      return jsx('span', {
        className: 'goap-brand-mark',
        style: { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.43)) },
        'aria-label': '企业 GOAP',
        children: 'G',
      })
    }

    function BrandName() {
      return jsxs('span', {
        className: 'goap-brand-name',
        children: ['企业 GOAP', jsx('small', { children: 'WORKBENCH' })],
      })
    }

    function WorkflowRail({ useConversation }) {
      const chat = useConversation((snapshot) => snapshot.views.get('chat'))
      const { corpus, graphData } = React.useMemo(() => {
        if (!chat) return { corpus: '', graphData: { spec: null, model: null, run: null, runPending: false } }
        const text = chat.nodes.values().map((node) => {
          try { return JSON.stringify(node.data) } catch { return '' }
        }).join('\n').toLowerCase()
        return { corpus: text, graphData: latestGoapData(chat) }
      }, [chat])
      const completed = stages.map((stage) => corpus.includes(stage.marker))
      let active = completed.findIndex((value) => !value)
      if (active < 0) active = stages.length - 1

      return jsxs('section', {
        className: 'goap-workflow',
        'aria-label': 'GOAP 构建流水线',
        children: [
          jsxs('div', {
            className: 'goap-workflow__header',
            children: [
              jsx('span', { className: 'goap-workflow__eyebrow', children: 'GOAP Delivery Pipeline' }),
              jsx('span', { className: 'goap-workflow__mode', children: completed[4] ? '运行完成' : '企业建模模式' }),
            ],
          }),
          jsx('div', {
            className: 'goap-workflow__rail',
            children: stages.map((stage, index) => {
              const state = completed[index] ? 'done' : index === active ? 'active' : 'pending'
              return jsxs('div', {
                className: 'goap-stage',
                'data-state': state,
                children: [
                  jsxs('div', {
                    className: 'goap-stage__top',
                    children: [
                      jsx('span', { className: 'goap-stage__number', children: String(index + 1) }),
                      jsx('span', { className: 'goap-stage__label', children: stage.label }),
                    ],
                  }),
                  jsx('div', { className: 'goap-stage__hint', children: stage.hint }),
                ],
              }, stage.id)
            }),
          }),
          jsx(GraphPanel, { data: graphData || { spec: null, model: null, run: null, runPending: false } }),
        ],
      })
    }

    function installIdentity() {
      const titleSuffix = '企业 GOAP 工作台'
      const applyTitle = () => {
        const conversation = document.title
          .replace(/\s*[—-]\s*(DeepSeek Harness|企业 GOAP 工作台)\s*$/i, '')
          .trim()
        const nextTitle = conversation && conversation !== titleSuffix
          ? `${conversation} — ${titleSuffix}`
          : titleSuffix
        if (document.title !== nextTitle) document.title = nextTitle
      }
      applyTitle()
      const titleElement = document.querySelector('title')
      const titleObserver = titleElement
        ? new MutationObserver(applyTitle)
        : null
      titleObserver?.observe(titleElement, { childList: true, characterData: true, subtree: true })
      let style = document.querySelector('style[data-plugin-css="enterprise-goap-workbench"]')
      if (!style) {
        style = document.createElement('style')
        style.dataset.pluginCss = 'enterprise-goap-workbench'
        style.textContent = css
        document.head.appendChild(style)
      }
      const oldIcons = [...document.querySelectorAll('link[rel~="icon"]')]
      oldIcons.forEach((icon) => icon.remove())
      const icon = document.createElement('link')
      icon.rel = 'icon'
      icon.href = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2f7d68"/><path d="M42 23a15 15 0 1 0 0 18v-9H31v7h4a8 8 0 1 1 1-13z" fill="white"/></svg>')}`
      document.head.appendChild(icon)
      return () => {
        titleObserver?.disconnect()
        style?.remove()
        icon.remove()
        oldIcons.forEach((oldIcon) => document.head.appendChild(oldIcon))
      }
    }

    function apply(ctx) {
      ctx.effect(installIdentity, 'enterprise-goap: product identity')
      ctx.slots.inject('sidebar.brand.mark', () =>
        ctx.slots.register({ name: 'sidebar.brand.mark' }, BrandMark))
      ctx.slots.inject('sidebar.brand.name', () =>
        ctx.slots.register({ name: 'sidebar.brand.name' }, BrandName))
      ctx.slots.inject('conversation.hero.brand.mark', () =>
        ctx.slots.register({ name: 'conversation.hero.brand.mark' }, BrandMark))
      ctx.slots.inject('conversation.input.dock', () =>
        ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'enterprise-goap-workflow',
          order: -100,
        }, WorkflowRail))
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
