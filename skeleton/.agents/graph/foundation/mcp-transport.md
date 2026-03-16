---
name: mcp-transport
layer: foundation
domain: foundation
description: MCP Server 传输层 — stdio 通信协议、工具注册、资源注册
serves:
  - data-layer/task-storage
  - data-layer/spec-system
  - data-layer/journal-system
  - data-layer/config-management
  - capability/task-management
  - capability/quality-control
  - capability/context-management
  - capability/framework-governance
depends_on: []
relates_to:
  - foundation/config-system
children:
  - stdio-transport
  - tool-registry
  - resource-registry
  - capability-gate
files:
  - tool: project_status
    role: 项目状态聚合查询
  - tool: task_create
    role: 任务创建
  - tool: task_get
    role: 任务详情读取（含冻结上下文）
  - tool: task_list
    role: 任务列表查询
  - tool: task_transition
    role: 任务状态流转
  - tool: task_cancel
    role: 任务取消
  - tool: task_append_log
    role: 任务执行记录追加
  - tool: subtask_create
    role: 子任务创建（DAG 依赖 + 循环检测）
  - tool: subtask_dependency_graph
    role: 子任务依赖图查询
  - tool: journal_append
    role: 日志写入
  - tool: journal_search
    role: 日志搜索
  - tool: context_budget
    role: 上下文 Token 预算估算
  - tool: context_generate
    role: 上下文推荐清单生成
  - tool: plan_validate
    role: 规划反面模式检测
  - tool: spec_validate
    role: 规范文件格式校验
  - tool: conflict_check
    role: 文件范围冲突检测
  - tool: framework_init
    role: 框架初始化
  - tool: framework_check
    role: 框架完整性检查
  - tool: framework_update
    role: Manifest 驱动框架升级
  - tool: worktree_create
    role: Git Worktree 创建
  - tool: worktree_merge
    role: Worktree 分支合并
  - tool: worktree_cleanup
    role: Worktree 清理
  - tool: worktree_list
    role: Worktree 状态查询
---

# MCP 传输层

MCP Transport 是 easyAI 框架的通信基础，提供 AI 与文件系统之间的可编程桥梁。所有 MCP Tool 和 Resource 通过此层注册和调度。

## 子特性

### stdio 传输（stdio-transport）

采用 stdio（标准输入/输出）作为传输协议，AI 客户端通过进程标准流与 MCP Server 通信。不依赖网络端口，部署简单。

### 工具注册（tool-registry）

MCP Server 启动时注册 23 个 Tools，涵盖任务管理、日志、上下文、质量、框架管理、Worktree 六大类。每个 Tool 定义输入参数的 JSON Schema 和处理函数。

### 资源注册（resource-registry）

MCP Server 注册 6 个 URI 资源，支持只读数据查询。包含项目状态、日志最新条目、规范文件、任务上下文、子任务上下文等。`spec://` 简写语法糖映射到 `trellis://spec/`。

### 权限校验（capability-gate）

Capability Gate 为受限工具提供角色权限校验。通过 `CAPABILITY_MATRIX` 定义每个受限工具对每个角色的允许/拒绝规则，防止无意越权。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：所有依赖 MCP Tools 的能力层特性（task-management、quality-control 等）
- **横向影响**：config-system 提供的运行时配置可能影响 Tool 行为
- **下游影响**：无（本节点是最底层）
