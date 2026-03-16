---
name: journal-system
layer: data-layer
domain: data-layer
description: 工作记忆存储 — journal 日志格式、自动分页、多用户目录隔离
serves:
  - capability/knowledge-management
  - role-system/pm-workflow
  - role-system/worker-workflow
depends_on:
  - foundation/file-persistence
  - foundation/config-system
  - foundation/mcp-transport
relates_to:
  - data-layer/task-storage
children:
  - journal-format
  - auto-pagination
  - user-isolation
files:
  - path: .trellis/workspace/
    role: 工作记忆根目录
  - tool: journal_append
    role: 日志写入（含自动分页）
  - tool: journal_search
    role: 日志搜索（按标签、关键词、日期范围）
---

# 工作记忆存储

Journal 系统定义了 `.trellis/workspace/` 下工作日志的**格式和存储策略**，是 AI 跨会话恢复记忆的核心数据源。

## 子特性

### 日志格式（journal-format）

每条日志包含日期、标签数组、内容正文和可选的关联任务 ID。标签用于分类检索（如 session、debug、decision）。由 `journal_append` Tool 写入。

### 自动分页（auto-pagination）

当单个 journal 文件超过 `maxLinesPerFile`（默认 2000 行）时，自动创建新文件。分页阈值由 `config.yaml` 的 `journal.maxLinesPerFile` 配置。

### 多用户隔离（user-isolation）

Journal 按用户名分目录存储：`.trellis/workspace/{developer.name}/`。用户名由 `config.yaml` 的 `developer.name` 配置。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：PM session-start 的日志恢复、session-close 的日志写入
- **横向影响**：task-storage 的任务日志与 journal 独立但可交叉引用
- **下游影响**：config-system 的 journal 配置项、file-persistence 的目录约定
