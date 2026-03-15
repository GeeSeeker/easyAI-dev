# easyAI 框架架构概览

> 本文档是框架知识库的一部分，供 AI 在框架自迭代时参考。

## 设计愿景

**"让用户以纯客户的视角进行软件开发"** — 用户只需提需求、审批方案、验收结果。所有开发细节、流程规范、工作安排由 PM 自主遵循。

## 四层架构

```text
┌────────────────────────────────────────────────────────┐
│                    用户交互层                            │
│  用户只做 3 件事：提需求、按指示切会话、审批结果          │
└───────────────────────┬────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────┐
│              Antigravity 原生层 (.agents/)               │
│  Rules（始终/按需注入）+ Workflows（角色入口）             │
│  + Skills（能力模块，渐进式加载）                         │
└───────────────────────┬────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────┐
│              MCP Server 层 (easyai-mcp-server)          │
│  Tools（AI 调用的函数）+ Resources（AI 可读取的数据源）    │
└───────────────────────┬────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────┐
│                数据持久层 (.trellis/)                     │
│  spec/（项目规范）  tasks/（任务管理）                     │
│  workspace/（开发记忆） config/（框架配置）                │
└────────────────────────────────────────────────────────┘
```

> 用户通过 npm 包获得编译后的 MCP Server（TypeScript → JavaScript），源码位于开发工作区的 `packages/mcp-server/`。

## 记忆体系（四层记忆架构）

按稳定性/持久性从最稳定到最短命排列：

```text
┌─ Layer 1：Rules（始终在线 · 地基）──────────────────────┐
│  project-identity.md / anti-hallucination.md            │
│  每轮对话自动注入，固定不变                               │
│  存储：.agents/rules/                                    │
├─ Layer 2：Workflow + MCP（角色层 · 暖记忆）──────────────┤
│  角色画像（PM / Worker）+ MCP 触发注入的上下文           │
│  会话开始时通过 /pm 或 /worker 激活                       │
│  存储：.agents/workflows/ + Skills 渐进加载              │
├─ Layer 3：.trellis/（长期持久 · 跨会话记忆中枢）─────────┤
│  spec/（项目规范）→ 编码前读取，审查时对照                │
│  tasks/（任务数据）→ PM 创建，Worker 读取                 │
│  workspace/journal（工作日志）→ 会话结束写入，新会话恢复  │
│  存储：.trellis/，通过 MCP Tools/Resources 读写          │
├─ Layer 4：Artifacts（会话热记忆 · 最活跃但随会话消亡）───┤
│  task.md / implementation_plan.md / walkthrough.md       │
│  当前会话的工作文档，会话结束后沉淀到 .trellis 或 .docs   │
│  存储：<appDataDir>/brain/<conversation-id>/             │
└──────────────────────────────────────────────────────────┘
```

### .trellis 的记忆闭环

```text
写入：session-close → journal_append() → workspace/     （经验记忆）
      pm-brainstorm → task_create()    → tasks/          （任务记忆）
      worker 发现新模式 → spec-update  → spec/           （规范记忆）

读取：session-start → journal/latest   → 恢复工作记忆
      worker 启动   → task_get()       → 恢复任务上下文
      worker 编码前 → spec://          → 加载项目规范
```

### config.yaml 运行时联动

`.trellis/config/config.yaml` 不只是静态配置文件，MCP Server 在运行时通过 `config-loader.ts` 读取并缓存它。

**运行时实际消费的配置项**：

```text
.trellis/config/config.yaml       消费方
├── context.phaseBudget        →  context_budget() 阶段预算计算
├── context.warningThreshold   →  context_budget() 警告阈值
├── context.criticalThreshold  →  context_budget() 临界阈值
├── journal.maxLinesPerFile    →  journal_append() 自动分页阈值
├── tasks.root                 →  task-utils getTasksDir() 任务目录路径
└── tasks.archive              →  task-utils getArchiveDir() 归档目录路径
```

> `journal.root`、`tasks.maxSubtasks` 已在 `config-loader.ts` 中定义和加载，但运行时尚未被消费（journal-utils 硬编码路径，subtask-tools 未检查数量上限）。

> **降级策略**：config.yaml 解析失败时，`config-loader.ts` 返回内置默认值（`DEFAULT_CONFIG`），不抛异常。

## 用户体验链条

```text
用户提需求 → PM 会话（/pm）
              ├─ 自动恢复项目状态          ← session-start + MCP
              ├─ 苏格拉底式澄清需求       ← pm-brainstorm
              ├─ 拆分任务 + 约束集         ← pm-task-planning
              └─ "请开新会话 /worker T001"
                        │
                        ▼
              Worker 会话（/worker T001）
              ├─ 读取任务上下文 + spec     ← MCP task_get + Resources
              ├─ TDD 驱动编码             ← worker-implement
              ├─ 自检 + 验证标记           ← worker-check
              └─ "T001 已完成，请回 PM"
                        │
                        ▼
              PM 会话（继续）
              ├─ 三阶段验收               ← pm-task-review
              ├─ 通过 → 归档 / 打回 → 修改
              └─ Artifacts 沉淀到 .docs
```

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

## 文档体系

### .trellis/（AI 团队内部工作空间 — 用户无需关注）

| 子目录       | 用途                                         |
| ------------ | -------------------------------------------- |
| `spec/`      | 项目开发规范（编码标准、API 设计、测试标准） |
| `tasks/`     | 任务看板（PM 拆活、Worker 领单、进度追踪）   |
| `workspace/` | 工作日志（AI 跨会话恢复记忆的数据源）        |
| `config/`    | 框架配置（MCP Server 运行时使用）            |

### .docs/（团队与用户的文件交接柜）

| 子目录          | 信息方向  | 用途                     |
| --------------- | --------- | ------------------------ |
| `requirements/` | 用户 → AI | 需求文档、用户故事       |
| `design/`       | AI ↔ 用户 | 架构设计、技术方案       |
| `guides/`       | AI → 用户 | 使用指南、部署文档       |
| `notes/`        | 用户 ↔ AI | 临时文档                 |
| `archive/`      | 归档      | 各文件夹中作废的历史文档 |

### 沉淀管道

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
