---
name: quality-control
layer: capability
domain: capability
description: 质量控制 — TDD 铁律、三标记自检、系统性调试、Evidence Gate 验收
serves:
  - role-system/pm-workflow
  - role-system/worker-workflow
depends_on:
  - data-layer/task-storage
  - data-layer/spec-system
  - foundation/mcp-transport
  - foundation/git-integration
relates_to:
  - capability/task-management
  - capability/context-management
children:
  - tdd-workflow
  - three-marker-check
  - systematic-debugging
  - evidence-gate-enforcement
  - review-standards
files:
  - path: .agents/skills/worker-implement/SKILL.md
    role: TDD 铁律驱动的编码流程（Red-Green-Refactor 循环、原子步骤、豁免场景）
  - path: .agents/skills/worker-check/SKILL.md
    role: 三标记自检流程（LINT_PASS / TEST_PASS / MANUAL_PASS + verification.md 生成 + Git 提交）
  - path: .agents/skills/worker-debug/SKILL.md
    role: 系统性调试 Break-Loop（4 阶段根因分析 + 3 次失败上报 + 5 维分析）
  - path: .agents/skills/pm-task-review/SKILL.md
    role: PM 三阶段验收（Stage 1 Spec 合规 → Stage 2 代码质量 → Stage 3 Artifacts 沉淀）
  - path: .agents/rules/anti-hallucination.md
    role: 反幻觉约束（禁止模糊措辞、第三方库必须查文档、RPI 阶段隔离）
  - path: .agents/rules/coding-standards.md
    role: 编码规范（命名约定、缩进、导入顺序、类型安全）
  - tool: task_transition
    role: Evidence Gate 运行时校验（_PASS / _NA / _FAIL 标记检查）
  - tool: plan_validate
    role: 规划反面模式检测（多方案未选择、推迟决策等）
  - tool: spec_validate
    role: 规范文件格式校验（必须字段、SemVer、枚举合法性）
---

# 质量控制

质量控制贯穿 easyAI 的整个任务生命周期，通过 TDD 铁律、三标记自检、系统性调试和 Evidence Gate 四层机制保障代码质量。

## 子特性

### TDD 工作流（tdd-workflow）

Worker 编码的核心流程，遵循 Iron Law：「没有失败测试，不准写生产代码」。每个功能点按 Red-Green-Refactor 循环执行，每步 2-5 分钟可完成（原子步骤）。违反铁律的代码必须删除并从头开始。

**豁免场景**（须在编码前声明）：纯配置/基础设施（Markdown、YAML）、自动生成代码、PM 预标注 `[TDD-EXEMPT]` 的快速原型。

### 三标记自检（three-marker-check）

Worker 完成编码后的**强制**验证流程，生成 `dev/verification.md`：

1. **LINT_PASS** — 运行 lint 检查，粘贴完整终端输出
2. **TEST_PASS** — 运行全量测试，确认 0 failures
3. **MANUAL_PASS** — 逐条对照验收标准手动验证

每个标记接受 `_PASS ✅`、`_NA ⚠️`（附说明），拒绝 `_FAIL ❌`。无论是否使用 `_NA`，`verification.md` 必须始终生成。

### 系统性调试（systematic-debugging）

遇到 Bug/测试失败时的 4 阶段结构化流程：

1. **根因调查** — 读错误信息、稳定复现、检查变更、追踪数据流
2. **模式分析** — 对比正常 vs 异常代码
3. **假设验证** — 单一假设 + 最小测试
4. **实施修复** — 创建失败测试 → 单一修复 → 验证

3 次修复失败必须停下，质疑架构方案，生成 `dev/failure-report.md` 上报 PM。

### Evidence Gate 校验（evidence-gate-enforcement）

MCP 层的硬性校验机制。`task_transition` 在转移到 `under_review` 时自动检查三标记：拒绝 `_FAIL` 标记，要求所有验证类别为 `_PASS` 或 `_NA`。此为不可绕过的运行时约束。

### 审查标准（review-standards）

PM 验收时的代码质量标准，包括边界情况处理、错误信息质量、可维护性（是否能让他人理解）。审查深度根据风险等级分档：低风险简化检查，高风险双 CLI 并行审查，极高风险附加 PM 独立验证。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：PM 验收流程的审查标准变更、Worker 编码流程的 TDD 规则变更
- **横向影响**：task-management 的 Evidence Gate 与本特性的三标记检查紧密耦合
- **下游影响**：spec-system 的校验规则、coding-standards Rule 的规范定义
