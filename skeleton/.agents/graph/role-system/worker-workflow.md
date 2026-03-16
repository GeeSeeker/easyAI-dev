---
name: worker-workflow
layer: role-system
domain: role-system
description: Worker 工作流 — 任务读取、TDD 编码、自检验证、阻塞上报的完整执行链路
serves:
  - user-experience/requirement-delivery
  - user-experience/session-management
  - user-experience/artifact-pipeline
depends_on:
  - capability/task-management
  - capability/quality-control
  - capability/context-management
  - capability/knowledge-management
  - data-layer/journal-system
  - data-layer/spec-system
  - foundation/git-integration
relates_to:
  - role-system/pm-workflow
skill_chain:
  mandatory_chain:
    - worker-implement
    - worker-check
  conditional_branches:
    - worker-debug
  common_skills:
    - common-session-close
files:
  - path: .agents/workflows/worker.md
    role: Worker 角色入口（身份锚定、参数解析、启动流程、阻塞上报协议、完成流程）
  - path: .agents/skills/worker-implement/SKILL.md
    role: TDD 铁律驱动的编码流程（先写失败测试 → 最小实现 → 重构）
  - path: .agents/skills/worker-check/SKILL.md
    role: 自检验证流程（Lint + Test + Manual 三标记 → 生成 verification.md）
  - path: .agents/skills/worker-debug/SKILL.md
    role: 系统性调试（4 阶段根因分析 + 3 次失败上报 PM）
  - path: .agents/skills/common-session-close/SKILL.md
    role: 会话收尾与日志沉淀
  - path: .agents/rules/coding-standards.md
    role: 编码规范（Worker 编写代码时自动注入）
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

Worker（执行者）按 PM 的约束集完成具体编码任务。Worker 是高效的实现者，专注于将精确的约束集转化为高质量的代码产出。所有行为以约束集为唯一执行依据。

## Skill 链路

### 必经链（mandatory_chain）

Worker 的标准执行路径：

1. **worker-implement** → 产出：通过测试的代码（TDD 流程：失败测试 → 最小实现 → 重构）
2. **worker-check** → 产出：验证报告（`dev/verification.md`，含 LINT_PASS / TEST_PASS / MANUAL_PASS 三标记）

### 条件分支（conditional_branches）

- **worker-debug**：遇到 Bug、测试失败或意外行为时激活。4 阶段根因分析（根因调查 → 模式分析 → 假设验证 → 实施），连续 3 次失败后停止并上报 PM。

### 通用 Skill（common_skills）

- **common-session-close**：会话结束时激活，汇总工作、写入 journal、Git 提交

## 角色特征

- **身份**：约束集驱动的实现者，不做架构决策
- **不做**：擅自扩大需求范围、变更技术方案、跳过验证步骤
- **契约**：约束集的每一条都必须被执行，不可选择性忽略
- **Git 职责**：Worker 仅 commit，不 push、不 merge

## 启动流程

Worker 启动时执行固定序列：

1. 声明身份（角色锚定）
2. Rules 合规加载（扫描 `always_on` 规则）
3. 读取任务详情（`task_get()` + frozen_context）
4. Worktree 环境切换（存在则切入隔离环境）
5. 加载上下文（根据角色加载不同粒度）

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
