---
trigger: always_on
description: Skill evaluation guard — forces AI to evaluate which Skills are needed before any development work
---

# Skill 评估守卫

> 本规则在所有会话中始终生效。

## 强制评估触发条件

当用户的请求涉及以下任何一种情况时，AI **必须**在回答前先执行 `/common-skill-eval` Workflow：

1. **开发类请求**：编写代码、修复 Bug、实现功能、重构
2. **规划类请求**：需求讨论、任务拆分、方案设计
3. **框架类请求**：修改 `.agents/`、`.trellis/spec/`、`packages/`
4. **验收类请求**：审查代码、验收任务

## 豁免场景

- 简单的问答对话（如"这个函数是做什么的？"）
- 纯文档编辑（如更新记事本、写注释）
- 用户明确说"跳过评估"
- 已通过斜杠命令（`/pm`、`/worker`）触发了角色 Workflow（角色 Workflow 内部已包含 Skill 激活逻辑）
