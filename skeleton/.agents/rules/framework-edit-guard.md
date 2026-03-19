---
trigger: always_on
description: Framework edit guard — mandatory graph consultation and knowledge loading before any framework modification or design
---

# 框架编辑守卫

> 本 Rule 确保 AI 在修改或设计框架相关内容前，**必须**先查阅知识图谱，防止盲改导致架构不一致。

## 约束 1：图谱是框架的单一事实来源

`.agents/graph/` 是 easyAI 框架的知识图谱系统。图谱记录了框架所有特性的依赖关系、文件映射和层级归属。

**以下两种场景，必须先查图谱，否则禁止继续**：

1. **修改框架文件**：修改 `.agents/`、`.trellis/spec/`、`.trellis/config/`、`packages/` 下的任何文件前
2. **设计涉及框架的方案**：产出任何涉及框架能力或架构的设计方案前

**图谱查询步骤**（不可省略）：

1. 读取 `.agents/graph/_index.md`，定位涉及的特性域
2. 读取相关域的节点文件，关注 `serves` / `depends_on` / `relates_to`
3. 基于图谱信息评估变更影响范围

> 已通过 Skill 流程（如 `pm-framework-evolve` Step 0）完成加载的，不需要重复执行。

## 约束 1d：`.docs/` 文件操作须查阅 artifact-pipeline

在 `.docs/` 下**创建、重命名、移动或归档**文件时，必须先读取图谱节点 `user-experience/artifact-pipeline.md`，了解：

- 文档前缀约定（`[DONE]` / `[OBSOLETE]` / `[MILESTONE]`）
- 各子目录的用途和归档路径

> 此约束比约束 1 更轻量：仅要求读取一个图谱节点，无需完整的三步查询流程。日常读取或编辑 `.docs/` 文件内容不触发此约束。

## 约束 1b：修改后检查图谱引用

修改 `.agents/`、`.trellis/spec/`、`.trellis/config/`、`packages/` 下的文件**完成后**，检查被修改文件是否被任何图谱节点的 `files` 字段引用。如被引用，提醒需同步更新该节点（如文件路径变更、职责变更等）。

> 此约束与约束 3（图谱必须同步更新）互补：约束 1 是修改**前**查图谱了解全貌，约束 1b 是修改**后**检查图谱是否需要同步。

## 约束 1c：非任务上下文修改提醒

当 AI 在**非正式任务上下文**中（即未通过 `/actor-worker {task_id}` 启动、没有活跃任务 ID 关联）修改 `.agents/`、`.trellis/spec/`、`.trellis/config/`、`packages/` 下的框架文件时：

1. **提醒检查图谱**：输出 `⚠️ 当前修改未关联正式任务，请确认图谱一致性`
2. **建议创建任务**：提示 `💡 建议为此修改创建正式任务（task_create），以便追踪变更历史和图谱同步`
3. **不阻塞执行**：此约束为提醒性质，不强制阻断（用户确认后可继续）

> 此约束的目的是防止非任务上下文的「随手改」绕过任务系统的变更追踪和图谱同步机制。

## 约束 2：修改 Skill 前必须读 skill-creator

修改 `.agents/skills/` 下任何 SKILL.md 前，**必须**先读取 `skill-creator` Skill 的 SKILL.md。

> 当前会话中已读取过 `skill-creator` 的，不需要重复读取。

## 约束 3：图谱必须同步更新

当框架文件的新增、删除、重命名或职责变更导致图谱信息过期时，**必须**在同一次变更中同步更新图谱节点。禁止"改了文件不更新图谱"。
