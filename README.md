# Enterprise Semantic GOAP MVP

这个项目验证一条尽量短、但边界真实的链路：

```text
自然语言访谈
  -> 带来源与置信度的 Semantic GOAP IR
  -> 确定性校验
  -> Semantic GOAP Compiler
  -> Embabel AgentBuilder / Agent
  -> 逐步执行、取证、每步重新规划
```

示例场景是一个端到端研发闭环：需求访谈、设计评审、实现、自动化测试、形成发布候选。五个角色可映射为五个 Agent，但 GOAP 规划面对的是统一的能力图，而不是让 LLM 临时编造流程。

## 当前做到什么

- `RuleBasedInterviewExtractor`：不需要模型密钥的访谈抽取基线，输出候选语义模型、待确认问题和来源。
- `SemanticGoapValidator`：检查 ID、谓词引用、角色归属、执行器绑定及目标可生产性。
- `SemanticGoapCompiler`：使用 Embabel 1.5.2 官方 `AgentBuilder` 生成真正的 `Agent`、`Action`、`Condition` 和 `Goal`。
- `DeterministicGoapRuntime`：透明的最短路径规划器；每执行一个 Action 后重新读取状态、重新规划，并生成证据。
- Spring HTTP API：让网页、企微/飞书或 DSH 把访谈和运行请求接入同一条服务链路。

MVP 的本地运行器用于无模型、无外部基础设施验证。它不是伪装成 Embabel `AgentPlatform`：生产阶段应把编译结果部署到 Embabel AgentPlatform，并将 checkpoint/evidence 落到持久化存储。

## 运行

需要 JDK 21+ 和 Maven 3.9+（Embabel 1.5.x 发布物以 JVM 21 编译）。

```bash
mvn -Dmaven.repo.local=.m2/repository test
mvn -Dmaven.repo.local=.m2/repository spring-boot:run
```

启动后访问 [http://localhost:8080](http://localhost:8080) 可使用 Agent 工作台。工作台支持自然语言访谈、Semantic GOAP 模型查看、Agent 协作图、运行轨迹和证据概览。

执行完整管线：

```bash
curl -s http://localhost:8080/api/pipeline/run \
  -H 'Content-Type: application/json' \
  --data @examples/interview.json
```

主要接口：

- `POST /api/interviews/extract`
- `POST /api/models/validate`
- `POST /api/models/compile`
- `POST /api/agents/run`
- `POST /api/pipeline/run`

## 关键原则

1. LLM/DSH 可以提出语义候选，不能直接发明可执行代码。
2. `executor` 必须在 `CapabilityRegistry` 中绑定，未绑定的 Action 编译前失败。
3. GOAP 的前置条件和效果只使用稳定谓词；大文本保留在 evidence/provenance 中，不进入状态空间。
4. Action 声明的效果是规划假设，运行后仍需由观察结果更新状态并重新规划。
5. 跨 Agent 协作由 `ownerRole` 和 capability 分配表达；规划图与具体 Agent 进程解耦。

进一步设计见 [架构说明](docs/architecture.md) 和 [DSH 集成判断](docs/dsh-integration.md)。

## 参考实现

- [Embabel Agent](https://github.com/embabel/embabel-agent)
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
