---
name: artifact-pipeline
layer: user-experience
domain: user-experience
description: 文档沉淀管道 — Artifacts 从生成到 .docs/ 持久化的完整流转
serves: [] # 最上层，直接服务用户
depends_on:
  - role-system/pm-workflow
  - role-system/worker-workflow
relates_to:
  - user-experience/requirement-delivery
  - user-experience/session-management
files:
  - path: .docs/requirements/
    role: 用户需求文档存放目录（用户 → AI）
  - path: .docs/design/
    role: 设计文档存放目录（AI ↔ 用户协作）
  - path: .docs/guides/
    role: 使用指南存放目录（AI → 用户）
  - path: .docs/notes/
    role: 临时文档存放目录（用户 ↔ AI）
  - path: .docs/archive/
    role: 归档目录（作废或不再适配的历史文档）
  - path: .agents/skills/pm-brainstorm/SKILL.md
    role: 设计文档产出（brainstorm → .docs/design/）
  - path: .agents/skills/worker-check/SKILL.md
    role: 验证报告产出（dev/verification.md）
  - path: .agents/skills/common-session-close/SKILL.md
    role: 会话工作汇总沉淀
---

# 文档沉淀管道

文档沉淀管道确保框架运作过程中产生的所有重要文档都被持久化保存到 `.docs/` 目录，形成可追溯、可查阅的项目文档体系。用户无需手动整理文档，框架在各工作环节自动沉淀。

## 用户视角的交互流程

### 文档产出时机

框架在以下环节自动产出文档：

1. **需求阶段**：PM brainstorm 产出设计文档 → `.docs/design/`
2. **执行阶段**：Worker 产出验证报告 → 任务目录 `dev/`
3. **收尾阶段**：session-close 汇总工作记录 → journal
4. **用户主动**：用户可随时将需求文档放入 `.docs/requirements/`

### 文档流向

```text
用户需求 → .docs/requirements/
                ↓
PM brainstorm → .docs/design/
                ↓
Worker 实现 → 任务目录 dev/（report.md + verification.md）
                ↓
PM 验收后 → 归档或更新 .docs/guides/
```

### 文档归档

不再适用的文档移入对应目录的 `.docs/archive/`，保留历史可追溯性。

## `.docs/` 目录结构

| 子目录         | 信息流向  | 用途                             |
| -------------- | --------- | -------------------------------- |
| `requirements` | 用户 → AI | 用户原始需求文档                 |
| `design`       | AI ↔ 用户 | PM 与用户协作的设计文档          |
| `guides`       | AI → 用户 | 面向用户的使用指南和操作手册     |
| `notes`        | 用户 ↔ AI | 临时文档（调研笔记、讨论记录等） |
| `archive`      | —         | 各目录中作废/不再适配的历史文档  |

## 变更影响

修改本特性时，需同步检查：

- **下游影响**：PM 工作流的 brainstorm 文档产出路径、Worker 工作流的验证报告产出
- **横向影响**：requirement-delivery 的需求文档存放、session-management 的会话产物沉淀
