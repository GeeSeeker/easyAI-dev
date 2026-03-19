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

### Step 0: config.yaml 硬性校验 + 新项目检测

> **阻断性检查** — 校验失败时不继续后续步骤。

读取 `.trellis/config/config.yaml`，校验以下字段：

#### 0a. 新项目检测

检查以下三个条件是否**同时**满足：

1. `developer.name` 为空
2. `.trellis/workspace/` 下无任何 `journal.md` 文件（排除 `.gitkeep`）
3. `.trellis/tasks/` 下无任何任务子目录（排除 `.gitkeep` 和 `archive/`）

**三条件全部满足** → 判定为**全新项目**，输出：

```
🎉 检测到全新项目！easyAI 提供两种初始化模式：

1. 引导模式（推荐新手）— 分步引导你完成配置，每步讲解用途，
   并带你体验一次完整的 easyAI 开发流程。

2. 快速模式（熟手直达）— AI 自动完成所有初始化，输出功能速查表。

选哪个？（输入 1 或 2）
```

- 用户选择 1 → 激活 `pm-onboarding` Skill（引导模式），**结束 pm-session-start**
- 用户选择 2 → 激活 `pm-onboarding` Skill（快速模式），完成后**回到 Step 1 继续**

**三条件未全部满足** → 非新项目，继续下方常规校验。

#### 0b. developer.name 校验

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

### 3.3 PM 记事本恢复

读取 `.docs/notes/pm-记事本.md`，检查「待办」区是否有上次遗留的待办事项：

- 有待办条目 → 在状态快照中列出，提醒 PM 关注
- 无待办条目 → 标记「✅ PM 记事本无遗留待办」

> PM 在工作过程中应主动往 `pm-记事本.md` 的「待办」区写入发现的问题和后续线索（详见 actor-pm 约束段）。

### 3.5 项目规范状态

扫描 `.trellis/spec/` 目录结构，了解当前项目规范的覆盖情况：

- `spec/backend/` — 后端规范（{n} 个文件 / 空）
- `spec/frontend/` — 前端规范（{n} 个文件 / 空）
- `spec/guides/` — 通用指南（{n} 个文件 / 空）
- `spec/general/` — 全局规范（{n} 个文件 / 空）

> 如有空分类，在状态快照中标记为 `[SPEC_GAP]`，
> 在 PATEOAS 导航中建议用户补充规范（可通过 `common-spec-update` Skill 执行）。

### 3.65 权限矩阵概览

读取 `.trellis/config/permissions.yaml`，在状态快照中展示当前角色的权限摘要（工具分级数量 + 路径保护范围）。

> 如文件不存在，提示用户可通过 `framework_init` 或手动创建。

### 3.7 图谱健康检查

> 跨会话追踪 — 检测 `worker-session-close` 报告的图谱过期条目。

调用 MCP Tool `journal_search({ tags: ["graph-stale"] })`：

- **有结果** → 输出报警并列出所有过期条目：
  ```
  ⚠️ 图谱健康检查：发现 {n} 条 [GRAPH_STALE] 记录
  - {日期} | {涉及节点} | 来源任务: {task_id}
  - ...
  建议：尽快更新图谱节点，或创建专项任务处理。
  ```
  在 PATEOAS 导航中增加建议项：「处理图谱过期条目」
- **无结果** → 标记 `✅ 图谱健康` 并跳过

### 3.8 语义地图铺底检测

> 初始铺底 — 检测项目是否已生成语义地图，缺失时引导用户确认生成。

检查 `.trellis/workspace/semantic-map.json` 是否存在：

- **文件存在且有效** → 标记 `✅ 语义地图已就绪`，在状态快照中输出简要统计：
  ```
  语义地图: ✅ ({n} 个目录, {m} 个骨架文件) — 生成于 {timestamp}
  ```
- **文件不存在或为空** → 输出铺底引导拦截：

  ```
  📋 语义地图缺失 — 项目尚未生成代码语义地图。
  语义地图可帮助 AI 快速理解项目架构，消除“战争迷雾”。

  是否现在生成？（输入 Y 确认，或跳过后可随时通过 /generate-map 手动生成）
  ```

  - 用户确认 → 激活 `common-semantic-map` Skill，执行全量扫描
  - 用户跳过 → 标记 `⏭️ 语义地图生成已跳过`，继续后续步骤

> 此检测仅在 `pm-session-start` 中触发，日常 session-close 不自动全刷（控制 Token 成本）。

#### JSON Schema 提示

> ⚠️ `semantic-map.json` 的结构是**嵌套树**，不是扁平数组。统计时必须递归遍历。

```json
{
  "version": "1.0",
  "generated_at": "...",        // ← 读取此字段作为 {timestamp}
  "project_root": "...",
  "tree": [                     // ← 顶级目录数组（非 "directories"）
    {
      "path": "src/",
      "type": "directory",
      "skeleton_files": [...],  // ← 该目录的骨架文件数组
      "children": [...]         // ← 子目录（递归同结构）
    }
  ]
}
```

**统计方法**：递归遍历 `tree` → `children`，累加所有 `type: "directory"` 节点数作为 `{n}`，累加所有 `skeleton_files` 数组长度之和作为 `{m}`。

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
- **权限矩阵**: safe({n}) / sensitive({n}) / restricted({n}) — 详见 `.trellis/config/permissions.yaml`
- **框架能力概览**: {层数}层 × {节点数}特性，详见 `.agents/graph/_index.md`
- **语义地图**: ✅ ({n} 目录, {m} 骨架文件) / ❌ 未生成
- **PM 记事本**: {n} 条遗留待办 / 无遗留待办

## 上次会话摘要

{latest_journal_summary}

### PATEOAS 导航

#### 下一步行动

1. [ ] 调用 `task_list()` 查看所有活跃任务详情
2. [ ] 对 `under_review` 状态的任务调用 `task_get({task_id})` 发起验收审查
3. [ ] 生成或刷新语义地图（`/generate-map` 或确认铺底引导）
4. [ ] 等待用户指令（新需求 / 任务管理 / 验收审批）

#### 状态快照

- 当前角色：PM
- 当前阶段：SESSION_START
- 活跃任务：{count} 个
- 项目规范：{有 SPEC_GAP 则标注空分类}
- 语义地图：已就绪 / 未生成 / 已跳过
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

### TC-03: 语义地图缺失时的铺底引导

- **场景**: 项目首次使用或 `semantic-map.json` 不存在
- **输入**: `/actor-pm`
- **期望行为**:
  1. Step 3.8 检测到 `.trellis/workspace/semantic-map.json` 不存在
  2. 输出铺底引导拦截，提示用户确认生成
  3. 用户确认后激活 `common-semantic-map` Skill
  4. 生成双文件（JSON + MD）
- **验证方法**: 检查是否输出铺底提示、确认后生成双文件

### TC-05: 语义地图已存在时的静默通过

- **场景**: `semantic-map.json` 已存在且有效
- **输入**: `/actor-pm`
- **期望行为**: Step 3.8 静默通过，在状态快照中显示地图统计信息
- **验证方法**: 检查状态快照中包含语义地图的目录数和骨架文件数
