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

## 约束 2：修改 Skill 前必须读 skill-creator

修改 `.agents/skills/` 下任何 SKILL.md 前，**必须**先读取 `skill-creator` Skill 的 SKILL.md。

> 当前会话中已读取过 `skill-creator` 的，不需要重复读取。

## 约束 3：图谱必须同步更新

当框架文件的新增、删除、重命名或职责变更导致图谱信息过期时，**必须**在同一次变更中同步更新图谱节点。禁止"改了文件不更新图谱"。
