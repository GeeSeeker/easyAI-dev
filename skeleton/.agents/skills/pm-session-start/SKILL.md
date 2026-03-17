---
name: pm-session-start
description: "[PM] 会话启动 — 触发：/actor-pm 命令启动新会话。排除：会话已启动或 Worker 角色。产出：项目状态快照。"
produces: project_snapshot
requires: null
---

# PM 会话启动 & 状态恢复

## 适用场景

当 PM 角色通过 `/actor-pm` Workflow 启动时，自动执行本 Skill 完成状态恢复。

## 执行步骤

### Step 0: config.yaml 硬性校验

> **阻断性检查** — 校验失败时不继续后续步骤。

读取 `.trellis/config/config.yaml`，校验以下字段：

1. **`developer.name` 非空检查**
   - 非空 → ✅ 通过，继续后续步骤
   - 为空 → ❌ **阻断**，立即引导用户填写：
     > 你的 `config.yaml` 中 `developer.name` 为空。请填写你的名字（用于 workspace 文件夹命名和 journal 归属）。
     > 你希望使用什么名字？

2. **`framework.version` 与 `.easyai-version` 一致性**
   - 一致 → ✅ 通过
   - 不一致 → ⚠️ 警告（不阻断）：
     > config.yaml 中版本号 ({config_version}) 与 .easyai-version ({file_version}) 不一致，建议更新。

3. **其他配置字段提示**（非阻断）
   - `team.roster` 中无 `type: external_cli` 条目 → 提示可添加外部 CLI 配置，但不阻断
   - `core_rules` 为空 → 提示可填写，但不阻断
   - `mcp_enforced` 为空 → 提示可填写，但不阻断
   - `features` 为空 → 提示可填写，但不阻断

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

### 3.5 项目规范状态

扫描 `.trellis/spec/` 目录结构，了解当前项目规范的覆盖情况：

- `spec/backend/` — 后端规范（{n} 个文件 / 空）
- `spec/frontend/` — 前端规范（{n} 个文件 / 空）
- `spec/guides/` — 通用指南（{n} 个文件 / 空）
- `spec/general/` — 全局规范（{n} 个文件 / 空）

> 如有空分类，在状态快照中标记为 `[SPEC_GAP]`，
> 在 PATEOAS 导航中建议用户补充规范（可通过 `common-spec-update` Skill 执行）。

### 3.6 用户自定义目录映射

读取项目根目录的 `.directory-map` 文件，了解用户声明的自定义目录用途：

- 文件存在且非空 → 解析目录映射，在后续操作中据此定位文件
- 文件不存在或为空 → 在 PATEOAS 导航中提示：「`.directory-map` 尚未配置，建议声明项目中自定义目录的用途，以便 AI 更好地定位文件」

### 4. 状态快照输出

向用户输出结构化的状态快照：

```markdown
## 项目状态快照

- **分支**: {branch}
- **工作区**: {clean/dirty}
- **活跃任务**: {count} 个
  - {task_id}: {title} [{status}]
  - ...
- **项目规范**: backend({n}) / frontend({n}) / guides({n}) / general({n}) — {有 SPEC_GAP 则标注}
- **框架能力概览**: {层数}层 × {节点数}特性，详见 `.agents/graph/_index.md`

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
- 项目规范：{有 SPEC_GAP 则标注空分类}
- 上下文完整度：已恢复 / 部分恢复 / 首次启动
```

## 异常处理

- **MCP 不可用**：降级为手动 git 命令 + 文件系统读取
- **无日志记录**：提示「暂无日志记录，首次使用？」
- **无活跃任务**：提示「当前无活跃任务，可以开始新需求」

## 注意事项

- 本 Skill 仅用于 PM 角色，执行者请使用 Worker Workflow 中的上下文加载流程
- 状态恢复应在 10 秒内完成，避免过多 MCP 调用

## 触发测试用例

### TC-01: 标准 PM 会话启动

- **场景**: 用户在新会话中首次调用 `/actor-pm`
- **输入**: `/actor-pm`
- **期望行为**:
  1. 调用 `project_status()` 获取状态
  2. 读取 `trellis://status` 和 `trellis://journal/latest`
  3. 扫描 `spec/` 目录结构
  4. 读取 `.directory-map`（F47）
  5. 输出结构化状态快照（含 PATEOAS 导航）
- **验证方法**: 检查输出是否包含分支、活跃任务、上次会话摘要、项目规范统计、PATEOAS 导航

### TC-02: MCP 不可用时的降级

- **场景**: MCP Server 未启动或连接断开
- **输入**: `/actor-pm`
- **期望行为**: 降级为手动 git 命令 + 文件系统读取，仍完成状态恢复
- **验证方法**: 检查是否输出了降级提示且状态快照仍然生成

### TC-03: .directory-map 为空的提示

- **场景**: 项目根目录存在 `.directory-map` 但为空（仅注释）
- **输入**: `/actor-pm`
- **期望行为**: 在 PATEOAS 导航中提示用户配置 `.directory-map`
- **验证方法**: 检查 PATEOAS 导航是否包含 `.directory-map` 配置建议
