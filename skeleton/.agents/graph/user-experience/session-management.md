---
name: session-management
layer: user-experience
domain: user-experience
description: 会话管理 — 会话启动恢复、跨会话记忆、会话收尾沉淀
serves: [] # 最上层，直接服务用户
depends_on:
  - role-system/pm-workflow
  - role-system/worker-workflow
relates_to:
  - user-experience/requirement-delivery
  - user-experience/artifact-pipeline
files:
  - path: .agents/skills/pm-session-start/SKILL.md
    role: PM 会话启动与状态恢复（项目状态 + 活跃任务 + 最新日志）
  - path: .agents/skills/pm-session-close/SKILL.md
    role: PM 会话收尾与日志沉淀（汇总 + 知识沉淀 + journal + Skill 审计 + Git 提交 + Push 确认 + 恢复指引）
  - path: .agents/skills/worker-session-close/SKILL.md
    role: Worker 会话收尾（journal + Skill 审计 + Git 提交 + 恢复指引，正常完成时由 worker-check 自动衔接）
  - path: .agents/workflows/actor-worker.md
    section: 启动流程
    role: Worker 会话启动序列（身份锚定 → Rules 加载 → 任务读取 → Worktree 切换 → 上下文加载）
  - tool: project_status
    role: 项目状态概览（Git + 任务 + 日志）
  - tool: journal_append
    role: 日志写入（会话收尾时沉淀工作记录）
  - tool: journal_search
    role: 日志搜索（会话启动时检索历史上下文）
---

# 会话管理

会话管理确保用户与 AI 的每次交互都有连贯的上下文 — 新会话能自动恢复上次的工作状态，会话结束前自动沉淀关键信息。用户无需手动维护任何上下文，框架保障跨会话的记忆连续性。

## 用户视角的交互流程

### 会话启动

用户通过 `/actor-pm` 或 `/actor-worker` 开始新会话时，框架自动：

1. 获取当前项目状态（Git 分支、未提交变更、活跃任务）
2. 检索最近的 journal 日志，恢复上次工作上下文
3. 对于 Worker，额外执行：任务详情读取、Worktree 环境切换、上下文冻结快照加载

用户感知：AI 已经知道当前项目的所有情况，可以直接开始工作。

### 会话收尾

当用户表达结束意图时（如"收工"），框架自动：

1. 汇总本次会话的工作成果
2. 将关键信息写入 journal（持久化的跨会话记忆）
3. Git 自动提交本次变更
4. 输出恢复指引（下次会话的衔接信息）

用户感知：关闭会话不会丢失任何工作进度和上下文。

### 跨会话记忆

journal 系统提供持久化的工作记忆：

- 每次会话的关键发现、决策、变更都沉淀为 journal 条目
- 新会话启动时自动检索相关条目恢复上下文
- 支持按标签、关键词、日期范围搜索历史记录

## 变更影响

修改本特性时，需同步检查：

- **下游影响**：PM/Worker 工作流的启动和收尾流程
- **横向影响**：requirement-delivery 的会话切换体验、artifact-pipeline 的会话产物沉淀
