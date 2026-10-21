window.__ModuleLoader__.load({
  id: 'enterprise-semantic-goap-dsh',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { jsx, jsxs } = require('react/jsx-runtime')

    const inject = ['slots', 'betterSidebar']
    const stages = [
      { id: 'intent', label: '范围与目标', hint: '业务结果、边界、角色' },
      { id: 'predicates', label: '语义谓词', hint: '查询、证据、四值策略' },
      { id: 'actions', label: '动作与异常', hint: '执行、观察、恢复与逆向' },
      { id: 'confirm', label: '确认 Spec', hint: '清空问题并显式确认' },
      { id: 'compile', label: '校验编译', hint: '引用、能力与可达性' },
      { id: 'run', label: '规划运行', hint: '事实提交与持续重规划' },
    ]

    const emptyWorkbenchSnapshot = {
      corpus: '',
      graphData: { spec: null, review: null, model: null, run: null, runs: [], runPending: false },
    }
    const workbenchSnapshots = new Map()
    const workbenchActions = new Map()
    const workbenchListeners = new Set()

    function publishWorkbenchSnapshot(sessionId, next) {
      if (next === emptyWorkbenchSnapshot) workbenchSnapshots.delete(sessionId)
      else workbenchSnapshots.set(sessionId, next)
      workbenchListeners.forEach((listener) => listener())
    }

    function subscribeWorkbench(listener) {
      workbenchListeners.add(listener)
      return () => workbenchListeners.delete(listener)
    }

    function useWorkbenchSnapshot(sessionId) {
      return React.useSyncExternalStore(
        subscribeWorkbench,
        () => workbenchSnapshots.get(sessionId) || emptyWorkbenchSnapshot,
        () => emptyWorkbenchSnapshot,
      )
    }

    const goapApiBaseUrl = window.__GOAP_API_BASE_URL__ || 'http://127.0.0.1:8080'

    async function scenarioRequest(path, options = {}) {
      const response = await fetch(new URL(path, goapApiBaseUrl), {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      })
      const value = await response.json()
      if (!response.ok) throw new Error(value?.error || `Scenario API ${response.status}`)
      return value
    }

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
        max-width: min(980px, calc(100vw - 32px));
        padding: 0 4px;
        width: 100%;
      }
      .goap-workflow--sidebar {
        height: 100%;
        margin: 0;
        max-width: none;
        overflow: auto;
        padding: 12px;
      }
      .goap-workflow--sidebar .goap-workflow__rail { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .goap-workflow--sidebar .goap-interview__body { grid-template-columns: 1fr; }
      .goap-workflow--sidebar .goap-interview__column { max-height: 230px; }
      .goap-workflow--sidebar .goap-graph__viewport { height: 360px; }
      .goap-workflow--sidebar .goap-graph__viewport svg { min-width: 700px; }
      .goap-scenario-bar {
        align-items: center;
        background: var(--dsw-specific-menu);
        border-bottom: 1px solid var(--dsw-alias-border-l1);
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        padding: 9px 12px;
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .goap-scenario-bar select,
      .goap-scenario-bar input,
      .goap-scenario-editor textarea {
        background: var(--dsw-alias-bg-base);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 7px;
        color: var(--dsw-alias-label-primary);
        font: inherit;
      }
      .goap-scenario-bar select { flex: 1 1 180px; min-width: 0; padding: 6px 8px; }
      .goap-scenario-bar input { flex: 1 1 160px; min-width: 0; padding: 6px 8px; }
      .goap-scenario-button {
        background: var(--goap-accent-soft);
        border: 1px solid color-mix(in srgb, var(--goap-accent) 35%, transparent);
        border-radius: 7px;
        color: var(--goap-accent);
        cursor: pointer;
        font: inherit;
        font-size: 11px;
        padding: 6px 9px;
      }
      .goap-scenario-button:disabled { cursor: default; opacity: .45; }
      .goap-scenario-status { color: var(--dsw-alias-label-tertiary); font-size: 10px; width: 100%; }
      .goap-scenario-editor { border-bottom: 1px solid var(--dsw-alias-border-l1); padding: 10px 12px; }
      .goap-scenario-editor textarea {
        box-sizing: border-box;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 10px;
        line-height: 1.45;
        min-height: 280px;
        padding: 10px;
        resize: vertical;
        width: 100%;
      }
      .goap-scenario-editor__actions { display: flex; gap: 7px; justify-content: flex-end; margin-top: 8px; }
      .goap-sidebar-root { height: 100%; min-height: 0; overflow: auto; }
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
        grid-template-columns: repeat(6, minmax(0, 1fr));
        overflow: hidden;
      }
      .goap-interview {
        background: color-mix(in srgb, var(--dsw-specific-menu) 90%, transparent);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 14px;
        box-shadow: var(--dsw-elevation-panel);
        margin-top: 10px;
        overflow: hidden;
      }
      .goap-interview__header {
        align-items: center;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
        display: flex;
        gap: 8px;
        justify-content: space-between;
        min-height: 42px;
        padding: 0 12px;
      }
      .goap-interview__title { color: var(--dsw-alias-label-primary); font-size: 12px; font-weight: 700; }
      .goap-interview__meta { align-items: center; display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
      .goap-pill {
        background: var(--dsw-alias-fill-tertiary);
        border-radius: 999px;
        color: var(--dsw-alias-label-secondary);
        font-size: 9px;
        padding: 3px 7px;
      }
      .goap-pill[data-tone="ok"] { background: var(--goap-accent-soft); color: var(--goap-accent); }
      .goap-pill[data-tone="warn"] { background: color-mix(in srgb, #b7892f 16%, transparent); color: #b7892f; }
      .goap-interview__body { display: grid; gap: 8px; grid-template-columns: 1.05fr 1fr 1fr; padding: 10px; }
      .goap-interview__column {
        background: color-mix(in srgb, var(--dsw-alias-fill-tertiary) 64%, transparent);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 10px;
        min-height: 112px;
        max-height: 190px;
        overflow: auto;
        padding: 9px;
      }
      .goap-interview__column h4 { color: var(--dsw-alias-label-secondary); font-size: 10px; letter-spacing: .06em; margin: 0 0 7px; text-transform: uppercase; }
      .goap-interview__objective { color: var(--dsw-alias-label-primary); font-size: 11px; font-weight: 650; line-height: 1.45; margin-bottom: 7px; }
      .goap-interview__summary { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 1.45; }
      .goap-interview__item { border-top: 1px solid var(--dsw-alias-border-l1); padding: 6px 0; }
      .goap-interview__item:first-of-type { border-top: 0; padding-top: 0; }
      .goap-interview__item strong { color: var(--dsw-alias-label-primary); display: block; font-size: 10px; margin-bottom: 3px; }
      .goap-interview__item span { color: var(--dsw-alias-label-tertiary); display: block; font-size: 8px; line-height: 1.4; overflow-wrap: anywhere; }
      .goap-interview__questions { border-top: 1px solid var(--dsw-alias-border-l1); padding: 8px 12px 10px; }
      .goap-interview__questions strong { color: #b7892f; display: block; font-size: 10px; margin-bottom: 5px; }
      .goap-interview__questions ol { color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 1.5; margin: 0; padding-left: 18px; }
      .goap-interview__empty { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 1.5; padding: 16px; text-align: center; }
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
        .goap-interview__body { grid-template-columns: 1fr; }
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
      let latestUserInput = ''
      const navigationItems = chat?.navigation?.items?.() || []
      if (navigationItems.length) latestUserInput = navigationItems[navigationItems.length - 1]?.prompt || ''
      if (chat) chat.nodes.values().forEach((node) => {
        const data = node?.data
        if (node?.kind !== 'user' && node?.kind !== 'steering' && data?.kind !== 'user' && data?.kind !== 'steering') return
        const text = (data?.content || [])
          .filter((item) => item?.type === 'text' && typeof item.text === 'string')
          .map((item) => item.text.trim())
          .filter(Boolean)
          .join('\n')
        if (text && !latestUserInput) latestUserInput = text
      })
      let spec = null
      let model = null
      let run = null
      let projection = null
      let review = null
      let reviewPending = false
      let runPending = false
      const runs = []
      for (const call of calls) {
        if (call.name === 'semantic_goap_spec_review') {
          spec = parseJson(call.result?.spec) || parseJson(call.args?.spec) || spec
          review = call.result || review
          reviewPending = call.running
        }
        if (call.name === 'semantic_goap_build') {
          spec = parseJson(call.result?.spec) || parseJson(call.args?.spec) || spec
          model = parseJson(call.result?.model) || model
          review = parseJson(call.result?.review) || review
        }
        if (['semantic_goap_validate', 'semantic_goap_compile', 'semantic_goap_project', 'semantic_goap_run'].includes(call.name)) {
          // Prefer the authoritative build artifact. Later run calls may carry
          // temporary fault-injection variants that must not rewrite the Spec graph.
          model = model || parseJson(call.args?.model)
        }
        if (call.name === 'semantic_goap_project') projection = call.result || projection
        if (call.name === 'semantic_goap_run') {
          run = call.result || null
          runPending = call.running
          if (call.result) runs.push(call.result)
        }
      }
      return { calls, latestUserInput, spec, review, reviewPending, model, projection, run, runs, runPending }
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
        semantic: item.semanticQuery || '未绑定 Semantica query',
        projection: `UNKNOWN→${item.unknownStrategy || 'FALSE'} · CONFLICT→${item.conflictStrategy || 'BLOCK'}`,
      }
    }

    function svgPredicateNode({ item, decision, x, y, key }) {
      const details = predicateDetails(item)
      const expression = `${item.id} = ${decision?.semanticValue || 'TRUE'}`
      return jsxs('g', {
        transform: `translate(${x} ${y})`,
        role: 'img',
        'aria-label': `语义谓词 ${expression}，${details.meaning}，证据 ${details.evidence}`,
        children: [
          jsx('title', { children: `谓词: ${expression}\n业务语义: ${details.meaning}\nSemantica: ${details.semantic}\n投影: ${details.projection}\n证据: ${details.evidence}` }),
          jsx('rect', { width: 250, height: 54, rx: 8, fill: 'color-mix(in srgb, #59647a 14%, var(--dsw-specific-menu))', stroke: 'color-mix(in srgb, #8b93a7 55%, transparent)', strokeWidth: 1 }),
          jsx('text', { x: 10, y: 13, fill: '#8b93a7', fontSize: 7.5, fontWeight: 750, letterSpacing: .45, children: 'SEMANTIC PREDICATE' }),
          jsx('text', { x: 10, y: 28, fill: 'var(--dsw-alias-label-primary)', fontSize: 10, fontWeight: 700, children: short(expression, 38) }),
          jsx('text', { x: 10, y: 41, fill: 'var(--dsw-alias-label-secondary)', fontSize: 8, children: short(details.semantic, 42) }),
          jsx('text', { x: 10, y: 50, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 6.5, children: short(decision ? `${decision.strategy || 'DIRECT'} · ${details.meaning}` : details.projection, 50) }),
        ],
      }, key)
    }

    function SpecGraph({ spec, model, projection }) {
      const source = model || spec
      if (!source) return jsx(GraphEmpty, { title: '等待 Spec 产物', text: '访谈 Agent 开始维护 InterviewSpec 后，此处会实时生成状态—动作图。' })
      const predicates = source.predicates || source.states || []
      const actions = source.capabilities || source.actions || []
      const goals = source.goals || []
      const predicateIndex = new Map(predicates.map((item, index) => [item.id, index]))
      const actionIndex = new Map(actions.map((item, index) => [item.id, index]))
      const goalIndex = new Map(goals.map((item, index) => [item.id, index]))
      const decisions = new Map((projection?.decisions || []).map((item) => [item.predicateId, item]))
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
        ;(action.observes || []).forEach((stateId) => {
          if (!predicateIndex.has(stateId)) return
          edges.push(jsx('path', { d: `M 600 ${ay(action.id) + 12} C 650 ${ay(action.id) + 12}, 315 ${py(stateId) + 20}, 280 ${py(stateId) + 20}`, fill: 'none', stroke: '#7667b8', strokeWidth: 1.25, strokeDasharray: '2 3', opacity: .9, markerEnd: 'url(#goap-arrow-observe)' }, `observe-${action.id}-${stateId}`))
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
            jsx('marker', { id: 'goap-arrow-observe', markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', children: jsx('path', { d: 'M0,0 L7,3.5 L0,7 Z', fill: '#7667b8' }) }),
          ] }),
          jsx('text', { x: 30, y: 23, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, fontWeight: 700, children: `SEMANTIC PREDICATES · ${predicates.length}` }),
          jsx('text', { x: 390, y: 23, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, fontWeight: 700, children: `ACTIONS · ${actions.length}` }),
          jsx('text', { x: 740, y: 23, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, fontWeight: 700, children: `GOALS · ${goals.length}` }),
          ...edges,
          ...predicates.map((item) => svgPredicateNode({ item, decision: decisions.get(item.id), x: 30, y: py(item.id), key: `p-${item.id}` })),
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
              jsx('text', { x: x + 58, y: 188, textAnchor: 'middle', fill: '#2f7d68', fontSize: 8, fontWeight: 650, children: short(`+ ${(step.effects || []).join(', ') || '-'} · ? ${(step.observes || []).join(', ') || '-'} · − ${(step.removes || []).join(', ') || '-'}`, 34) }, `effect-${index}`),
              jsx('text', { x: x + 58, y: 204, textAnchor: 'middle', fill: 'var(--dsw-alias-label-tertiary)', fontSize: 7, children: evidence ? '✓ evidence' : `${(step.after || []).length} facts` }, `evidence-${index}`),
              jsx('text', { x: x + 58, y: 229, textAnchor: 'middle', fill: 'var(--dsw-alias-label-tertiary)', fontSize: 7, children: `plan ${Math.max(0, (step.plan || []).length - 1)} remaining` }, `plan-${index}`),
            ]
          }),
          svgNode({ x: width - 143, y: 112, width: 125, height: 46, fill: run.achieved ? 'color-mix(in srgb, #2f7d68 22%, var(--dsw-specific-menu))' : 'color-mix(in srgb, #b7892f 18%, var(--dsw-specific-menu))', stroke: run.achieved ? '#2f7d68' : '#b7892f', title: run.achieved ? '最终谓词' : '未达成谓词', subtitle: final.length ? final.join(' ∧ ') : '∅ 空世界', key: 'final' }),
          jsx('text', { x: 18, y: 274, fill: 'var(--dsw-alias-label-tertiary)', fontSize: 9, children: `${steps.length} 步执行 · ${run.replans ?? steps.length} 次重规划 · ${run.termination || (run.achieved ? 'ACHIEVED' : 'NO_PLAN')} · pending: ${(run.pendingPredicates || []).join(', ') || '-'} · goal: ${run.goalId || '-'}` }),
        ],
      })
    }

    function GraphEmpty({ title, text }) {
      return jsxs('div', { className: 'goap-graph__empty', children: [jsx('strong', { children: title }), jsx('span', { children: text })] })
    }

    function InterviewPanel({ data }) {
      const spec = data.spec
      const review = data.review
      if (!spec) return jsxs('section', {
        className: 'goap-interview',
        'aria-label': '访谈构建态',
        children: [
          jsxs('div', { className: 'goap-interview__header', children: [
            jsx('span', { className: 'goap-interview__title', children: '访谈构建态 · LIVE SPEC' }),
            jsx('span', { className: 'goap-pill', 'data-tone': 'warn', children: data.latestUserInput ? 'Agent 正在形成 v1 草稿' : '等待首次输入' }),
          ] }),
          data.latestUserInput
            ? jsxs('div', { className: 'goap-interview__body', children: [
                jsxs('div', { className: 'goap-interview__column', children: [
                  jsx('h4', { children: '当前访谈输入' }),
                  jsx('div', { className: 'goap-interview__objective', children: data.latestUserInput }),
                ] }),
                jsxs('div', { className: 'goap-interview__column', children: [
                  jsx('h4', { children: '正在提取' }),
                  jsx('div', { className: 'goap-interview__summary', children: '业务目标 · 参与角色 · 明确边界 · 待确认假设' }),
                ] }),
                jsxs('div', { className: 'goap-interview__column', children: [
                  jsx('h4', { children: '下一步' }),
                  jsx('div', { className: 'goap-interview__summary', children: 'Agent 将先发布稀疏 DRAFT，再逐轮补充谓词、投影策略、动作、异常与恢复路径。' }),
                ] }),
              ] })
            : jsx('div', { className: 'goap-interview__empty', children: '输入模糊业务需求后，原始访谈内容会立即显示；Agent 的每次 Spec Review 会继续刷新目标、谓词、动作和待澄清问题。' }),
        ],
      })
      const states = spec.states || []
      const actions = spec.actions || []
      const questions = review?.clarificationQuestions || spec.openQuestions || []
      const missing = review?.missingFields || []
      const confirmed = spec.confirmedClaims || []
      const assumptions = spec.assumptions || []
      return jsxs('section', {
        className: 'goap-interview',
        'aria-label': '访谈构建态',
        children: [
          jsxs('div', { className: 'goap-interview__header', children: [
            jsx('span', { className: 'goap-interview__title', children: `${spec.title || '未命名业务'} · LIVE SPEC` }),
            jsxs('span', { className: 'goap-interview__meta', children: [
              jsx('span', { className: 'goap-pill', children: `v${spec.version || 1}` }),
              jsx('span', { className: 'goap-pill', 'data-tone': spec.status === 'CONFIRMED' ? 'ok' : 'warn', children: spec.status || 'DRAFT' }),
              data.reviewPending ? jsx('span', { className: 'goap-pill', 'data-tone': 'warn', children: 'Agent 审查中' }) : null,
              data.reviewPending ? null : jsx('span', { className: 'goap-pill', 'data-tone': review?.readyToBuild ? 'ok' : 'warn', children: review?.readyToBuild ? '可构建' : review ? `${missing.length} 个结构缺口` : '等待审查结果' }),
            ] }),
          ] }),
          jsxs('div', { className: 'goap-interview__body', children: [
            jsxs('div', { className: 'goap-interview__column', children: [
              jsx('h4', { children: '业务契约' }),
              jsx('div', { className: 'goap-interview__objective', children: spec.objective || '等待澄清可验证业务结果' }),
              jsx('div', { className: 'goap-interview__summary', children: spec.summary || '尚未形成范围摘要' }),
              jsx('div', { className: 'goap-interview__item', children: jsxs(React.Fragment, { children: [
                jsx('strong', { children: `${(spec.actors || []).length} 个角色 · ${(spec.goals || []).length} 个目标` }),
                jsx('span', { children: `已确认 ${confirmed.length} · 假设 ${assumptions.length} · 未决 ${questions.length}` }),
              ] }) }),
              ...confirmed.slice(0, 3).map((claim, index) => jsx('div', { className: 'goap-interview__item', children: jsxs(React.Fragment, { children: [jsx('strong', { children: `✓ 决策 ${index + 1}` }), jsx('span', { children: claim })] }) }, `claim-${index}`)),
            ] }),
            jsxs('div', { className: 'goap-interview__column', children: [
              jsx('h4', { children: `语义谓词 · ${states.length}` }),
              ...(states.length ? states : [{ id: '等待定义', description: 'Agent 尚未提取谓词' }]).map((state, index) => jsxs('div', { className: 'goap-interview__item', children: [
                jsx('strong', { children: state.id || `predicate-${index + 1}` }),
                jsx('span', { children: state.semanticQuery || '缺少 Semantica query' }),
                jsx('span', { children: `UNKNOWN→${state.unknownStrategy || 'FALSE'} · CONFLICT→${state.conflictStrategy || 'BLOCK'}` }),
              ] }, `state-${state.id || index}`)),
            ] }),
            jsxs('div', { className: 'goap-interview__column', children: [
              jsx('h4', { children: `动作 / 观察 · ${actions.length}` }),
              ...(actions.length ? actions : [{ id: '等待定义', description: 'Agent 尚未提取动作' }]).map((action, index) => jsxs('div', { className: 'goap-interview__item', children: [
                jsx('strong', { children: `${action.name || action.id || `action-${index + 1}`} · ${action.ownerRole || '未分配'}` }),
                jsx('span', { children: `前置 ${(action.preconditions || []).join(', ') || '∅'} · 观察 ${(action.observes || []).join(', ') || '∅'}` }),
                jsx('span', { children: `效果 ${(action.effects || []).join(', ') || '∅'} · 异常 ${(action.failureModes || []).length} · ${action.reversibility || '未评估'}` }),
              ] }, `action-${action.id || index}`)),
            ] }),
          ] }),
          questions.length || missing.length ? jsxs('div', { className: 'goap-interview__questions', children: [
            jsx('strong', { children: `下一轮需要澄清 · ${questions.length || missing.length}` }),
            jsx('ol', { children: (questions.length ? questions : missing.map((item) => `请补全 ${item}`)).slice(0, 4).map((question, index) => jsx('li', { children: question }, `question-${index}`)) }),
          ] }) : null,
        ],
      })
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
        : selectedRun ? `${selectedRun.steps?.length || 0} 步 · ${selectedRun.replans ?? 0} 次重规划 · ${selectedRun.termination || (selectedRun.achieved ? '达成' : '未达成')}` : '等待执行'
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
          jsx('div', { className: 'goap-graph__viewport', role: 'tabpanel', children: tab === 'spec' ? jsx(SpecGraph, { spec: data.spec, model: data.model, projection: data.projection }) : jsx(ExecutionGraph, { run: selectedRun, pending: data.runPending && runIndex === (data.runs?.length || 0) }) }),
          jsxs('div', { className: 'goap-graph__legend', children: tab === 'spec' ? [
            jsxs('span', { children: [jsx('i', { style: { background: '#8b93a7' } }), '谓词 → 动作：前置条件'] }),
            jsxs('span', { children: [jsx('i', { style: { background: '#2f7d68' } }), '动作 → 谓词：断言 TRUE'] }),
            jsxs('span', { children: [jsx('i', { style: { background: '#b44e55' } }), '动作 → 谓词：撤销事实'] }),
            jsxs('span', { children: [jsx('i', { style: { background: '#7667b8' } }), '动作 → 谓词：观察真实值'] }),
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

    function ConversationWorkbenchBridge({ sessionId, useConversation, inputActions }) {
      const chat = useConversation((snapshot) => snapshot.views.get('chat'))
      const snapshot = React.useMemo(() => {
        if (!chat) return emptyWorkbenchSnapshot
        const text = chat.nodes.values().map((node) => {
          try { return JSON.stringify(node.data) } catch { return '' }
        }).join('\n').toLowerCase()
        return { corpus: text, graphData: latestGoapData(chat) }
      }, [chat])
      React.useEffect(() => {
        publishWorkbenchSnapshot(sessionId, snapshot)
        workbenchActions.set(sessionId, inputActions)
        return () => {
          if (workbenchSnapshots.get(sessionId) === snapshot) publishWorkbenchSnapshot(sessionId, emptyWorkbenchSnapshot)
          if (workbenchActions.get(sessionId) === inputActions) workbenchActions.delete(sessionId)
        }
      }, [sessionId, snapshot, inputActions])
      return null
    }

    function WorkflowRail({ corpus, graphData, sidebar = false }) {
      const spec = graphData.spec
      const review = graphData.review
      const states = spec?.states || []
      const actions = spec?.actions || []
      const completed = [
        Boolean(spec?.objective && (spec?.actors || []).length),
        Boolean(states.length && states.every((state) => state.semanticQuery && state.evidenceRequired)),
        Boolean(actions.length && (spec?.goals || []).length && actions.every((action) => action.reversibility && action.reversibility !== 'NOT_ASSESSED')),
        Boolean(review?.readyToBuild || graphData.model),
        corpus.includes('semantic_goap_compile'),
        Boolean(graphData.run),
      ]
      let active = completed.findIndex((value) => !value)
      if (active < 0) active = stages.length - 1

      return jsxs('section', {
        className: `goap-workflow${sidebar ? ' goap-workflow--sidebar' : ''}`,
        'aria-label': 'GOAP 构建流水线',
        children: [
          jsxs('div', {
            className: 'goap-workflow__header',
            children: [
              jsx('span', { className: 'goap-workflow__eyebrow', children: 'GOAP Delivery Pipeline' }),
              jsx('span', { className: 'goap-workflow__mode', children: graphData.reviewPending ? 'Agent 正在更新 Spec' : completed[5] ? '运行完成' : spec ? `访谈构建中 · v${spec.version || 1}` : graphData.latestUserInput ? 'Agent 正在形成 v1 草稿' : '企业建模模式' }),
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
          jsx(InterviewPanel, { data: graphData }),
          jsx(GraphPanel, { data: graphData || { spec: null, model: null, run: null, runPending: false } }),
        ],
      })
    }

    function GoapBuildSidebar({ scope }) {
      const sessionId = scope.sessionId
      const live = useWorkbenchSnapshot(sessionId)
      const [scenarios, setScenarios] = React.useState([])
      const [selectedId, setSelectedId] = React.useState('')
      const [document, setDocument] = React.useState(null)
      const [newTitle, setNewTitle] = React.useState('')
      const [editing, setEditing] = React.useState(false)
      const [draft, setDraft] = React.useState('')
      const [status, setStatus] = React.useState('')

      const refresh = React.useCallback(async (preferredId) => {
        const list = await scenarioRequest('/api/scenarios')
        setScenarios(list)
        const bound = list.find((item) => (item.boundSessionIds || []).includes(sessionId))
        const id = preferredId || bound?.id || ''
        setSelectedId(id)
        setDocument(id ? await scenarioRequest(`/api/scenarios/${encodeURIComponent(id)}`) : null)
      }, [sessionId])

      React.useEffect(() => {
        let active = true
        refresh().catch((error) => active && setStatus(`场景读取失败：${error.message}`))
        return () => { active = false }
      }, [refresh])

      const selectScenario = async (id) => {
        setSelectedId(id)
        setEditing(false)
        if (!id) { setDocument(null); return }
        try {
          await scenarioRequest(`/api/scenarios/${encodeURIComponent(id)}/binding`, {
            method: 'PUT', body: JSON.stringify({ sessionId }),
          })
          const next = await scenarioRequest(`/api/scenarios/${encodeURIComponent(id)}`)
          setDocument(next)
          const latestVersion = next.versions?.[next.versions.length - 1]?.version
          workbenchActions.get(sessionId)?.setDraft(
            `我已在 GUI 中切换到持久化场景「${next.title}」${latestVersion ? `v${latestVersion}` : '（尚无版本）'}。请先调用 semantic_goap_scenario_current 读取完整上下文，再继续访谈。`,
          )
          setStatus(`已绑定当前 CUI 会话：${sessionId.slice(0, 8)}…，上下文提示已写入输入框`)
        } catch (error) { setStatus(`绑定失败：${error.message}`) }
      }

      const createScenario = async () => {
        if (!newTitle.trim()) return
        try {
          let created = await scenarioRequest('/api/scenarios', {
            method: 'POST', body: JSON.stringify({ title: newTitle.trim(), sessionId }),
          })
          if (live.graphData.spec) {
            created = await scenarioRequest(`/api/scenarios/${encodeURIComponent(created.id)}/versions`, {
              method: 'POST',
              body: JSON.stringify({
                spec: live.graphData.spec,
                sessionId,
                changeSummary: 'Imported from current CUI session',
                preserveStatus: true,
              }),
            })
          }
          setNewTitle('')
          await refresh(created.id)
          const importedVersion = created.versions?.[created.versions.length - 1]?.version
          workbenchActions.get(sessionId)?.setDraft(importedVersion
            ? `已将当前会话产物持久化为场景「${created.title}」v${importedVersion}。请先调用 semantic_goap_scenario_current 读取完整上下文，再继续访谈。`
            : `请开始访谈并构建场景「${created.title}」。场景 ID：${created.id}。`)
          setStatus(importedVersion ? `场景已创建，当前产物已导入为 v${importedVersion}` : '场景已创建并与当前 CUI 会话绑定')
        } catch (error) { setStatus(`创建失败：${error.message}`) }
      }

      const beginEdit = () => {
        const latest = document?.versions?.[document.versions.length - 1]
        if (!latest) return
        setDraft(JSON.stringify(latest.spec, null, 2))
        setEditing(true)
      }

      const saveVersion = async () => {
        try {
          const spec = JSON.parse(draft)
          const latest = document?.versions?.[document.versions.length - 1]
          const next = await scenarioRequest(`/api/scenarios/${encodeURIComponent(selectedId)}/versions`, {
            method: 'POST',
            body: JSON.stringify({ spec, sessionId, baseVersion: latest?.version, changeSummary: 'GUI edit' }),
          })
          setDocument(next)
          setEditing(false)
          await refresh(selectedId)
          const version = next.versions?.[next.versions.length - 1]?.version
          workbenchActions.get(sessionId)?.setDraft(`我已在 GUI 中基于旧产物创建场景「${next.title}」v${version}。请先调用 semantic_goap_scenario_current 读取完整上下文，对变更进行访谈校验并继续补全 Spec。`)
          setStatus(`v${version} 已持久化，变更说明已带入 CUI 输入框`)
        } catch (error) { setStatus(`保存失败：${error.message}`) }
      }

      const latest = document?.versions?.[document.versions.length - 1]
      const persisted = latest ? {
        corpus: live.corpus,
        graphData: {
          ...live.graphData,
          spec: live.graphData.spec || latest.spec,
          review: live.graphData.review || latest.review,
          model: live.graphData.model || latest.model,
          run: live.graphData.run || latest.runs?.[latest.runs.length - 1] || null,
          runs: live.graphData.runs?.length ? live.graphData.runs : (latest.runs || []),
        },
      } : live

      return jsxs('div', { className: 'goap-sidebar-root', children: [
        jsxs('div', { className: 'goap-scenario-bar', children: [
          jsx('select', {
            value: selectedId,
            onChange: (event) => selectScenario(event.target.value),
            'aria-label': '当前场景',
            children: [jsx('option', { value: '', children: '选择持久化场景' }), ...scenarios.map((item) => jsx('option', { value: item.id, children: `${item.title}${item.latestVersion ? ` · v${item.latestVersion}` : ''}` }, item.id))],
          }),
          jsx('input', { value: newTitle, onChange: (event) => setNewTitle(event.target.value), placeholder: '新场景名称', 'aria-label': '新场景名称' }),
          jsx('button', { type: 'button', className: 'goap-scenario-button', disabled: !newTitle.trim(), onClick: createScenario, children: '新建场景' }),
          jsx('button', { type: 'button', className: 'goap-scenario-button', disabled: !latest, onClick: beginEdit, children: latest ? `基于 v${latest.version} 编辑` : '暂无版本' }),
          jsx('span', { className: 'goap-scenario-status', children: status || (selectedId ? `场景 ${selectedId} 已与当前会话联动` : '新建或选择场景后，Agent 产物将按版本持久化') }),
        ] }),
        editing ? jsxs('div', { className: 'goap-scenario-editor', children: [
          jsx('textarea', { value: draft, onChange: (event) => setDraft(event.target.value), 'aria-label': 'InterviewSpec JSON' }),
          jsxs('div', { className: 'goap-scenario-editor__actions', children: [
            jsx('button', { type: 'button', className: 'goap-scenario-button', onClick: () => setEditing(false), children: '取消' }),
            jsx('button', { type: 'button', className: 'goap-scenario-button', onClick: saveVersion, children: '保存为新版本' }),
          ] }),
        ] }) : null,
        jsx(WorkflowRail, { corpus: persisted.corpus, graphData: persisted.graphData, sidebar: true }),
      ] })
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
      ctx.effect(() => ctx.betterSidebar.registerTab({
        id: 'enterprise-goap:build',
        title: 'GOAP 构建态',
        description: '访谈 Spec、语义谓词、Action 与规划图谱',
        icon: (size) => jsx(BrandMark, { size }),
        order: 15,
        single: true,
        component: GoapBuildSidebar,
      }), 'enterprise-goap: sidebar build view')
      ctx.slots.inject('sidebar.brand.mark', () =>
        ctx.slots.register({ name: 'sidebar.brand.mark' }, BrandMark))
      ctx.slots.inject('sidebar.brand.name', () =>
        ctx.slots.register({ name: 'sidebar.brand.name' }, BrandName))
      ctx.slots.inject('conversation.hero.brand.mark', () =>
        ctx.slots.register({ name: 'conversation.hero.brand.mark' }, BrandMark))
      ctx.slots.inject('conversation.input.dock', () =>
        ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'enterprise-goap-workbench-bridge',
          order: -100,
          inject: (sessionId) => ({ sessionId }),
        }, ConversationWorkbenchBridge))
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
