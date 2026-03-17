---
name: task-storage
layer: data-layer
domain: data-layer
description: 任务数据存储 — 目录结构、task.md 格式、frontmatter 规范、上下文清单
serves:
  - capability/task-management
  - capability/context-management
  - capability/quality-control
depends_on:
  - foundation/file-persistence
  - foundation/config-system
  - foundation/mcp-transport
relates_to:
  - data-layer/spec-system
  - data-layer/journal-system
  - data-layer/config-management
children:
  - task-directory
  - task-md-format
  - context-jsonl
  - dev-directory
  - archive-directory
files:
  - path: .trellis/tasks/
    role: 任务根目录（运行时动态创建）
  - path: .trellis/tasks/archive/
    role: 已归档任务目录
---

# 任务数据存储

任务存储定义了 `.trellis/tasks/` 下任务数据的**目录结构和文件格式**。

## 子特性

### 任务目录（task-directory）

每个任务以 `{ID}-{slug}/` 目录形式存储。目录名包含任务 ID（如 T001）和中文简称。任务根目录路径由 `config.yaml` 的 `tasks.root` 配置。

### task.md 格式（task-md-format）

任务主文件采用 YAML frontmatter + Markdown 正文。frontmatter 包含：id、title、status、description（约束集）、acceptance_criteria、created_at、updated_at、file_scope。正文包含描述、验收标准、执行记录三个章节。

### context.jsonl 清单（context-jsonl）

每个任务目录下的 `context.jsonl` 定义任务的上下文清单。每行一个 JSON 对象，指定 type（spec/file）、path、priority（required/recommended/deferred）和 reason。由 `context_generate` Tool 辅助生成。

### dev/ 开发产物（dev-directory）

Worker 执行过程中产出的文件存放在任务目录的 `dev/` 子目录。包括 `report.md`（完成报告）和 `verification.md`（验证标记文件）。

### 归档目录（archive-directory）

任务状态流转到 `archived` 时，整个任务目录移动到 `.trellis/tasks/archive/`。归档路径由 `config.yaml` 的 `tasks.archive` 配置。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：task-management 的状态机、验收门、task_get/task_create 等 MCP Tools
- **横向影响**：journal-system 的日志记录可能引用任务 ID
- **下游影响**：file-persistence 的目录约定、config-system 的路径配置
