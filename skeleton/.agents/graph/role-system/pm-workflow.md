---
name: pm-workflow
layer: role-system
domain: role-system
description: PM 工作流 — 会话启动、需求发散、任务规划、验收审批的完整编排链路
serves:
  - user-experience/requirement-delivery
  - user-experience/session-management
  - user-experience/artifact-pipeline
depends_on:
  - capability/task-management
  - capability/quality-control
  - capability/context-management
  - capability/knowledge-management
  - capability/framework-governance
  - capability/external-cli-dispatch
  - data-layer/config-management
  - data-layer/journal-system
  - foundation/git-integration
relates_to:
  - role-system/worker-workflow
skill_chain:
  mandatory_chain:
    - pm-session-start
    - pm-brainstorm
    - pm-task-planning
    - pm-task-review
    - pm-framework-evolve
  conditional_branches:
    - worker-debug # PM 收到 L3 blocker 后可能需要介入调试分析
    - common-spec-update
    - pm-milestone-archive
    - pm-braindump-assimilate # 用户提供非结构化想法/需求文本时激活
    - common-cli-dispatch # PM 需要外部 CLI 审查时激活
    - common-github-cli # PM 需要 GitHub 平台交互时激活（搜索代码/Issue、创建 PR 等）
    - common-semantic-map # PM 会话启动时检测是否需要生成语义地图
  common_skills:
    - pm-session-close
files:
  - path: .agents/workflows/actor-pm.md
    role: PM 角色入口（身份锚定、启动流程、可用操作菜单）
  - path: .agents/skills/pm-session-start/SKILL.md
    role: 会话启动与状态恢复（项目状态 + 活跃任务 + 最新日志）
    upgrade: replace
  - path: .agents/skills/pm-brainstorm/SKILL.md
    role: 苏格拉底式需求发散（引导用户从想法到完整设计）
  - path: .agents/skills/pm-task-planning/SKILL.md
    role: 约束集驱动的任务规划（7 步流程 → 生成可零决策执行的约束集任务）
  - path: .agents/skills/pm-task-review/SKILL.md
    role: 三阶段验收（Stage 1 Spec 合规 → Stage 2 代码质量 → Stage 3 Artifacts 沉淀）
  - path: .agents/skills/pm-framework-evolve/SKILL.md
    role: 框架自迭代（知识检索 + 影响分析 + 安全修改 + 知识库自更新）
  - path: .agents/skills/common-spec-update/SKILL.md
    role: 规范动态演进（变更前快照 + 影响分析 + 用户确认门）
  - path: .agents/skills/common-cli-dispatch/SKILL.md
    role: 外部 CLI 统一调度（ABCDE 闸门 + cli-runner.js 调度引擎）
  - path: .agents/skills/pm-milestone-archive/SKILL.md
    role: 进度归档（废弃文档清理、冷藏区转移、全局环境清理与阶段总结）
  - path: .agents/skills/pm-session-close/SKILL.md
    role: PM 会话收尾（汇总 + 知识沉淀 + journal + Git 提交 + Push 确认 + 恢复指引）
  - tool: project_status
    role: 获取项目当前状态概览（Git 分支、活跃任务、最新日志）
  - tool: task_create
    role: 创建任务（PM 规划阶段产出）
  - tool: task_list
    role: 查询任务列表（PM 日常监控）
  - tool: conflict_check
    role: 文件范围冲突检测（创建任务前必须调用）
  - tool: plan_validate
    role: 反面模式检测（规划产出自检）
  - path: .agents/skills/pm-braindump-assimilate/SKILL.md
    role: Brain Dump 同化（非结构化想法 → 分类路由）
  - path: .agents/skills/common-github-cli/SKILL.md
    role: GitHub CLI 集成（搜索代码/Issue、创建 PR、管理 Release 等）
  - path: .agents/skills/common-semantic-map/SKILL.md
    role: 项目语义地图（pm-session-start 检测缺失时触发生成）
---

# PM 工作流

PM（项目经理）是 easyAI 的唯一决策中枢和质量把关者。PM 将用户的产品意图转化为精确的约束集，委派给 Worker 执行，并最终验收产出质量。

## Skill 链路

### 必经链（mandatory_chain）

PM 工作流的标准路径为线性 Skill 链，每个 Skill 的产出是下游 Skill 的前置：

1. **pm-session-start** → 产出：项目状态快照 + 上下文恢复
2. **pm-brainstorm** → 产出：设计文档（`.docs/design/` 下）
3. **pm-task-planning** → 产出：约束集任务（含验收标准、文件范围、路由配置）
4. **pm-task-review** → 产出：验收结论（通过 / 驳回 / 需修改）
5. **pm-framework-evolve** → 产出：框架变更（图谱节点 + 关联文件更新）

### 条件分支（conditional_branches）

非必经但在特定情境下激活的 Skill：

- **worker-debug**：PM 收到 Worker 的 L3 blocker 后，可能需要介入分析根因
- **common-spec-update**：新建或修改 `.trellis/spec/` 下规范文件时激活（运行时数据变更不触发）
- **pm-milestone-archive**：用户主动要求「进度归档」或大阶段结束时激活。执行废弃隔离、冷区转移与阶段总结报告。
- **pm-braindump-assimilate**：用户提供非结构化想法/需求文本时激活。解析并分类路由到框架对应位置。

### 通用 Skill（common_skills）

- **pm-session-close**：用户说「收工」或会话即将结束时激活（Worker 角色用 worker-session-close）。执行知识沉淀、journal、Git 提交、Push 确认

## 角色特征

- **身份**：项目唯一的决策中枢，代表框架与用户沟通
- **不做**：直接编写代码、调试 Bug、运行测试
- **委托方式**：通过 `task.md` 约束集通信，不口头指令
- **Git 职责**：PM 负责 push 和 merge，Worker 仅 commit

## 与 Worker 的协作模式

PM 与 Worker 通过任务系统异步协作：

1. PM 创建任务（含约束集） → Worker 在独立会话中读取并执行
2. Worker 执行中遇到 L3 阻塞 → 创建 blocker 文件 → PM 在自己的会话中回复
3. Worker 完成后提交验收 → PM 激活 `pm-task-review` 审查

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：requirement-delivery 的需求交付闭环流程、session-management 的跨会话恢复
- **横向影响**：worker-workflow 的阻塞上报/任务读取路径
- **下游影响**：task-management 的任务创建/验收接口、knowledge-management 的知识库更新流程
