---
trigger: always_on
description: Framework edit guard — mandatory knowledge loading before modifying framework files
---

# 框架编辑守卫

> 本 Rule 确保 AI 在修改框架文件前**完成必要的知识加载**，防止盲改导致架构不一致。

## 约束 1：修改框架文件前必须查图谱

修改以下路径下的任何文件前，**必须**先完成图谱知识加载：

- `.agents/rules/`
- `.agents/workflows/`
- `.agents/skills/`
- `.agents/graph/`
- `.trellis/spec/`
- `.trellis/config/`

**知识加载步骤**：

1. 读取 `.agents/graph/_index.md` 定位涉及的特性域
2. 读取相关域的节点文件，关注 `serves` / `depends_on` / `relates_to`
3. 基于图谱知识评估变更影响

> 已通过 Skill 流程（如 `pm-framework-evolve` Step 0）完成加载的，不需要重复执行。

**示例**：

```text
# 正确 ✅
AI: 我需要修改 worker-implement Skill，先查图谱…
AI: [读取 _index.md → capability/task-execution.md → 确认影响范围]
AI: [开始修改]

# 错误 ❌
AI: 我直接修改 worker-implement Skill 的步骤…
```

## 约束 2：修改 Skill 前必须读 skill-creator

修改 `.agents/skills/` 下任何 SKILL.md 前，**必须**先读取 `skill-creator` Skill 的 SKILL.md，了解：

- 目录结构规范
- YAML frontmatter 格式
- 渐进式披露原则

> 当前会话中已读取过 `skill-creator` 的，不需要重复读取。

**示例**：

```text
# 正确 ✅
AI: 修改 Skill 前，先读 skill-creator 了解规范…
AI: [读取 skill-creator/SKILL.md]
AI: [按规范修改目标 Skill]

# 错误 ❌
AI: 直接修改 Skill 的 YAML frontmatter…
```
