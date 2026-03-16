---
name: git-integration
layer: foundation
domain: foundation
description: Git 版本控制集成 — 状态查询、提交历史、Worktree 并行隔离
serves:
  - capability/task-management
  - capability/quality-control
  - capability/framework-governance
  - role-system/pm-workflow
  - role-system/worker-workflow
depends_on: []
relates_to:
  - foundation/file-persistence
  - foundation/manifest-mechanism
children:
  - git-status-query
  - worktree-isolation
  - git-ref-validation
files:
  - tool: project_status
    role: 项目状态聚合（含 Git 分支、最近提交）
  - tool: worktree_create
    role: 为任务创建 Git worktree（并行隔离）
  - tool: worktree_merge
    role: Worktree 分支合并回目标分支
  - tool: worktree_cleanup
    role: 清理 Worktree 及其分支
  - tool: worktree_list
    role: 查询所有 Worktree 状态
---

# Git 集成

Git 集成为 easyAI 提供版本控制能力，支持状态查询、提交历史检索和 Worktree 并行任务隔离。

## 子特性

### Git 状态查询（git-status-query）

查询当前 Git 仓库的分支、未提交变更、最近提交记录等信息。`project_status` Tool 聚合 Git 状态与任务/日志信息，用于 PM 会话启动时的状态恢复。

### Worktree 并行隔离（worktree-isolation）

为中/高风险任务创建独立的 Git worktree，实现物理级别的分支隔离。完整生命周期包括：创建 → 工作 → 合并 → 清理。PM task-review 验收时触发 merge + cleanup。

### Git Ref 防注入（git-ref-validation）

`isValidGitRef()` 校验分支名合法性，防止通过伪造分支名执行注入攻击。由 Capability Gate 模块调用。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：PM 验收流程的 Worktree 合并步骤、Worker 的隔离工作环境
- **横向影响**：manifest-mechanism 依赖 Git 仓库状态判断升级可行性
- **下游影响**：无（本节点是最底层）
