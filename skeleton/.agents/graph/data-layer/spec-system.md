---
name: spec-system
layer: data-layer
domain: data-layer
description: 规范体系存储 — 四分类目录、spec-schema.json 校验、URI 寻址
serves:
  - capability/quality-control
  - capability/framework-governance
  - role-system/worker-workflow
  - capability/context-management
  - capability/knowledge-management
depends_on:
  - foundation/file-persistence
  - foundation/mcp-transport
relates_to:
  - data-layer/config-management
  - data-layer/task-storage
children:
  - category-directories
  - schema-validation
  - uri-addressable
files:
  - path: .trellis/spec/
    role: 规范体系根目录
  - path: .trellis/spec/spec-schema.json
    role: 规范文件 JSON Schema（校验 frontmatter）
    upgrade: replace
  - path: .trellis/spec/frontend/
    role: 前端规范目录
  - path: .trellis/spec/backend/
    role: 后端规范目录
  - path: .trellis/spec/guides/
    role: 指南类规范目录
  - path: .trellis/spec/general/
    role: 通用规范目录（命名约定、Git 流程等）
  - tool: spec_validate
    role: 规范文件格式校验
---

# 规范体系存储

规范存储定义了 `.trellis/spec/` 下项目规范的**分类组织和校验机制**。

## 子特性

### 四分类目录（category-directories）

规范按领域分为四个子目录：

- `frontend/` — 前端规范
- `backend/` — 后端规范
- `guides/` — 指南类规范（review-standards、testing、external-cli-guide 等）
- `general/` — 通用规范（命名约定、Git 流程、ADR 模板等）

### Schema 校验（schema-validation）

`spec-schema.json` 定义规范文件 frontmatter 的必须字段（title、version、category）、版本号格式（SemVer）和枚举值约束。`spec_validate` Tool 执行自动校验。

### URI 寻址（uri-addressable）

规范文件支持两种 URI 寻址：

- `spec://{category}/{name}` — 简写语法糖
- `trellis://spec/{category}/{name}` — 完整路径

Worker 在编码前通过 `spec://` 加载需要遵守的项目规范。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：quality-control 的合规检查、Worker 编码前的规范加载
- **横向影响**：config-management 定义了 spec.root 和 spec.categories
- **下游影响**：file-persistence 的目录约定
