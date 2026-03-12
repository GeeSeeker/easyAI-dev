# easyAI 框架架构概览

> 本文档是框架知识库的一部分，供 AI 在框架自迭代时参考。

## 设计理念

**"让用户以纯客户的视角进行软件开发"** — 用户只需提需求、审批方案、验收结果。

## 三层架构

```text
.agents/          ← AI 角色层（框架入口）
├── rules/        ← 规则注入（always_on / glob 触发）
├── workflows/    ← 角色入口（PM / Worker）
└── skills/       ← 能力模块（按角色前缀分组）

.trellis/         ← 数据持久层
├── spec/         ← 项目开发规范
├── tasks/        ← 任务管理（含 archive/）
├── workspace/    ← 开发者记忆（journal）
└── config/       ← 框架配置

.docs/            ← 用户文档空间
├── requirements/ ← 需求文档（用户 → AI）
├── design/       ← 设计文档（AI ↔ 用户）
├── guides/       ← 使用指南（AI → 用户）
├── notes/        ← 临时文档（用户 ↔ AI）
└── archive/      ← 归档
```

> 用户通过 npm 包获得编译后的 MCP Server（TypeScript → JavaScript），源码位于开发工作区的 `packages/mcp-server/`。

## 约束分层体系（五级优先级）

高层覆盖低层，冲突时上报用户：

| 层级 | 类型     | 约束性 | 说明                                     |
| ---- | -------- | ------ | ---------------------------------------- |
| 1    | Rules    | 硬约束 | 反幻觉、编码规范 — 始终生效，不可覆盖    |
| 2    | Skills   | 硬约束 | TDD 流程、验证标记 — 角色激活时生效      |
| 3    | MCP      | 硬约束 | 状态机校验、Evidence Gate — 可编程硬约束 |
| 4    | PM 判断  | 软约束 | 约束集、任务指令 — 可由用户裁决调整      |
| 5    | 用户偏好 | 软约束 | 个人习惯 — 可被上层覆盖                  |

## 角色系统

| 角色   | 触发方式       | 职责                         |
| ------ | -------------- | ---------------------------- |
| PM     | `/pm`          | 需求沟通、任务管理、验收审批 |
| Worker | `/worker T001` | 按约束集执行任务、自检产出   |

## 文档沉淀管道

会话中产生的 Artifacts（热记忆）通过 PM 审核后沉淀到 `.docs/`（持久文档空间）：

| 来源                     | 沉淀目标                          | 触发时机                      |
| ------------------------ | --------------------------------- | ----------------------------- |
| `implementation_plan.md` | `.docs/design/`                   | `pm-brainstorm` 完成时        |
| `walkthrough.md`         | `.docs/notes/` 或 `.docs/guides/` | `pm-task-review` Stage 3      |
| 分析报告等               | `.docs/notes/` 或 `.docs/design/` | `common-session-close` Step 4 |

## 升级机制

框架通过 **Manifest 驱动的智能合并**升级：

- `easyai-manifest.json` 记录 skeleton 中所有框架文件的 SHA-256 哈希
- 升级时只替换未被用户修改的框架文件
- 用户自定义的 Skills/Rules/Workflows 不会被覆盖
- 被用户修改过的框架文件生成 `.new` 冲突文件，由用户决策
