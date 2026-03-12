---
name: pm-session-start
description: PM 会话启动与状态恢复 — 自动读取项目状态、恢复任务上下文、加载最新日志。在 /pm 触发后由 Workflow 激活。
---

# PM 会话启动 & 状态恢复

## 适用场景

当 PM 角色通过 `/pm` Workflow 启动时，自动执行本 Skill 完成状态恢复。

## 执行步骤

### 1. 获取项目状态

调用 MCP Tool `project_status()`，获取：

- Git 当前分支和工作区状态
- 最近 5 条 commit
- 所有活跃任务列表及其状态
- 最新 3 条日志摘要

### 2. 读取项目总览 Resource

读取 MCP Resource `trellis://status`，获取更完整的项目总览数据。

### 3. 检索最新日志

读取 MCP Resource `trellis://journal/latest`，了解上次会话的工作内容和遗留事项。

### 4. 状态快照输出

向用户输出结构化的状态快照：

```markdown
## 项目状态快照

- **分支**: {branch}
- **工作区**: {clean/dirty}
- **活跃任务**: {count} 个
  - {task_id}: {title} [{status}]
  - ...

## 上次会话摘要

{latest_journal_summary}

### PATEOAS 导航

#### 下一步行动

1. [ ] 调用 `task_list()` 查看所有活跃任务详情
2. [ ] 对 `under_review` 状态的任务调用 `task_get({task_id})` 发起验收审查
3. [ ] 等待用户指令（新需求 / 任务管理 / 验收审批）

#### 状态快照

- 当前角色：PM
- 当前阶段：SESSION_START
- 活跃任务：{count} 个
- 上下文完整度：已恢复 / 部分恢复 / 首次启动
```

## 异常处理

- **MCP 不可用**：降级为手动 git 命令 + 文件系统读取
- **无日志记录**：提示「暂无日志记录，首次使用？」
- **无活跃任务**：提示「当前无活跃任务，可以开始新需求」

## 注意事项

- 本 Skill 仅用于 PM 角色，执行者请使用 Worker Workflow 中的上下文加载流程
- 状态恢复应在 10 秒内完成，避免过多 MCP 调用
