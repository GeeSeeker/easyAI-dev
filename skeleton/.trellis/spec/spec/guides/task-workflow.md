---
title: 任务工作流规范
version: 1.0.0
category: guides
status: active
---

# 任务工作流规范

## 概述

定义 easyAI 任务从创建到归档的完整工作流程。

## 任务生命周期

```
pending → in_progress → under_review → completed → archived
                                    ↘ rejected → in_progress
             任意非归档状态 → cancelled
```

## PM 职责

1. 使用 `pm-brainstorm` Skill 澄清需求
2. 使用 `pm-task-planning` Skill 生成约束集
3. 调用 `task_create()` 创建任务
4. 使用 `pm-task-review` Skill 验收任务

## Worker 职责

1. 调用 `task_get()` 读取任务详情
2. 按约束集逐步执行（TDD 流程）
3. 使用 `worker-check` Skill 生成验证标记
4. 调用 `task_transition(under_review)` 提交验收
