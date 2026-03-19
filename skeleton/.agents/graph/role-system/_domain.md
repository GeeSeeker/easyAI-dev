# Layer 3 · 角色系统层（Role System）

> 角色工作流编排 — 将能力层的功能模块组合为 PM 和 Worker 的完整工作链路。

## 层级定位

角色系统层定义了框架的**两个核心角色**及其工作流程。它调度 Layer 2 的能力模块，将离散的功能编排为有序的工作链路，直接为 Layer 4 的用户体验提供服务。

## 包含节点

| 节点               | 描述                                                 |
| ------------------ | ---------------------------------------------------- |
| pm-workflow        | PM 工作流 — 会话启动、需求发散、任务规划、验收审批   |
| worker-workflow    | Worker 工作流 — 任务读取、TDD 编码、自检提交         |
| worker-quick-fix   | Worker 轻量修复工作流 — 极其简化的修改与快速验证流程 |

## 层间关联

- **向下依赖** → Layer 2 的 task-management、quality-control、context-management、knowledge-management
- **向上服务** → Layer 4 的 requirement-delivery 和 session-management
- **横向协作** → PM 和 Worker 通过任务系统异步协作（PM 创建任务 → Worker 执行 → PM 验收）
