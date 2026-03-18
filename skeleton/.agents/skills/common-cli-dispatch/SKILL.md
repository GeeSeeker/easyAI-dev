---
name: common-cli-dispatch
description: "[Common] 外部 CLI 调度 — 触发：PM/Worker 需要外部 CLI 审查或执行。排除：D/E 级任务无需 CLI。产出：结构化审查报告。"
produces: cli_review_report
requires: null
---

# 外部 CLI 统一调度

## 适用场景

PM 或 Worker 需要调用外部 CLI（Codex / Claude Code / Gemini CLI）进行审查或执行时，**必须**通过本 Skill 的标准流程调用。**禁止**通过 `run_command` 直接调用 CLI 命令（`cli-direct-call-guard` Rule 强制约束）。

## HARD-GATE

```text
外部 CLI 的唯一合法调用路径是本 Skill 的 cli-runner.js 脚本。
直接 run_command 调用 codex / claude / gemini = 违反 Rule 硬约束。
```

## 闸门：ABCDE → CLI 数量映射（C1）

在调用外部 CLI 前，先确认当前工作的 ABCDE 等级（来自 `common-skill-eval` Step 3 的自评）：

| ABCDE 等级 | CLI 数量 | --backend 参数                  | 说明                  |
| ---------- | -------- | ------------------------------- | --------------------- |
| **A**      | 3        | `--backend codex,claude,gemini` | 三个 CLI 并行独立审查 |
| **B**      | 2        | `--backend codex,claude`        | 两个 CLI 并行独立审查 |
| **C**      | 1        | `--backend codex`               | 单 CLI 审查           |
| **D/E**    | 0        | 不调用 CLI                      | PM/Worker 内部处理    |

> D/E 级直接跳过本 Skill，不需要外部 CLI 介入。

## 标准调用流程（C2）

### Step 1：闸门检查

1. 确认当前 ABCDE 等级（已在 `common-skill-eval` Step 3 自评）
2. 查映射表确定 CLI 数量。D/E 级 → 退出本 Skill
3. 确认调用目的（审查 / 分析）和预期输出

### Step 2：准备 Prompt 文档

基于 `templates/review.md` 模板填充上下文：

1. 读取模板内容
2. 填入变量：`{task_id}`、`{context}`、`{constraints}`、`{review_dimensions}`、`{output_format}`
3. 将填充后的 Prompt 写入 `.tmp/cli-dispatch/prompt-{timestamp}.md`

> 临时文件路径统一为 `.tmp/cli-dispatch/`（非系统 `/tmp/`）。

### Step 3：调用 cli-runner.js

通过 `run_command` 调用调度引擎：

```bash
node .agents/skills/common-cli-dispatch/scripts/cli-runner.js \
  --backend codex,claude \
  --mode review \
  --prompt-file .tmp/cli-dispatch/prompt-xxx.md \
  --workdir /path/to/project \
  --timeout 600 \
  --output-dir .tmp/cli-dispatch/results/
```

**参数说明**：

| 参数             | 说明                                           |
| ---------------- | ---------------------------------------------- |
| `--backend`      | 逗号分隔的 backend 列表（codex/claude/gemini） |
| `--mode`         | 调用模式（review）                             |
| `--prompt-file`  | Prompt 文件路径                                |
| `--workdir`      | CLI 工作目录                                   |
| `--timeout`      | 超时秒数（默认 600）                           |
| `--output-dir`   | 结果输出目录                                   |
| `--session-id`   | 会话 ID，支持连续对话恢复存储                  |
| `--context-mode` | 上下文模式（analyze, review, execute）         |

### Step 4：读取并处理结果

1. 读取 `--output-dir` 下各 backend 的结果文件（JSON 格式）
2. 按 `schema_version: "1.0"` 解析结构化输出
3. 提取 `review_result.findings`，按 severity 分级（Critical / Warning / Info）
4. 检查 `degraded_from` 字段，如有降级需记录
5. 综合多个 backend 结果，去重合并

### Step 5：裁决 + 整合

原则："谁调用，谁裁判"。PM 和 Worker 都需通过 `common-cli-dispatch` 统一执行裁决逻辑。

- **5.1 读取结果**：读取 CLI 结果 JSON。
- **5.2 交叉验证**：将逐条 finding 与项目 `spec/` 或约束集进行交叉验证。
- **5.3 法官裁决**：对每条建议进行明确标记：
  - 采纳：`[ACCEPTED]`
  - 拒绝：`[REJECTED_CLI_ADVICE: 理由]`（必须提供具体拒绝理由）
- **5.4 生成裁决报告**：将结论汇拢为裁决报告写入 `tasks/Txxx/cli/{backend}/verdict.md`（或相应的任务归档路经）。
- **5.5 整合到工作流**：将 `[ACCEPTED]` 的 findings 整合到当前工作流，并兼容旧有将综合结果作为审查或自检补充证据的流程。

## 降级策略

当指定 backend 不可用时，cli-runner.js 自动执行降级：

1. 按 strengths + mode 匹配最近似的可用 backend
2. 降级后标记 `degraded_from` 字段
3. 全部 backend 不可用 → exit_code = 127 + error 提示
4. AI 根据结果决定：内部独立完成 or 上报用户

## 审查者匹配指引

从 `config.yaml` 的 `team.roster`（`type: external_cli`）中匹配：

| 任务领域             | 首选 CLI    | 备选 CLI    |
| -------------------- | ----------- | ----------- |
| 后端逻辑 / 安全      | Codex CLI   | Claude Code |
| 架构 / 重构 / 多文件 | Claude Code | Codex CLI   |
| 前端 / 模式一致性    | Gemini CLI  | Claude Code |

## PATEOAS 导航

```markdown
### 下一步行动

1. [ ] 检查 ABCDE 等级，确认 CLI 数量
2. [ ] 准备 Prompt 文档（填充 review.md 模板）
3. [ ] 调用 cli-runner.js（run_command）
4. [ ] 读取并处理结果
5. [ ] 将结果整合到当前工作流

### 状态快照

- 当前角色：{PM/Worker}
- 当前 Skill: common-cli-dispatch
- ABCDE 等级：{A/B/C/D/E}
- CLI 数量：{0/1/2/3}
- 调用状态：{未开始/进行中/已完成/已降级}
```

## 触发测试用例

### TC-01: B 级任务双 CLI 审查

- **场景**: PM 对 B 级框架变更任务发起审查
- **输入**: ABCDE = B，backend = codex,claude
- **期望行为**: 通过 cli-runner.js 并行调用两个 CLI，返回合并结果
- **验证方法**: 检查输出 JSON 中 `total: 2, succeeded: 2`

### TC-02: D 级任务跳过 CLI

- **场景**: Worker 对 D 级配置变更自评
- **输入**: ABCDE = D
- **期望行为**: 在 Step 1 闸门检查时直接退出，不调用 CLI
- **验证方法**: 检查是否未执行 run_command
