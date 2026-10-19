# DSH 集成判断

这里将 DSH 理解为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)。如果你指的是另一个同名产品，只需要替换适配层，Semantic GOAP 核心不受影响。

## 结论

可以用，而且适合两个位置：

1. **自然语言访谈外壳**：DSH 的 Agent loop、session 和可插拔模型适合维护多轮对话、追问缺失字段、展示候选模型并等待用户确认。
2. **生成后 Agent 的运行入口与观测面**：DSH 可以把本服务注册为 typed tools，由 DSH Agent 发起 compile/run、查看证据、暂停或继续长程任务。

不建议让 DSH 取代 GOAP 规划器。DSH 的模型循环和动态 workflow 适合开放式编排；企业规则、动作可达性和审计要求应留在确定性的 Semantic GOAP/Embabel 一侧。

## 推荐边界

```text
DSH session / UI / LLM
  |  semantic_goap_interview
  |  semantic_goap_validate
  |  semantic_goap_compile
  |  semantic_goap_run
  v
本项目 HTTP API
  -> Semantic GOAP Compiler
  -> Embabel Agent / runtime
  -> checkpoint + evidence store
```

DSH 官方架构中，Session 是追加式事件日志，模型上下文由事件派生；Agent loop、tools、持久化和模型提供方均为插件。这使它非常适合做接入层，但也意味着 JVM Agent 不会被 DSH 原生直接加载，需要 HTTP/MCP/CLI tool bridge。

## 访谈流程

DSH 侧应维护以下状态，而不是只给 LLM 一段大 prompt：

```json
{
  "transcript": "...",
  "candidateVersion": 3,
  "openQuestions": ["失败后如何处理？"],
  "confirmedClaims": ["tests_passed is required before release"],
  "rejectedClaims": []
}
```

每轮调用 `/api/interviews/extract`，将候选 IR 的 diff 展示给用户；只有用户确认后才进入 `/api/models/compile`。

## 运行流程

MVP 的 `/api/agents/run` 是同步接口。长程版本建议改为：

- `POST /runs`：返回 `runId`。
- `GET /runs/{runId}`：返回当前 goal、world state、计划、等待中的人工输入。
- `POST /runs/{runId}/events`：提交数据库 observation、Agent 结果或人工确认。
- `POST /runs/{runId}/resume`：从 checkpoint 恢复并重新规划。

DSH Session 记录人机交互和 tool call；业务 checkpoint、幂等键、外部副作用和证据由本服务持久化。两边通过 `runId` 与 DSH `sessionId` 关联，而不是共享黑板内存。

## Tool Bridge 原型

仓库已在 [`integrations/dsh/goap-tools.ts`](../integrations/dsh/goap-tools.ts) 提供一个薄 DSH plugin 适配器，使用官方 `defineTool` 暴露上述四个 typed tools。适配器只负责参数校验、HTTP 调用和结果展示，不复制规划逻辑。这样即使将来换成飞书、企微或独立 H5，后端协议仍保持不变。

当前网页工作台直接调用本项目 HTTP API，因此不依赖 DSH 也能运行。接入 DSH 后，应由 DSH 接管多轮访谈 Session、LLM 推理和工具调用，网页通过 DSH 的 Remote/Session API 订阅会话与工具事件；GOAP 服务仍是确定性控制面。

参考：

- [DSH Agent API](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent/README.md)
- [DSH Tools](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/tools.md)
- [DSH Sessions](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)
