# MVP 架构与边界

## 数据路径

```text
InterviewExtractor
      |
      v
SemanticGoapModel -- provenance / clarification questions
      |
      v
SemanticGoapValidator ----> reject unknown predicates/executors
      |
      v
SemanticGoapCompiler -----> Embabel AgentBuilder -----> Embabel Agent
      |
      v
Runtime: observe -> plan -> execute one action -> collect evidence -> replan
```

## 为什么 IR 仍然强类型

自然语言和数据库记录可以是非结构化输入，但进入规划器前必须映射为有限、可判定的谓词。否则规划器无法可靠计算动作是否可用、效果是否满足目标，也无法做可达性检查。

强类型并不要求把每份业务文档都变成 JVM 类。这里采用两层结构：

- 控制面：`PredicateSpec`、`CapabilitySpec`、`GoalSpec`、`AgentRoleSpec`，必须结构化。
- 数据面：原始访谈、文档、数据库返回值和模型输出，放在 provenance/evidence 中，只提取少量稳定事实进入控制面。

## LLM 应该放在哪里

- 可用：访谈追问、候选语义抽取、文档理解、动作内部内容生成、异常解释。
- 不默认使用：GOAP 搜索、前置条件判定、执行器注册、权限决策、效果验收。
- 必须受约束：LLM 输出只引用已登记的谓词和 capability ID；编译器执行确定性校验。

## 跨 Agent

`CapabilitySpec.ownerRole` 决定动作由哪个角色承担。MVP 在一个进程中模拟五个角色；后续把 capability executor 替换为远程 Agent 调用即可，规划模型无需变化。

建议的生产拆分：

1. Orchestrator 维护 GOAP 状态、目标和运行 checkpoint。
2. Role Agent 只接收一个有明确输入、成功条件和证据要求的 capability。
3. Action 完成后返回结构化 observation，Orchestrator 决定是否接受效果并重新规划。

## 尚未冒充完成的部分

- 访谈抽取当前为规则基线，尚未接真实 LLM。
- 本地运行器验证规划语义和重规划，尚未把动态 Agent 部署到 Embabel `AgentPlatform`。
- checkpoint 当前只存在于一次 HTTP 响应中，尚未接 PostgreSQL/event store。
- `effects` 当前只表达正向谓词；失败分支应扩展为显式 outcome predicates。
