---
name: knowledge-management
layer: capability
domain: capability
description: 知识管理 — 框架知识图谱、日志沉淀、规范体系维护、文档生命周期
serves:
  - role-system/pm-workflow
  - role-system/worker-workflow
depends_on:
  - data-layer/spec-system
  - data-layer/journal-system
  - data-layer/config-management
  - foundation/file-persistence
relates_to:
  - capability/framework-governance
  - capability/context-management
children:
  - knowledge-graph
  - journal-lifecycle
  - spec-evolution
  - artifact-sedimentation
  - knowledge-categories
files:
  - path: .agents/graph/
    role: 框架知识图谱（五层特性树 + 双向链接 + 渐进式披露）
  - path: .agents/skills/pm-framework-evolve/SKILL.md
    role: PM 框架自迭代（知识查询 + 安全迭代 + 知识库自更新）
  - path: .agents/skills/pm-session-close/SKILL.md
    role: PM 会话收尾中的知识沉淀检查（Step 4 分类触发 + Step 4b Artifacts 沉淀）
  - path: .agents/skills/common-spec-update/SKILL.md
    role: 规范动态演进（变更前快照 → 影响分析 → 用户确认门 → journal 记录）
  - path: .agents/skills/pm-task-review/SKILL.md
    role: Stage 3 Artifacts 沉淀（扫描 Worker 产出 → 按知识分类判断沉淀目标）
  - tool: journal_append
    role: 日志写入（标签 + 内容 + 关联任务）
  - tool: journal_search
    role: 日志搜索（按标签、关键词、日期范围过滤）
  - tool: spec_validate
    role: 规范文件格式校验
---

# 知识管理

知识管理覆盖框架知识的**产生、组织、检索和演进**全过程。从会话中产出的知识通过 journal 和 Artifacts 沉淀，通过图谱结构化，通过 spec 机制标准化。

## 子特性

### 知识图谱（knowledge-graph）

框架的全息知识地图。`.agents/graph/` 以特性为节点、双向链接的五层树状结构组织框架知识。每个节点知道三个方向的关联：向上（serves）、向下（depends_on）、横向（relates_to）。支持渐进式披露：Level 0 顶层索引 → Level 1 域内展开 → Level 2 节点详情。

### 日志生命周期（journal-lifecycle）

工作记忆的写入与检索。通过 `journal_append()` 写入带标签的日志条目，`journal_search()` 按多条件组合搜索。日志超过最大行数时自动创建新文件。`pm-session-close` Skill 在每次会话结束时自动触发日志写入。

### 规范演进（spec-evolution）

`.trellis/spec/` 规范文件的安全更新机制。`common-spec-update` Skill 提供变更前快照、影响范围分析（低/中/高风险）、用户确认门三重保护。每次变更留下 journal 记录。规范文件必须含完整 YAML frontmatter（title, version, category, status），版本号遵循 SemVer。

### Artifacts 沉淀（artifact-sedimentation）

将会话中产出的 Artifacts 持久化到项目文档体系。PM 验收时的 Stage 3 和会话收尾时的 Step 4b 均包含沉淀检查：扫描 Artifacts → 按知识分类判断目标路径 → 用户确认后执行 → 提炼内容（去除过程性细节）。

### 知识分类（knowledge-categories）

知识内容的分类路由体系（由 `spec://general/knowledge-categories` 定义）：

- **DESIGN** → `.docs/design/features/`（特性架构蓝图）
- **PLANNING** → `.docs/design/planning/`（规划与里程碑总结）
- **NOTE** → `.docs/notes/`（临时备忘）
- **REF** → `.docs/refs/`（外部参考资料）

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：PM 框架迭代流程的知识查询和更新步骤、会话收尾的知识沉淀检查
- **横向影响**：framework-governance 的规范演进与本特性的 spec-evolution 紧密协作；context-management 依赖 spec 文件作为上下文来源
- **下游影响**：spec-system 的存储格式、journal-system 的日志格式、file-persistence 的目录约定
