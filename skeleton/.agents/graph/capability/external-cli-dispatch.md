---
name: external-cli-dispatch
layer: capability
domain: capability
description: 外部 CLI 统一调度 — Antigravity 三重身份（委托人 + 法官 + 监工）、ABCDE 分级闸门、多 backend 并行、降级策略、会话恢复与追问、模型选择、文件注入
serves:
  - role-system/pm-workflow
  - role-system/worker-workflow
depends_on:
  - data-layer/config-management
  - capability/quality-control
  - capability/framework-governance
relates_to:
  - capability/task-management
  - capability/context-management
files:
  - path: .agents/skills/common-cli-dispatch/SKILL.md
    role: 调用规则 + ABCDE 闸门 + 流程定义
  - path: .agents/skills/common-cli-dispatch/scripts/cli-runner.js
    role: 主调度引擎（子进程管控 + 并行调度 + 降级 + 超时）
  - path: .agents/skills/common-cli-dispatch/scripts/backends/codex.js
    role: Codex CLI 后端适配器（capability interface）
  - path: .agents/skills/common-cli-dispatch/scripts/backends/claude.js
    role: Claude Code 后端适配器（capability interface）
  - path: .agents/skills/common-cli-dispatch/scripts/backends/gemini.js
    role: Gemini CLI 后端适配器（capability interface）
  - path: .agents/skills/common-cli-dispatch/scripts/lib/parser.js
    role: JSON 行解析器（逐行 JSON.parse，解析失败降级为纯文本）
  - path: .agents/skills/common-cli-dispatch/scripts/lib/filter.js
    role: stderr 噪音过滤（各 backend 特有的 noisePatterns 匹配）
  - path: .agents/skills/common-cli-dispatch/scripts/lib/path-utils.js
    role: 共享路径分类器（文件→父目录转换、去重、不存在路径跳过）
  - path: .agents/skills/common-cli-dispatch/scripts/lib/reporter.js
    role: 结构化输出报告（schema_version 1.0 的 JSON 输出契约）
  - path: .agents/skills/common-cli-dispatch/templates/review.md
    role: 审查模式 Prompt 模板（Markdown 变量占位符）
  - path: .agents/skills/common-cli-dispatch/templates/roles/*.md
    role: 专属角色提示词模板（定义各 backend 在不同场景的身份和审点）
  - path: .agents/rules/cli-direct-call-guard.md
    role: CLI 直接调用守卫 Rule（禁止 run_command 直接调用 CLI）
---

# 外部 CLI 统一调度

外部 CLI 调度是框架的统一外部 AI 审查能力。通过 ABCDE 分级闸门控制调用数量，cli-runner.js 管控子进程生命周期，支持多 backend 并行独立审查。

## 核心能力

- **ABCDE 闸门**：A=3 CLI, B=2, C=1, D/E=0，由 SKILL.md 在调用前检查
- **多 Backend 并行**：cli-runner.js 对每个 backend 启动独立子进程，互不可见
- **降级策略**：首选 backend 不可用时按 strengths + mode 动态匹配替代
- **超时管控**：AbortController + SIGTERM (5s) → SIGKILL
- **结构化输出**：schema_version 1.0 的 JSON 输出契约（含 session_id）
- **会话恢复**：--session-id / --follow-up 多轮追问（Codex exec resume / Claude --resume / Gemini --resume）
- **模型选择**：--model 覆盖 config.yaml default_model（Codex -m / Claude --model / Gemini --model）
- **文件注入**：--include-files 缩窄审查范围（通过 path-utils.js 归一化：文件→父目录 + 去重 + 跳过不存在路径）
- **会话列表**：--list-sessions 查询历史会话（fs 模式 / CLI flag 模式）
- **治理约束**：cli-direct-call-guard Rule 禁止绕过 Skill 直接调用

## 调用路径

```text
AI 激活 common-cli-dispatch Skill
  → ABCDE 闸门检查
  → 准备 Prompt（填充 templates/review.md）
  → run_command: node cli-runner.js --backend ... --mode review ...
  → cli-runner.js 并行启动多个 CLI 子进程
  → AI 读取结果、结合 spec 交叉验证并进行法官裁决 (verdict.md)
```

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：pm-workflow 和 worker-workflow 的外部审查环节
- **横向影响**：config-management 中 team.roster 的 cli_command 字段、routing 的 grade_review_mapping
- **下游影响**：quality-control 的审查证据收集流程
