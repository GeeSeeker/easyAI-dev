# Layer 1 · 数据层（Data Layer）

> 结构化数据的组织与存储 — 定义框架数据的持久化格式和访问约定。

## 层级定位

数据层定义了框架核心数据（任务、规范、日志、配置）的**存储格式和目录组织**。它依赖 Layer 0 的文件系统和配置加载能力，为 Layer 2 的业务逻辑提供结构化数据存取。

## 包含节点

| 节点              | 描述         | 存储位置            |
| ----------------- | ------------ | ------------------- |
| task-storage      | 任务数据存储 | .trellis/tasks/     |
| spec-system       | 规范体系存储 | .trellis/spec/      |
| journal-system    | 工作记忆存储 | .trellis/workspace/ |
| config-management | 配置数据管理 | .trellis/config/    |

## 层间关联

- **向下依赖** → Layer 0 的 file-persistence 提供读写能力，config-system 提供配置解析
- **向上服务** → Layer 2 的 task-management 消费 task-storage，quality-control 消费 spec-system
- **横向协作** → config-management 提供其他数据节点的目录路径配置
