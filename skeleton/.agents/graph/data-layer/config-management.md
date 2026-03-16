---
name: config-management
layer: data-layer
domain: data-layer
description: 配置数据管理 — config.yaml 结构定义、各段落职责、运行时联动
serves:
  - capability/task-management
  - capability/context-management
  - capability/framework-governance
  - role-system/pm-workflow
  - capability/knowledge-management
depends_on:
  - foundation/file-persistence
  - foundation/config-system
  - foundation/mcp-transport
relates_to:
  - data-layer/task-storage
  - data-layer/spec-system
  - data-layer/journal-system
children:
  - framework-section
  - developer-section
  - tasks-section
  - journal-section
  - context-section
  - routing-section
  - team-section
files:
  - path: .trellis/config/config.yaml
    role: 框架配置文件（完整结构定义）
---

# 配置数据管理

配置管理定义了 `config.yaml` 的**结构设计和各段落职责**，是 Layer 0 config-system 解析的数据源。

## 子特性

### framework 段（framework-section）

框架基本信息：name、version、description。version 与 `.easyai-version` 保持一致。

### developer 段（developer-section）

开发者信息：name（用于 workspace 目录名）。PM 启动时硬性校验，为空则阻断并引导填写。

### tasks 段（tasks-section）

任务管理配置：root（任务目录）、archive（归档目录）、max_subtasks（子任务上限）、statuses（状态列表定义）。

### journal 段（journal-section）

日志配置：root（日志目录）、maxLinesPerFile（自动分页阈值）、dateFormat（日期格式）。

### context 段（context-section）

上下文预算：warningThreshold（60% 降级）、criticalThreshold（80% 新会话）、phaseBudget（各阶段 Token 预算）。

### routing 段（routing-section）

任务路由：risk_review_mapping（风险→审查策略映射）、low_risk_whitelist（低风险变更白名单）。

### team 段（team-section）

AI 团队资源清单：roster 列出主控 AI 和外部 CLI，各含 type、mcp_tool、strengths、concurrency。PM 路由任务时参考此配置。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：task-management 的状态列表、context-management 的预算、PM 的路由决策
- **横向影响**：task-storage/spec-system/journal-system 的目录路径均由此配置
- **下游影响**：config-system 的解析逻辑需适配新字段
