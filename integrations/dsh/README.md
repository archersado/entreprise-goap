# DSH Tool Bridge

这个目录提供 Semantic GOAP 与 DeepSeek Harness（DSH）的薄适配层。DSH 负责多轮会话、模型循环、工具选择和前端会话体验；Spring Boot 服务继续负责模型校验、Embabel 编译、确定性规划和证据。

`index.js` 是可安装的 DSH Bundle，按当前 DSH `@deepseek-ai/dsh-tools` 的 `defineTool` API 注册五个工具，并声明 `GOAP 访谈 Agent` 预设：

- `semantic_goap_spec_review`
- `semantic_goap_build`
- `semantic_goap_validate`
- `semantic_goap_compile`
- `semantic_goap_run`

本地安装到基于 Web 模板的 DSH Profile：

```bash
npx @deepseek-ai/dsh semantic-goap --from-default-profile web --dump-default-config
npx @deepseek-ai/dsh plugin --profile semantic-goap add ./integrations/dsh
GOAP_API_BASE_URL=http://127.0.0.1:18080 npx @deepseek-ai/dsh --profile semantic-goap --port 3080
```

建议给工作台 Agent 配置以下行为约束：

1. Agent 在 DSH Session 中持续维护版本化 `InterviewSpec`，每轮回答后调用 review。
2. 访谈结果存在 `clarificationQuestions` 时继续追问，并展示 Spec diff。
3. 只有 `status=CONFIRMED`、开放问题为空且 `readyToBuild=true` 时才生成 GOAP。
4. 把候选模型或 diff 展示给用户，只有明确确认后才调用 compile/run。
5. 不修改 executor、谓词或权限校验结果。
6. 工具调用结果写入 DSH Session；业务 checkpoint 与 evidence 仍由 GOAP 服务保存。

当前后端运行接口是同步 MVP。正式长任务接入前，还需实现 `runId`、checkpoint、resume 和人工确认接口。
