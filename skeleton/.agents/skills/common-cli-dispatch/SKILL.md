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
  --output-dir .tmp/cli-dispatch/results/
```

**参数说明**：

| 参数 | 说明 |
| --- | --- |
| `--backend <name,...>` | 逗号分隔的 backend 列表（codex/claude/gemini） |
| `--mode <mode>` | 调用模式（review / execute） |
| `--prompt-file <path>` | Prompt 文件路径 |
| `--workdir <path>` | CLI 工作目录 [默认: 当前目录] |
| `--timeout <seconds>` | 超时秒数 [默认: config.yaml per-backend timeout / 600] |
| `--output-dir <path>` | 结果输出目录 |
| `--task-id <id>` | 任务 ID |
| `--session-id <id>` | 恢复指定会话（从上次结果 JSON 的 `session_id` 获取） |
| `--follow-up` | 标记为追问模式（需配合 `--session-id`） |
| `--model <name>` | 指定模型（覆盖 config.yaml `default_model`） |
| `--include-files <paths>` | 逗号分隔的文件/目录路径，注入审查上下文 |
| `--list-sessions <backend>` | 列出指定 backend 的历史会话并退出 |
| `--context-mode <mode>` | 上下文模式（analyze, review, execute） |

### Step 4：读取并处理结果

1. 读取 `--output-dir` 下各 backend 的结果文件（JSON 格式）
2. 按 `schema_version: "1.0"` 解析结构化输出
3. 提取 `review_result.findings`，按 severity 分级（Critical / Warning / Info）
4. 检查 `degraded_from` 字段，如有降级需记录
5. **保存 `session_id`** — 供后续追问使用
6. 综合多个 backend 结果，去重合并

## 角色定位与主权原则

### 核心定位

外部 CLI = 受聘外包（Subcontractor），Antigravity = 委托人 + 法官 + 监工。

| Antigravity 角色 | 适用模式 | 行为 |
|------------------|----------|------|
| 委托人 | 所有模式 | 决定调用目的、选择 CLI、准备 Prompt |
| 法官 | Review 模式 | 对 CLI 审查建议逐条裁决，以项目约束为准 |
| 监工 | Execute 模式 | 验收 CLI 写入的代码（lint/test/manual），不合格则回滚 |

### 主权原则

1. 外部 CLI 没有项目上下文（约束集、spec、设计意图、历史决策），其产出不具有自动采纳权
2. Antigravity 基于项目上下文做出独立判断，仅采纳正确且合适的内容
3. 当 CLI 建议与项目约束冲突时，Antigravity 的裁决优先

### 裁决依据优先级

1. 约束集（PM 制定的硬约束）
2. 项目 spec（.trellis/spec/ 中的规范）
3. 设计意图（.docs/design/ 中的架构决策）
4. CLI 建议（仅当不与上述冲突时采纳）

### 三种裁决结果

- `[ACCEPTED]` — CLI 意见正确且符合项目上下文，采纳
- `[REJECTED_CLI_ADVICE: 理由]` — CLI 意见与项目约束冲突或不适用，拒绝并说明理由
- `[PARTIALLY_ACCEPTED: 理由]` — CLI 发现了真实问题，但修复方案需按项目上下文调整

### Step 5：裁决 + 整合

原则："谁调用，谁裁判"。PM 和 Worker 都需通过 `common-cli-dispatch` 统一执行裁决逻辑。

- **5.1 读取结果**：读取 CLI 结果 JSON。
- **5.2 交叉验证**：将逐条 finding 与项目 `spec/` 或约束集进行交叉验证。
- **5.3 法官裁决**：对每条建议进行明确标记：
  - 采纳：`[ACCEPTED]`
  - 拒绝：`[REJECTED_CLI_ADVICE: 理由]`（必须提供具体拒绝理由）
  - 部分采纳：`[PARTIALLY_ACCEPTED: 理由]`（CLI 发现了真实问题，但修复方案需调整）
- **5.4 生成裁决报告**：将结论汇拢为裁决报告写入 `tasks/Txxx/cli/{backend}/verdict.md`（或相应的任务归档路经）。
- **5.5 整合到工作流**：将 `[ACCEPTED]` 的 findings 整合到当前工作流，并兼容旧有将综合结果作为审查或自检补充证据的流程。

## 会话恢复与追问流程

### 何时恢复会话

当满足以下任一条件时，应使用 `--session-id` 恢复上次调用的会话：

1. **首轮审查结果需要展开**：findings 含 Critical 但缺乏具体修改建议
2. **PM 需要追问**：针对某条 finding 要求 CLI 给出更详细的分析
3. **分阶段审查**：先审查架构 → 再审查实现细节（同一 session 保持上下文）

### 追问流程

```text
① 首轮 review → 获取结果（含 session_id）
② 判断是否需要追问
    ├─ 否 → 进入裁决流程（Step 5）
    └─ 是 → 准备追问 Prompt
③ 调用 cli-runner.js --session-id <id> --follow-up --prompt-file followup.md
④ 读取追问结果 → 合并到首轮结果
⑤ 进入裁决流程（Step 5）
```

> 追问 Prompt 应聚焦于具体问题，而非重复首轮的完整上下文。

### 各 CLI 的会话恢复机制

| Backend | 恢复机制 | session_id 来源 |
| --- | --- | --- |
| **Codex** | `codex resume <thread_id>` | JSON 输出中的 `thread_id` |
| **Claude** | `claude --resume <session_id> -p` | 交互结束时输出的 UUID / 会话目录名 |
| **Gemini** | `gemini --resume <session_id>` | JSON 输出中的 `session_id` |

## 上下文文件注入

通过 `--include-files` 缩窄 CLI 的关注范围，避免 CLI 在大项目中迷路。

### 使用场景

1. **代码审查**：只传入变更的文件 → CLI 专注审查变更
2. **架构分析**：传入核心模块目录 → CLI 分析模块间依赖
3. **安全检查**：传入 auth / crypto 相关文件 → CLI 聚焦安全审查

### 各 CLI 的文件注入机制

| Backend | 注入方式 | 说明 |
| --- | --- | --- |
| **Codex** | stdin prompt 中拼接文件内容 | Codex exec 无专门的文件注入参数 |
| **Claude** | `--add-dir <path>`（每个路径独立参数） | 支持目录级注入 |
| **Gemini** | `--include-directories <path>` | 与 workdir 使用相同参数 |

### 示例

```bash
node cli-runner.js \
  --backend claude \
  --mode review \
  --prompt-file prompt.md \
  --include-files src/auth,src/crypto \
  --workdir /path/to/project
```

## 模型选择

通过 `--model` 或 config.yaml `default_model` 指定 CLI 使用的模型。

### 优先级

```text
CLI --model 参数 > config.yaml team.roster.default_model > CLI 默认模型
```

### config.yaml 配置示例

```yaml
team:
  roster:
    - name: "Claude Code"
      type: "external_cli"
      cli_command: "claude"
      timeout: 600
      default_model: "claude-sonnet-4-20250514"  # 可选
```

### 各 CLI 的模型参数

| Backend | 参数 |
| --- | --- |
| **Codex** | `-m <model>` |
| **Claude** | `--model <model>` |
| **Gemini** | `--model <model>` |

## 会话列表查询

通过 `--list-sessions <backend>` 查询指定 CLI 的历史会话。

```bash
node cli-runner.js --list-sessions claude
node cli-runner.js --list-sessions codex
node cli-runner.js --list-sessions gemini
```

> Claude 和 Codex 通过文件系统读取（交互式 TUI 不适合脚本），Gemini 使用 `--list-sessions` flag。

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
4. [ ] 读取并处理结果（保存 session_id）
5. [ ] 判断是否需要追问（--follow-up + --session-id）
6. [ ] 将结果整合到当前工作流（裁决）

### 状态快照

- 当前角色：{PM/Worker}
- 当前 Skill: common-cli-dispatch
- ABCDE 等级：{A/B/C/D/E}
- CLI 数量：{0/1/2/3}
- 调用状态：{未开始/进行中/已完成/追问中/已降级}
- 活跃 session_id：{无 / <id>}
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

### TC-03: 会话恢复追问

- **场景**: 首轮审查后需要 CLI 展开某条 finding
- **输入**: `--session-id <上次结果的 session_id> --follow-up`
- **期望行为**: CLI 恢复上次会话上下文，回答追问问题
- **验证方法**: 检查 exit_code = 0 且回复引用上轮上下文

### TC-04: 会话列表查询

- **场景**: 调度前查看历史会话
- **输入**: `--list-sessions claude`
- **期望行为**: 返回 JSON 格式的会话列表
- **验证方法**: 检查输出包含 `sessions` 数组
