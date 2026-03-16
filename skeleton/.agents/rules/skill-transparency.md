---
trigger: always_on
description: Skill usage transparency — real-time activation declarations and PATEOAS extension
---

# Skill 使用透明性

> 本 Rule 确保用户对 AI 的 Skill 使用具备**实时感知**和**事后审计**能力。

## 实时声明

### 激活声明（强制）

每当 AI 激活某个 Skill 时，**必须**在该 Skill 的第一行输出中包含以下格式的声明：

```
**[Skill: {name}] 已激活** — {描述}
```

- `{name}`：取自 SKILL.md YAML frontmatter 的 `name` 字段
- `{描述}`：取自 SKILL.md YAML frontmatter 的 `description` 字段的第一句（句号或破折号前的内容）

**示例**：

```
**[Skill: worker-implement] 已激活** — 执行者实现工作流
**[Skill: common-session-close] 已激活** — 会话收尾与日志沉淀
```

### 退出声明（推荐）

Skill 执行完毕后，**建议**输出以下格式的退出声明：

```
**[Skill: {name}] 完成**
```

> 退出声明为推荐行为（非强制），但有助于用户清楚区分 Skill 的执行边界。

## PATEOAS 扩展

所有 Skill 的 PATEOAS 状态快照中，**必须**包含以下行以声明当前正在执行的 Skill：

```
当前 Skill: {name}
```

**示例**：

```markdown
#### 状态快照

- 当前角色：Worker
- 当前 Skill: worker-implement
- 当前阶段：TDD_RED
- ...
```

> 当无 Skill 激活时，可省略此行或标注 `当前 Skill: 无`。
