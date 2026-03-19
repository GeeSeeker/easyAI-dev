# Layer 2 · 能力层（Capability）

> 框架核心业务能力 — 将数据层的原始存储转化为可编排的业务功能。

## 层级定位

能力层封装了框架的**核心业务逻辑**。它消费 Layer 1 的结构化数据，通过 MCP Tools 和 Skills 实现任务管理、质量控制等高级功能，为 Layer 3 的角色工作流提供可组合的能力模块。

## 包含节点

| 节点                 | 描述                                             |
| -------------------- | ------------------------------------------------ |
| task-management      | 任务全生命周期管理（状态机、验收门、子任务 DAG） |
| quality-control      | 质量控制（TDD、自检、Evidence Gate）             |
| context-management   | 上下文管理（Token 预算、阶段冻结）               |
| knowledge-management | 知识管理（框架知识库、图谱）                     |
| framework-governance | 框架治理（约束分层、规范演进、Manifest 升级）    |
| external-cli-dispatch| 外部 CLI 统一调度（Codex / Claude / Gemini 审查）|

## 层间关联

- **向下依赖** → Layer 1 的 task-storage、spec-system、journal-system、config-management
- **向上服务** → Layer 3 的 PM/Worker 工作流编排这些能力模块
- **横向协作** → task-management 与 quality-control 紧密协作（TDD 流程依赖任务上下文）
