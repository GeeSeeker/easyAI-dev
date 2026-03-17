---
name: file-persistence
layer: foundation
domain: foundation
description: 文件系统持久化 — .trellis/ 和 .agents/ 的目录约定与读写机制
serves:
  - data-layer/task-storage
  - data-layer/spec-system
  - data-layer/journal-system
  - data-layer/config-management
  - capability/knowledge-management
depends_on: []
relates_to:
  - foundation/config-system
  - foundation/git-integration
children:
  - trellis-directory
  - agents-directory
  - docs-directory
  - directory-map
files:
  - path: .trellis/
    role: 数据持久层根目录（tasks/ spec/ workspace/ config/）
  - path: .agents/
    role: AI 角色层根目录（rules/ workflows/ skills/）
  - path: .docs/
    role: 意图与蓝图空间根目录（notes/ refs/ design/ archive/）
  - path: .directory-map
    role: 用户自定义目录映射（用途声明）
---

# 文件系统持久化

文件持久化定义了 easyAI 框架的**目录约定** — 三个隐藏顶层目录各自承担明确职责，所有数据最终以文件形式存储在这些目录下。

## 子特性

### .trellis/ 目录体系（trellis-directory）

数据持久层的根目录，包含四个子目录：

- `tasks/` — 任务数据（AI 动态创建）
- `spec/` — 项目规范（骨架预设 + 运行时扩展）
- `workspace/` — 工作日志（跨会话记忆）
- `config/` — 框架配置（MCP 运行时消费）

### .agents/ 目录体系（agents-directory）

AI 角色层的根目录，包含三个子目录：

- `rules/` — 规则注入（always_on / glob 触发）
- `workflows/` — 角色入口（PM / Worker）
- `skills/` — 能力模块（按角色前缀分组）

### .docs/ 目录体系（docs-directory）

意图与蓝图空间，面向人与大局：

- `notes/` — 草稿场区（user-/pm- 前缀，双向临时文档）
- `refs/` — 外部参考资料库
- `design/planning/` — 长线规划、Roadmap、里程碑总结
- `design/features/` — 特性架构蓝图
- `archive/` — 就地养老式归档

### 目录映射（directory-map）

`.directory-map` 文件允许用户声明自定义目录的用途，AI 据此定位文件。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：Layer 1 所有数据节点的存储路径依赖此约定
- **横向影响**：git-integration 跟踪的文件范围受目录结构影响
- **下游影响**：无（本节点是最底层）
