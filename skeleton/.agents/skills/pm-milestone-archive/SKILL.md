---
name: pm-milestone-archive
description: "[PM] 进度归档 — 触发：用户主动要求「进度归档」或里程碑结束。排除：日常单次会话收工（用 pm-session-close）。产出：废弃文档隔离、冷藏区转移、全局环境清理与里程碑总结报告。"
---

# `pm-milestone-archive` Skill

## 目标

这是一个独立于日常收工的重度清理与总结工具。仅在大型阶段（如 Epic 完工、版本发布）结束时，由用户输入“进度归档”主动触发。核心思想是净化热工作区视野，将已作废的意图与部件送入冷宫封存，同时生成阶段性的里程碑总结。

## 前置要求

- 当前角色必须是 **PM**。Worker 角色不执行全局归档。
- 只有明确触发“进度归档”、“里程碑结项”等宏观动作时才激活。

## 执行步骤

### Step 1: `.docs/` 意图空间清理

- **`.docs/design/features/`**:
  - 扫描所有文件。
  - 对于确认已上线/完工的设计，仅修改文件名前缀添加 `[DONE]` 标记（保留在原目录）。
  - 对于明确废弃的方案，加上 `[OBSOLETE]` 前缀，移动到 `.docs/design/features/archive/`。
- **`.docs/refs/`**:
  - 仅移动明确废弃/失效的参考资料到 `.docs/refs/archive/`。
  - 仍有查阅价值的旧参考资料添加 `[DONE]` 标记，留在原地（或让用户确认删除）。
- **`.docs/notes/` (记事本去水)**:
  - 读取 `pm-记事本.md`，将所有选中的 `[x]` 已完成或已决议事项**剪切**移走，转移至 `.docs/notes/archive/YYYY-MM-阶段名称-归档纪要.md`。
  - 清理已经转正归档的、挂着孤单 `pm-xxx` 前缀的临时草稿文件至 `.docs/notes/archive/` 或提示删除。

### Step 2: `.archive/` 全局冷藏区清理

- 扫描是否存在已确认废弃或被新版本替代的 `.agents/workflows/` 脚本或 `.agents/skills/` 技能，向用户确认后，统一物理转移至项目根目录专门设立的冷藏区：
  - 过期工作流移入：`.archive/dep-workflows/`
  - 过期技能移入：`.archive/dep-skills/`

### Step 3: `.tmp/` 与 `.test/` 的隔离与清理协议

- **`.tmp/`**: 执行强制**全部清空**（保留必要的框架锁文件除外）。这是纯粹的瞬态副产物废件池。
- **`.test/`**: 对有价值的阶段性测试报告、基准校验截图，打包移动到 `.test/archive/YYYY-MM-阶段测报/`。迎接下一阶段清爽的测试空间。

### Step 4: `.trellis/` 契约与记忆空间的清理

- **任务归档**: 执行 `task.py archive` 命令，将所有状态为 `completed` 或 `rejected` 且非活跃的工单目录，打包转移到 `.trellis/tasks/archive/YYYY-MM/`。

### Step 5: 撰写并放置里程碑总结报告

- 结合本阶段 `.trellis/workspace/` 里所有的 `journal.md` 记忆和刚刚被归档的所有热任务，撰写一份宏大的复盘总结报告（Release Note）。
- **存放位置**: 直接写入长线规划区 `.docs/design/planning/`（例如命名为 `[MILESTONE] vX.X-阶段总结-YYYY-MM.md`）。

## 结束与输出

- 向用户打印归档动作的结果统计清单（如“清理了X个tmp文件，归档了Y个废弃图纸”）。
- 通知用户「里程碑总结报告」已生成完毕，并请用户检阅，为下一步规划提供干净清爽的空间。
