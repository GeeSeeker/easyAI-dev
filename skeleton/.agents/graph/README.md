# 框架知识图谱（Framework Knowledge Graph）

> easyAI 框架的全息知识地图 — 以特性为节点、双向链接的树状图谱。

## 什么是图谱

图谱用**特性树**（而非文件列表）描述 easyAI 框架的完整结构。每个节点代表一个框架特性，包含：

- **YAML frontmatter**：结构化元数据（名称、层级、依赖关系、实现文件）
- **Markdown 正文**：特性说明、子特性描述、变更影响分析

## 五层架构

```text
Layer 4 · 用户体验层    用户可感知的交付闭环
Layer 3 · 角色系统层    PM / Worker 工作流编排
Layer 2 · 能力层        任务管理、质量控制等核心能力
Layer 1 · 数据层        tasks/ spec/ workspace/ config/ 的数据组织
Layer 0 · 基础设施层    MCP 传输、配置加载、文件系统、Git 集成
```

## 如何查询

### 渐进式披露

1. **一屏概览** → 读 `_index.md`，查看所有域和特性名称
2. **域内展开** → 读 `{domain}/_domain.md`，了解该层包含的特性及层间关联
3. **节点详情** → 读具体节点文件，查看关联、文件清单、变更影响

### 典型查询场景

| 场景                         | 操作                               |
| ---------------------------- | ---------------------------------- |
| 理解框架全貌                 | 读 `_index.md`                     |
| 改了某个特性，想知道影响范围 | 读该节点的 `serves` + `relates_to` |
| 找某个功能的实现文件         | 读该节点的 `files:` 字段           |
| 分析依赖链                   | 从目标节点沿 `depends_on` 向下追溯 |

## 如何维护

### 更新时机

1. **框架迭代完成后**（`pm-framework-evolve` Step 6）— 每次修改框架文件后检查并更新关联节点
2. **用户自主魔改后** — 添加/删除 Skills、Rules 后手动更新对应节点

### 更新范围

- **新增 Skill** → 在对应层级目录新增节点 + 更新 `_index.md` + 更新上下游节点的关联
- **修改 MCP Tool** → 更新 `foundation/` 的 `files:` 字段 + 上层节点的 `depends_on`
- **修改 Rule** → 更新 `capability/framework-governance.md` 节点

### 节点文件格式

```yaml
---
name: node-name # 节点名称（与文件名一致）
layer: layer-name # 所属层级
domain: domain-name # 所属域
description: 一句话描述 # 简明功能概述
serves: # 向上：为谁提供能力
  - domain/node
depends_on: # 向下：依赖什么
  - domain/node
relates_to: # 横向：与谁协作
  - domain/node
children: # 子特性列表
  - child-name
files: # 实现文件清单
  - path: .agents/...
    role: 说明
  - tool: tool_name # MCP 工具用名称描述
    role: 说明
---
```
