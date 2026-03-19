---
name: manifest-mechanism
layer: foundation
domain: foundation
description: Manifest 驱动升级 — SHA-256 哈希比对、智能合并、冲突检测
serves:
  - capability/framework-governance
depends_on: []
relates_to:
  - foundation/file-persistence
  - foundation/git-integration
children:
  - hash-comparison
  - smart-merge
  - conflict-detection
files:
  - path: easyai-manifest.json
    role: 骨架文件 SHA-256 哈希清单（升级时比对）
    upgrade: replace
  - path: .easyai-version
    role: 当前框架版本号
    upgrade: replace
  - tool: framework_init
    role: 初始化框架到项目（生成 manifest）
  - tool: framework_check
    role: 检查框架完整性（校验 manifest）
  - tool: framework_update
    role: Manifest 驱动智能合并升级
---

# Manifest 机制

Manifest 机制是 easyAI 框架的**升级基础设施**，通过 SHA-256 哈希比对实现智能合并，确保升级过程不覆盖用户自定义内容。

## 子特性

### 哈希比对（hash-comparison）

`easyai-manifest.json` 记录骨架中每个框架文件的 SHA-256 哈希。升级时通过哈希判断文件是否被用户修改过。

### 智能合并（smart-merge）

升级时的合并策略：

- 未修改的框架文件 → 直接替换为新版本
- 用户自定义的 Skills/Rules/Workflows → 不触碰
- 被用户修改过的框架文件 → 生成 `.new` 冲突文件

### 冲突检测（conflict-detection）

当用户修改了框架文件（本地哈希与 manifest 不匹配），升级时生成 `.new` 文件并报告冲突，由用户决策合并方式。

## 变更影响

修改本特性时，需同步检查：

- **上游影响**：framework-governance 的升级流程依赖 manifest 一致性
- **横向影响**：file-persistence 的目录结构变化需同步更新 manifest
- **下游影响**：无（本节点是最底层）
