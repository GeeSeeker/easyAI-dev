---
name: context-management
layer: capability
domain: capability
description: 上下文管理 — Token 预算估算、上下文推荐生成、阶段冻结快照
serves:
  - role-system/pm-workflow
  - role-system/worker-workflow
depends_on:
  - data-layer/task-storage
  - data-layer/spec-system
  - data-layer/config-management
  - foundation/mcp-transport
  - foundation/config-system
relates_to:
  - capability/task-management
  - capability/knowledge-management
children:
  - context-budget
  - context-generation
  - phase-frozen-snapshot
  - context-priority
files:
  - path: .agents/skills/pm-task-planning/SKILL.md
    role: Step 7 上下文配置（调用 context_generate 生成推荐清单 + PM 审核）
  - path: .agents/workflows/worker.md
    role: Worker 启动 Step 4 上下文加载（优先使用 frozen_context，回退到 context.jsonl）
  - tool: context_budget
    role: Token 预算估算（超 60% 建议降级、超 80% 建议新开会话）
  - tool: context_generate
    role: 上下文推荐清单生成（分析任务描述 + 扫描 spec 目录 → 按 phase 分配 priority）
  - tool: task_get
    role: 返回任务详情中包含 frozen_context（in_progress 状态自动加载冻结快照）
---

# 上下文管理

上下文管理确保 AI 在任务执行的不同阶段获取**正确且稳定**的参考信息。通过 Token 预算控制上下文大小，通过阶段冻结防止上下文静默漂移。

## 子特性

### Token 预算（context-budget）

估算当前任务的上下文 Token 消耗。MCP Tool `context_budget` 按阶段（plan / implement / check / debug）设定预算上限：

- 超过 60% → 建议降级 recommended 上下文（减少非必要的参考文件）
- 超过 80% → 建议新开会话（防止上下文窗口溢出导致质量下降）

### 上下文推荐生成（context-generation）

PM 创建任务后，调用 `context_generate(task_id, phase)` 自动扫描 spec 目录，结合任务描述生成 context.jsonl 推荐清单。每个条目包含 type（spec/file）、path、priority（required/recommended/deferred）和 reason。PM 审核后写入任务目录。

### 阶段冻结快照（phase-frozen-snapshot）

任务进入 `in_progress` 状态后，`task_get()` 返回的 `frozen_context` 字段自动包含冻结的上下文快照内容。这确保同一阶段内上下文不会因 spec 文件变更而静默漂移，Worker 始终基于一致的参考信息工作。

### 上下文优先级（context-priority）

context.jsonl 中的三级优先级控制上下文加载策略：

- **required** — 必须加载，缺失则警告
- **recommended** — 建议加载，Token 预算紧张时可降级
- **deferred** — 延迟加载，仅在触发特定阶段时加载

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：PM 任务规划的上下文配置步骤、Worker 启动流程的上下文加载
- **横向影响**：task-management 的任务状态影响冻结快照时机；knowledge-management 的 spec 文件是上下文的主要来源
- **下游影响**：task-storage 的 context.jsonl 格式、spec-system 的文件路径引用
