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
  - path: .docs/refs/
    role: 外部参考资料存放目录
  - path: .docs/design/
    role: 架构与规划中心（planning/ + features/）
  - path: .docs/notes/
    role: 草稿场区（user-/pm- 前缀）
  - path: .docs/archive/
    role: 就地养老式归档目录
  - path: .agents/skills/pm-brainstorm/SKILL.md
    role: 设计文档产出（brainstorm → .docs/design/）
  - path: .agents/skills/worker-check/SKILL.md
    role: 验证报告产出（dev/verification.md）
  - path: .agents/skills/pm-session-close/SKILL.md
    role: PM 会话工作汇总沉淀
---

# 文档沉淀管道

文档沉淀管道确保框架运作过程中产生的所有重要文档都被持久化保存到 `.docs/` 目录，形成可追溯、可查阅的项目文档体系。用户无需手动整理文档，框架在各工作环节自动沉淀。

## 用户视角的交互流程

### 文档产出时机

框架在以下环节自动产出文档：

1. **需求阶段**：PM brainstorm 产出设计文档 → `.docs/design/features/`
2. **执行阶段**：Worker 产出验证报告 → 任务目录 `dev/`
3. **收尾阶段**：session-close 汇总工作记录 → journal
4. **用户主动**：用户可随时将参考资料放入 `.docs/refs/`

### 文档流向

```text
参考资料 → .docs/refs/
                ↓
PM brainstorm → .docs/design/features/
                ↓
Worker 实现 → 任务目录 dev/（report.md + verification.md）
                ↓
PM 验收后 → 完工打 [DONE] 标记 / 废弃移入 archive/
```

### 文档归档

不再适用的文档移入对应目录的 `.docs/archive/`，保留历史可追溯性。

## `.docs/` 目录结构

| 子目录              | 用途                                      |
| ------------------- | ----------------------------------------- |
| `notes/`            | 草稿场区（user-/pm- 前缀 + 记事本四分区） |
| `refs/`             | 外部参考资料库                            |
| `design/`（根文件） | 项目核心常青文档（需求、架构、技术说明）  |
| `design/planning/`  | 长线规划、Roadmap、里程碑总结             |
| `design/features/`  | 特性架构蓝图                              |
| `archive/`          | 就地养老式归档（各目录内配套 archive/）   |

### 记事本约定

记事本（`user-记事本.md` 和 `pm-记事本.md`）是框架初始化时创建的标准文件，采用四分区结构：

| 分区            | 说明                           | AI 处理                    |
| --------------- | ------------------------------ | -------------------------- |
| 说明（仅 user） | 处理模式设定（跳过/询问/自动） | 缺失时自动补全，模式值不改 |
| 长期            | 用户长期记录                   | 不主动处理                 |
| 待办            | 活跃待办事项                   | 收工时标记完成 + 重编号    |
| 完成            | 已完成事项                     | 归档时剪切到 archive/      |

## 变更影响

修改本特性时，需同步检查：

- **下游影响**：PM 工作流的 brainstorm 文档产出路径、Worker 工作流的验证报告产出
- **横向影响**：requirement-delivery 的需求文档存放、session-management 的会话产物沉淀
