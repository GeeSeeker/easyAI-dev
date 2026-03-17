---
name: requirement-delivery
layer: user-experience
domain: user-experience
description: 需求交付闭环 — 从用户提需求到验收成果的完整流程
serves: [] # 最上层，直接服务用户
depends_on:
  - role-system/pm-workflow
  - role-system/worker-workflow
relates_to:
  - user-experience/session-management
  - user-experience/artifact-pipeline
files:
  - path: .agents/workflows/pm.md
    role: PM 入口（接收用户需求、展示可用操作菜单）
  - path: .agents/workflows/worker.md
    role: Worker 入口（执行约束集任务、产出代码和验证报告）
  - path: .agents/skills/pm-brainstorm/SKILL.md
    role: 需求发散阶段（苏格拉底式引导用户完善需求）
  - path: .agents/skills/pm-task-planning/SKILL.md
    role: 需求 → 约束集任务的转化
  - path: .agents/skills/pm-task-review/SKILL.md
    role: 成果验收（三阶段审查）
  - path: .docs/refs/
    role: 外部参考资料存放目录
  - path: .docs/design/
    role: AI 与用户协作的设计文档存放目录（planning/ + features/）
---

# 需求交付闭环

需求交付闭环是用户使用 easyAI 的核心体验 — 用户只需提需求、审批方案、验收结果。整个过程对用户透明：用户不需要了解内部的 Skill 编排、任务拆分、TDD 流程等技术细节。

## 用户视角的交互流程

### 1. 提需求

用户通过 `/pm` 进入 PM 会话，用自然语言描述想要的功能。PM 通过苏格拉底式提问引导用户澄清需求，最终产出设计文档。

### 2. 审批方案

PM 将设计文档转化为约束集任务，向用户呈现拆分结果和实施计划。用户审批后，任务进入待执行状态。

### 3. 等待执行

用户在另一个会话中通过 `/worker` 触发 Worker 执行任务。Worker 按约束集编码、测试、自检，全程无需用户干预。

### 4. 验收成果

Worker 完成后提交验收，用户回到 PM 会话。PM 进行三阶段审查（Spec 合规 → 代码质量 → Artifacts 沉淀），审查通过后交付成果。

## 交付保障机制

- **约束集**：PM 产出的不是 TODO list，而是缩小执行者解空间的精确约束
- **Evidence Gate**：Worker 提交验收时必须附带三标记证据（LINT_PASS / TEST_PASS / MANUAL_PASS）
- **阻塞上报**：Worker 遇到 L3 级问题时停止执行并上报 PM，确保不被忽略
- **外部 CLI 审查**：中高风险任务由外部 CLI 进行独立代码审查

## 变更影响

修改本特性时，需同步检查：

- **下游影响**：PM/Worker 工作流的 Skill 链路和操作菜单
- **横向影响**：session-management 的会话切换（PM 会话 ↔ Worker 会话）、artifact-pipeline 的文档产出
