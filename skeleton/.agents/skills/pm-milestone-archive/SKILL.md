---
name: pm-milestone-archive
description: "[PM] 进度归档 — 触发：用户主动要求「进度归档」或里程碑结束。排除：日常单次会话收工（用 pm-session-close）。产出：废弃文档隔离、冷藏区转移、全局环境清理与里程碑总结报告。"
---

# `pm-milestone-archive` Skill

## 目标

这是一个独立于日常收工的重度清理与总结工具。仅在大型阶段（如 Epic 完工、版本发布）结束时，由用户输入"进度归档"主动触发。核心思想是净化热工作区视野，将已作废的意图与部件送入冷宫封存，同时生成阶段性的里程碑总结。

## 前置要求

- 当前角色必须是 **PM**。Worker 角色不执行全局归档。
- 只有明确触发"进度归档"、"里程碑结项"等宏观动作时才激活。

## 执行流程（强制分阶段）

> **核心原则：先扫描 → 再汇报方案 → 等用户确认 → 批量执行。严禁未经确认直接执行归档动作。**

### Phase A: 全局扫描

对以下所有区域进行只读扫描，收集归档候选项：

1. `.docs/design/` — 根目录文件 + `features/` + `planning/`
2. `.docs/refs/`
3. `.docs/notes/`（含 `pm-记事本.md` 内容分析）
4. `.agents/workflows/` 和 `.agents/skills/`（是否有废弃项）
5. `.tmp/` 和 `.test/`
6. `.trellis/tasks/`（各工单状态）

### Phase B: 汇报归档方案

将扫描结果整理为分类表格，向用户列出每个文件/目录的**建议处理方式**。对于不确定的项，明确标注「需用户决策」。等待用户逐条确认或批量确认后，才进入 Phase C。

### Phase C: 批量执行

按用户确认后的方案，执行以下 5 个步骤：

---

### Step 1: `.docs/` 意图空间清理

- **`design/*.md`（根目录文件）**：
  - 扫描用户的顶层设计文档。
  - 完工的打 `[DONE]` 标记，保留原位。废弃的打 `[OBSOLETE]` 标记，移至 `design/features/archive/`。
- **`design/features/`**：
  - 完工设计打 `[DONE]` 标记，保留原位。
  - 废弃方案打 `[OBSOLETE]` 标记，移至 `design/features/archive/`。
- **`design/planning/`**：
  - 已完成的设计草案打 `[DONE]` 标记，保留原位。
- **`refs/`**：
  - 仅移动明确废弃/失效的参考资料到 `.docs/refs/archive/`。
  - 仍有查阅价值的旧参考资料添加 `[DONE]` 标记，留在原地。
- **`notes/`（记事本去水 — 特殊规则）**：
  - **`pm-记事本.md` 不移动，只剪切内容**：读取记事本，将所有 `[x]` 已完成或已决议事项**剪切**出来，写入新建的 `.docs/notes/archive/YYYY-MM-阶段名称-归档纪要.md`。原文件保留，仅留下未决事项。
  - `user-记事本.md` 由用户自行处理，AI 不主动操作。
  - 清理挂着 `pm-xxx` 前缀的已转正/废弃临时草稿文件：归档到 `.docs/notes/archive/` 或提示用户删除。

### Step 2: `.archive/` 全局冷藏区清理

- 扫描是否存在已确认废弃或被新版本替代的 `.agents/workflows/` 或 `.agents/skills/`（如空目录、被替代的旧实现），向用户确认后，统一物理转移至项目根目录的冷藏区：
  - 过期工作流移入：`.archive/dep-workflows/`
  - 过期技能移入：`.archive/dep-skills/`

### Step 3: `.tmp/` 与 `.test/` 清理

- **`.tmp/`**：执行强制**全部清空**（保留 `.gitkeep` 除外）。这是纯粹的瞬态废件池。
- **`.test/`**：非框架强制目录。如存在且有内容，**提醒用户自行清理**，AI 不主动操作。

### Step 4: `.trellis/` 契约与记忆空间清理

- **任务归档**：将所有状态为 `completed` 或 `cancelled` 且非活跃的工单目录，批量移动到 `.trellis/tasks/archive/YYYY-MM/`。

  ```bash
  mkdir -p .trellis/tasks/archive/YYYY-MM
  # 对每个 completed/cancelled 工单执行 mv
  ```

### Step 5: 撰写并放置里程碑总结报告

- 结合本阶段 `.trellis/workspace/` 中的 journal 记录和刚被归档的所有工单，撰写一份复盘总结报告。
- **存放位置**：直接写入 `.docs/design/planning/`，命名为 `[MILESTONE] vX.X-阶段总结-YYYY-MM.md`。

## 结束与输出

向用户输出**标准归档统计表**：

```markdown
| 类别         | 动作                       | 数量     |
| ------------ | -------------------------- | -------- |
| design/ 打标 | [DONE] / [OBSOLETE]        | X 个     |
| notes/ 去水  | 剪切已完成事项             | X 条     |
| 冷藏区转移   | dep-skills / dep-workflows | X 个     |
| .tmp/ 清空   | 删除                       | X 个文件 |
| 工单归档     | → archive/YYYY-MM/         | X 个     |
| 里程碑总结   | 已生成                     | 1 份     |
```

通知用户里程碑总结报告已生成，请检阅。
