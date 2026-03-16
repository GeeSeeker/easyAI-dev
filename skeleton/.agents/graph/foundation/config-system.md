---
name: config-system
layer: foundation
domain: foundation
description: 配置加载与降级 — config.yaml 解析、内存缓存、默认值回退
serves:
  - data-layer/config-management
  - capability/context-management
  - capability/task-management
  - capability/framework-governance
  - data-layer/journal-system
  - data-layer/task-storage
depends_on: []
relates_to:
  - foundation/mcp-transport
  - foundation/file-persistence
children:
  - yaml-parser
  - cache-layer
  - default-fallback
files:
  - path: .trellis/config/config.yaml
    role: 框架配置文件（被解析的数据源）
---

# 配置系统

配置系统负责解析 `.trellis/config/config.yaml`，将其转化为内存中的结构化配置对象，供 MCP Tools 运行时消费。

## 子特性

### YAML 解析（yaml-parser）

使用轻量 YAML 解析器读取 config.yaml，支持嵌套对象、数组、字符串、数字等类型。解析失败时不抛异常，走降级路径。

### 内存缓存（cache-layer）

配置加载后缓存在内存中，避免重复 I/O。缓存生命周期与 MCP Server 进程一致，进程重启时重新加载。

### 默认值回退（default-fallback）

`DEFAULT_CONFIG` 定义所有配置项的默认值。当 config.yaml 不存在或解析失败时，自动使用默认值，确保 MCP Server 始终可启动。

**运行时实际消费的配置项**：

| 配置项                    | 消费方                        |
| ------------------------- | ----------------------------- |
| context.phaseBudget       | context_budget() 阶段预算计算 |
| context.warningThreshold  | context_budget() 警告阈值     |
| context.criticalThreshold | context_budget() 临界阈值     |
| journal.maxLinesPerFile   | journal_append() 自动分页     |
| tasks.root                | task-utils 任务目录路径       |
| tasks.archive             | task-utils 归档目录路径       |

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：context-management 的预算计算、task-management 的目录寻址
- **横向影响**：file-persistence 的读取路径受配置影响
- **下游影响**：无（本节点是最底层）
