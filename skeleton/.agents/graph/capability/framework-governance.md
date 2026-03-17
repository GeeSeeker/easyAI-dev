---
name: framework-governance
layer: capability
domain: capability
description: 框架治理 — 约束分层体系、规范守护、Manifest 驱动升级、框架完整性检查
serves:
  - role-system/pm-workflow
depends_on:
  - data-layer/spec-system
  - data-layer/config-management
  - foundation/manifest-mechanism
  - foundation/mcp-transport
  - foundation/config-system
  - foundation/git-integration
relates_to:
  - capability/knowledge-management
  - capability/quality-control
children:
  - constraint-hierarchy
  - rules-system
  - manifest-upgrade
  - framework-integrity
  - dev-mode-guard
files:
  - path: .agents/skills/pm-framework-evolve/SKILL.md
    role: PM 框架自迭代（变更影响分析 → 用户确认门 → 安全修改 → 知识库更新）
  - path: .agents/skills/common-spec-update/SKILL.md
    role: 规范守护（.trellis/spec/ 的写操作必须经过本 Skill）
  - path: .agents/rules/project-identity.md
    role: 项目身份定义 + 五级约束分层体系
  - path: .agents/rules/anti-hallucination.md
    role: 反幻觉硬约束（第三方库查文档、禁止模糊措辞、RPI 阶段隔离）
  - path: .agents/rules/framework-dev-mode.md
    role: 框架开发模式（三层版本流转 + 写入守卫，仅开发工作区）
  - path: .agents/rules/coding-standards.md
    role: 编码规范（glob 触发，编辑源码时自动注入）
  - path: .agents/rules/skill-transparency.md
    role: Skill 使用透明性（always_on，激活声明 + PATEOAS 扩展 + 事后审计）
  - tool: framework_init
    role: 框架初始化（复制骨架到目标项目）
  - tool: framework_check
    role: 框架完整性检查（验证必需目录、文件、版本、Git 状态）
  - tool: framework_update
    role: Manifest 驱动升级（SHA-256 哈希比对 + 智能合并 + 冲突检测）
  - tool: spec_validate
    role: 规范文件格式校验（必须字段、SemVer 版本号、枚举合法性）
---

# 框架治理

框架治理定义了 easyAI 的**约束体系、规范守护机制和升级策略**。确保框架在迭代过程中保持一致性和完整性。

## 子特性

### 约束分层体系（constraint-hierarchy）

五级约束优先级，高层覆盖低层，冲突时上报用户：

1. **Rules**（最高 · 硬约束）— 反幻觉、编码规范，始终生效，不可覆盖
2. **Skills**（硬约束）— TDD 流程、验证标记、PATEOAS 输出，角色激活时生效
3. **MCP**（硬约束）— 状态机校验、Evidence Gate、权限校验
4. **PM 判断**（软约束）— 约束集、任务指令，可由用户裁决调整
5. **用户偏好**（最低 · 软约束）— 个人习惯，可被上层覆盖

硬约束（Rules/Skills/MCP）即使用户明确要求也不可豁免；软约束冲突由用户裁决。

### Rules 系统（rules-system）

`.agents/rules/` 目录下的规则文件，通过 YAML frontmatter 的 `trigger` 字段控制生效时机：

- **always_on** — 每个会话始终生效（如 `anti-hallucination.md`、`project-identity.md`、`skill-transparency.md`）
- **glob** — 编辑匹配文件时自动注入（如 `coding-standards.md` 匹配 `*.ts,*.js,*.py`）

Worker Workflow Step 2.5 和 `pm-session-close` Step 4.5 分别在会话启动和收尾时执行 Rules 合规加载/回顾。

### Manifest 驱动升级（manifest-upgrade）

框架升级通过 `manifest.json`（包含每个文件的 SHA-256 哈希）驱动智能合并：

- 新版有变更 + 用户未改 → 自动更新
- 新版有变更 + 用户也改了 → 报告冲突，由用户决策
- 用户自定义文件（不在 manifest 中）→ 保留不动

`framework_update` MCP Tool 执行升级，`framework_check` 验证升级后完整性。

### 框架完整性检查（framework-integrity）

`framework_check` MCP Tool 验证项目的 easyAI 框架完整性：

- 必需目录是否存在（`.agents/`、`.trellis/`、`.docs/`）
- 必需文件是否存在
- 版本号一致性（`config.yaml` vs `.easyai-version`）
- Git 状态检查

### 开发模式守卫（dev-mode-guard）

仅在开发工作区（`easyAI-dev/`）生效的保护机制。三层版本流转架构（生产 → 开发 → 发行）确保框架变更经过完整的测试和发布流程。写入守卫要求每次修改前回答「写入前三问」，违规时立即停止并上报。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：PM 框架迭代流程的安全修改步骤、所有角色的 Rules 加载行为
- **横向影响**：knowledge-management 的规范演进与本特性的 spec 守护协作；quality-control 的 Evidence Gate 属于约束分层中的 MCP 层
- **下游影响**：manifest-mechanism 的哈希计算、config-system 的版本号管理、spec-system 的校验规则
