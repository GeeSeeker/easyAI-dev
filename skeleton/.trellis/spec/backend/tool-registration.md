---
title: MCP Tool 注册模式
version: 1.0.0
category: backend
status: active
lastUpdated: "2026-03-14"
tags:
  - mcp-server
  - tool
  - registration
  - error-handling
  - zod
dependencies:
  - backend/project-structure
---

# MCP Tool 注册模式

## 概述

定义 `tools/` 目录下 MCP Tool 的标准注册模板，包括参数校验、错误处理、返回格式和权限控制。

## 标准模板

```typescript
import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { someHelper } from "../utils/some-utils.js";
import { checkCapability, capabilityError } from "../utils/capability-gate.js";

/**
 * 注册 tool_name 工具
 * {工具用途的简短描述}
 */
export function register(server: McpServer): void {
  server.tool(
    "tool_name",
    "中文描述：工具的功能说明，供 AI 理解何时调用。",
    {
      // Zod schema — 参数定义
      required_param: z.string(),
      optional_param: z.string().optional(),
      array_param: z.array(z.string()).optional().describe("参数描述"),
    },
    async ({ required_param, optional_param, array_param }) => {
      try {
        // [可选] Capability Gate 检查
        const reject = checkCapability(role, "tool_name");
        if (reject) {
          return capabilityError(reject);
        }

        // 业务逻辑...
        const result = someHelper(required_param);

        // 成功返回
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        // 错误返回
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
```

## 参数校验

- 使用 `zod` 内联定义 schema，无需抽取独立的 schema 对象
- 必填参数使用 `z.string()` / `z.number()` 等
- 可选参数使用 `.optional()`
- 需要描述的参数追加 `.describe("...")`
- 复杂对象使用 `z.object({...}).optional()`

## 错误处理

### 三层错误结构

| 层级                 | 处理方式                         | 示例           |
| -------------------- | -------------------------------- | -------------- |
| Capability Gate 拒绝 | `return capabilityError(reject)` | 角色无权限     |
| 业务前置校验失败     | 直接返回 `{ isError: true }`     | 任务目录已存在 |
| 运行时异常           | `catch` 块兜底                   | 文件 I/O 失败  |

### 错误返回格式

```typescript
{
  content: [{
    type: "text" as const,
    text: JSON.stringify({
      error: true,
      message: "中文错误信息",
    }),
  }],
  isError: true,
}
```

### Capability Gate 错误格式

```typescript
{
  content: [{
    type: "text" as const,
    text: JSON.stringify({
      error: true,
      gate: "capability",
      message: "拒绝理由",
    }),
  }],
  isError: true,
}
```

## 成功返回格式

```typescript
{
  content: [{
    type: "text" as const,
    text: JSON.stringify(resultObject, null, 2),
  }],
}
```

- 返回值始终包裹在 `content` 数组的 `text` 元素中
- 使用 `JSON.stringify(obj, null, 2)` 格式化输出（2 空格缩进）
- `type` 必须使用 `"text" as const` 类型断言

## Capability Gate

受限工具（涉及权限控制的操作）必须在 handler 开头执行角色检查：

```typescript
const reject = checkCapability(role, "tool_name");
if (reject) {
  return capabilityError(reject);
}
```

需要添加 `role: z.string().optional()` 到参数 schema。

## 聚合文件的导出

聚合文件（一个文件包含多个 Tool）使用具名导出：

```typescript
// subtask-tools.ts
export function registerSubtaskCreate(server: McpServer): void { ... }
export function registerSubtaskDependencyGraph(server: McpServer): void { ... }
```

独立文件使用 `register` 作为函数名：

```typescript
// task-create.ts
export function register(server: McpServer): void { ... }
```

## Tool Description 规范

- 使用中文撰写
- 第一句概括工具功能
- 后续句描述行为细节（输入、副作用、返回值）
- 示例：`"创建新任务。生成任务 ID，创建任务目录和 task.md 文件，初始状态为 pending。"`

## Handler 约定

- handler 函数为 `async` 函数（即使内部无异步操作）
- 复杂业务逻辑委托给 `utils/` 工具函数，handler 只做编排
- 禁止在 handler 中定义复杂的数据处理逻辑
