---
title: MCP Server 项目结构与命名规范
version: 1.0.0
category: backend
status: active
lastUpdated: "2026-03-14"
tags:
  - mcp-server
  - project-structure
  - naming
---

# MCP Server 项目结构与命名规范

## 概述

定义 `packages/mcp-server/src/` 的目录组织、文件命名和模块职责划分。

## 目录结构

```
packages/mcp-server/src/
├── index.ts          ← 入口：创建 Server + 注册所有模块 + 启动
├── tools/            ← MCP Tool 实现（对外暴露的操作）
│   ├── task-create.ts
│   ├── task-list.ts
│   ├── subtask-tools.ts    ← 聚合文件（多个 register）
│   └── ...
├── resources/        ← MCP Resource 实现（只读数据源）
│   ├── status-resource.ts
│   ├── spec-resource.ts
│   └── ...
└── utils/            ← 共享工具函数（业务逻辑核心）
    ├── task-utils.ts
    ├── journal-utils.ts
    └── ...
```

## 文件命名规则

| 层级               | 命名格式                                | 示例                                     |
| ------------------ | --------------------------------------- | ---------------------------------------- |
| tools/             | `{domain}.ts` 或 `{domain}-{action}.ts` | `task-create.ts`, `journal-append.ts`    |
| tools/（聚合）     | `{domain}-tools.ts`                     | `subtask-tools.ts`, `worktree-tools.ts`  |
| resources/         | `{domain}-resource.ts`                  | `status-resource.ts`, `spec-resource.ts` |
| utils/             | `{domain}-utils.ts`                     | `task-utils.ts`, `journal-utils.ts`      |
| utils/（特殊用途） | `{purpose}.ts`                          | `capability-gate.ts`, `uri-utils.ts`     |

**通用规则**：全部 `kebab-case.ts`，禁止 `camelCase` 或 `PascalCase` 文件名。

## 入口文件职责（index.ts）

`index.ts` 的唯一职责是 **编排**，禁止放复杂业务逻辑：

1. 导入所有模块的 `register` 函数
2. 创建 `McpServer` 实例
3. 注册少量内联 Tool（仅限极简工具如 `project_status`）
4. 批量调用 `register(server)` 注册模块
5. 启动 `StdioServerTransport`

## 模块聚合规则

| 场景                 | 做法                        | 示例                                   |
| -------------------- | --------------------------- | -------------------------------------- |
| 独立工具（单一操作） | 一文件一 `register`         | `task-create.ts`                       |
| 同域强关联工具组     | 一文件多 `registerXxx` 导出 | `worktree-tools.ts` 导出 4 个 register |

**判断标准**：共享私有函数或类型 → 聚合；否则 → 独立。

## 空目录保留

使用 `.gitkeep` 保留空子目录（`tools/`、`resources/`、`utils/`），确保 Git 追踪目录结构。

## 导入顺序

每个文件的 import 按以下顺序排列，各组之间空行分隔：

```typescript
// 1. Node 内置模块
import * as fs from "node:fs";
import * as path from "node:path";

// 2. 第三方包
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// 3. 项目内部模块
import { getProjectRoot } from "../utils/task-utils.js";
import { checkCapability } from "../utils/capability-gate.js";
```

## 注释语言

代码注释（行内注释、JSDoc、分节注释）统一使用 **中文**。
Tool/Resource 的 description 参数统一使用 **中文**。
