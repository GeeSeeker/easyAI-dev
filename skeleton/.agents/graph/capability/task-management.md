---
name: task-management
layer: capability
domain: capability
description: 任务全生命周期管理 — 从创建到归档的完整状态流转、验收门控、子任务编排
serves:
  - role-system/pm-workflow
  - role-system/worker-workflow
depends_on:
  - data-layer/task-storage
  - foundation/mcp-transport
  - foundation/config-system
  - data-layer/config-management
  - foundation/git-integration
relates_to:
  - capability/quality-control
  - capability/context-management
children:
  - state-machine
  - evidence-gate
  - subtask-dag
  - blocker-protocol
  - task-routing
files:
  - path: .agents/skills/pm-task-planning/SKILL.md
    role: 任务创建与约束集生成（7 步流程：需求聚焦 → 约束集 → 反面模式自检 → 任务拆分 → 路由 → 冲突检测 → 上下文配置）
  - path: .agents/skills/pm-task-review/SKILL.md
    role: 三阶段验收流程（Stage 1 Spec 合规 → Stage 2 代码质量 → Stage 3 Artifacts 沉淀）
  - path: .agents/skills/worker-lead/SKILL.md
    role: 组长编排（团队执行模式：PLAN 子任务拆分 + INTEGRATE 审核整合，含 ABCDE 工作重要性分级和 CLI 动态选型）
  - path: .agents/workflows/actor-worker.md
    role: Worker 启动流程中的任务读取、模式决策、worktree 环境切换、阻塞上报协议
  - tool: task_create
    role: 任务创建（生成 ID、创建目录和 task.md）
  - tool: task_get
    role: 任务详情读取（含 frozen_context 冻结快照 + compliance_hints 合规性提示）
  - tool: task_list
    role: 任务列表查询（支持按 status 过滤）
  - tool: task_transition
    role: 状态机运行时校验（合法转移矩阵 + Evidence Gate）
  - tool: task_cancel
    role: 任务取消（校验合法性 + 记录原因）
  - tool: task_append_log
    role: 任务执行记录追加
  - tool: subtask_create
    role: 子任务创建（DAG 依赖声明 + 自动循环检测）
  - tool: subtask_dependency_graph
    role: 子任务依赖图查询
  - tool: conflict_check
    role: 文件范围冲突检测（防止多任务修改同一文件）
  - path: .trellis/config/config.yaml
    section: tasks
    role: 任务配置（状态列表、根目录路径、归档路径）
---

# 任务管理

任务管理是 easyAI 的核心能力，覆盖任务从创建（pending）到归档（archived）的完整生命周期。PM 通过 `pm-task-planning` Skill 创建任务，Worker 通过 Workflow 读取并执行，PM 通过 `pm-task-review` Skill 验收。

## 子特性

### 状态机（state-machine）

任务状态流转控制，定义合法的状态转移路径。MCP Tool `task_transition` 在运行时硬性校验转移合法性，AI 无法绕过。

状态流转路径：

- `pending` → `in_progress`（Worker 开始执行）
- `in_progress` → `under_review`（Worker 提交验收，触发 Evidence Gate）
- `under_review` → `completed`（PM 验收通过）
- `under_review` → `rejected`（PM 打回）
- `rejected` → `in_progress`（Worker 继续修复）
- `completed` → `archived`（PM 归档，任务目录移至 archive/）
- 任意非终态 → `cancelled`（附带原因）

### 验收门（evidence-gate）

任务从 `in_progress` 转为 `under_review` 时的强制验证。要求每个验证类别标记为 `_PASS` 或 `_NA`，拒绝 `_FAIL` 和缺失标记。验收门由 `task_transition` MCP Tool 在状态转移时自动检查。

### 子任务 DAG（subtask-dag）

支持子任务间的依赖声明和自动环检测。通过 `subtask_create()` 声明依赖关系，`subtask_dependency_graph()` 查询依赖图并检测循环。用于团队执行模式下组长拆分子任务给组员。嵌套限制：组员不能再分配子任务（单层结构）。

### 阻塞上报协议（blocker-protocol）

Worker 执行中遇到 L3 级阻塞时的结构化上报机制。Worker 在任务目录 `blockers/` 下创建编号文件（`{NN}-{role}-question.md`），PM 以 `{NN}-pm-reply.md` 回复。PM 验收前扫描未回复的 blockers。

### 任务路由（task-routing）

PM 创建任务时的风险评估与审查策略分配。基于文件范围和任务性质判定 ABCDE 等级（E 无需审查 / D🟢 PM 自审 / C🟡 1 CLI / B🔴 2 CLI / A⚫ 3 CLI），从 `config.yaml` 的 `routing.grade_review_mapping` 读取 CLI 数量，从 `team.roster` 中选择审查者。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：PM 工作流的任务创建/验收流程、Worker 工作流的任务读取和执行流程
- **横向影响**：quality-control 的 TDD 流程依赖任务上下文和约束集；context-management 的上下文冻结绑定任务状态
- **下游影响**：task-storage 的目录结构和 task.md 格式；config-system 的任务配置段
