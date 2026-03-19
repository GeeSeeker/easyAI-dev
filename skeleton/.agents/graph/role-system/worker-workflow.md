---
name: worker-workflow
layer: role-system
domain: role-system
description: Worker 工作流 — 支持独立执行模式和团队执行模式（组长编排+组员并行），含模式自主决策、TDD 编码、自检验证、阻塞上报
serves:
  - user-experience/requirement-delivery
  - user-experience/session-management
  - user-experience/artifact-pipeline
depends_on:
  - capability/task-management
  - capability/quality-control
  - capability/context-management
  - capability/knowledge-management
  - capability/external-cli-dispatch
  - data-layer/journal-system
  - data-layer/spec-system
  - foundation/git-integration
relates_to:
  - role-system/pm-workflow
skill_chain:
  independent_mode:
    mandatory_chain:
      - worker-implement
      - worker-check
  quick_fix_mode:
    mandatory_chain:
      - worker-quick-fix
  team_mode_lead:
    mandatory_chain:
      - worker-lead (PLAN)
      - worker-implement # 可选，审核者模式可跳过
      - worker-lead (INTEGRATE)
      - worker-check
  team_mode_member:
    mandatory_chain:
      - worker-implement
      - worker-check
  conditional_branches:
    - worker-debug
    - common-cli-dispatch # Worker 需要外部 CLI 审查时激活
    - common-github-cli # Worker 需要 GitHub 平台交互时激活
  common_skills:
    - worker-session-close
files:
  - path: .agents/workflows/actor-worker.md
    role: Worker 角色入口（身份锚定、参数解析、模式决策、角色阻断、启动流程、阻塞上报协议、完成流程）
  - path: .agents/workflows/worker-quick-fix.md
    role: 轻量修复 Workflow（约束集读取 → 定位 → 修改 → 验证 → 简化自检）
  - path: .agents/skills/worker-lead/SKILL.md
    role: 组长编排（团队执行模式：PLAN 子任务拆分 + INTEGRATE 审核整合，含 ABCDE 工作重要性分级）
  - path: .agents/skills/worker-implement/SKILL.md
    role: TDD 铁律驱动的编码流程（先写失败测试 → 最小实现 → 重构）
  - path: .agents/skills/worker-check/SKILL.md
    role: 自检验证流程（Lint + Test + Manual 三标记 → 生成 verification.md）
  - path: .agents/skills/worker-debug/SKILL.md
    role: 系统性调试（4 阶段根因分析 + 3 次失败上报 PM）
  - path: .agents/skills/worker-session-close/SKILL.md
    role: Worker 会话收尾（journal + Skill 审计 + Git 提交 + 恢复指引，正常完成时由 worker-check 自动衔接）
  - path: .agents/rules/coding-standards.md
    role: 编码规范（Worker 编写代码时自动注入）
  - path: .agents/skills/common-github-cli/SKILL.md
    role: GitHub CLI 集成（Worker 需要 GitHub 平台交互时激活）
  - tool: task_get
    role: 任务详情读取（含约束集、验收标准、frozen_context）
  - tool: task_append_log
    role: 任务执行记录追加
  - tool: task_transition
    role: 提交验收（in_progress → under_review，触发 Evidence Gate）
  - tool: worktree_list
    role: Worktree 环境查询（Worker 启动时检查隔离环境）
  - tool: worktree_create
    role: Worktree 创建（PM 分配时创建，Worker 启动时切入）
---

# Worker 工作流

Worker（执行者）按 PM 的约束集完成具体编码任务。支持两种执行模式：**独立执行模式**（单人完成）和**团队执行模式**（组长+组员协作）。Worker 自主判断并决策执行模式（需用户确认升级）。所有行为以约束集为唯一执行依据。

## Skill 链路

### 独立执行模式（independent_mode）

1. **worker-implement** → 产出：通过测试的代码（TDD 流程：失败测试 → 最小实现 → 重构）
2. **worker-check** → 产出：验证报告（`dev/verification.md`，含三标记）

### 轻量修复模式（quick_fix_mode）

1. **worker-quick-fix** → 产出：代码就地修改与简化版验证报告

### 团队执行模式 · 组长（team_mode_lead）

1. **worker-lead** (PLAN) → 产出：子任务已创建 + 用户操作指引
2. **worker-implement** → 组长自己负责的部分（可选，审核者模式跳过）
3. 等待组员完成
4. **worker-lead** (INTEGRATE) → 产出：汇总报告 + 集成验证结果
5. **worker-check** → 产出：整体验证报告

### 团队执行模式 · 组员（team_mode_member）

1. **worker-implement** → 产出：子任务范围内通过测试的代码
2. **worker-check** → 产出：子任务范围的验证报告（不提交主任务验收）

### 条件分支（conditional_branches）

- **worker-debug**：已有代码出现 Bug、测试失败或意外行为时激活（新功能从零编码用 worker-implement）。4 阶段根因分析，连续 3 次失败后停止并上报 PM。

### 通用 Skill（common_skills）

- **worker-session-close**：worker-check 完成后自动衔接或中途暂停时手动触发（PM 角色用 pm-session-close）。汇总工作、写入 journal、Git 提交

## 角色特征

- **身份**：约束集驱动的实现者，不做架构决策
- **执行模式**：独立/团队执行模式/轻量修复模式，由 PM 分配策略或 Worker 自主决策
- **不做**：擅自扩大需求范围、变更技术方案、跳过验证步骤、偷偷升级模式
- **契约**：约束集的每一条都必须被执行，不可选择性忽略
- **Git 职责**：Worker 仅 commit，不 push、不 merge

## 启动流程

Worker 启动时执行固定序列：

1. 声明身份（角色锚定：独立执行者 / 组长 / 组员）
2. Rules 合规加载（扫描 `always_on` 规则）
3. 读取任务详情（`task_get()` + frozen_context）
4. Worktree 环境切换（存在则切入隔离环境）
5. 加载上下文（根据角色加载不同粒度）
6. 模式决策（角色缺失硬阻断 + 自主升级评估）

## 阻塞上报协议

Worker 执行中遇到阻塞，按严重程度分级处理：

- **L1（轻度）**：5 分钟内可自行解决 → 自行处理
- **L2（中度）**：不阻塞整体进度 → 记录后继续
- **L3（重度）**：约束歧义 / 架构不确定 / 3 次修复失败 → 停止工作，在 `blockers/` 下创建结构化上报文件

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：requirement-delivery 的执行交付环节、session-management 的 Worker 会话生命周期
- **横向影响**：pm-workflow 的任务委派和验收路径
- **下游影响**：task-management 的任务读取/状态转移接口、quality-control 的 TDD/自检流程
