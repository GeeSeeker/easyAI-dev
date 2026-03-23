---
title: 外部 CLI 集成指南
version: "3.0"
category: guides
status: active
---

# 外部 CLI 集成指南

> **版本**：v3.0（会话恢复 + 模型选择 + 文件注入扩展版）
> **适用角色**：PM（调度）、Worker（执行时参考）
> **架构依据**：`.docs/design/features/common-cli-dispatch.md` (v1.1)

---

## 1. 安全约束

### 1.1 核心原则：代码主权

外部 CLI（Codex / Claude Code / Gemini CLI）= **外包资源池**，不是项目成员。

- 外部 CLI 产出视为 **Prototype**，主控 AI 需重构后才能合入代码库
- 主控 AI 重构时须确保：对齐项目编码规范、去除冗余、验证类型安全

### 1.2 调用方式

> ⚠️ **唯一合法调用路径**：通过 `common-cli-dispatch` Skill 的 cli-runner.js 脚本调用。
> `cli-direct-call-guard` Rule 禁止 AI 通过 `run_command` 直接调用 codex / claude / gemini。

**调用流程**：

```text
AI 激活 common-cli-dispatch Skill
  → ABCDE 闸门检查（A=3 CLI, B=2, C=1, D/E=0）
  → 准备 Prompt（填充 templates/review.md 模板）
  → run_command: node cli-runner.js --backend <backends> --mode review ...
  → AI 读取结果文件并综合
```

### 1.3 调用前检查清单

每次通过 `common-cli-dispatch` 调用外部 CLI 前，PM/Worker 必须确认：

- [ ] 确认 ABCDE 等级（来自 `common-skill-eval` 自评）
- [ ] 明确调用目的（审查 / 分析）
- [ ] 准备 Prompt 文档（使用 `templates/review.md` 模板）
- [ ] 确认 `--backend` 参数（按等级选择 CLI 组合）

---

## 2. 统一调用模板

### 2.1 cli-runner.js 命令行参数

```bash
node .agents/skills/common-cli-dispatch/scripts/cli-runner.js \
  --backend codex,claude \
  --mode review \
  --prompt-file .tmp/cli-dispatch/prompt-{timestamp}.md \
  --workdir /path/to/project \
  --timeout 600 \
  --output-dir .tmp/cli-dispatch/results/
```

| 参数 | 说明 |
| --- | --- |
| `--backend <name,...>` | 逗号分隔的 backend 列表（codex / claude / gemini） |
| `--mode <mode>` | 调用模式（review / execute） |
| `--prompt-file <path>` | Prompt 文件路径 |
| `--workdir <path>` | CLI 工作目录 [默认: 当前目录] |
| `--timeout <seconds>` | 超时秒数 [默认: config.yaml per-backend / 600] |
| `--output-dir <path>` | 结果输出目录 |
| `--session-id <id>` | 恢复指定会话（从上次结果 JSON 的 `session_id` 获取） |
| `--follow-up` | 标记为追问模式（需配合 `--session-id`） |
| `--model <name>` | 指定模型（覆盖 config.yaml `default_model`） |
| `--include-files <paths>` | 逗号分隔的文件/目录路径，注入审查上下文 |
| `--list-sessions <backend>` | 列出指定 backend 的历史会话并退出 |

### 2.2 Backend 适配器特性

| Backend | CLI 命令 | 擅长领域 | Resume | JSON | 模型参数 | 文件注入 |
| --- | --- | --- | --- | --- | --- | --- |
| Codex | `codex` | 后端逻辑、算法分析、安全 | `exec resume <id>` | `--json` | `-m` | stdin 拼接 |
| Claude | `claude` | 架构、重构、多文件分析 | `--resume <id>` | `--output-format json` | `--model` | `--add-dir` |
| Gemini | `gemini` | 前端、可维护性、模式一致 | `--resume <id>` | `-o json` | `--model` | `--include-directories` |

### 2.3 JSON 输出契约

cli-runner.js 输出 `schema_version: "1.0"` 的 JSON：

```json
{
  "schema_version": "1.0",
  "task_id": "string",
  "backend": "codex",
  "mode": "review",
  "exit_code": 0,
  "duration_ms": 12345,
  "degraded_from": null,
  "review_result": {
    "findings": [
      {
        "severity": "Critical|Warning|Info",
        "dimension": "string",
        "description": "string",
        "fix_suggestion": "string"
      }
    ],
    "passed_checks": ["string"],
    "summary": "string"
  },
  "session_id": "uuid | null"
}
```

---

## 3. 多模型交叉审查流程

### 3.1 流程概述

```text
Stage 1：并行审查（产出互不可见）
  ├─ cli-runner.js 启动 CLI-A 子进程 → result-codex.json
  └─ cli-runner.js 启动 CLI-B 子进程 → result-claude.json

Stage 2：主控 AI 综合（分级处理）
  └─ 读取各结果文件 → 去重 → 分级

Stage 3：决策与修复
  ├─ Critical → 必须修复
  ├─ Warning → 建议修复
  └─ Info → 酌情处理
```

### 3.2 推荐组合

| ABCDE 等级 | `--backend` 参数      | 组合理由                     |
| ---------- | --------------------- | ---------------------------- |
| A          | `codex,claude,gemini` | 全面覆盖（后端+架构+前端）   |
| B          | `codex,claude`        | 互补（执行优化 vs 架构视角） |
| C          | `codex`               | 单 CLI 审查                  |

### 3.3 综合报告格式

```markdown
## 交叉审查报告：T{xxx}

### Critical（X 项）— 必须修复

- [ ] [SPEC] file.ts:42 — 约束 C1 未满足：{描述}

### Warning（Y 项）— 建议修复

- [ ] [QUA] utils.ts:88 — 命名不一致：{描述}

### Info（Z 项）— 酌情处理

- [ ] [PAT] helper.ts:20 — 建议抽取函数：{描述}

### 已通过检查

- ✅ 约束集 C1-C5 全部满足
```

### 3.4 决策规则

- **Critical > 0**：必须修复后才能进入验收
- **Critical = 0, Warning > 0**：建议修复，但可由 PM 判断是否接受
- **全部 Info**：可直接进入验收

---

## 4. 降级策略

当指定 backend 不可用时：

1. cli-runner.js 自动检测可用性（`which` 命令）
2. 按 strengths + mode 匹配最近似的可用 backend
3. 降级后标记结果中的 `degraded_from` 字段
4. 全部不可用 → exit_code = 127 + error 提示

---

## 5. 使用场景指南

| 场景             | ABCDE 等级 | `--backend` 参数    | `--mode` |
| ---------------- | ---------- | ------------------- | -------- |
| 框架核心变更审查 | A          | codex,claude,gemini | review   |
| 跨模块功能审查   | B          | codex,claude        | review   |
| 单模块逻辑审查   | C          | codex               | review   |
| 低风险 / 配置    | D          | 不调用 CLI          | —        |
| 文档 / 格式      | E          | 不调用 CLI          | —        |

### 注意事项

1. **临时文件路径**：统一使用 `.tmp/cli-dispatch/`（非系统 `/tmp/`）
2. **超时控制**：默认 600 秒，复杂任务可适当增加。各 CLI 可在 config.yaml `team.roster` 中独立配置
3. **产出重构**：所有外部 CLI 产出在合入前必须经主控 AI 重构对齐项目规范（代码主权原则）
4. **零 npm 依赖**：cli-runner.js 仅使用 Node.js 内置模块
5. **会话管理**：首轮结果 JSON 中的 `session_id` 应当保存，供后续 `--session-id` 追问使用
6. **模型优先级**：`--model` CLI 参数 > config.yaml `default_model` > CLI 默认模型
